import { Router } from "express";
import { posts } from "../data/posts.data.js";

const pagesRouter = Router();

pagesRouter.get("/", (request, response) => {
    response.render("home", {
        title: "Inicio",
        section: "home",
        posts,
    });
});

pagesRouter.get("/about", (request, response) => {
    response.render("about", {
        title: "Acerca de",
        section: "about",
    });
});

export default pagesRouter;