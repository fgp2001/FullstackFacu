function makePerson ({ uuidv4, getAge })  {
    return function createPerson(name, birthdate) {
        return {
            id: uuidv4(),
            name,
            age: getAge(birthdate)
        };
    };
};


export default makePerson;