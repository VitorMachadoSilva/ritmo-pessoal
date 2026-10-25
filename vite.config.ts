import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      input: { app: "index.html", preview: "transition-preview.html", logoutPreview: "logout-preview.html" },
      output: { manualChunks: { charts: ["recharts"] } },
    },
  },
});
