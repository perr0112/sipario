/**
 * @module Modular
 * @description A lightweight NPM package for managing smooth transitions between pages in a Single Page Application (SPA).
 * Features include:
 * - Handling multiple clicks on the browser's back/forward buttons
 * - Caching pages to avoid unnecessary network requests
 * - Integration with GSAP for animations
 * - Synchronization with the browser's history API
 */

// --- Types ---

/**
 * Lifecycle events emitted by Modular, in the order they fire
 * during a navigation.
 */
export type ModularEvent =
    | 'beforeLeave'    // Click intercepted; isTransitioning flips to true.
    | 'leave'          // Outgoing container still in normal flow.
    | 'beforeEnter'    // Incoming container inserted; outgoing isolated to overlay.
    | 'enter'          // Animation window. Return a Promise to block the transition.
    | 'afterEnter';    // Outgoing removed, history updated, new page's init() called.

/**
 * Payload shapes for each lifecycle event.
 */
export interface ModularEventPayloads {
    beforeLeave: void;
    leave: {
        from: HTMLElement;
        fromNamespace: string | null;
    };
    beforeEnter: {
        from: HTMLElement;
        to: HTMLElement;
        fromNamespace: string | null;
        toNamespace: string | null;
    };
    enter: {
        from: HTMLElement;
        to: HTMLElement;
        fromNamespace: string | null;
        toNamespace: string | null;
        signal: AbortSignal;
        /** Present when {@link BridgePlugin} is registered. */
        bridges?: Bridge[];
    };
    afterEnter: {
        to: HTMLElement;
    };
}

/**
 * Callback for a given lifecycle event. Can be async — Modular awaits
 * all callbacks via `Promise.all` before moving on.
 */
export type ModularEventCallback<E extends ModularEvent = ModularEvent> =
    ModularEventPayloads[E] extends void
        ? () => void | Promise<void>
        : (payload: ModularEventPayloads[E]) => void | Promise<void>;

// --- Classes ---

/**
 * Base class for page modules (e.g., Home, About, Work).
 * Extend this class to build your own page.
 */
export class Module {
    /**
     * The main container for the page (automatically detected via [data-load-container]).
     * @default null
     */
    container: HTMLElement | null;

    /**
     * Object to store UI elements for the page (e.g., buttons, images).
     * @default {}
     */
    ui: Record<string, HTMLElement | HTMLElement[]> | null;

    /**
     * List of managed events for this page (automatically cleaned up on destroy).
     * @private
     */
    private _managedEvents: Array<{
        element: EventTarget;
        type: string;
        handler: EventListenerOrEventListenerObject;
    }> | null;

    /**
     * Constructor.
     */
    constructor();

    /**
     * Called after the page content is injected into the DOM.
     * Override this in your subclasses to initialize page-specific logic.
     */
    init(): void;

    /**
     * Get a single element within the page container.
     * @param selector - CSS selector (e.g., '.my-button')
     * @returns The element or null if not found.
     */
    $(selector: string): HTMLElement | null;

    /**
     * Get multiple elements within the page container.
     * @param selector - CSS selector (e.g., '.gallery-item')
     * @returns A NodeList or null if no elements are found.
     */
    $$(selector: string): NodeListOf<HTMLElement> | null;

    /**
     * Add an event listener to an element and store it for automatic cleanup.
     * @param element - Target element (HTMLElement, Window, Document, etc.)
     * @param type - Event type (e.g., 'click', 'scroll')
     * @param handler - Event handler function
     */
    addManagedEvent(
        element: EventTarget,
        type: string,
        handler: EventListenerOrEventListenerObject
    ): void;

    /**
     * Called before the page is removed from the DOM.
     * Override this in your subclasses to clean up page-specific logic.
     * Automatically removes managed events and UI elements.
     */
    destroy(): void;
}

/**
 * Main manager for handling page transitions in a SPA.
 * Handles caching, animations, browser history, and DOM synchronization.
 */
export class Modular {
    /**
     * Configuration options for the package.
     */
    options: {
        /**
         * CSS selector for the main content container.
         * @default "[data-load-container]"
         */
        container?: string;
        /**
         * Map of page identifiers (e.g., 'home', 'about') to their Module classes.
         */
        pages?: Record<string, typeof Module>;
    };

    /**
     * The main content container (automatically detected).
     */
    container: HTMLElement | null;

    /**
     * Current page module instance (e.g., Home, About).
     */
    currentPageInstance: Module | null;

    /**
     * Cache for loaded pages (key: URL, value: page data).
     */
    cache: Map<string, {
        html: string;
        title: string;
        namespace: string;
        fullDoc: string;
    }>;

