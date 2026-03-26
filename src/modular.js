import { CSS_CLASSES } from "./config";

export class Modular {
    constructor(options = {}) {
        this.options = options;
        this.pagesMap = options.pages || {};
        this.currentPageInstance = null;
        this.cache = new Map();
        this.events = {};
        this.body = document.body;
        this.currentNamespace = null;

        this.isTransitioning = false;
        this.abortController = null;
        this.activeTransitionId = 0;
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    async emit(event, data) {
        if (this.events[event]) {
            await Promise.all(this.events[event].map(cb => cb(data)));
        }
    }

    init() {
        this.container = document.querySelector(this.options.container || "[data-load-container]");
        if (!this.container) {
            console.error(`Modular: Container "${this.options.container}" not found.`);
            return;
        }

        const initialNamespace = this.container.getAttribute('data-modular-namespace');
        this.currentNamespace = initialNamespace;
        this.renderPage(initialNamespace);

        document.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (!link || !this.isValidLink(link, e)) return;

            if (this.isTransitioning) {
                e.preventDefault();
                return;
            }

            e.preventDefault();
            const ignoreCache = link.hasAttribute('data-modular-no-cache');
            this.goTo(link.href, true, ignoreCache);
        });

        window.addEventListener("popstate", () => {
            this.goTo(window.location.href, false, false, true);
        });
    }

    updateMetadata(newDoc) {
        const newTitle = newDoc.querySelector('title')?.innerText;
        if (newTitle) document.title = newTitle;

        const metaSelectors = [
            'meta[name="description"]',
            'meta[property^="og:"]',
            'meta[name^="twitter:"]',
            'link[rel="canonical"]'
        ];

        metaSelectors.forEach(selector => {
            const newNode = newDoc.querySelector(selector);
            const currentNode = document.head.querySelector(selector);

            if (newNode) {
                if (currentNode) {
                    const attributeName = newNode.hasAttribute('content') ? 'content' : 'href';
                    currentNode.setAttribute(attributeName, newNode.getAttribute(attributeName));
                } else {
                    document.head.appendChild(newNode.cloneNode(true));
                }
            } else if (currentNode) {
                currentNode.remove();
            }
        });
    }

    isValidLink(link, e) {
        const href = link.getAttribute('href');
        const isSpecial = href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:');
        const isNewTab = link.target === '_blank' || e.ctrlKey || e.shiftKey || e.metaKey || e.altKey;

        return link.origin === window.location.origin && !isSpecial && !isNewTab && !link.hasAttribute('data-modular-ignore');
    }

    renderPage(namespace) {
        const prefix = CSS_CLASSES.IS_PREFIX;
        Array.from(this.body.classList).forEach(cls => {
            if (cls.startsWith(prefix)) this.body.classList.remove(cls);
        });

        if (namespace) this.body.classList.add(`${prefix}${namespace}`);

        if (
            this.currentPageInstance &&
            this.currentPageInstance?.destroy &&
            typeof this.currentPageInstance.destroy === 'function'
        ) {
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

    async goTo(href, push = true, ignoreCache = false, isPopstate = false) {
        if (this.isTransitioning && !isPopstate) return;

        const currentId = Date.now();
        this.activeTransitionId = currentId;

        if (this.isTransitioning && isPopstate) {
            if (this.abortController) this.abortController.abort();
            document.querySelectorAll('.is-next-container').forEach(el => el.remove());
        }

        if (!isPopstate && href === window.location.href && !ignoreCache) return;

        this.abortController = new AbortController();
        const { signal } = this.abortController;

        this.isTransitioning = true;
        this.body.classList.add(CSS_CLASSES.IS_LOADING);
        await this.emit('leave');

        try {
            let pageData = ignoreCache ? null : this.cache.get(href);
            let newDoc;

            if (!pageData) {
                const response = await fetch(href, { signal });
                const html = await response.text();
                const parser = new DOMParser();
                newDoc = parser.parseFromString(html, "text/html");
                const newContainer = newDoc.querySelector(this.options.container || "[data-load-container]");

                if (!newContainer) throw new Error("Target container not found.");

                pageData = {
                    html: newContainer.innerHTML,
                    title: newDoc.title,
                    namespace: newContainer.getAttribute('data-modular-namespace'),
                };

                if (!ignoreCache) this.cache.set(href, pageData);
            } else {
                const parser = new DOMParser();
                newDoc = parser.parseFromString(pageData.fullDoc, "text/html");
            }

            if (this.activeTransitionId !== currentId || signal.aborted) return;

            this.updateMetadata(newDoc);

            const oldContainer = this.container;
            document.querySelectorAll('.is-next-container').forEach(el => el.remove());

            const nextContainer = document.createElement('div');
            nextContainer.classList.add('is-next-container');
            nextContainer.innerHTML = pageData.html;

            nextContainer.setAttribute('data-load-container', '');
            if (pageData.namespace) nextContainer.setAttribute('data-modular-namespace', pageData.namespace);
            nextContainer.className = oldContainer.className;

            oldContainer.parentNode.appendChild(nextContainer);
            this.body.classList.replace(CSS_CLASSES.IS_LOADING, CSS_CLASSES.IS_CHANGING);

            this.renderPage(pageData.namespace);

            await this.emit('transition', {
                from: oldContainer,
                to: nextContainer,
                namespace: pageData.namespace,
                signal: signal
            });

            if (signal.aborted || this.activeTransitionId !== currentId) {
                nextContainer.remove();
                return;
            }

            oldContainer.remove();
            this.container = nextContainer;
            nextContainer.classList.remove('is-next-container');

            if (push && !isPopstate) history.pushState({}, "", href);

            this.currentNamespace = pageData.namespace;
            this.body.classList.remove(CSS_CLASSES.IS_CHANGING);
            this.isTransitioning = false;
            await this.emit('afterEnter', pageData.namespace);

        } catch (error) {
            this.isTransitioning = false;
            if (error.name === 'AbortError') {
                console.log("Modular: Navigation aborted.");
            } else {
                console.error("Modular Error:", error);
                this.body.classList.remove(CSS_CLASSES.IS_LOADING, CSS_CLASSES.IS_CHANGING);
                window.location.href = href;
            }
        }
    }
}