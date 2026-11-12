import Server from "./server.js";

const server = new Server();
await server.start();
console.log(`Server is running on port ${server.port}`);