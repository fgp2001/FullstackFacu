import env from '../../config/env.config.js';

const request = async (method, path, body, options = {}) => {
    const hasBody = body !== undefined;

    const response = await fetch(`${env.reqresBaseUrl}${path}`, {
        // AbortSignal es utilizado para abortar la solicitud si se demora demasiado, si cambiamos el valor
        // a 1 directamente nos va a devolver un error de timeout
        signal: AbortSignal.timeout(5000),
        ...options,
        method,
        headers: {
            Accept: "application/json",
            ...(hasBody && { "Content-Type": "application/json" }),
            ...options.headers,
        },
        body: hasBody ? JSON.stringify(body) : undefined,
    });


    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();


};

const fetchAdapter = {
    get: (path, options) => request("GET", path, undefined, options),
    post: (path, body, options) => request("POST", path, body, options),
    put: (path, body, options) => request("PUT", path, body, options),
    patch: (path, body, options) => request("PATCH", path, body, options),
    delete: (path, options) => request("DELETE", path, undefined, options)
}

export default fetchAdapter;