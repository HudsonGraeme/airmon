import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this repo from the branch root, and the built site lives in
// /docs, so the public URL is https://<user>.github.io/airmon/docs/ and every
// asset + data URL must carry that prefix. Change to "/" for a root deploy
// (Cloudflare Pages or a custom domain), or "/airmon/" if Pages is pointed at the
// /docs folder directly.
const base = "/airmon/docs/";

export default defineConfig({
  base,
  plugins: [react()],
  // Pin PostCSS to an empty inline config so Vite does NOT walk up the tree and
  // inherit the parent repo's Tailwind postcss.config.js. Chakra is CSS-in-JS.
  css: { postcss: {} },
  // Emit the production build to repo-root /docs so GitHub Pages can serve it
  // from the main branch ("/docs" folder).
  build: { outDir: "../../docs", emptyOutDir: true },
});
