import fetchAdapter from "./adapters/http/fetch.adapter.js"
import axiosAdapter from "./adapters/http/axios.adapter.js"
import createUserService from "./services/user.service.js";
import fakeAdapter from "./adapters/http/fake.adapter.js"

//

const userService = createUserService(axiosAdapter);

const runOperation = async (label, operation) => {
    try {
        const result = await operation();
        console.log(`${label}:`, result);
    } catch (error) {
        console.error(`${label} failed: ${error.message}`);

    } finally {
        console.log(`${label} finished\n`);
    }
};

const main = async () => {
    await runOperation("getUsers", () => userService.getUsers(1));
    await runOperation("getUserById", () => userService.getUserById(2));
    await runOperation("createUser", () => userService.createUser({ name: "John Doe", job:"Lead"}));
    await runOperation("updateUser", () => userService.updateUser(2, {name: "John Doe", job:"Engineer"}));
    await runOperation("patchUser", () => userService.patchUser(2, {job: "Manager"}));
    await runOperation("deleteUser", () => userService.deleteUser(2));
    //Caso de prueba de un Not Found: await runOperation("notFound", () => userService.getUserById(9999));
}

main();


