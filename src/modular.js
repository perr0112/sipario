export class Modular {
    constructor(options = {}) {
        this.options = options;
        this.pagesMap = options.pages || {};
        this.currentPageInstance = null;
        this.cache = new Map();
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(cb => cb(data));
        }
    }

    init() {
        this.container = document.querySelector(this.options.container || "[data-load-container]");
        
        const initialNamespace = this.container.getAttribute('data-modular-namespace');
        this.renderPage(initialNamespace);

        document.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (!link || !this.isValidLink(link)) return;
            e.preventDefault();
            this.goTo(link.href);
        });

        window.addEventListener("popstate", () => this.goTo(window.location.href, false));
    }

    isValidLink(link) {
        const isSameOrigin = link.origin === window.location.origin;
        const isAnchor = link.getAttribute('href').startsWith('#');
        return isSameOrigin && !isAnchor && !link.hasAttribute('data-modular-ignore');
    }

    renderPage(namespace) {
        if (this.currentPageInstance && typeof this.currentPageInstance.destroy === 'function') {
            this.currentPageInstance.destroy();
        }

        const PageClass = this.pagesMap[namespace];

        if (PageClass) {
            this.currentPageInstance = new PageClass();
            this.currentPageInstance.init();
        } else {
            console.warn(`Modular: No class found for namespace "${namespace}"`);
            this.currentPageInstance = null;
        }
    }

    async goTo(href, push = true) {
        await this.emit('leave');

        try {
            const response = await fetch(href);
            const html = await response.text();
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, "text/html");
            const newContainer = newDoc.querySelector(this.options.container || "[data-load-container]");
            const namespace = newContainer.getAttribute('data-modular-namespace');

            this.container.style.opacity = "0"; 

            this.container.innerHTML = newContainer.innerHTML;
            this.container.setAttribute('data-modular-namespace', namespace);
            document.title = newDoc.title;
            if (push) history.pushState({}, "", href);

            this.renderPage(namespace);

            await this.emit('enter', namespace); 
            
            this.emit('afterEnter', namespace);
        } catch (error) {
            window.location.href = href;
        }
    }

    async emit(event, data) {
        if (this.events[event]) {
            await Promise.all(this.events[event].map(cb => cb(data)));
        }
    }
}