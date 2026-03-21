export class Modular {
    constructor(options = {}) {
        this.options = options;
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
        
        console.log("Modular initialized on:", window.location.pathname);

        document.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (!link || !this.isValidLink(link)) return;

            e.preventDefault();
            // console.log("Navigation interceptée vers : ", link.href);
            this.goTo(link.href);
        });

        window.addEventListener("popstate", () => {
            this.goTo(window.location.href, false);
        });
    }

    isValidLink(link) {
        const isSameOrigin = link.origin === window.location.origin;
        const isAnchor = link.getAttribute('href').startsWith('#');
        return isSameOrigin && !isAnchor && !link.hasAttribute('data-modular-ignore');
    }

    async goTo(href, push = true) {
        this.emit('leave');
        document.body.classList.add('is-loading');

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            let html;
            if (this.cache.has(href)) {
                html = this.cache.get(href);
            } else {
                const response = await fetch(href);
                html = await response.text();
                this.cache.set(href, html);
            }

            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, "text/html");
            const newContent = newDoc.querySelector("[data-load-container]").innerHTML;

            this.container.innerHTML = newContent;
            document.title = newDoc.title;
            if (push) history.pushState({}, "", href);

            this.emit('enter');

            setTimeout(() => {
                document.body.classList.remove('is-loading');
                this.emit('afterEnter');
            }, 50);

        } catch (error) {
            console.error("Modular Error:", error);
            window.location.href = href;
        }
    }
}