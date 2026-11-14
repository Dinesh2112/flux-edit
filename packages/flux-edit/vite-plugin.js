import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { instrumentJsx, applyAstMutation, parseLoc } from './ast-patcher.js';
import {
  assertAuthorizedRequest,
  resolveSafeWorkspacePath,
  atomicWriteFileSync,
} from './security.js';

/**
 * Reads and parses the JSON body of an incoming HTTP request.
 * Enforces a strict 1MB size limit to mitigate payload denial-of-service attacks.
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Payload too large: maximum allowed request body is 1MB.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body: malformed request payload.'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Transmits a standardized JSON response with status code and headers.
 */
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

const VIRTUAL_CLIENT_ID = '/@flux-edit/client';
const RESOLVED_VIRTUAL_CLIENT_ID = '\0flux-edit:client';

/**
 * FluxEdit Vite Plugin.
 *
 * Provides end-to-end browser-to-source visual editing capabilities for React applications:
 * 1. AST JSX Instrumentation: tags React elements in dev mode with source file and coordinate metadata (`data-fe-loc`).
 * 2. Zero-Configuration Overlay Injection: auto-mounts the visual editor UI without editing `main.jsx`.
 * 3. Bidirectional AST Mutation Engine: executes surgical, syntax-validated code edits directly on disk.
 * 4. Enterprise Security Hardening: CSRF prevention, canonical symlink jail, atomic file transactions.
 * 5. Zero Production Overhead: strictly gated to dev server (`apply: 'serve'`).
 */
