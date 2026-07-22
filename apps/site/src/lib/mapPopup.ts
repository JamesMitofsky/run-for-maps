import { getContext, setContext } from "svelte";

// Lets popup content (e.g. PointPopup) dismiss the map popup after an action
// without reaching for a map instance — the popup is a single controlled element
// in MapView. Replaces the React `useMapPopup` context.
const KEY = Symbol("map-popup");

type MapPopupCtx = { close: () => void };

export function setMapPopup(ctx: MapPopupCtx) {
  setContext(KEY, ctx);
}

export function getMapPopup(): MapPopupCtx {
  return getContext<MapPopupCtx>(KEY) ?? { close: () => {} };
}
