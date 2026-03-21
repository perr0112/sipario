import { Modular } from "./modular.js";
import { Home } from "./pages/home.js";
import { About } from "./pages/about.js";

const PAGES_MAP = {
    'home': Home,
    'about': About
};

const $modular = new Modular();
let currentPageInstance = null;

const initPageScripts = (namespace) => {
    if (currentPageInstance && typeof currentPageInstance.destroy === 'function') {
        currentPageInstance.destroy();
    }

    const PageClass = PAGES_MAP[namespace];

    if (PageClass) {
        currentPageInstance = new PageClass();
        currentPageInstance.init();
    } else {
        console.warn(`Aucune classe trouvée pour le namespace: ${namespace}`);
        currentPageInstance = null;
    }
};

window.addEventListener("DOMContentLoaded", () => {
    $modular.init();
    const initialNamespace = document.querySelector('[data-load-container]').getAttribute('data-modular-namespace');
    initPageScripts(initialNamespace);
});

$modular.on('enter', (namespace) => {
    initPageScripts(namespace);
});