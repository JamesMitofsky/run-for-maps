// Platform capabilities that each app injects at startup. The stores and other
// core modules call these through the registry in ./configure.ts, so nothing in
// @rosm/core reaches for a browser, Capacitor, or Expo API directly.
//
// Only the ports the core runtime actually calls live in CorePorts. The rest are
// contract types each app implements and consumes in its own UI layer. This file
// is finalized alongside the store extraction (it will reference OutboxItem).

export type GeoPoint = {
  lat: number;
  lon: number;
  heading: number | null;
  accuracy?: number;
};

export type GeoWatch = { clear: () => void };
