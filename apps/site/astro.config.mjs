// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// Server output (API endpoints under src/pages/api). Static pages are still
// prerendered by default; only routes/endpoints that opt out run on-demand.
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
