import { Router } from "express";
import { posts } from "../data/posts.data.js";

const postsRouter = Router();

postsRouter.get("/", (request, response) => {
    response.render("posts", {
        title: "Todos los posts",
        section: "posts",
        posts,
    });
});


postsRouter.get("/:slug", (request, response, next) => {
    const post = posts.find((item) => item.slug === request.params.slug);

    if (!post) return next();

    response.render("post", {
        title: post.title,
        section: "posts",
        post,
    });
});

export default postsRouter;