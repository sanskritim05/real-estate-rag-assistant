import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/documents": "http://localhost:8000",
      "/upload-documents": "http://localhost:8000",
      "/ingest": "http://localhost:8000",
      "/ask": "http://localhost:8000",
      "/stats": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
});
