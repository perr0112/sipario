import { Module } from "../../src/module";

export class Work extends Module {
    constructor() {
        super();
    }

    init() {
        this.ui.button = this.$(".hero-button");
        this.ui.title = this.$("h1");

        if (this.ui.button) {
            this.addManagedEvent(this.ui.button, "click", () => {
                console.log("Clic sur le bouton Work !");
            });
        }

        this.addManagedEvent(window, "resize", this.onResize.bind(this));

        console.log("Work Initialisée");
    }

    onResize() {
        console.log("Resize capté par la page Work");
    }

    destroy() {
        super.destroy();
        console.log("Work détruite proprement");
    }
}