import { useMemo } from "react";
import { usePlanner } from "@rosm/core/stores/planner";
import { EDIT_COLOR, EDIT_LABEL } from "@rosm/core/editStatus";
import type { RosmMarker } from "../../map/RosmMap";
import type { PointEdit } from "../PointSheet";

// The planner-phase marker set: every found fountain (colored by its route /
// pin / exclusion / edit state), plus via waypoints, the start flag, and the
// unreachable-island highlight. Data only — the screen owns the bottom sheet
// (RosmMap markers can't carry popups). Mirrors the web usePlannerMarkers.
export function usePlannerMarkers({ edits }: { edits: Record<number, PointEdit> }): RosmMarker[] {
  const fountains = usePlanner((s) => s.fountains);
  const stops = usePlanner((s) => s.stops);
  const pinnedIds = usePlanner((s) => s.pinnedIds);
  const excludedIds = usePlanner((s) => s.excludedIds);
  const vias = usePlanner((s) => s.vias);
  const center = usePlanner((s) => s.center);
  const islandPt = usePlanner((s) => s.islandPt);

  return useMemo(() => {
    const chosenIds = new Map(stops.map((s, i) => [s.id, i + 1]));
    const pinnedSet = new Set(pinnedIds);
    const excludedSet = new Set(excludedIds);

    const fountainMarkers: RosmMarker[] = fountains.map((f) => {
      const n = chosenIds.get(f.id);
      const edit = edits[f.id];
      // edited (this session) wins; then: dim "–" = explicitly removed; green
      // numbered = chosen; amber star = pinned (forced); gray = available.
      const color = edit
        ? (EDIT_COLOR[edit.status] ?? "#9ca3af")
        : excludedSet.has(f.id)
          ? "#52525b"
          : n
            ? "#16a34a"
            : pinnedSet.has(f.id)
              ? "#f59e0b"
              : "#9ca3af";
      const label = edit
        ? EDIT_LABEL[edit.status]
        : excludedSet.has(f.id)
          ? "–"
          : n
            ? String(n)
            : pinnedSet.has(f.id)
              ? "★"
              : undefined;
      return { id: f.id, lat: f.lat, lon: f.lon, color, label };
    });

    const viaMarkers: RosmMarker[] = vias.map((v, i) => ({
      id: `via-${i}`,
      lat: v.lat,
      lon: v.lon,
      color: "#7c3aed",
      label: "✦",
    }));

    const startMarker: RosmMarker[] = center
      ? [{ id: "start", lat: center.lat, lon: center.lon, color: "#16a34a", label: "⚑" }]
      : [];

    // Highlight the unreachable ("target island") point, if any.
    const islandMarker: RosmMarker[] = islandPt
      ? [{ id: "island", lat: islandPt.lat, lon: islandPt.lon, color: "#dc2626", label: "!" }]
      : [];

    return [...fountainMarkers, ...viaMarkers, ...startMarker, ...islandMarker];
  }, [fountains, stops, pinnedIds, excludedIds, vias, center, islandPt, edits]);
}
