import { Modular } from "./modular.js";
import { Home } from "./pages/Home.js";
import { About } from "./pages/About.js";

const $modular = new Modular({
    container: '[data-load-container]',
    pages: {
        'home': Home,
        'about': About
    }
});

$modular.init();

$modular.on('leave', () => console.log('Transition en cours...'));
