//console.log("My first Node.js app");

// Al utilizar CommonJS:

//const CURRENT_DATE = require('./utils/constants');
//console.log(CURRENT_DATE)

//Al utilizar ECM - Modules:
//import { CURRENT_DATE } from "./utils/constants.js";
//console.log(CURRENT_DATE)
import { v4 as uuidv4 } from "uuid";
import getAge from "get-age";
import makePerson from "./factories/person.factory.js";

const createPerson = makePerson({ uuidv4, getAge });

const people = [
  createPerson("John Doe", "2000-05-15"),
  createPerson("Facundo Pereira", "2001-01-15"),
  createPerson("Carlos Pérez", "1988-03-20"),
];

console.log(people);

