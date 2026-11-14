# FluxEdit ⚡

> **Zero-overhead, in-browser AST visual editor for React and Vite with real-time disk sync.**  
> Edit text, spacing, alignment, and structure visually right in your browser — watch VS Code update instantly.

[![npm version](https://img.shields.io/badge/npm-1.0.0-blue.svg)](https://www.npmjs.com/package/flux-edit)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/vite-4%20%7C%205%20%7C%206-purple.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-18%20%7C%2019-cyan.svg)](https://react.dev/)
[![Zero Production Overhead](https://img.shields.io/badge/prod%20bundle-0%20KB-brightgreen.svg)](#zero-production-footprint)

---

## 🚀 Why FluxEdit?

Modern web development often involves a constant loop: change CSS, switch to the browser, inspect element, calculate margin, switch back to VS Code, edit file, wait for HMR.

**FluxEdit eliminates that friction entirely.**
- **Click to Inspect:** Instantly highlight any JSX component on screen.
- **Double-Click to Edit Text:** Type directly in the live browser preview; JSX text nodes in your source file update on disk in real time with proper character escaping.
- **Effortless Spacing & Alignment:** 1-click `[ ◀ 12px ]` / `[ 12px ▶ ]` nudge buttons, quick alignment snaps (`Left`, `Center`, `Right`), and intuitive drag-to-position into empty space.
- **Structural Reordering:** Drag cards, navigation links, or list items onto neighbors — a glowing blue insertion bar shows exactly where the element will land in JSX.
- **Tailwind CSS & Standard CSS Support:** Automatically detects whether an element uses Tailwind utility classes (`p-4`, `mt-2`, `rounded-xl`) or standard inline styles, and patches the AST accordingly.
- **Real-Time Disk Sync:** Edits write directly to your project files on disk, triggering native Vite HMR without losing component state.

---

## 📦 Zero-Hectic 1-Line Setup

### 1. Install

```bash
npm install -D flux-edit
```

### 2. Add to `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fluxEdit } from 'flux-edit/vite';

export default defineConfig({
  plugins: [fluxEdit(), react()],
});
```

**That's it!**  
There is no step 3. You do **not** need to edit `main.jsx`, wrap `<App />`, or import anything into your client code. FluxEdit auto-injects its dev overlay into `index.html` exclusively during development.

---

## 🔒 Enterprise-Grade Security Architecture

FluxEdit is built with a defensive security model to guarantee zero vulnerabilities during development:

| Threat | FluxEdit Countermeasure | Implementation |
|---|---|---|
| **Localhost CSRF / DNS Rebinding** | Custom Header + Origin Check | All endpoints require `x-flux-client: 'true'` (cannot be set cross-origin without preflight) and validate local origin headers. |
| **Path Traversal Attacks (`../../`)** | Canonical `fs.realpathSync` Jail | Every requested path is fully canonicalized against the project root. Attempts to access files outside the workspace are rejected with HTTP 403. |
| **Symlink Escapes** | Realpath Evaluation | Symlinks pointing outside the workspace boundary are strictly detected and blocked. |
| **File Corruption / Process Crash** | Atomic Renames (`.flux_tmp_*`) | AST mutations are written to an ephemeral sibling file first, then atomically renamed to the destination. Original files are never left half-written. |
| **Syntax Invalidation** | AST Pre-Flight Validation | All code modifications are fully parsed and validated via `@babel/parser` before touching disk. Syntax errors throw immediately and leave files untouched. |

---

## 🛡️ Zero Production Footprint

In production builds (`npm run build` / `vite build`):
- The Vite plugin uses `apply: 'serve'` — Vite completely skips the plugin during build.
- The virtual client module (`/@flux-edit/client`) is never generated or linked.
- The dev middleware is never mounted.
- **0 bytes added to your production JavaScript bundle.**

---

## 🎛️ Usage & Keyboard Shortcuts

- **`Alt + E`**: Toggle Live Edit Mode on/off.
- **Click**: Select any JSX element and open the Inspector drawer.
- **Double-Click**: Enter live inline text editing. Press `Enter` or click outside to commit.
- **`[ ◀ 12px ]` / `[ 12px ▶ ]`**: Nudge element left or right instantly.
- **`Left` / `Center` / `Right`**: Snap alignment across flex containers.
- **Drag into Empty Space**: Free-form margin dragging with live visual feedback.
- **Drag onto Sibling**: Reorder JSX nodes structurally in source code.
- **`Ctrl + Z` / `Ctrl + Y`**: Undo / Redo AST modifications.
- **Diffs Drawer**: Inspect full unified diffs of all edits made during your session.

---

## 📄 License

MIT © FluxEdit Contributors

