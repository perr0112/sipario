import { Module } from "../../src/module";

export class Contact extends Module {
    constructor() {
        super();
    }

    init() {
        this.ui.button = this.$(".hero-button");
        this.ui.title = this.$("h1");

        if (this.ui.button) {
            this.addManagedEvent(this.ui.button, "click", () => {
                console.log("Clic sur le bouton Contact !");
            });
        }

        this.addManagedEvent(window, "resize", this.onResize.bind(this));

        console.log("Contact Initialisée");
    }

    onResize() {
        console.log("Resize capté par la page Contact");
    }

    destroy() {
        super.destroy();
        console.log("Contact détruite proprement");
    }
}