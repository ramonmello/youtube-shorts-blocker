<p align="center">
  <img src="icons/icon-128.png" width="96" height="96" alt="YouTube Shorts Blocker icon">
</p>

# YouTube Shorts Blocker

A minimal Chrome extension that removes YouTube Shorts entry points from the regular YouTube desktop interface.

It hides Shorts links, cards, shelves, and navigation items while leaving direct navigation to `/shorts/...` untouched.

## Installation

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project folder.
6. Open `https://www.youtube.com/` and use YouTube normally.

If the extension is already loaded and you changed files locally, click **Reload** on the extension card in `chrome://extensions`.

## What It Does

- Removes Shorts links from the sidebar and mini guide.
- Hides Shorts shelves and sections from the home page and feeds.
- Removes Shorts cards from mixed recommendation views.
- Re-runs cleanup as YouTube updates the page through SPA navigation and infinite scroll.
- Does not redirect, block, or modify direct `/shorts/...` pages.

## Architecture

This project is intentionally small and static. There is no framework, build step, backend, analytics, popup, storage, or service worker.

```text
.
├── manifest.json
├── content.css
├── content.js
└── icons/
    ├── icon.svg
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### `manifest.json`

Defines a Manifest V3 Chrome extension and injects the content script only on `https://www.youtube.com/*`.

The extension declares no API permissions and no separate `host_permissions`.

### `content.css`

Provides fast first-pass hiding for known Shorts UI patterns using CSS selectors. This reduces visible flicker while YouTube is rendering.

The CSS is scoped behind an `html.ysb-active` class so it can be disabled when the current page is a direct Shorts URL.

### `content.js`

Runs at `document_start` and coordinates the dynamic cleanup:

- Detects whether the current route is a direct `/shorts/...` page.
- Adds or removes the `ysb-active` class.
- Finds Shorts links and hides the nearest safe UI container.
- Uses a `MutationObserver` to handle YouTube SPA navigation and infinite scroll.
- Prunes empty containers after Shorts-only sections have been hidden.

## Scope

This extension targets Chrome desktop on `www.youtube.com`.

It is designed to remove visible Shorts distractions from the standard YouTube interface, not to be a hard bypass-proof content blocker.
