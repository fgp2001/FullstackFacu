import axios from "axios";
import env from '../../config/env.config.js';

const client = axios.create({
    baseURL: env.reqresBaseUrl,
    timeout: 5000,
    headers: { Accept: "application/json" },
});

// Normalización de errores
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        return Promise.reject(
            new Error(status ? `HTTP error: ${status}` : error.message),
        );
    },

);
const unwrap = (response) => (response.status === 204 ? null : response.data);

const axiosAdapter = {
    get: async (path, options) => unwrap(await client.get(path, options)),
    post: async (path, body, options) => unwrap(await client.post(path, body, options)),
    put: async (path, body, options) => unwrap(await client.put(path, body, options)),
    patch: async (path, body, options) => unwrap(await client.patch(path, body, options)),
    delete: async (path, options) => unwrap(await client.delete(path, options)),

};

export default axiosAdapter;
