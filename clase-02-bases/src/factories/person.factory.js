import {generateId} from "../adapters/id.adapter.js"
import {calculateAge} from "../adapters/age.adapter.js"


export const createPerson = (name, birthdate) => ({
    id: generateId(),
    name,
    birthdate,
    age: calculateAge(birthdate),
});

export default createPerson;


