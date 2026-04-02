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
        this.plugins = []
    }

    use(plugin) {
        const pluginInstance = typeof plugin === 'function' ? new plugin() : plugin;

        if (!pluginInstance || typeof pluginInstance.install !== 'function') {
            throw new TypeError('Modular.use expects a plugin instance or constructor with an install() method.');
        }

        this.plugins.push(pluginInstance);
        pluginInstance.install(this);
        return this;
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
        this.fixedStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.getAttribute('href'));

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
            // this.currentPageInstance.init();
        } else {
            console.warn(`Modular: No class found for namespace "${namespace}"`);
            this.currentPageInstance = null;
        }
    }

    async updateHead(newDoc) {
        const head = document.head;
        const newStyles = Array.from(newDoc.querySelectorAll('link[rel="stylesheet"]'));
        const currentStyleNodes = Array.from(head.querySelectorAll('link[rel="stylesheet"]'));
        const stylePromises = [];

        currentStyleNodes.forEach(styleNode => {
            const href = styleNode.getAttribute('href');
            const isStillNeeded = newStyles.some(s => s.getAttribute('href') === href);
            const isFixed = this.fixedStyles.includes(href);

            if (!isStillNeeded && !isFixed) {
                styleNode.remove();
            }
        });

        newStyles.forEach(newStyle => {
            const href = newStyle.getAttribute('href');
            const alreadyLoaded = head.querySelector(`link[href="${href}"]`);

            if (!alreadyLoaded) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;

                const p = new Promise((resolve) => {
                    link.onload = resolve;
                    link.onerror = resolve;
                });
                
                stylePromises.push(p);
                head.appendChild(link);
            }
        });

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
            const currentNode = head.querySelector(selector);

            if (newNode) {
                if (currentNode) {
                    const attr = newNode.hasAttribute('content') ? 'content' : 'href';
                    currentNode.setAttribute(attr, newNode.getAttribute(attr));
                } else {
                    head.appendChild(newNode.cloneNode(true));
                }
            } else if (currentNode) {
                currentNode.remove();
            }
        });

        return Promise.all(stylePromises);
    }



    // Goto function
    // ========================================
    async goTo(href, push = true, ignoreCache = false, isPopstate = false) {
        const fromNamespace = this.currentNamespace;

        // Abort if necessary
        if (!this._prepareTransition(isPopstate)) return;
        if (!isPopstate && href === window.location.href && !ignoreCache) return;

        const currentId = this.activeTransitionId;
        const { signal } = this.abortController;

        try {
            await this.emit('beforeLeave');
            this.isTransitioning = true;
            this.body.classList.add(CSS_CLASSES.IS_LOADING);
            
            const oldContainer = this.container;
            await this.emit('leave', { from: oldContainer, fromNamespace });

            // Fetch href requested
            const { pageData, newDoc } = await this._fetchPage(href, ignoreCache, signal);

            if (this._isAborted(currentId, signal)) return;

            // Update head
            await this._updateDocument(newDoc);

            // Swap containers
            const nextContainer = await this._swapContainers(pageData, oldContainer, fromNamespace, signal);

            if (this._isAborted(currentId, signal)) {
                nextContainer?.remove();
                return;
            }

            this._finalizeTransition(href, push, isPopstate, pageData, oldContainer, nextContainer);
        } catch (error) {
            this._handleError(error, href);
        }
    }



    _prepareTransition(isPopstate) {
        if (this.isTransitioning && !isPopstate) return false;

        const currentId = Date.now();
        this.activeTransitionId = currentId;

        if (this.isTransitioning && isPopstate) {
            if (this.abortController) this.abortController.abort();
            document.querySelectorAll('.is-next-container').forEach(el => el.remove());
        }

        this.abortController = new AbortController();
        return true;
    }

    _isAborted(currentId, signal) {
        return signal.aborted || this.activeTransitionId !== currentId;
    }

    async _fetchPage(href, ignoreCache, signal) {
        let pageData = ignoreCache ? null : this.cache.get(href);
        let newDoc;

        if (!pageData) {
            const response = await fetch(href, { signal });
            const html = await response.text();
            const parser = new DOMParser();

            newDoc = parser.parseFromString(html, 'text/html');
            const newContainer = newDoc.querySelector(this.options.container || '[data-load-container]');

            if (!newContainer) throw new Error('Target container not found');

            const containerAttributes = {};
            newContainer.getAttributeNames().forEach((name) => {
                containerAttributes[name] = newContainer.getAttribute(name) ?? '';
            });

            // pageData = {
            //     html: newContainer.innerHTML,
            //     fullHtml: html,
            //     title: newDoc.title,
            //     namespace: newContainer.getAttribute('data-modular-namespace'),
            // };
            pageData = {
                html: newContainer.innerHTML,
                fullHtml: html,
                title: newDoc.title,
                namespace: newContainer.getAttribute('data-modular-namespace'),
                containerClass: newContainer.className,
                containerTag: newContainer.tagName.toLowerCase(),
                containerAttributes,
            };

            if (!ignoreCache) this.cache.set(href, pageData);
        } else {
            const parser = new DOMParser();
            newDoc = parser.parseFromString(pageData.fullHtml, 'text/html');

            if (!pageData.containerTag || !pageData.containerAttributes) {
                const cachedContainer = newDoc.querySelector(this.options.container || '[data-load-container]');
                if (cachedContainer) {
                    const containerAttributes = {};
                    cachedContainer.getAttributeNames().forEach((name) => {
                        containerAttributes[name] = cachedContainer.getAttribute(name) ?? '';
                    });

                    pageData.containerTag = cachedContainer.tagName.toLowerCase();
                    pageData.containerAttributes = containerAttributes;
                    pageData.containerClass = cachedContainer.className;
                }
            }
        }

        return { pageData, newDoc };
    }

    async _updateDocument(newDoc) {
        return this.updateHead(newDoc);
    }

    async _swapContainers(pageData, oldContainer, fromNamespace, signal) {
        const nextContainer = document.createElement(pageData.containerTag || 'div');
        nextContainer.innerHTML = pageData.html;

        if (pageData.containerAttributes) {
            Object.entries(pageData.containerAttributes).forEach(([name, value]) => {
                nextContainer.setAttribute(name, value);
            });
        }

        nextContainer.classList.add('is-next-container');

        if (!nextContainer.hasAttribute('data-load-container')) {
            nextContainer.setAttribute('data-load-container', '');
        }

        if (pageData.namespace) {
            nextContainer.setAttribute('data-modular-namespace', pageData.namespace);
        }

        oldContainer.parentNode.appendChild(nextContainer);
        this.body.classList.replace(CSS_CLASSES.IS_LOADING, CSS_CLASSES.IS_CHANGING);

        await this.emit('beforeEnter', {
            from: oldContainer,
            to: nextContainer,
            fromNamespace,
            toNamespace: pageData.namespace,
        });

        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        nextContainer.getBoundingClientRect();

        this.renderPage(pageData.namespace);

        await this.emit('enter', {
            from: oldContainer,
            to: nextContainer,
            fromNamespace,
            toNamespace: pageData.namespace,
            signal,
        });

        return nextContainer;
    }

    async _finalizeTransition(href, push, isPopstate, pageData, oldContainer, nextContainer) {
        oldContainer.remove();
        this.container = nextContainer;
        nextContainer.classList.remove('is-next-container');

        if (push && !isPopstate) history.pushState({}, '', href);

        this.currentNamespace = pageData.namespace;
        this.body.classList.remove(CSS_CLASSES.IS_CHANGING);
        this.isTransitioning = false;

        await this.emit('afterEnter', {
            to: nextContainer,
        });

        this.currentPageInstance.init();
    }

    _handleError(error, href) {
        this.isTransitioning = false;
        if (error.name === 'AbortError') {
            console.log('Modular: Navigation aborted');
        } else {
            console.error('Modular error:', error);
            this.body.classList.remove(CSS_CLASSES.IS_LOADING, CSS_CLASSES.IS_CHANGING);
            window.location.href = href;
        }
    }
}