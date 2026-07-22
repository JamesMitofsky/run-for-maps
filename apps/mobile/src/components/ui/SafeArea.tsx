import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

// react-native-safe-area-context's SafeAreaView is a third-party component, so
// Uniwind's Metro transform doesn't wire `className` → `style` for it — that only
// happens for core RN components. Without this, every `className` on a SafeAreaView
// (bg, flex-1, items-center, padding…) silently drops, collapsing the layout.
// withUniwind wraps it once so Tailwind classes apply; `edges` and the rest pass
// straight through.
export const SafeArea = withUniwind(SafeAreaView);
