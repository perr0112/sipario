import { Modular } from "./modular.js";

const $modular = new Modular();

$modular.on('leave', () => document.body.style.opacity = "0.5");
$modular.on('afterEnter', () => document.body.style.opacity = "1");

window.addEventListener("DOMContentLoaded", () => {
    $modular.init();
});
