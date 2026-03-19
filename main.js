import { Modular } from "./modular.js"

console.log("mounted from main.js file")

let $modular

window.addEventListener("load", () => {
    $modular = new Modular()
    $modular.init()
})