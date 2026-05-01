export class Module {
    constructor() {
        this.container = null;
        this.ui = {};
        this._managedEvents = [];
    }

    $(selector) {
        return this.container.querySelector(selector);
    }

    $$(selector) {
        return this.container.querySelectorAll(selector);
    }

    addManagedEvent(element, type, handler) {
        element.addEventListener(type, handler);
        this._managedEvents.push({ element, type, handler });
    }

    init() {
        this.container = document.querySelector("[data-load-container]");
        if (!this.container) throw new Error("Target container not found");
    }

    destroy() {
        this._managedEvents.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this._managedEvents = [];

        this.ui = {};
        this.container = null;
    }
}