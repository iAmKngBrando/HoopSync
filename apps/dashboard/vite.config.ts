import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    strictPort: true,
    // apps/server (the ported 2kOT API); see src/features/tracker-data/api.ts.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
