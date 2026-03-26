import gsap from "gsap";
import { Modular } from "../src/modular.js";
import { CSS_CLASSES } from "../src/config.js";

import { Home } from "./pages/home.js";
import { About } from "./pages/About.js";
import { Work } from "./pages/Work.js";
import { Lab } from "./pages/Lab.js";
import { Contact } from "./pages/Contact.js";

const $body = document.body;

const $modular = new Modular({
    container: '[data-load-container]',
    pages: { 
        'home': Home, 
        'about': About,
        'work': Work,
        'lab': Lab, 
        'contact': Contact 
    }
});

const themes = {
    home: { bg: "#f7f3ef", text: "#1f1d1b" },
    about: { bg: "#1a1a1a", text: "#ffffff" },
    work: { bg: "#2c3e50", text: "#ecf0f1" },
    lab: { bg: "#6c5ce7", text: "#ffffff" },
    contact: { bg: "#fab1a0", text: "#2d3436" }
};

$modular.on('transition', async ({ from, to, namespace }) => {
    const theme = themes[namespace] || themes.home;
    const tl = gsap.timeline({ defaults: { duration: 1.1, ease: "expo.inOut" } });

    if (namespace === 'lab' || namespace === 'contact') {
        gsap.set(to, { y: "100%", opacity: 0, scale: 0.9 });
        
        return tl
            .to($body, { backgroundColor: theme.bg, color: theme.text }, 0)
            .to(from, { y: "-50%", scale: 0.8, opacity: 0 }, 0)
            .to(to, { y: "0%", scale: 1, opacity: 1 }, 0.1);
    }

    if (namespace === 'about') {
        gsap.set(to, { scale: 1.2, opacity: 0 });
        
        return tl
            .to($body, { backgroundColor: theme.bg, color: theme.text }, 0)
            .to(from, { scale: 0.8, opacity: 0 }, 0)
            .to(to, { scale: 1, opacity: 1 }, 0.2);
    }

    gsap.set(to, { x: "100%", z: -400, opacity: 0 });
    
    return tl
        .addLabel('start')
        .to($body, { backgroundColor: theme.bg, color: theme.text }, 'start')
        .to(from, { 
            x: "-100%", 
            z: -400, 
            scale: 0.6, 
            opacity: 0,
            rotationY: -15
        }, 'start')
        .to(to, { 
            x: "0%", 
            z: 0, 
            scale: 1, 
            opacity: 1,
            rotationY: 0,
            clearProps: "all" 
        }, 'start');
});

$modular.on('afterEnter', () => {
    $body.classList.remove(CSS_CLASSES.IS_LOADING, CSS_CLASSES.IS_CHANGING);
});

$modular.init();
