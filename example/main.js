import gsap from "gsap";
import { Modular } from "../src/modular.js";
import { BridgePlugin } from "../src/plugins/BridgePlugin.js";

import { Home } from "./pages/home.js";
import { About } from "./pages/About.js";
import { Work } from "./pages/Work.js";
import { Lab } from "./pages/Lab.js";
import { Contact } from "./pages/Contact.js";
import { DetailsWork } from "./pages/DetailsWork.js";

const $modular = new Modular({
    container: '[data-load-container]',
    pages: { 
        'home': Home, 
        'about': About,
        'work': Work,
        'detailedWork': DetailsWork,
        'lab': Lab, 
        'contact': Contact 
    }
});

const themes = {
    home: { bg: "#f7f3ef", text: "#1f1d1b" },
    about: { bg: "#1a1a1a", text: "#ffffff" },
    work: { bg: "#2c3e50", text: "#ecf0f1" },
    lab: { bg: "#6c5ce7", text: "#ffffff" },
    contact: { bg: "#fab1a0", text: "#2d3436" },
    detailedWork: { bg: "#fab1a0", text: "#2d3436" },
};

$modular.use(BridgePlugin);

$modular.on('beforeEnter', async ({ from, fromNamespace, to, toNamespace }) => {
    if (toNamespace) {
        await gsap.to(document.body, {
            background: themes[toNamespace].bg,
            duration: 1.2,
            ease: "power1.in"
        })
    }
})

$modular.on('enter', async ({ from, to, fromNamespace, toNamespace, signal, bridges }) => {
    console.log(from, to, fromNamespace, toNamespace, signal, bridges)
    gsap.set(to, { opacity: 0 });

    const cloneTweens = [];
    const clones = [];

    console.log("nms", toNamespace)

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
                        fontSize: toComputed.fontSize,
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
        if (from) {
            await gsap.to(from, { opacity: 0, y: -20, duration: 0.4, ease: "power2.out" });
        }

        await gsap.fromTo(to, 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        );
    }
});

$modular.init();
