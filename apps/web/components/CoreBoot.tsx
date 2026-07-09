"use client";

// Runs lib/coreSetup for its side effect (configureCore) and renders nothing.
// Mounted first in the root layout so @rosm/core is configured before any other
// component can trigger a store action.
import "@/lib/coreSetup";

export default function CoreBoot() {
  return null;
}
