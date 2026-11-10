import app from "./app.js"

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, "0.0.0.0", (error) => {
    if (error) {
        console.error(`No se pudo iniciar el servidor: ${error.message}`);
        process.exit(1);
    }

    console.log(`Servidor escuchando en http://localhost:${PORT}`);
})
