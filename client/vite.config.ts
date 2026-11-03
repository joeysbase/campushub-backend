import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const sharedDir = fileURLToPath(new URL('../shared', import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // API contract types shared with the backend (see shared/contract.ts).
    alias: { '@shared': sharedDir },
  },
  server: {
    // Serve ../shared, which is outside the client root, without opening up the rest of the repo.
    fs: { allow: ['.', sharedDir] },
    // Forward API calls to the Express backend, so the browser sees one origin (no CORS needed).
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
