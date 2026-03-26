export class Module {
    constructor() {
        this.container = document.querySelector("[data-load-container]");
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

    init() {}

    destroy() {
        this._managedEvents.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this._managedEvents = [];

        this.ui = {};
        this.container = null;
    }
}