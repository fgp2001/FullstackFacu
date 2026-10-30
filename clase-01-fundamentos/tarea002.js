const fs = require("fs");

const data = fs.readFileSync("README.md", "utf8");

console.log(data);

fs.writeFileSync("README-COPY.md", data.replace(/JavaScript/gi, "ECMAScript"));

const copy = fs.readFileSync("README-COPY.md", "utf8");

const words = copy.trim().split(/\s+/);

console.log("Cantidad de palabras:", words.length);

const occurrences = copy.match(/ECMAScript/g);

console.log("Ocurrencias de ECMAScript:", occurrences ? occurrences.length : 0);


