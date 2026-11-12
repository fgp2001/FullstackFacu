import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { HttpError } from "./errors.js";
import {
    createUserSchema,
    patchUserSchema, putUserSchema, validateBody
} from "./schemas.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const SORTABLE_FIELDS = ["id", "name", "email"];

const toPublicUser = ({ id, name, email }) => ({ id, name, email });
const invalidQuery = (message) => new HttpError(400, "INVALID_QUERY", message);

const readTextParam = (value, name) => {
    if (value === undefined) return undefined;
    if (typeof value !== "string") throw invalidQuery(`${name} must be a single value`);

    return value.trim().toLowerCase();
}

const readIntegerParam = (value, { fallback, min, max, message }) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^\d+$/.test(value)) throw invalidQuery(message);

    const number = Number(value);
    if (number < min || number > max) throw invalidQuery(message);

    return number;

}

const readSortParam = (value) => {
    if (value === undefined) return null;
    if (typeof value !== "string") throw invalidQuery("sort must be a single value");

    const direction = value.startsWith("-") ? -1 : 1;
    const field = direction === -1 ? value.slice(1) : value;

    if (!SORTABLE_FIELDS.includes(field)) {
        throw invalidQuery(`sort must be one of: ${SORTABLE_FIELDS.join(", ")} (prefix "-" for descending)`);
    }

    return { field, direction };
};

const compareBy = ({ field, direction }) => (a, b) => {
    const result =
        typeof a[field] === "number"
            ? a[field] - b[field]
            : a[field].localeCompare(b[field], "es", { sensitivity: "base" });

    return result * direction;
}

class Server {
    #app;
    #port;
    #httpServer = null;
    #bcryptRounds;
    #writeLimiter;
    #nextId = 3;
    #users = [];

    constructor({
        port = process.env.PORT || 3000,
        bcryptRounds = 10,
        rateLimit: rateLimitOptions = {},
    } = {}) {
        this.#app = express();
        this.#port = Number(port);
        this.#bcryptRounds = bcryptRounds;
        this.#users = [
            {
                id: 1,
                name: "John Doe",
                email: "john.doe@example.com",
                password: bcrypt.hashSync("john-secret-123", bcryptRounds),
            },
            {
                id: 2,
                name: "Jane Smith",
                email: "jane.smith@example.com",
                password: bcrypt.hashSync("jane-secret-456", bcryptRounds),
            },
        ];

