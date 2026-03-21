import gsap from "gsap";

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

const overlay = document.querySelector('.transition-overlay');
const container = document.querySelector('[data-load-container]');

$modular.on('leave', async () => {
    return gsap.to(overlay, {
        y: "0%",
        duration: 0.8,
        ease: "expo.inOut",
        onStart: () => {
            gsap.to(container, { opacity: 0, duration: 0.4 });
        }
    });
});

$modular.on('enter', async () => {
    const tl = gsap.timeline();

    gsap.set(container, { opacity: 0, y: 10 });

    return tl
        .to(overlay, {
            y: "-100%",
            duration: 0.8,
            ease: "expo.inOut"
        })
        .to(container, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            clearProps: "all"
        }, "-=0.4") 
        .set(overlay, { y: "100%" });
});

$modular.init();
