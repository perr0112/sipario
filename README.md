# 📦 Modular Load

Modular Load is a ultra-lightweight Navigation System (SPA-like) for static sites or CMS. It handles seamless page transitions, smart caching, and component lifecycle management through a robust Namespacing system.

## ✨ Features🚀

- SPA Navigation: No full page reloads. Only the content changes.
- 🧠 Lifecycle Manager: Automatic init() and destroy() calls for every page.
- 🗄️ Built-in Cache: Prevents redundant HTTP requests for previously visited pages.
- 🎨 CSS-Ready: Global state classes (.is-loading) for smooth fade-ins/outs.
- 🛠️ Scoped Selectors: DOM queries are restricted to the current page container to avoid conflicts.

## 🚀 Installation

```
npm install @perr0112/modular-load
```

## 🛠️ Usage

1. HTML Structure

Wrap your unique content in a container with a data-modular-namespace attribute.

```HTML
<div data-load-container data-modular-namespace="home">

  <h1>Home</h1>
  <a href="about.html">Go to About</a>
</div>

<div data-load-container data-modular-namespace="about">
  <h1>About Us</h1>
  <a href="index.html">Back Home</a>
</div>
```

2. Create your Page Classes

Each page logic should extend the Module base class.
```js
// pages/Home.js

import { Module } from '@perr0112/modular-load';

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

In your entry point (e.g., main.js):

```js
import { Modular } from '@your-username/modular-load';
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

Modular Load toggles an .is-loading class on the body during the fetch process. You can use this to trigger animations:
```CSS
[data-load-container] {
    transition: opacity 0.4s ease, transform 0.4s ease;
    opacity: 1;
}

body.is-loading [data-load-container] {
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
}
```
