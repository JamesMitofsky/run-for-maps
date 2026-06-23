import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Native project + its vendored/generated JS (Capacitor bridge, copied web
    // assets, DerivedData) — not ours to lint.
    "ios/**",
    ".api-stash/**",
  ]),
]);

export default eslintConfig;
