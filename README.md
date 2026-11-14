# FluxEdit — Browser-to-Source AST Visual Editor for React + Vite

[![npm version](https://img.shields.io/badge/npm-1.0.1-blue.svg)](https://www.npmjs.com/package/flux-edit)
[![Live Showcase](https://img.shields.io/badge/live%20demo-flux--edit.vercel.app-blueviolet.svg)](https://flux-edit.vercel.app/)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Edit AI-generated or handwritten React UIs visually in your browser and watch the exact `.jsx` / `.tsx` files rewrite themselves cleanly on disk in real time (with instant VS Code & Vite HMR sync).

## Architecture

1. **Vite Compiler Plugin (`packages/flux-edit/vite-plugin.js`)**
   - Runs in dev mode (`apply: 'serve'`, `enforce: 'pre'`)—**0 KB overhead in production builds**.
   - Parses `.jsx`/`.tsx` via `@babel/parser` and injects `data-fe-loc="file:line:col"` onto intrinsic DOM nodes, plus `data-fe-dynamic="true"` when inside `.map()` / `.flatMap()` loops.
   - Serves `/__flux_edit/*` middleware endpoints (`mutate`, `undo`, `redo`, `history`, `source`) with path-traversal protection and an in-memory Undo/Redo stack.

2. **Surgical AST Patcher (`packages/flux-edit/ast-patcher.js`)**
   - Uses `@babel/parser`, `@babel/traverse`, and `magic-string` to mutate **only** the targeted AST node byte range—preserving comments, imports, and formatting across the rest of the file.
   - Re-parses every mutated output with Babel before writing to disk so broken syntax is never saved.
   - Supports:
     - `editText` (inline JSX text mutation with brace escaping)
     - `updateStyle` (clean `style={{ ... }}` merge/insert/remove)
     - `updateClassName` (static className string updates)
     - `moveSibling` (reorders JSX elements in the same parent container while preserving whitespace/indentation)
     - `duplicateElement` & `deleteElement`

3. **Browser DevTools Overlay (`packages/flux-edit/client/VisualEditor.jsx`)**
   - Toggleable via `Edit UI Live` pill or `Alt+E`.
   - Hover highlight box, parent container selection, pointer-based sibling drag-and-drop, double-click inline text editing, 60 FPS live style sliders, live disk source snippet preview, and diff log drawer.

## Quick Integration in Any Vite + React App

```bash
npm install -D flux-edit
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fluxEdit } from 'flux-edit/vite';

export default defineConfig({
  plugins: [
    fluxEdit(), // Dev-only visual editor (0 KB added in production)
    react(),
  ],
});
```

**Zero manual imports required in your code.** FluxEdit auto-mounts only when `vite` runs and is completely omitted during `npm run build`.

