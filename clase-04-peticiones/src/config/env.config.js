const requiredVariables = ["REQRES_BASE_URL"];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing required environment variable: ${variable}`);
    }
}

const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3000),
    reqresBaseUrl: process.env.REQRES_BASE_URL.replace(/\/+$/, ""),
};

export default env;