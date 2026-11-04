import peopleData from "../data/people.data.js"
import createPerson from "../factories/person.factory.js"

export const getPeopleData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (peopleData.length === 0) {
                reject(new Error("No people data available"));
                return;
            }

            resolve(peopleData);
        }, 1000);
    })
}

export const buildPeopleReport = async () => {
    const data = await getPeopleData();

    const people = data.map(({ name, birthdate }) => {
        const person = createPerson(name, birthdate);

        return { ...person, isAdult: person.age >= 18 };
    });

    const adults = people.filter((person) => person.isAdult);

    const totalAge = people.reduce((sum, person) => sum + person.age, 0);
    const averageAge = totalAge / people.length;

    return {
        generatedAt: new Date().toISOString(),
        total: people.length,
        adults,
        averageAge
    };
};

