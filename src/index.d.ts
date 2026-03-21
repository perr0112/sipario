/**
 * Base class for page modules.
 * Every page (Home, About, etc.) should extend this class.
 */
export class Module {
    /** The main container of the page (automatically queried) */
    container: HTMLElement | null;

    constructor();

    /** * Called after the page content is injected into the DOM.
     * Override this in your sub-classes.
     */
    init(): void;

    /** * Called before the page is removed.
     * Override this to clean up your page-specific logic.
     */
    destroy(): void;
}

/**
 * Main Orchestrator for Modular Load
 */
export class Modular {
    options: {
        container?: string;
        pages?: Record<string, typeof Module>;
    };

    constructor(options?: {
        /** CSS Selector for the content container. Default: "[data-load-container]" */
        container?: string;
        /** Object mapping namespaces to Module classes */
        pages?: Record<string, typeof Module>;
    });

    /** Initializes the navigation system and global click listeners */
    init(): void;

    /** * Listens to Modular lifecycle events.
     * Supports async callbacks (perfect for GSAP/Animations).
     */
    on(event: 'leave' | 'enter' | 'afterEnter', callback: (data?: any) => void | Promise<void>): void;

    /** Programmatically navigate to a new URL */
    goTo(href: string, push?: boolean): Promise<void>;
}