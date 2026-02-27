# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a static HTML/CSS landing page for **Danke TV** (a streaming TV service). There are no build tools, package managers, or backend services. The codebase consists of two files: `index.html` and `styles.css`.

### Running the dev server

Serve the static files with Python's built-in HTTP server:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in a browser.

### Lint / Test / Build

- **No linter** is configured; the project is vanilla HTML/CSS with no tooling.
- **No automated tests** exist.
- **No build step** is needed; files are served directly.

### Notes

- The site uses CSS custom properties, smooth-scroll anchors, an IntersectionObserver-based reveal animation, and a mobile hamburger menu toggle (all vanilla JS in a `<script>` block at the bottom of `index.html`).
- There are no dependencies to install, no environment variables, and no secrets required.
