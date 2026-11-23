# bunthondev.github.io

Personal GitHub Pages navigation hub for open-source macOS utility apps by **Bunthon Mao (`@bunthondev`)**.

## Featured Utility Apps

- **[RunDock](https://bunthondev.github.io/RunDock/)** — Fast Rust + Tauri v2 desktop app, macOS menu bar switcher, CLI, and PATH shim manager for 15 runtimes & local services.
- **[DeepClean](https://bunthondev.github.io/deep-clean/)** — Small native SwiftUI Mac app (< 3 MB) that finds developer caches and build folders, explains every item, and trashes only what you confirm.

## Publish to GitHub Pages

1. Create a public repository named **`bunthondev.github.io`** under `https://github.com/bunthondev`.
2. Push this directory to the `main` branch:
   ```sh
   git init -b main
   git add .
   git commit -m "Initial bunthondev utility apps hub"
   git remote add origin git@github.com:bunthondev/bunthondev.github.io.git
   git push -u origin main
   ```
3. In GitHub **Settings → Pages**, verify **Source** is set to **Deploy from a branch** (`main` / `/ (root)`).
4. Your site will be live at **https://bunthondev.github.io/**.

## Adding a Future App

1. Drop its icon and preview screenshot into `assets/`.
2. Duplicate an `<article class="app-card">` block in `index.html` and add a corresponding quick-launch tile in `.dock-grid`.
3. Add an entry to the `APPS` array in `app.js` so its latest GitHub Release tag, direct download button, and `⌘K` Quick Jump palette stay automatically in sync.
