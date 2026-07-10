import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeArea } from "../../components/ui/SafeArea";
import { usePlanner, inRouteIdsOf } from "@rosm/core/stores/planner";
import { RosmMap, type RosmMarker } from "../../map/RosmMap";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";

// Three-phase planner (config → map → run) over the shared planner store. The run
// phase hands off to the standalone /run screen.
export default function Plan() {
  const router = useRouter();
  const planner = usePlanner();

  if (planner.phase === "config") {
    return (
      <SafeArea className="bg-paper flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center gap-4 p-5">
          <Text className="text-ink text-2xl font-bold">Plan a route</Text>
          <Panel>
            <Text className="text-ink-dim mb-3 text-sm">
              Start from where you are, then find nearby OpenStreetMap points to survey on your run.
            </Text>
            <Button
              title="Use my location"
              variant="secondary"
              onPress={() => planner.geolocate()}
            />
            <Text className="text-ink-dim mt-3 text-xs">
              {planner.center
                ? `Center set (${planner.center.lat.toFixed(3)}, ${planner.center.lon.toFixed(3)})`
                : "No start point yet"}
            </Text>
          </Panel>
          <Button
            title="Find points"
            loading={planner.busy === "config" || planner.busy === "route"}
            disabled={!planner.center}
            onPress={() => planner.finishConfig()}
          />
          {planner.err ? <Text className="text-red-500">{planner.err}</Text> : null}
        </View>
      </SafeArea>
    );
  }

  // map / run-building phase
  const inRoute = inRouteIdsOf(planner);
  const markers: RosmMarker[] = planner.fountains.map((f) => ({
    id: f.id,
    lat: f.lat,
    lon: f.lon,
    color: inRoute.has(f.id) ? "#2563eb" : "#9ca3af",
    dimmed: !inRoute.has(f.id),
  }));
  const center: [number, number] = planner.center
    ? [planner.center.lat, planner.center.lon]
    : [0, 0];

  async function startRun() {
    await planner.startRun();
    router.replace("/run");
  }

  return (
    <View className="bg-paper flex-1">
      <RosmMap
        center={center}
        markers={markers}
        line={planner.line}
        recenterKey={planner.recenterKey}
        onMarkerPress={(id) => planner.toggleStop(Number(id))}
      />
      <SafeArea edges={["bottom"]} className="absolute right-0 bottom-0 left-0 p-4">
        <View className="border-paper-line gap-3 rounded-2xl border bg-white p-4">
          <Text className="text-ink font-bold">
            {planner.stops.length} stops · {(planner.distanceM / 1000).toFixed(1)} km
          </Text>
          <Text className="text-ink-dim text-xs">
            Tap points to add or remove them from the route.
          </Text>
          <View className="flex-row gap-2">
            <Button title="Start run" disabled={planner.stops.length === 0} onPress={startRun} />
            <Button title="Back" variant="ghost" onPress={() => planner.setPhase("config")} />
          </View>
          {planner.err ? <Text className="text-red-500">{planner.err}</Text> : null}
        </View>
      </SafeArea>
    </View>
  );
}
