import type { Plugin } from 'vite';
import type { ComponentType } from 'react';

export interface FluxEditOptions {
  /**
   * Whether to automatically inject the client overlay into index.html during development.
   * @default true
   */
  autoInject?: boolean;

  /**
   * Custom CSS selector or element query for the mount point.
   * @default undefined
   */
  containerId?: string;
}

/**
 * Vite plugin for FluxEdit in-browser AST visual editing.
 *
 * Automatically active only in development mode (`apply: 'serve'`).
 * Guaranteed 0 KB production bundle impact.
 *
 * @param options Plugin configuration options.
 * @returns Vite Plugin instance.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { fluxEdit } from 'flux-edit/vite';
 *
 * export default defineConfig({
 *   plugins: [fluxEdit(), react()],
 * });
 * ```
 */
export declare function fluxEdit(options?: FluxEditOptions): Plugin;
export declare function fluxEditPlugin(options?: FluxEditOptions): Plugin;
export default fluxEditPlugin;

/**
 * Props for the standalone `<VisualEditor />` component.
 */
export interface VisualEditorProps {
  /**
   * Optional custom class name for styling the overlay container.
   */
  className?: string;
}

/**
 * Standalone React component for the FluxEdit visual editor overlay.
 * Renders null in production builds.
 *
 * @example
 * ```tsx
 * import { VisualEditor } from 'flux-edit';
 *
 * export default function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <VisualEditor />
 *     </>
 *   );
 * }
 * ```
 */
export declare const VisualEditor: ComponentType<VisualEditorProps>;

/**
 * Mutation action types supported by the AST engine.
 */
export type AstActionType =
  | 'editText'
  | 'updateStyle'
  | 'updateClassName'
  | 'moveSibling'
  | 'duplicateElement'
  | 'deleteElement';

/**
 * AST Mutation Payload specifications.
 */
export interface AstMutationPayload {
  text?: string;
  className?: string;
  direction?: -1 | 1;
  styleProp?: string;
  styleValue?: string | number;
  tailwindClass?: string;
  mode?: 'auto' | 'style' | 'tailwind';
}

/**
 * Result returned by the AST mutation engine.
 */
export interface AstMutationResult {
  nextCode: string;
  summary: string;
  newLoc?: string;
  diffLines: Array<{
    type: 'add' | 'del' | 'same';
    text: string;
  }>;
}

/**
 * Security validation helper for incoming HTTP requests.
 */
export declare function assertAuthorizedRequest(req: any): void;

/**
 * Resolves a canonical, sandboxed workspace path to prevent path traversal attacks.
 */
export declare function resolveSafeWorkspacePath(relPath: string, rootDir: string): string;

/**
 * Performs an atomic file write using an ephemeral sibling file and atomic rename.
 */
export declare function atomicWriteFileSync(filePath: string, content: string): void;

