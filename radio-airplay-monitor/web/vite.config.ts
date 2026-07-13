import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Pin PostCSS to an empty inline config so Vite does NOT walk up the tree and
  // inherit the parent repo's Tailwind postcss.config.js. Chakra is CSS-in-JS.
  css: { postcss: {} },
});