export function fluxEditPlugin(options = {}) {
  let rootDir = process.cwd();
  const undoStack = [];
  const redoStack = [];
  const auditLog = [];

  // Determine the file path for the client overlay bundle
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const clientEntryPath = path.resolve(currentDir, 'client/VisualEditor.jsx');

  return {
    name: 'flux-edit',
    enforce: 'pre',
    apply: 'serve', // Zero production bundle impact

    configResolved(config) {
      rootDir = config.root || process.cwd();
    },

    /**
     * Injects the FluxEdit client overlay script tag into index.html during development.
     */
    transformIndexHtml(html) {
      if (options.autoInject === false) {
        return html;
      }
      return [
        {
          tag: 'script',
          attrs: {
            type: 'module',
            src: VIRTUAL_CLIENT_ID,
          },
          injectTo: 'body',
        },
      ];
    },

    /**
     * Resolves the virtual module identifier for the client overlay.
     */
    resolveId(id) {
      if (id === VIRTUAL_CLIENT_ID || id === 'virtual:flux-edit/client') {
        return RESOLVED_VIRTUAL_CLIENT_ID;
      }
      return null;
    },

    /**
     * Loads the synthetic entry point that mounts <VisualEditor /> into a dedicated DOM container.
     */
    load(id) {
      if (id === RESOLVED_VIRTUAL_CLIENT_ID) {
        const isInsideWorkspace = !path.relative(rootDir, clientEntryPath).startsWith('..');
        const clientImport = isInsideWorkspace
          ? '/' + path.relative(rootDir, clientEntryPath).replace(/\\/g, '/')
          : '/@fs/' + clientEntryPath.replace(/\\/g, '/');

        return `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { VisualEditor } from '${clientImport}';

(function mountFluxEdit() {
  if (typeof window === 'undefined') return;
  if (window.__FLUX_EDIT_MOUNTED__ || document.getElementById('flux-edit-root')) return;

  function init() {
    if (window.__FLUX_EDIT_MOUNTED__ || document.getElementById('flux-edit-root')) return;
    window.__FLUX_EDIT_MOUNTED__ = true;
    let container = document.getElementById('flux-edit-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'flux-edit-root';
      document.body.appendChild(container);
    }
    const root = createRoot(container);
    root.render(React.createElement(VisualEditor));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
`;
      }
      return null;
    },

    /**
     * Instruments JSX/TSX components with precise source location markers.
     */
    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!/\.(jsx|tsx)$/.test(cleanId)) return null;
      if (cleanId.includes('node_modules')) return null;

      const relPath = path.relative(rootDir, cleanId).replace(/\\/g, '/');
      const relLower = relPath.toLowerCase();

      // Guard: do not instrument FluxEdit's internal UI components
      if (
        relLower.startsWith('..') ||
        relLower.startsWith('packages/flux-edit/') ||
        cleanId.replace(/\\/g, '/').toLowerCase().includes('/flux-edit/client/')
      ) {
        return null;
      }

      try {
        const diskCode = fs.existsSync(cleanId) ? fs.readFileSync(cleanId, 'utf-8') : null;
        return instrumentJsx(code, relPath, diskCode);
      } catch (err) {
        // Never interrupt user compilation for transient syntax drafts
        console.warn(`[FluxEdit] AST instrumentation skipped for ${relPath}:`, err?.message);
        return null;
      }
    },

    /**
     * Registers the secure dev server endpoints for AST mutations, undo/redo, and source inspection.
     */
    configureServer(server) {
      server.middlewares.use('/__flux_edit', async (req, res, next) => {
        const url = (req.url || '').split('?')[0];

        try {
          // 1. Enforce origin & CSRF token on all incoming requests
          assertAuthorizedRequest(req);

          // 2. Route: /mutate - Apply surgical AST edit directly to source code on disk
          if (req.method === 'POST' && url === '/mutate') {
            const { loc, action, payload } = await readJsonBody(req);
            if (!loc || !action) {
              return sendJson(res, 400, { ok: false, error: 'Missing required loc or action parameter.' });
            }

            const { file } = parseLoc(loc);
            const absPath = resolveSafeWorkspacePath(file, rootDir);
            const prevCode = fs.readFileSync(absPath, 'utf-8');

            const result = applyAstMutation(prevCode, file, loc, action, payload);

            if (result.nextCode !== prevCode) {
              // Commit atomically to prevent file corruption
              atomicWriteFileSync(absPath, result.nextCode);

              undoStack.push({
                absPath,
                relFile: file,
                prevCode,
                nextCode: result.nextCode,
                summary: result.summary,
                prevLoc: loc,
                newLoc: result.newLoc,
              });
              if (undoStack.length > 50) undoStack.shift();
              redoStack.length = 0;

              auditLog.unshift({
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                file,
                summary: result.summary,
                diffLines: result.diffLines,
                time: new Date().toLocaleTimeString(),
              });
              if (auditLog.length > 25) auditLog.pop();
            }

            return sendJson(res, 200, {
              ok: true,
              file,
              summary: result.summary,
              newLoc: result.newLoc,
              diffLines: result.diffLines,
              canUndo: undoStack.length > 0,
              canRedo: redoStack.length > 0,
              auditLog,
            });
          }

          // 3. Route: /undo - Revert the previous AST mutation
          if (req.method === 'POST' && url === '/undo') {
            if (undoStack.length === 0) {
              return sendJson(res, 200, { ok: false, error: 'Undo history is empty.' });
            }
            const entry = undoStack.pop();
            atomicWriteFileSync(entry.absPath, entry.prevCode);
            redoStack.push(entry);

            auditLog.unshift({
              id: `${Date.now()}_undo`,
              file: entry.relFile,
              summary: `Undid: ${entry.summary}`,
              diffLines: [],
              time: new Date().toLocaleTimeString(),
            });

            return sendJson(res, 200, {
              ok: true,
              summary: `Undid: ${entry.summary}`,
              newLoc: entry.prevLoc,
              canUndo: undoStack.length > 0,
              canRedo: redoStack.length > 0,
              auditLog,
            });
          }

          // 4. Route: /redo - Re-apply an undone AST mutation
          if (req.method === 'POST' && url === '/redo') {
            if (redoStack.length === 0) {
              return sendJson(res, 200, { ok: false, error: 'Redo history is empty.' });
            }
            const entry = redoStack.pop();
            atomicWriteFileSync(entry.absPath, entry.nextCode);
            undoStack.push(entry);

            auditLog.unshift({
              id: `${Date.now()}_redo`,
              file: entry.relFile,
              summary: `Redid: ${entry.summary}`,
              diffLines: [],
              time: new Date().toLocaleTimeString(),
            });

            return sendJson(res, 200, {
              ok: true,
              summary: `Redid: ${entry.summary}`,
              newLoc: entry.newLoc,
              canUndo: undoStack.length > 0,
              canRedo: redoStack.length > 0,
              auditLog,
            });
          }

          // 5. Route: /history - Retrieve current stack status and mutation audit log
          if (req.method === 'GET' && url === '/history') {
            return sendJson(res, 200, {
              ok: true,
              canUndo: undoStack.length > 0,
              canRedo: redoStack.length > 0,
              auditLog,
            });
          }

          // 6. Route: /source - Retrieve contextual code snippet for the element inspector
          if (req.method === 'GET' && url === '/source') {
            const fullUrl = new URL(req.url, 'http://localhost');
            const loc = fullUrl.searchParams.get('loc');
            if (!loc) return sendJson(res, 400, { ok: false, error: 'Missing loc parameter.' });

            const { file, line } = parseLoc(loc);
            const absPath = resolveSafeWorkspacePath(file, rootDir);
            const content = fs.readFileSync(absPath, 'utf-8');
            const lines = content.split('\n');
            const start = Math.max(0, line - 4);
            const end = Math.min(lines.length, line + 5);
            const snippet = lines.slice(start, end).map((text, idx) => ({
              lineNum: start + idx + 1,
              text,
              highlight: start + idx + 1 === line,
            }));

            return sendJson(res, 200, { ok: true, file, line, snippet });
          }

          next();
        } catch (err) {
          const status = err.statusCode || 400;
          sendJson(res, status, { ok: false, error: err.message || 'AST operation failed.' });
        }
      });
    },
  };
}

export default fluxEditPlugin;
export { fluxEditPlugin as fluxEdit };
