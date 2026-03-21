import { Module } from "./module.js";

export class Home extends Module {
    constructor() {
        super();
    }

    init() {
        super.init()
        console.log("Home content");
    }

    destroy() {
        super.destroy();
        console.log("Clean home");
    }
}