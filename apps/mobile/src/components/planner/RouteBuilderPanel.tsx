import { useMemo } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { usePlanner, pinnedOf, removedOf, type SizeMode } from "@rosm/core/stores/planner";
import type { Fountain } from "@rosm/core/schemas";
import { fmtDist } from "@rosm/core/geo";
import { Button } from "../ui/Button";
import { PhaseNav } from "./PhaseNav";
import { SegmentedControl } from "../ui/SegmentedControl";

// Route sizing modes, shown as a segmented control on the map phase.
const SIZE_MODES: readonly { key: SizeMode; label: string }[] = [
  { key: "distance", label: "Target distance" },
  { key: "points", label: "By waypoints" },
];

function markLabel(f: Fountain) {
  return f.tags.name ?? "Unnamed fountain";
}

const toNum = (t: string): number | "" => {
  const n = Number(t);
  return t.trim() === "" || Number.isNaN(n) ? "" : n;
};

// Map phase bottom card: sizing controls, point-picking help, plan/reverse and
// the start-run handoff. The mobile mirror of the web RouteBuilderPanel.
export function RouteBuilderPanel({ onStartRun }: { onStartRun: () => void }) {
  const p = usePlanner();

  const pinned = useMemo(
    () => pinnedOf(p),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.fountains, p.pinnedIds, p.excludedIds],
  );
  const removed = useMemo(
    () => removedOf(p),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.fountains, p.excludedIds],
  );

  // Whether the current sizing mode has enough input to plan a route.
  const sizingReady =
    p.sizeMode === "distance" ? (p.targetMi || 0) > 0 : pinned.length > 0 || p.vias.length > 0;
  const planHint =
    p.sizeMode === "distance"
      ? "Enter a target distance above."
      : "Add a point to the route (tap one) or drop a waypoint to size your run.";

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-ink text-lg font-bold">Build the route</Text>
        {p.fountains.length > 0 ? (
          <View className="bg-sky/30 rounded-full px-2 py-0.5">
            <Text className="text-sky-deep text-xs font-semibold">{p.fountains.length} found</Text>
          </View>
        ) : null}
      </View>

      {/* Route sizing — collapses away once a route exists to free space. */}
      {p.stops.length === 0 ? (
        <View className="gap-2">
          <SegmentedControl options={SIZE_MODES} value={p.sizeMode} onChange={p.setSizeMode} />
          {p.sizeMode === "distance" ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                className="border-paper-line bg-paper/40 text-ink w-20 rounded-lg border px-2 py-2"
                keyboardType="decimal-pad"
                value={p.targetMi === "" ? "" : String(p.targetMi)}
                onChangeText={(t) => p.setTargetMi(toNum(t))}
              />
              <Text className="text-ink text-sm">target run (mi)</Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-2">
            <Switch value={p.loop} onValueChange={p.setLoop} />
            <Text className="text-ink text-sm">Loop (finish back at start)</Text>
          </View>
        </View>
      ) : null}

      {/* Map interaction help */}
      <Text className="text-ink-dim text-xs">
        Tap a point for details. Tap empty map to drop a waypoint
        {p.vias.length > 0 ? ` (${p.vias.length} added — tap ✦ to remove)` : ""}.
      </Text>

      {removed.length > 0 ? (
        <View className="gap-1">
          <Text className="text-ink-dim text-xs font-semibold">
            Removed from route ({removed.length})
          </Text>
          <ScrollView className="max-h-24">
            {removed.map((f) => (
              <View
                key={f.id}
                className="bg-paper-deep mb-1 flex-row items-center justify-between rounded-lg px-2 py-1.5"
              >
                <Text className="text-ink-dim flex-1 text-xs line-through" numberOfLines={1}>
                  {markLabel(f)}
                </Text>
                <Pressable
                  onPress={() => p.restoreStop(f.id)}
                  accessibilityRole="button"
                  accessibilityLabel="add point back to route"
                >
                  <Text className="text-sky-deep text-xs font-semibold">Add back</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {p.stops.length === 0 ? (
        <View className="border-paper-line gap-2 border-t pt-3">
          <Button
            title="Plan route"
            loading={p.busy === "route"}
            disabled={p.fountains.length === 0 || p.busy !== null || !sizingReady}
            onPress={() => p.makeRoute()}
          />
          {p.fountains.length > 0 && !sizingReady ? (
            <Text className="text-ink-dim text-center text-xs">{planHint}</Text>
          ) : null}
        </View>
      ) : (
        <View className="border-sky-deep/30 bg-sky/10 gap-2 rounded-2xl border p-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-ink font-semibold">
              {p.stops.length} stops <Text className="text-ink-dim">of {p.fountains.length}</Text>
            </Text>
            <Text className="text-sky-deep font-semibold">{fmtDist(p.distanceM)}</Text>
          </View>
          {p.autoCount > 0 ? (
            <Text className="text-ink-dim text-xs">
              +{p.autoCount} grabbed for a small detour off your route. Remove any you don’t want.
            </Text>
          ) : null}
          {p.stops.length > 1 ? (
            <Button
              title={p.busy === "reverse" ? "Reversing…" : "Direction"}
              variant="secondary"
              disabled={p.busy !== null}
              onPress={() => p.reverseRoute()}
            />
          ) : null}
        </View>
      )}

      {p.err ? (
        <View className="gap-2">
          <Text className="text-sm text-red-500">{p.err}</Text>
          {p.islandPt ? (
            <Text className="text-ink-dim text-xs">
              It’s marked ! in red on the map. Remove that point (or move your nearest waypoint),
              then the route re-plans on its own.
            </Text>
          ) : null}
          {p.errRetryable ? (
            <Button
              title="Retry"
              variant="secondary"
              loading={p.busy === "find"}
              onPress={() => p.findPoints()}
            />
          ) : null}
        </View>
      ) : null}

      {/* Back to setup; forward starts the run once a route exists. */}
      <PhaseNav
        back={{ label: "Setup", onPress: () => p.setPhase("config") }}
        forward={{
          label: "Start run",
          onPress: onStartRun,
          disabled: p.stops.length === 0 || p.busy !== null,
        }}
      />
    </View>
  );
}
