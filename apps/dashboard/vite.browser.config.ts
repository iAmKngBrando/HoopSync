import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Serves src/renderer directly as a plain browser page - NOT the real app.
// This exists purely so UI/layout changes can be screenshot-verified in a
// browser (the dev workflow this project's tooling is built around), without
// needing the Electron shell. The Capture Device panel won't reliably hold
// an Elgato connection here (that's the whole reason the real app moved to
// Electron) - for actual live tracking, use `pnpm dev` (electron-vite).
export default defineConfig({
  root: resolve(__dirname, "src/renderer"),
  plugins: [react()],
  server: {
    port: 5190,
    strictPort: true,
  },
});
