import gsap from "gsap";
import { Modular } from "../src/modular.js";
import { CSS_CLASSES } from "../src/config.js";
import { BridgePlugin } from "../src/plugins/BridgePlugin.js";

import { Home } from "./pages/home.js";
import { About } from "./pages/About.js";
import { Work } from "./pages/Work.js";
import { Lab } from "./pages/Lab.js";
import { Contact } from "./pages/Contact.js";
import { DetailsWork } from "./pages/DetailsWork.js";

const $body = document.body;

const $modular = new Modular({
    container: '[data-load-container]',
    pages: { 
        'home': Home, 
        'about': About,
        'work': Work,
        'detailed-work': DetailsWork,
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

// $modular.use(new BridgePlugin());
$modular.use(BridgePlugin);

$modular.on('enter', async ({ from, to, fromNamespace, toNamespace, signal, bridges }) => {
    console.log(from, to, fromNamespace, toNamespace, signal, bridges)
    gsap.set(to, { opacity: 0 });

    const cloneTweens = [];
    const clones = [];

    if (bridges && bridges.length > 0) {
        bridges.forEach(({ clone, toRect, toComputed }, i) => {
            clones.push(clone);

            cloneTweens.push(
                new Promise((resolve) => {
                    gsap.to(clone, {
                        top: toRect.top,
                        left: toRect.left,
                        width: toRect.width,
                        height: toRect.height,
                        borderRadius: toComputed.borderRadius,
                        duration: Math.max(0.2, 0.8 - i * 0.2),
                        ease: "expo.inOut",
                        onComplete: resolve,
                    });
                })
            );
        });

        const revealTween = new Promise((resolve) => {
            gsap.to(to, {
                opacity: 1,
                duration: 0.6,
                delay: 0.2,
                onComplete: resolve,
            });
        });

        await Promise.all([...cloneTweens, revealTween]);

        clones.forEach((clone) => clone.remove());
    } else {
        console.log("....................")
        await new Promise((resolve) => {
            const tl = gsap.timeline({
                onComplete: resolve
            });

            tl.to(from, {
                opacity: 0,
                y: -20,
                duration: 0.4,
                ease: "power2.out"
            })
            .fromTo(to,
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "power2.out"
                },
                "-=0.2"
            );
        });
    }
});

$modular.init();
