import express from "express";
import cors from "cors";
import * as yup from "yup";
import { HttpError } from "./errors.js";


const createUserSchema = yup.object({
    name: yup.string().required(),
    email: yup.string().email().required(),
    password: yup.string().min(8).required(),
})
    .noUnknown(true);

const patchUserSchema = yup
    .object({
        name: yup.string(),
        email: yup.string().email(),
        password: yup.string().min(8),
    })
    .noUnknown(true)
    .test(
        "at-least-one-field",
        "At least one field (name or email) is required",
        (value) => Object.values(value ?? {}).some((field) => field !== undefined),
    );


const validateBody = (schema) => async (req, res, next) => {
    try {
        await schema.validate(req.body ?? {}, { strict: true, abortEarly: false });
        next();
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return next(new HttpError(400, "VALIDATION_ERROR", "Invalid request body", error.errors),
            );
        }
        next(error);
    }
};

const toPublicUser = ({ id, name, email }) => ({ id, name, email });

class Server {
    #app;
    #port;
    #nextId = 3;
    #users = [
        {
            id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
            password: "john-secret-123"
        },
        {
            id: 2,
            name: "Jane Smith",
            email: "jane.smith@example.com",
            password: "jane-secret-123"
        }
    ];

    constructor() {
        this.#app = express();
        this.#port = process.env.PORT || 3000;

        this.#middleware();
        this.#registerRoutes();
        this.#registerErrorHandlers();
    }


    #findUserById(id) {
        return this.#users.find((user) => user.id === id);
    }

    #getUserOrFail(req) {
        const id = parseInt(req.params.id, 10);
        const user = this.#findUserById(id);

        if (!user) {
            throw new HttpError(404, "USER_NOT_FOUND", "User not found");
        }

        return user;
    }


    #registerRoutes() {
        this.#app.get("/api/users", (req, res) => {
            const { name } = req.query;

            if (name !== undefined && typeof name !== "string") {
                throw new HttpError(400, "INVALID_QUERY", "name must be a single value");
            }

            let users = this.#users;


            if (name !== undefined) {
                const search = name.trim().toLowerCase();
                users = users.filter((user) => user.name.toLowerCase().includes(search));
            }

            res.json({ data: users.map(toPublicUser) });
        });

        this.#app.get("/api/users/search", (req, res) => {
            const search = String(req.query.keywords ?? "").trim().toLowerCase();

            const users = this.#users.filter(
                (user) =>
                    user.name.toLowerCase().includes(search) ||
                    user.email.toLowerCase().includes(search),
            );

            res.json({ data: users.map(toPublicUser) });
        });

        this.#app.get("/api/users/:id", (req, res) => {
            const user = this.#getUserOrFail(req);

            res.json({ data: toPublicUser(user) });
        });

        this.#app.post("/api/users", validateBody(createUserSchema), (req, res) => {
            const { name, email, password } = req.body;
            const user = { id: this.#nextId, name, email, password };

            this.#users.push(user);
            res.status(201).location(`/api/users/${user.id}`).json({ data: toPublicUser(user) });
        });

        this.#app.patch("/api/users/:id", validateBody(patchUserSchema), (req, res) => {
            const user = this.#getUserOrFail(req);
            const { name, email, password } = req.body;

            if (name !== undefined) user.name = name;
            if (email !== undefined) user.email = email;
            if (password !== undefined) user.password = password;


            res.json({ data: toPublicUser(user) });

        })


        this.#app.delete("/api/users/:id", (req, res) => {
            const user = this.#getUserOrFail(req);

            this.#users.splice(this.#users.indexOf(user), 1);
            res.status(204).send();
        })

        this.#app.get("/api/health", (req, res) => {
            res.json({ status: "ok", uptime: process.uptime() });
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
        this.#app.use(cors({ origin: "http://localhost:5173" }));
        this.#app.use(express.json());
    }


    start() {
        this.#app.listen(this.#port, () => {
            console.log(`Server is running on port ${this.#port}`);
        });
    }

}

export default Server;