        this.#writeLimiter = rateLimit({
            windowMs: rateLimitOptions.windowMs ?? 60_000,
            limit: rateLimitOptions.limit ?? 30,
            standardHeaders: "draft-7",
            legacyHeaders: false,
            handler: (req, res, next) =>
                next(new HttpError(429, "RATE_LIMITED", "Too many requests, please try again later")),
        });


        this.#middleware();
        this.#registerRoutes();
        this.#registerErrorHandlers();
    }

    get port() {
        return this.#httpServer?.address()?.port ?? this.#port;
    }

    #hashPassword(password) {
        return bcrypt.hash(password, this.#bcryptRounds);
    }

    #parseId(req) {
        const { id } = req.params;
        const number = Number(id);

        if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(number)) {
            throw new HttpError(400, "INVALID_ID", "id must be a positive integer");
        }

        return number;
    }

    #getUserOrFail(req) {
        const id = this.#parseId(req);
        const user = this.#users.find((item) => item.id === id);

        if (!user) {
            throw new HttpError(404, "USER_NOT_FOUND", "User not found");
        }

        return user;
    }

    #assertEmailAvailable(email, ignoreId) {
        const normalized = email.toLowerCase();
        const taken = this.#users.some(
            (user) => user.id !== ignoreId && user.email.toLowerCase() === normalized,
        );

        if (taken) {
            throw new HttpError(409, "EMAIL_TAKEN", "Email is already registered");
        }
    }


    #registerRoutes() {

        this.#app.get("/api/health", (req, res) => {
            res.json({ status: "ok", uptime: process.uptime() });
        });

        // Listado: Filtrar -> Ordenar -> Contar -> Cortar
        this.#app.get("/api/users", (req, res) => {
            const name = readTextParam(req.query.name, "name");
            const q = readTextParam(req.query.q, "q");
            const sort = readSortParam(req.query.sort);
            const limit = readIntegerParam(req.query.limit, {
                fallback: DEFAULT_LIMIT,
                min: 1,
                max: MAX_LIMIT,
                message: `limit must be an integer between 1 and ${MAX_LIMIT}`,
            });

            const offset = readIntegerParam(req.query.offset, {
                fallback: 0,
                min: 0,
                max: Number.MAX_SAFE_INTEGER,
                message: "offset must be a non-negative integer",
            });

            let users = this.#users;

            if (name !== undefined) {
                users = users.filter((user) => user.name.toLowerCase().includes(name));
            }

            if (q !== undefined) {
                users = users.filter(
                    (user) =>
                        user.name.toLowerCase().includes(q) ||
                        user.email.toLowerCase().includes(q)
                );
            }

            if (sort) {
                users = [...users].sort(compareBy(sort));
            }

            const total = users.length;
            const data = users.slice(offset, offset + limit).map(toPublicUser);

            res.json({ data, meta: { total, limit, offset } });
        });

        this.#app.get("/api/users/:id", (req, res) => {
            const user = this.#getUserOrFail(req);

            res.json({ data: toPublicUser(user) });
        });

        this.#app.post("/api/users", this.#writeLimiter, validateBody(createUserSchema), async (req, res) => {
            const { name, email, password } = req.body;
            const passwordHash = await this.#hashPassword(password);


            this.#assertEmailAvailable(email);

            const user = { id: this.#nextId, name, email, passwordHash };

            this.#users.push(user);
            res.status(201).location(`/api/users/${user.id}`).json({ data: toPublicUser(user) });
        });

        this.#app.put("/api/users/:id", this.#writeLimiter, validateBody(putUserSchema), async (req, res) => {
            const user = this.#getUserOrFail(req);
            const { name, email, password } = req.body;
            const passwordHash = await this.#hashPassword(password);

            this.#assertEmailAvailable(email, user.id);

            user.name = name;
            user.email = email;
            user.password = passwordHash;

            res.json({ data: toPublicUser(user) });
        });

        this.#app.patch("/api/users/:id", this.#writeLimiter, validateBody(patchUserSchema), async (req, res) => {
            const user = this.#getUserOrFail(req);
            const { name, email, password } = req.body;
            const passwordHash = password !== undefined ? await this.#hashPassword(password) : undefined;

            if (email !== undefined) this.#assertEmailAvailable(email, user.id);

            if (name !== undefined) user.name = name;
            if (email !== undefined) user.email = email;
            if (passwordHash !== undefined) user.passwordHash = passwordHash;

            res.json({ data: toPublicUser(user) });

        });


        this.#app.delete("/api/users/:id", (req, res) => {
            const user = this.#getUserOrFail(req);

            this.#users.splice(this.#users.indexOf(user), 1);
            res.status(204).send();
        });
    }

    #registerErrorHandlers() {
        this.#app.use((req, res) => {
            res.status(404).json(
                {
                    error: { code: "ROUTE_NOT_FOUND", message: "Route not found" },
                });
        });

        this.#app.use((error, req, res, next) => {
            if (error instanceof HttpError) {
                const { status, code, message, details } = error;

                return res.status(status).json({
                    error: { code, message, ...(details && { details }) },

                });
            }

            if (error.type === "entity.parse.failed") {
                return res.status(400).json({
                    error: { code: "INVALID_JSON", message: "Malformed JSON body" },
                });
            }

            console.error(error);
            res.status(500).json({
                error: { code: "INTERNAL_ERROR", message: "Internal server error" },
            });
        });
    }

    #middleware() {
        this.#app.use(cors({ origin: ["http://localhost:5173"] }));
        this.#app.use(express.json());
    }


    start() {
        return new Promise((resolve, reject) => {
            this.#httpServer = this.#app.listen(this.#port, (error) => {
                if (error) return reject(error)
                resolve(this);
            });
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            if (!this.#httpServer) return resolve();

            this.#httpServer.close((error) => (error ? reject(error) : resolve()));
            this.#httpServer.closeAllConections?.();
            this.#httpServer = null;
        });
    }

}

export default Server;

