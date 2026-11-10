import express from "express";
import path from "node:path";
import { engine } from "express-handlebars";

import { site } from "./data/posts.data.js";
import pagesRouter from "./routes/pages.routes.js";
import postsRouter from "./routes/posts.routes.js";

const app = express();

const viewsDir = path.join(import.meta.dirname, "views");
const publicDir = path.join(import.meta.dirname, "..", "public");

// Motor de plantillas
app.engine("handlebars",
    engine({
        layoutsDir: path.join(viewsDir, "layouts"),
        partialsDir: path.join(viewsDir, "partials"),
        defaultLayout: "main",
        extname: ".handlebars",
        helpers: {
            eq: (a, b) => a === b,
            upper: (value) => String(value ?? "").toUpperCase(),
            formatDate: (value) =>
                new Intl.DateTimeFormat("es-AR", {
                    dateStyle: "long",
                    timeZone: "UTC",
                }).format(new Date(value)),
        },
    }),
);

app.set("view engine", "handlebars");
app.set("views", viewsDir);

// Datos globales para todas las vistas
app.locals.site = { ...site, year: new Date().getFullYear() };
app.locals.nav = [
    { id: "home", href: "/", label: "Inicio" },
    { id: "posts", href: "/posts", label: "Posts" },
    { id: "about", href: "/about", label: "Acerca de" },
];

//Middleware
app.use((request, response, next) => {
    const startedAt = Date.now();

    response.on("finish", () => {
        console.log(
            `${request.method} ${request.url} → ${response.statusCode} (${Date.now() - startedAt} ms)`,
        );
    });

    next();
});

app.use(express.static(publicDir));

//Rutas
app.use("/", pagesRouter);
app.use("/posts", postsRouter);

//404 
app.use((request, response) => {
    response.status(404).render("404", { title: "No encontrado" });
});

//Errores - Siempre 4 parametros
app.use((error, request, response, next) => {
    console.error(error);
    response.status(500).render("500", { title: "Error" });
});

export default app;