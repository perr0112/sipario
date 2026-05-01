# Changelog

All notable changes to **Sipario** are documented in this file.

---

## [2.0.0] — 2026-05-01

### 🚀 Highlights

**Major release** introducing a **plugin system** and **shared-element transitions**
via the new `BridgePlugin`. The lifecycle is expanded with three new events
(`beforeLeave`, `beforeEnter`, `enter`). Leaving and incoming containers
are properly isolated during transitions to prevent CSS bleed between pages.

---

### ✨ Features

- New `BridgePlugin` for shared-element (FLIP-style) transitions, exposing
  **full computed-style snapshots** on each bridge so any CSS property can be
  animated without touching the plugin.
- Plugin system via `Modular.use()`, accepting either a class constructor or a
  ready-made instance.
- New lifecycle events: `beforeLeave`, `beforeEnter`, `enter`.
- `AbortSignal` exposed on the `enter` payload — animations can be cancelled
  cleanly.
- New body classes `is-old-container` / `is-next-container` to style each
  container independently during the transition window.
- `BridgePlugin` exported from `@perr0112/sipario`.

### 🔧 Improvements

- Inline-style pinning of the leaving container prevents incoming page CSS from
  bleeding onto it during the transition.
- `Module.init()` is now invoked automatically on the first page (direct URL
  load, refresh) — previously only subsequent navigations triggered it.
- `Module` subclasses no longer need to call `super.init()` — `Modular` wires
  `this.container` itself before invoking the page's `init()`.
- Per-event payload typing on `on()` / `emit()`. Each event now carries a
  precise payload shape — autocomplete and type-checking work end-to-end.
- Updated README to match the new API and document BridgePlugin.

### 🐛 Bug Fixes

- Style bleed from the incoming page onto the leaving container during
  transitions (e.g. titles briefly inheriting the destination color).
- `TypeError: Cannot read properties of null (reading 'querySelector')` when a
  `Module` subclass uses `this.$()` without first calling `super.init()`.

### 💥 Breaking Changes

- `transition` event removed — use `enter` instead.
- `leave` payload changed from `()` to `{ from, fromNamespace }`.
- `afterEnter` payload changed from `string` (the namespace) to `{ to }`
  (the incoming container element).
- TypeScript: `ModularEvent` union and callback typing reworked to reflect the
  real lifecycle. `TransitionCallback` and `ErrorCallback` removed.

### 🗑️ Deprecated

_None_

---

## [1.2.0] — 2026-03-26

### 🚀 Highlights

Comprehensive update of the documentation (README), covering installation,
usage and available features. Improved clarity, structure, and navigation
across the documentation with updated examples (located in the `example`
folder).

---

### ✨ Features

- Added documentation for page transition lifecycle events (`leave`,
  `transition`, `afterEnter`).
- Introduced guidance for integrating animations (GSAP / CSS) using emitted
  events.
- Documented new utility methods in the `Module` base class for easier page
  extensions.

### 🔧 Improvements

- Refactored and clarified documentation.
- Added documentation for `CSS_CLASSES` to better reflect and track navigation
  states.

### 🐛 Bug Fixes

_None_

### 💥 Breaking Changes

_None_

### 🗑️ Deprecated

_None_

---

## [1.1.0] — 2026-03-26

### 🚀 Highlights

Improved SEO consistency and more reliable navigation behavior across page
transitions.

---

### ✨ Features

- Automatically update all page metadata (title, meta tags, etc.) on
  navigation.
- Introduced new utility methods in the `Module` base class for easier page
  extensions.

### 🔧 Improvements

- Refactored navigation flow using `async`/`await` for better reliability and
  readability.
- Introduced `CSS_CLASSES` to better reflect and track navigation states.
- Improved TypeScript support and documentation (`index.d.ts`).

### 🐛 Bug Fixes

- Fixed unexpected behavior when clicking on `mailto:` links.

### 💥 Breaking Changes

_None_

### 🗑️ Deprecated

_None_

---

## [1.0.1] — 2026-03-22

Initial public release.

[2.0.0]: https://github.com/perr0112/sipario/releases/tag/v2.0.0
[1.2.0]: https://github.com/perr0112/sipario/releases/tag/v1.2.0
[1.1.0]: https://github.com/perr0112/sipario/releases/tag/v1.1.0
[1.0.1]: https://github.com/perr0112/sipario/releases/tag/v1.0.1
