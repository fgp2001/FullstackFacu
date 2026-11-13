import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import Server from "../src/server.js";

const validUser = { name: "Ada", email: "ada@example.com", password: "ada-secret-789" };

let server;
let api;

beforeEach(async () => {
    server = new Server({ port: 0, bcryptRounds: 4 });
    await server.start();
    api = request(`http://localhost:${server.port}`);
});

afterEach(async () => {
    await server.stop();
});

describe("health y CORS", () => {
    it("GET /api/health responde 200", async () => {
        const res = await api.get("/api/health");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });

    it("permite el origen http://localhost:5173", async () => {
        const res = await api
            .options("/api/users")
            .set("Origin", "http://localhost:5173")
            .set("Access-Control-Request-Method", "POST");

        expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    });

    it("no devuelve el header CORS para otro origen", async () => {
        const res = await api
            .options("/api/users")
            .set("Origin", "http://evil.example.com")
            .set("Access-Control-Request-Method", "POST");

        expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });
});

describe("POST /api/users", () => {
    it("crea el usuario, devuelve Location y nunca la contraseña", async () => {
        const res = await api.post("/api/users").send(validUser);

        expect(res.status).toBe(201);
        expect(res.headers.location).toBe("/api/users/3");
        expect(res.body.data).toEqual({ id: 3, name: "Ada", email: "ada@example.com" });
        expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    });

    it("responde 409 EMAIL_TAKEN con un email repetido (sin distinguir mayúsculas)", async () => {
        await api.post("/api/users").send(validUser);
        const res = await api.post("/api/users").send({ ...validUser, email: "ADA@example.com" });

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe("EMAIL_TAKEN");
    });

    it("responde 400 con claves desconocidas", async () => {
        const res = await api.post("/api/users").send({ ...validUser, role: "admin" });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("responde 400 con details y sin devolver la contraseña recibida", async () => {
        const res = await api.post("/api/users").send({ email: "no-es-email", password: "123" });

        expect(res.status).toBe(400);
        expect(Array.isArray(res.body.error.details)).toBe(true);
        expect(JSON.stringify(res.body)).not.toContain("123");
    });

    it("asigna ids distintos a usuarios consecutivos", async () => {
        const first = await api.post("/api/users").send(validUser);
        const second = await api.post("/api/users").send({ ...validUser, email: "otro@example.com" });

        expect(first.body.data.id).toBe(3);
        expect(second.body.data.id).toBe(4);
    });
});

describe("GET /api/users", () => {
    it("pagina y devuelve meta", async () => {
        const res = await api.get("/api/users?limit=1&offset=1");

        expect(res.body.meta).toEqual({ total: 2, limit: 1, offset: 1 });
        expect(res.body.data).toHaveLength(1);
    });

    it("rechaza un limit inválido", async () => {
        const res = await api.get("/api/users?limit=abc");

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("INVALID_QUERY");
    });

    it("busca con ?q= en name y email", async () => {
        const byName = await api.get("/api/users?q=SMITH");
        const byEmail = await api.get("/api/users?q=example.com");

        expect(byName.body.data.map((user) => user.name)).toEqual(["Jane Smith"]);
        expect(byEmail.body.meta.total).toBe(2);
    });

    it("ordena ascendente y descendente", async () => {
        const asc = await api.get("/api/users?sort=name");
        const desc = await api.get("/api/users?sort=-name");

        expect(asc.body.data[0].name).toBe("Jane Smith");
        expect(desc.body.data[0].name).toBe("John Doe");
    });

    it("no modifica el orden de los datos originales al ordenar", async () => {
        await api.get("/api/users?sort=-name");
        const res = await api.get("/api/users");

        expect(res.body.data[0].id).toBe(1);
    });

    it("rechaza ordenar por un campo no permitido", async () => {
        const res = await api.get("/api/users?sort=passwordHash");

        expect(res.status).toBe(400);
    });
});

describe("ids", () => {
    it.each(["abc", "0", "-1", "1.5", "12abc"])("GET /api/users/%s responde 400", async (id) => {
        const res = await api.get(`/api/users/${id}`);

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("INVALID_ID");
    });

    it("responde 404 USER_NOT_FOUND con un id válido inexistente", async () => {
        const res = await api.get("/api/users/999");

        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });
});

describe("PUT, PATCH y DELETE", () => {
    it("PUT reemplaza el usuario completo", async () => {
        const res = await api.put("/api/users/1").send(validUser);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({ id: 1, name: "Ada", email: "ada@example.com" });
    });

    it("PUT con campos faltantes responde 400", async () => {
        const res = await api.put("/api/users/1").send({ name: "Solo nombre" });

        expect(res.status).toBe(400);
    });

    it("PUT con el email de otro usuario responde 409", async () => {
        const res = await api.put("/api/users/1").send({ ...validUser, email: "jane.smith@example.com" });

        expect(res.status).toBe(409);
    });

    it("PATCH actualiza solo los campos enviados", async () => {
        const res = await api.patch("/api/users/1").send({ name: "Johnny" });

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({ id: 1, name: "Johnny", email: "john.doe@example.com" });
    });

    it("PATCH con body vacío responde 400", async () => {
        const res = await api.patch("/api/users/1").send({});

        expect(res.status).toBe(400);
    });

    it("DELETE responde 204 y luego 404", async () => {
        const first = await api.delete("/api/users/2");
        const second = await api.delete("/api/users/2");

        expect(first.status).toBe(204);
        expect(first.text).toBe("");
        expect(second.status).toBe(404);
    });
});

describe("rate limiting", () => {
    it("responde 429 RATE_LIMITED al superar el límite de escrituras", async () => {
        const limited = new Server({ port: 0, bcryptRounds: 4, rateLimit: { limit: 2 } });
        await limited.start();

        try {
            const client = request(`http://localhost:${limited.port}`);

            await client.patch("/api/users/1").send({ name: "Uno" });
            await client.patch("/api/users/1").send({ name: "Dos" });
            const res = await client.patch("/api/users/1").send({ name: "Tres" });

            expect(res.status).toBe(429);
            expect(res.body.error.code).toBe("RATE_LIMITED");
        } finally {
            await limited.stop();
        }
    });
});