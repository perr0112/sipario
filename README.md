![landing-readme.png](./docs/cover.png)

# 📦 Sipario

Sipario is an ultra-lightweight Navigation System (SPA) for static sites or CMS. It handles seamless page transitions, smart caching, and component lifecycle management through a robust Namespace system.

## ✨ Features🚀

- SPA Navigation: No full page reloads. Only the content changes.
- 🧠 Lifecycle Manager: Automatic init() and destroy() calls for every page.
- 🗄️ Built-in Cache: Prevents redundant HTTP requests for previously visited pages.
- 🎨 CSS-Ready: Global state classes (.is-loading) for smooth fade-ins/outs.
- 🛠️ Scoped Selectors: DOM queries are restricted to the current page container to avoid conflicts.

## 🚀 Installation

Install Sipario via npm:
```
npm install @perr0112/sipario
```
Or with yarn:
```
yarn add @perr0112/sipario
```

## 🛠️ Usage

1. HTML Structure

Wrap your unique content in a container with a `data-modular-namespace` attribute.

```HTML
<!-- index.html -->
<div data-load-container data-modular-namespace="home">

  <h1>Home</h1>
  <a href="about.html">Go to About</a>
</div>

<!-- about.html -->
<div data-load-container data-modular-namespace="about">
  <h1>About Us</h1>
  <a href="index.html">Back Home</a>
</div>
```

2. Create your Page Classes

Each page should extend the Module base class. Define your page logic in `init()` and cleanup in `destroy()`:
```js
// pages/Home.js

import { Module } from '@perr0112/sipario';

export class Home extends Module {
    init() {
        super.init();
        console.log("Home page initialized");
    }

    destroy() {
        super.destroy();
        console.log("Home page destroyed");
    }

}
```

3. Initialize Modular

In your entry point (e.g., `main.js`):

```js
import { Modular } from '@perr0112/sipario';
import { Home } from './pages/Home.js';
import { About } from './pages/About.js';

const $modular = new Modular({
    container: '[data-load-container]',
    pages: {
        'home': Home,
        'about': About
    }
});

$modular.init();
```

## 🎨 CSS Transitions

Sipario uses 3 CSS classes for smooth transitions and page-specific styling:
| Class | Description |
|-------|-------------|
| `is-loading` | Added to `<body>` during page load. Disable interactions and prepare animations. |
| `is-changing` | Added to `<body>` during transitions. Sync animations (e.g., with GSAP). |
| `is-page-[namespace]` | Added to `<body>` after the new page is loaded. Useful for page-specific styles. |

```css
body.is-loading [data-load-container] {
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
}
body.is-changing [data-load-container] {
  opacity: 1;
}

body.is-page-home {
  background: #f7f3ef;
}
body.is-page-about {
  background: #1a1a1a;
}
```


> Tip: For advanced animations, use the `transition` event to trigger GSAP or CSS animations.

## Handling Page Transitions

Sipario emits custom events at key lifecycle points. Use these to integrate animations or analytics:

| Event Name | Description | Example Usage |
|------------|-------------|----------------|
| `leave` | Emitted when leaving the current page. | Save scroll position, cleanup animations. |
| `transition` | Emitted during the transition between pages. | Start GSAP animations, update UI state. |
| `afterEnter` | Emitted after the new page is displayed. | Scroll to top, initialize sliders. |

### Example with GSAP Animations

```js

import gsap from 'gsap';
import { Modular } from '@perr0112/sipario';

const $modular = new Modular({ ... });

$modular.on('transition', async ({ from, to, namespace }) => {
  const tl = gsap.timeline();

  // Animate the outgoing page
  tl.to(from, { opacity: 0, y: -50, duration: 0.5 });

  // Animate the incoming page
  tl.from(to, { opacity: 0, y: 50, duration: 0.5 });
});

$modular.init();
```

## 🧩 Advanced Usage

### Caching Strategies
By default, Sipario caches pages to avoid redundant requests. You can control caching per link:
```HTML
<!-- Bypass cache for this link -->
<a href="contact.html" data-modular-no-cache>Contact Us</a>
```

### Navigation Control
Programmatically navigate to a new page:
```js
$modular.goTo('about.html');
```

### Error Handling

Listen for errors and provide fallback UI:

```js
$modular.on('error', (error) => {
  console.error('Failed to load page:', error);
  // Show a user-friendly error message
});
```

## 📚 API Reference
### Module Class
Base class for all pages. Extend this to create your own page modules.

| Method | Description |
|--------|-------------|
| `init() | Called after the page is loaded. Override for page-specific logic. |
| `destroy() | Called before the page is removed. Override for cleanup. |
| `$(selector)` | Get a single element within the page container. |
| `$$ (selector)` | Get multiple elements within the page container. |
| `addManagedEvent(element, type, handler)` | Add an event listener that is automatically cleaned up on destroy(). |

### Modular Class
Main orchestrator for page transitions.

| Method | Description |
|--------|-------------|
| `init()` | Initialize the navigation system. |
| `goTo(href, push, ignoreCache, isPopstate)` | Navigate to a new URL. |

Options:
```js
const $modular = new Modular({
  container: '[data-load-container]', // CSS selector for the container
  pages: {
    'home': Home,
    'about': About,
  },
});
```

## 📜 License
Sipario is released under the MIT License.
