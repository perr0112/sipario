import { Modular } from "../src/modular.js";
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

$modular.on('leave', () => console.log('🏃 Leave current page...'));
$modular.on('afterEnter', (ns) => console.log(`✨ Welcome on ${ns}`));