    /**
     * Custom events emitted by the package.
     */
    events: Record<string, ModularEventCallback[]>;

    /**
     * The document body (used to manage CSS classes).
     */
    body: HTMLBodyElement;

    /**
     * Current page identifier (e.g., 'home', 'about').
     */
    currentNamespace: string | null;

    /**
     * Flag to prevent multiple transitions at once.
     */
    isTransitioning: boolean;

    /**
     * Controller to cancel ongoing fetch requests.
     */
    abortController: AbortController | null;

    /**
     * Unique ID for the current transition (prevents conflicts on rapid clicks).
     */
    activeTransitionId: number;

    /**
     * Constructor.
     * @param options - Configuration options for the package.
     */
    constructor(options?: {
        /**
         * CSS selector for the main content container.
         * @default "[data-load-container]"
         */
        container?: string;
        /**
         * Map of page identifiers to their Module classes.
         */
        pages?: Record<string, typeof Module>;
    });

    /**
     * Initialize the navigation system and set up global event listeners.
     * Must be called after instantiation.
     */
    init(): void;

    /**
     * Update the page metadata (title, meta tags, etc.) from the loaded HTML.
     * @param newDoc - The newly loaded HTML document.
     */
    updateMetadata(newDoc: Document): void;

    /**
     * Check if a link is valid for internal navigation.
     * @param link - The `<a>` element to check.
     * @param event - The click event (to detect keyboard shortcuts like Ctrl+Click).
     * @returns `true` if the link is valid, `false` otherwise.
     */
    isValidLink(link: HTMLAnchorElement, event: MouseEvent): boolean;

    /**
     * Render the page corresponding to the given identifier.
     * @param namespace - The page identifier (e.g., 'home', 'about').
     */
    renderPage(namespace: string): void;

    /**
     * Subscribe to a lifecycle event. Callbacks are awaited via
     * `Promise.all` — returning a Promise from any callback blocks
     * the transition until it resolves.
     * @param event - Event name ('beforeLeave', 'leave', 'beforeEnter', 'enter', 'afterEnter').
     * @param callback - Function to call when the event is emitted.
     */
    on<E extends ModularEvent>(event: E, callback: ModularEventCallback<E>): void;

    /**
     * Emit a lifecycle event to all subscribers. Resolves once every
     * registered callback has resolved.
     * @param event - Event name.
     * @param data - Payload passed to each callback.
     */
    emit<E extends ModularEvent>(
        event: E,
        ...args: ModularEventPayloads[E] extends void
            ? []
            : [payload: ModularEventPayloads[E]]
    ): Promise<void>;

    /**
     * Navigate to a new URL, with caching, animations, and history management.
     * @param href - Destination URL.
     * @param push - If `true`, add an entry to the browser's history. @default true
     * @param ignoreCache - If `true`, bypass the cache and reload the page. @default false
     * @param isPopstate - If `true`, the navigation is triggered by the back/forward button. @default false
     * @returns Promise that resolves after the transition.
     */
    goTo(
        href: string,
        push?: boolean,
        ignoreCache?: boolean,
        isPopstate?: boolean
    ): Promise<void>;

    /**
     * Register a plugin. Plugins install themselves by
     * subscribing to lifecycle events via `on()`.
     */
    use(plugin: ModularPlugin | (new () => ModularPlugin)): this;
}

/**
 * Contract a plugin must satisfy to be registered via `Modular.use`.
 */
export interface ModularPlugin {
    install(modular: Modular): void;
}

/**
 * Describes a bridged element pair produced by {@link BridgePlugin}
 * and delivered to the `enter` event payload as `bridges`.
 */
export interface Bridge {
    key: string;
    clone: HTMLElement;
    fromEl: HTMLElement;
    toEl: HTMLElement;
    fromRect: DOMRect;
    toRect: DOMRect;
    /**
     * Frozen snapshot of `window.getComputedStyle(fromEl)` at the moment
     * the bridge was measured, keyed in camelCase. Every computed CSS
     * property is exposed, so any of them can be animated without
     * touching the plugin.
     */
    fromComputed: Record<string, string>;
    /**
     * Frozen snapshot of `window.getComputedStyle(toEl)` at the moment
     * the bridge was measured, keyed in camelCase.
     */
    toComputed: Record<string, string>;
}

/**
 * Shared-element transition plugin. Matches elements in the outgoing and
 * incoming containers that share the same `data-modular-bridge` key,
 * clones the source, positions it as `fixed` at the source rect, and
 * exposes the clones on the `enter` event payload for the user to animate.
 */
export class BridgePlugin implements ModularPlugin {
    constructor();
    bridges: Bridge[];
    install(modular: Modular): void;
}