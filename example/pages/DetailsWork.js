import { Module } from "../../src/module";

export class DetailsWork extends Module {
    constructor() {
        super();
    }

    init() {
        this.addManagedEvent(window, "resize", this.onResize.bind(this));

        console.log("DetailsWork Initialisée");
    }

    onResize() {
        console.log("Resize capté par la page DetailsWork");
    }

    destroy() {
        super.destroy();
        console.log("DetailsWork détruite proprement");
    }
}