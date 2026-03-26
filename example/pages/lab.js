import { Module } from "../../src/module";

export class Lab extends Module {
    constructor() {
        super();
    }

    init() {
        this.ui.button = this.$(".hero-button");
        this.ui.title = this.$("h1");

        if (this.ui.button) {
            this.addManagedEvent(this.ui.button, "click", () => {
                console.log("Clic sur le bouton Lab !");
            });
        }

        this.addManagedEvent(window, "resize", this.onResize.bind(this));

        console.log("Lab Initialisée");
    }

    onResize() {
        console.log("Resize capté par la page Lab");
    }

    destroy() {
        super.destroy();
        console.log("Lab détruite proprement");
    }
}