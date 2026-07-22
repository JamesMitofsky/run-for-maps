"use client";

import { useMemo } from "react";
import type { MapMarker } from "@/components/MapView";
import { type PointEdit } from "@/components/PointPopup";
import { usePlanner } from "@rosm/core/stores/planner";
import { EDIT_COLOR, EDIT_LABEL } from "@rosm/core/editStatus";

// The planner-phase marker set: every found fountain (colored by its route /
// pin / exclusion / edit state), plus via waypoints, the start flag, and the
// unreachable-island highlight. The run phase feeds the map from useRunSession
// instead.
export function usePlannerMarkers({ edits }: { edits: Record<number, PointEdit> }): MapMarker[] {
  const fountains = usePlanner((s) => s.fountains);
  const stops = usePlanner((s) => s.stops);
  const pinnedIds = usePlanner((s) => s.pinnedIds);
  const excludedIds = usePlanner((s) => s.excludedIds);
  const autoIds = usePlanner((s) => s.autoIds);
  const vias = usePlanner((s) => s.vias);
  const center = usePlanner((s) => s.center);
  const islandPt = usePlanner((s) => s.islandPt);

  return useMemo(() => {
    // Zustand actions are referentially stable; read them off the store so the
    // memo deps stay honest.
    const { toggleStop, removeVia } = usePlanner.getState();

    const chosenIds = new Map(stops.map((s, i) => [s.id, i + 1]));
    const pinnedSet = new Set(pinnedIds);
    const excludedSet = new Set(excludedIds);
    const autoSet = new Set(autoIds);

    const fountainMarkers: MapMarker[] = fountains.map((f) => {
      const n = chosenIds.get(f.id);
      const isPinned = pinnedSet.has(f.id);
      const isExcluded = excludedSet.has(f.id);
      const isAuto = autoSet.has(f.id);
      const edit = edits[f.id];
      const isChosen = n != null || isPinned;
      // edited (this session) wins; then: dim "–" = explicitly removed;
      // purple = dynamically added detour; green = user selected / chosen; gray = available.
      const color = edit
        ? (EDIT_COLOR[edit.status] ?? "#9ca3af")
        : isExcluded
          ? "#52525b"
          : isAuto
            ? "#a855f7"
            : isChosen
              ? "#16a34a"
              : "#9ca3af";
      const label = edit ? EDIT_LABEL[edit.status] : isExcluded ? "–" : n ? String(n) : undefined;
      return {
        id: f.id,
        lat: f.lat,
        lon: f.lon,
        color,
        label,
        // Tapping the point toggles its route membership directly — no popup
        // gate. OSM survey edits live on the run page, not here.
        onClick: () => toggleStop(f.id),
      };
    });

    const viaMarkers: MapMarker[] = vias.map((v, i) => ({
      id: `via-${i}`,
      lat: v.lat,
      lon: v.lon,
      color: "#7c3aed",
      label: "✦",
      onClick: () => removeVia(i),
    }));

    const startMarker: MapMarker[] = center
      ? [{ id: "start", lat: center.lat, lon: center.lon, color: "#16a34a", label: "⚑" }]
      : [];

    // Highlight the unreachable ("target island") point, if any.
    const islandMarker: MapMarker[] = islandPt
      ? [{ id: "island", lat: islandPt.lat, lon: islandPt.lon, color: "#dc2626", label: "!" }]
      : [];

    return [...fountainMarkers, ...viaMarkers, ...startMarker, ...islandMarker];
  }, [fountains, stops, pinnedIds, excludedIds, autoIds, vias, center, islandPt, edits]);
}
