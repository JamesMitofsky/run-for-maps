import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit/integration runner for the site's copied libs (pure logic + OSM/Overpass
// clients). Node environment; `@` resolves to src to match the app's tsconfig.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/pages/api/**"],
      reporter: ["text", "html"],
    },
  },
});
