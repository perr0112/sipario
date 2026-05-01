function snapshotComputedStyle(el) {
    const computed = window.getComputedStyle(el);
    const snapshot = {};
    for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        snapshot[camel] = computed.getPropertyValue(prop);
    }
    return snapshot;
}

export class BridgePlugin {
    constructor() {
        this.bridges = [];
    }

    install(modular) {
        modular.on('beforeEnter', ({ to }) => {
            this.bridges = [];

            to.style.opacity = '0';
            to.style.pointerEvents = 'none';
        });

        modular.on('enter', (payload) => {
            const { from, to } = payload;
            const fromElements = from.querySelectorAll('[data-modular-bridge]');

            fromElements.forEach(fromEl => {
                const key = fromEl.getAttribute('data-modular-bridge');
                const toEl = to.querySelector(`[data-modular-bridge="${key}"]`);
                if (!toEl) return;

                const fromRect = fromEl.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();

                const fromComputed = snapshotComputedStyle(fromEl);
                const toComputed = snapshotComputedStyle(toEl);

                const clone = fromEl.cloneNode(true);
                clone.removeAttribute('data-modular-bridge');

                const computed = window.getComputedStyle(fromEl);
                let cssText = '';
                for (let i = 0; i < computed.length; i++) {
                    const prop = computed[i];
                    cssText += `${prop}: ${computed.getPropertyValue(prop)};`;
                }
                clone.style.cssText = cssText;

                clone.style.position = 'fixed';
                clone.style.top = `${fromRect.top}px`;
                clone.style.left = `${fromRect.left}px`;
                clone.style.width = `${fromRect.width}px`;
                clone.style.height = `${fromRect.height}px`;
                clone.style.margin = '0';
                clone.style.padding = '0';
                clone.style.zIndex = '9999';
                clone.style.pointerEvents = 'none';
                clone.style.transformOrigin = 'top left';
                clone.style.transform = 'none';

                document.body.appendChild(clone);

                fromEl.style.visibility = 'hidden';
                toEl.style.visibility = 'hidden';

                this.bridges.push({
                    key,
                    clone,
                    fromEl,
                    toEl,
                    fromRect,
                    toRect,
                    fromComputed,
                    toComputed,
                });
            });

            payload.bridges = this.bridges;
        });

        modular.on('afterEnter', () => {
            const container = document.querySelector('[data-load-container]');
            if (container) {
                container.style.opacity = '';
                container.style.pointerEvents = '';
            }

            this.bridges.forEach(({ toEl }) => {
                toEl.style.visibility = '';
            });

            this.bridges = [];
        });
    }
}