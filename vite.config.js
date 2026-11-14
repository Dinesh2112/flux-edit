import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fluxEdit from './packages/flux-edit/vite-plugin.js';

export default defineConfig({
  plugins: [fluxEdit(), react()],
});

