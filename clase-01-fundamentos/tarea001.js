/*let message = 'Welcome';
let period = new Date().getHours() < 12 ? "AM": "PM";


if (period === "AM") {
    message = "Good Morning";
} else{ 
    message = "Good Afternoon";
};

console.log(message);*/

console.log("Inicio de programa");

setTimeout(() => {
  console.log("Primer Timeout");
}, 3000);

setTimeout(() => {
  console.log("Segundo Timeout");
}, 1);

setTimeout(() => {
  console.log("Tercer Timeout");
}, 0);

console.log("Fin de programa");