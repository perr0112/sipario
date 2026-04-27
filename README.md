![Sipario cover](./docs/cover.png)

# Sipario

A lightweight, framework-agnostic library for SPA-style page transitions on multi-page sites.

## Why Sipario

A native browser navigation reloads the whole document: stylesheets re-execute, scripts re-run, and any in-flight animation stops cold. Sipario intercepts same-origin link clicks, fetches the next page in the background, and swaps only a single content region while the rest of your document stays alive. You get one place to wire up animations between pages (GSAP, the Web Animations API, CSS — whatever you already use), a small lifecycle with five awaited events, and a plugin hook for shared-element transitions. It takes inspiration from [Barba.js](https://barba.js.org/) and [Swup](https://swup.js.org/) and keeps the API surface at that level.

## Installation

```bash
npm install @perr0112/sipario
# or
pnpm add @perr0112/sipario
# or
yarn add @perr0112/sipario
```

Sipario ships ESM, CJS/UMD, and TypeScript declarations. Zero runtime dependencies.

## Basic usage

### 1. Mark the swappable region

Each page wraps its content in an element carrying `data-load-container` and a `data-modular-namespace`. The namespace identifies the page (used for routing and for the `is-page-{namespace}` class on `<body>`). Anything outside that element — headers, footers, scripts — is preserved across navigations.

```html
<!-- index.html -->
<body>
  <header>…shared across pages…</header>

  <main data-load-container data-modular-namespace="home">
    <h1>Home</h1>
    <a href="/about.html">About</a>
  </main>

  <script type="module" src="/main.js"></script>
</body>
```

```html
<!-- about.html -->
<body>
  <header>…shared across pages…</header>

  <main data-load-container data-modular-namespace="about">
    <h1>About</h1>
    <a href="/">Back home</a>
  </main>

  <script type="module" src="/main.js"></script>
</body>
```

### 2. Describe each page (optional)

Subclass `Module` to run setup/teardown when a page is live. `$` and `$$` are scoped to `this.container`; `addManagedEvent` registers a listener that is auto-removed when the page leaves.

```js
// pages/Home.js
import { Module } from '@perr0112/sipario';

export class Home extends Module {
  init() {
    super.init();
    this.ui.cta = this.$('.cta');
    this.addManagedEvent(this.ui.cta, 'click', () => console.log('clicked'));
  }
}
```

### 3. Wire up Modular and animate transitions

```js
// main.js
import gsap from 'gsap';
import { Modular } from '@perr0112/sipario';
import { Home } from './pages/Home.js';
import { About } from './pages/About.js';

const modular = new Modular({
  container: '[data-load-container]',
  pages: { home: Home, about: About },
});

modular.on('beforeEnter', async ({ from, to }) => {
  gsap.set(to, { opacity: 0 })
})

modular.on('enter', async ({ from, to }) => {
  await gsap.to(from, { opacity: 0, y: -20, duration: 0.4 });
  await gsap.fromTo(
    to,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5 }
  );
});

modular.init();
```

## Lifecycle hooks

Every navigation fires these five events in order. Callbacks are awaited via `Promise.all`, so returning a Promise from any hook blocks the transition until it resolves.

| Event          | Payload                                                          | When                                                                            |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `beforeLeave`  | —                                                                | Click intercepted; `isTransitioning` flips to `true`.                           |
| `leave`        | `{ from, fromNamespace }`                                        | Outgoing container still in normal flow.                                        |
| `beforeEnter`  | `{ from, to, fromNamespace, toNamespace }`                       | Incoming container inserted; outgoing isolated into an overlay root.            |
| `enter`        | `{ from, to, fromNamespace, toNamespace, signal, bridges? }`     | Run your animation here. `signal` aborts if another navigation overrides this. |
| `afterEnter`   | `{ to }`                                                         | Outgoing removed, history updated, new page's `init()` called.                  |

```js
modular.on('beforeEnter', ({ toNamespace }) => {
  document.body.dataset.theme = toNamespace;
});
```

## HTML attributes

| Attribute                    | Where                   | Purpose                                                  |
| ---------------------------- | ----------------------- | -------------------------------------------------------- |
| `data-load-container`        | Content wrapper         | Marks the swappable region.                              |
| `data-modular-namespace`     | On `[data-load-container]` | Page identity. Drives routing and `is-page-{ns}` class. |
| `data-modular-ignore`        | On `<a>`                | Fall back to a regular browser navigation.               |
| `data-modular-no-cache`      | On `<a>`                | Bypass the in-memory cache and refetch.                  |
| `data-modular-bridge="key"`  | Any element             | Shared-element pair consumed by `BridgePlugin`.          |

## CSS hooks

`<body>` gains state classes you can style against:

| Class                   | When                                    |
| ----------------------- | --------------------------------------- |
| `is-loading`            | During fetch.                           |
| `is-changing`           | During the animation window.            |
| `is-page-{namespace}`   | While that page is current.             |

The outgoing container gets `is-old-container`; the incoming container gets `is-next-container` until the transition completes.

## Plugins

A plugin is any object (or class) with an `install(modular)` method. Register it with `use()`, which accepts either a constructor (instantiated for you) or a ready-made instance.

```js
class LoggerPlugin {
  install(modular) {
    modular.on('enter', ({ fromNamespace, toNamespace }) => {
      console.log(`→ ${fromNamespace} → ${toNamespace}`);
    });
  }
}

modular.use(LoggerPlugin);
```

Plugins should only communicate with Modular through `on()` and the lifecycle payload — never by touching `Modular` internals directly.

### BridgePlugin — shared-element transitions

`BridgePlugin` handles the DOM plumbing for shared-element ("FLIP") transitions. Mark matching elements in two pages with the same `data-modular-bridge` key:

```html
<!-- work.html -->
<h1 data-modular-bridge="hero-title">Green — Etsy ©</h1>
<img src="/hero.jpg" data-modular-bridge="hero-image" />
```

```html
<!-- detailedWork.html -->
<h1 data-modular-bridge="hero-title">Green — Etsy ©</h1>
<img src="/hero.jpg" data-modular-bridge="hero-image" />
```

Register it and animate the clones in your `enter` hook:

```js
import { Modular, BridgePlugin } from '@perr0112/sipario';
import gsap from 'gsap';

const modular = new Modular({ /* … */ });
modular.use(BridgePlugin);

modular.on('enter', async ({ bridges, to }) => {
  await Promise.all(
    bridges.map(({ clone, toRect, toComputed }) =>
      gsap.to(clone, {
        top: toRect.top,
        left: toRect.left,
        width: toRect.width,
        height: toRect.height,
        borderRadius: toComputed.borderRadius,
        duration: 0.6,
        ease: 'expo.inOut',
      })
    )
  );

  bridges.forEach(({ clone }) => clone.remove());
});

modular.init();
```

What the plugin does for you:

- Measures the source and target elements with `getBoundingClientRect()`.
- Clones the source element, copies its computed styles inline, and appends the clone to `<body>` positioned `fixed` at the source rect.
- Hides both originals while the clone animates.
- Exposes the array of `{ clone, fromRect, toRect, fromComputed, toComputed, fromEl, toEl, key }` on `payload.bridges` during `enter`.

Each clone is yours to animate (and to remove when done).

## API reference

### `new Modular(options)`

| Option      | Type                                 | Default                    | Description                                   |
| ----------- | ------------------------------------ | -------------------------- | --------------------------------------------- |
| `container` | `string`                             | `"[data-load-container]"`  | CSS selector for the swappable region.        |
| `pages`     | `Record<string, typeof Module>`      | `{}`                       | Map of namespace → page class (both optional).|

### Modular methods

| Method                                                        | Description                                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `init()`                                                      | Attaches click/popstate listeners and bootstraps the first page. Call once at startup.                   |
| `use(plugin)`                                                 | Registers a plugin. Accepts a class or an instance. Returns `this` for chaining.                         |
| `on(event, callback)`                                         | Subscribes to a lifecycle event. Callbacks are awaited.                                                  |
| `goTo(href, push?, ignoreCache?, isPopstate?)`                | Navigates programmatically. Defaults mirror a normal link click (`push = true`, the rest `false`).       |

### Module methods

| Method                                 | Description                                                                |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `init()`                               | Called after `enter` resolves. Override for page setup.                    |
| `destroy()`                            | Called before `leave` starts. Override for teardown (managed events auto-cleaned). |
| `$(selector)`                          | `querySelector` scoped to `this.container`.                                |
| `$$(selector)`                         | `querySelectorAll` scoped to `this.container`.                             |
| `addManagedEvent(element, type, handler)` | Adds an event listener that is removed automatically on `destroy()`.    |

## License

MIT © Clement P. See [LICENSE](./LICENSE).
