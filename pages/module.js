export class Module {
    constructor() {
        this.container = document.querySelector("[data-load-container]");
    }

    init() {
        console.log("Module Parent Init");
    }

    destroy() {
        console.log("Module Parent Destroy");
    }
}
