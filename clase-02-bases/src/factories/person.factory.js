import { v4 as uuidv4 } from "uuid";
import getAge from "get-age";


export const createPerson = (name, birthdate) => ({
    id: uuidv4(),
    name,
    birthdate,
    age: getAge(birthdate),
});