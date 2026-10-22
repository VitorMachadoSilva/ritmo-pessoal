import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 650,
    rollupOptions: { output: { manualChunks: { charts: ["recharts"] } } },
  },
});
