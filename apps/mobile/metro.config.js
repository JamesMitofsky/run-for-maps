// Expo's default Metro config auto-detects the pnpm monorepo (workspace root +
// node_modules resolution). withUniwindConfig wires the Tailwind CSS pipeline
// (Metro transform — no Babel preset required).
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  // Relative path to the CSS entry file (imports tailwindcss + uniwind).
  cssEntryFile: "./src/global.css",
  // Auto-generated className typings; picked up by tsconfig's `**/*.ts` include.
  dtsFile: "./src/uniwind-types.d.ts",
});
