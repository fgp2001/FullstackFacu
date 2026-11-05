const REQUIRED_METHODS = ["get", "post", "put", "patch", "delete"];

export const createUserService = (adapter) => {
    for (const method of REQUIRED_METHODS) {
        if (typeof adapter?.[method] !== "function") {
            throw new Error(`HTTP adapter must implement ${method}()`);
        }
    }


    return {
        getUsers: async (page = 1) => {
            const body = await adapter.get(`/users?page=${page}`);
            return body.data
        },


        getUserById: async (id) => {
            const body = await adapter.get(`/users/${id}`);
            return body.data
        },

        createUser: async (user) => {
            return await adapter.post("/users", user);
        },

        updateUser: async (id, user) => {
            return await adapter.put(`/users/${id}`, user)
        },

        patchUser: async (id, user) => {
            return await adapter.patch(`/users/${id}`, user)
        },

        deleteUser: async (id) => {
            return await adapter.delete(`/users/${id}`);
        },

    };
};

export default createUserService;