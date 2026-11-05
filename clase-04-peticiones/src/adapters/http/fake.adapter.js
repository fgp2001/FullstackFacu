const fakeUser = {
  id: 1,
  email: "fake@example.com",
  first_name: "Fake",
  last_name: "User",
};

const fakeAdapter = {
  get: async (path) =>
    path.startsWith("/users?") ? { data: [fakeUser] } : { data: fakeUser },
  post: async (path, body) => ({ ...body, id: "123", createdAt: new Date().toISOString() }),
  put: async (path, body) => ({ ...body, updatedAt: new Date().toISOString() }),
  patch: async (path, body) => ({ ...body, updatedAt: new Date().toISOString() }),
  delete: async () => null,
};

export default fakeAdapter;