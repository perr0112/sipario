import { Module } from "./module.js";

export class About extends Module {
    constructor() {
        super();
    }

    init() {
        super.init()
        console.log("About content");
    }

    destroy() {
        super.destroy();
        console.log("Clean about");
    }
}