// Type declaration for NativeWind's `global.css` side-effect import.
//
// Expo normally supplies this via `expo-env.d.ts` (a `/// <reference types="expo/types" />`
// that pulls in `declare module '*.css'`). That file is generated and gitignored, so it
// exists locally but is absent in CI — making `tsc` fail with TS2882 on `import "../global.css"`.
// Tracking the declaration here keeps typecheck independent of the generated file.
declare module "*.css";
