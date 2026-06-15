"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  WarningIcon,
  TrashIcon,
  ArrowUpIcon,
  SkipForwardIcon,
  FlagCheckeredIcon,
  PlusCircleIcon,
} from "@phosphor-icons/react";
import { useRun, type RunStop, type StopStatus } from "@/store/run";
import { useOutbox, outboxCounts } from "@/store/outbox";
import { bearing, compass, fmtDist, haversine, type Pt } from "@/lib/geo";
import { ptLabel } from "@/lib/pointTypes";
import type { MapMarker } from "@/components/MapView";
import type { EditAction } from "@/lib/schemas";
import { editSummary, todayLocal } from "@/lib/editSummary";
import OsmStatusBar, { useOsmStatus } from "@/components/OsmStatus";
import PointPopup from "@/components/PointPopup";
import SyncStatus from "@/components/SyncStatus";
import { celebratePoint } from "@/lib/confetti";
import { archiveRoute } from "@/lib/routeArchive";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const STATUS_COLOR: Record<StopStatus, string> = {
  pending: "#9ca3af",
  confirm: "#16a34a",
  out_of_order: "#d97706",
  removed: "#dc2626",
  skipped: "#6b7280",
};

export default function RunPage() {
  const router = useRouter();
  const run = useRun();
  const outboxItems = useOutbox((s) => s.items);
  const { status: osm, refresh } = useOsmStatus();

  const [pos, setPos] = useState<Pt | null>(null);
  const [manualArrived, setManualArrived] = useState(false);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(() => !useRun.getState().hasPlan);
  // Last per-tap write, recorded locally and shown until the next action. Sending
  // to OSM happens in the background — see the SyncStatus panel for delivery.
  const [lastSaved, setLastSaved] = useState<{ nodeId: number; summary: string } | null>(null);
  // Finish/close-changeset state.
  const [finishing, setFinishing] = useState(false);
  const [finishErr, setFinishErr] = useState<string | null>(null);
  const [closed, setClosed] = useState<{ changesetUrl?: string } | null>(null);

  // Hydrate from saved run if store empty (reload / direct nav).
  useEffect(() => {
    if (run.hasPlan) return; // hydrating already false (lazy init)
    fetch("/api/run")
      .then((r) => r.json())
      .then((plan) => {
        if (plan && plan.stops?.length) run.hydrate(plan);
        else router.replace("/");
      })
      .finally(() => setHydrating(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live position.
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => setErr(`Location: ${e.message}`),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const { stops, index, loop, tagKey, tagValue, added } = run;
  const addLabel = ptLabel(tagKey, tagValue);
  const target = stops[index];
  const done = run.hasPlan && index >= stops.length;

  const distToTarget = pos && target ? haversine(pos, target) : null;
  const bearingTo = pos && target ? bearing(pos, target) : 0;

  // Derived: armed manually ("I'm here") or auto within 30 m. No effect, so no
  // cascading-render setState.
  const arrived = manualArrived || (distToTarget != null && distToTarget < 30);

  async function persist(nextIndex: number, changesetId?: number) {
    const routeId = useRun.getState().routeId;
    const plan = {
      start: run.start,
      loop,
      tagKey,
      tagValue,
      stops: useRun.getState().stops,
      vias: run.vias,
      added: useRun.getState().added,
      routeCoords: run.routeCoords,
      distanceM: run.distanceM,
      index: nextIndex,
      changesetId: changesetId ?? run.changesetId,
    };
    // Durable on-device record of this route + every node change, kept across N
    // routes. Written first so the archive survives even if the server POST fails.
    archiveRoute({ routeId, plan, edits: useOutbox.getState().items });
    await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...plan, routeId }),
    });
  }

  function advance() {
    const ni = index + 1;
    run.setIndex(ni);
    setManualArrived(false);
    persist(ni);
  }

  // Record an OSM update for any node. Offline-first: the edit is written to the
  // on-device outbox and celebrated immediately, then sent to OSM in the
  // background (retried later if offline). Editing the current target advances the
  // run; editing another point on the fly (tapped on the map) leaves the position.
  function recordFor(node: RunStop, action: EditAction, comment?: string) {
    const isCurrent = !!target && node.id === target.id;
    setErr(null);
    // 1) Write locally + instant feedback — no network required.
    useOutbox.getState().enqueue({ nodeId: node.id, action, tagKey, name: node.tags?.name, comment });
    run.setStatus(node.id, action as StopStatus);
    celebratePoint();
    setLastSaved({ nodeId: node.id, summary: editSummary(action, tagKey, todayLocal()) });
    // 2) Move the run along + persist.
    if (isCurrent) {
      persist(index + 1);
      advance();
    } else {
      persist(index);
    }
    // 3) Try to deliver to OSM in the background.
    useOutbox.getState().flush();
  }

  function record(action: EditAction) {
    if (target) recordFor(target, action);
  }

  function skip() {
    setLastSaved(null);
    if (target) {
      run.setStatus(target.id, "skipped");
    }
    advance();
  }

  // Create a brand-new node of the surveyed type at the current GPS position.
  // Lets the user add instances they pass that aren't in OSM yet, without
  // touching the run sequence. Online-only (needs a fresh node id back from OSM),
  // but shares the outbox's changeset so the create lands with the run's edits.
  async function addHere() {
    if (!osm?.loggedIn) {
      setErr("Sign in to OSM first.");
      return;
    }
    if (!pos) {
      setErr("Waiting for GPS fix.");
      return;
    }
    setAdding(true);
    setErr(null);
    setLastSaved(null);
    try {
      const r = await fetch("/api/osm/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: pos.lat,
          lon: pos.lon,
          tag: { key: tagKey, value: tagValue },
          changesetId: useOutbox.getState().changesetId,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "create failed");
      // Reuse this changeset for the run's edits + the final close.
      useOutbox.getState().setChangeset(j.changesetId);
      run.addNode({ id: j.nodeId, lat: j.lat, lon: j.lon, tags: j.tags });
      celebratePoint();
      setLastSaved({ nodeId: j.nodeId, summary: j.summary });
      await persist(index);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function finish() {
    setFinishing(true);
    setFinishErr(null);
    try {
      const changesetId = useOutbox.getState().changesetId;
      if (changesetId) {
        const r = await fetch("/api/osm/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changesetId }),
        });
        const j = await r.json();
        if (!r.ok || j.ok === false) throw new Error(j.error || "close failed");
        setClosed({ changesetUrl: j.changesetUrl });
      } else {
        setClosed({});
      }
      // Snapshot the sealed run so the archive holds the final per-edit changeset.
      await persist(index);
    } catch (e) {
      setFinishErr((e as Error).message);
    } finally {
      setFinishing(false);
    }
  }

  function goHome() {
    run.reset();
    useOutbox.getState().clear();
    router.push("/plan");
  }

  const line: [number, number][] = useMemo(
    () => run.routeCoords.map(([lon, lat]) => [lat, lon]),
    [run.routeCoords],
  );

  const markers: MapMarker[] = useMemo(() => {
    const stopMarkers: MapMarker[] = stops.map((s, i) => ({
      id: s.id,
      lat: s.lat,
      lon: s.lon,
      color: i === index && s.status === "pending" ? "#2563eb" : STATUS_COLOR[s.status],
      label: String(i + 1),
      // Tap any point to update it in OSM on the fly, not just the current one.
      popup: (
        <PointPopup
          fountain={s}
          loggedIn={!!osm?.loggedIn}
          busy={false}
          onAction={(action, comment) => recordFor(s, action, comment)}
        />
      ),
    }));
    const viaMarkers: MapMarker[] = run.vias.map((v, i) => ({
      id: `via-${i}`,
      lat: v.lat,
      lon: v.lon,
      color: "#7c3aed",
      label: "✦",
    }));
    // Nodes added on the fly: green "+" markers, off the routed sequence.
    const addedMarkers: MapMarker[] = added.map((f) => ({
      id: f.id,
      lat: f.lat,
      lon: f.lon,
      color: "#16a34a",
      label: "+",
    }));
    return [...stopMarkers, ...viaMarkers, ...addedMarkers];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, index, run.vias, added, osm?.loggedIn]);

  if (hydrating) return <main className="grid min-h-screen place-items-center text-neutral-400">Loading…</main>;

  if (done) {
    const counts = stops.reduce<Record<string, number>>((a, s) => {
      a[s.status] = (a[s.status] || 0) + 1;
      return a;
    }, {});
    const editCount =
      (counts.confirm || 0) +
      (counts.out_of_order || 0) +
      (counts.removed || 0) +
      (counts.delete || 0);
    const sealed = closed !== null;
    const sync = outboxCounts(outboxItems);
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <FlagCheckeredIcon size={56} className="text-green-600" />
        <h1 className="text-2xl font-bold">{sealed ? "Changeset closed" : "Run complete"}</h1>
        <ul className="text-sm text-neutral-600">
          <li>Confirmed: {counts.confirm || 0}</li>
          <li>Out of order: {counts.out_of_order || 0}</li>
          <li>Removed: {(counts.removed || 0) + (counts.delete || 0)}</li>
          <li>Skipped: {counts.skipped || 0}</li>
        </ul>

        {/* Review what reached OSM and retry anything that missed. */}
        <SyncStatus />

        {sealed ? (
          <>
            {closed?.changesetUrl && (
              <a
                href={closed.changesetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-600 underline underline-offset-2"
              >
                View {editCount} {editCount === 1 ? "edit" : "edits"} on OpenStreetMap →
              </a>
            )}
            <button
              onClick={goHome}
              className="w-full rounded bg-neutral-900 py-3 font-semibold text-white"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <button
              onClick={finish}
              disabled={finishing || sync.unsent > 0}
              className="w-full rounded bg-neutral-900 py-3 font-semibold text-white disabled:opacity-50"
            >
              {finishing ? "Closing changeset…" : "Close changeset & finish"}
            </button>
            {sync.unsent > 0 && (
              <p className="w-full text-sm text-neutral-500">
                Send the remaining {sync.unsent} {sync.unsent === 1 ? "edit" : "edits"} before
                closing the changeset.
              </p>
            )}
            {finishErr && (
              <p className="w-full rounded bg-red-50 p-2 text-sm text-red-700">{finishErr}</p>
            )}
          </>
        )}
      </main>
    );
  }

  const center: [number, number] = pos
    ? [pos.lat, pos.lon]
    : target
      ? [target.lat, target.lon]
      : [run.start.lat, run.start.lon];

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex items-center justify-end px-4 py-2">
        <OsmStatusBar />
      </div>

      <div className="h-[42vh] w-full">
        <MapView
          center={center}
          zoom={16}
          recenterKey={pos ? `${pos.lat.toFixed(4)},${pos.lon.toFixed(4)}` : "t"}
          markers={markers}
          line={line}
          userPos={pos ? [pos.lat, pos.lon] : null}
          className="h-full w-full"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4">
              <ArrowUpIcon
                size={40}
                weight="bold"
                style={{ transform: `rotate(${bearingTo}deg)` }}
                className="text-blue-600 transition-transform"
              />
              <div>
                <div className="text-2xl font-bold">
                  {distToTarget != null ? fmtDist(distToTarget) : "—"}
                </div>
                <div className="text-sm text-neutral-500">
                  head {compass(bearingTo)} · {target?.tags?.name || `node ${target?.id}`}
                </div>
              </div>
            </div>

            {target?.tags?.check_date && (
              <p className="text-xs text-neutral-400">Last checked in OSM: {target.tags.check_date}</p>
            )}

            {!osm?.loggedIn && (
              <a
                href="/api/osm/auth"
                className="rounded bg-blue-600 py-2 text-center text-sm font-semibold text-white"
                onClick={() => setTimeout(refresh, 1000)}
              >
                Sign in to OSM to record updates
              </a>
            )}

            {!arrived ? (
              <button
                onClick={() => setManualArrived(true)}
                className="rounded bg-neutral-900 py-3 font-semibold text-white"
              >
                I&apos;m here — inspect
              </button>
            ) : (
              <div className="grid gap-2">
                <button
                  onClick={() => record("confirm")}
                  className="flex items-center justify-center gap-2 rounded bg-green-600 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <CheckCircleIcon size={20} /> Working — confirm (set check_date)
                </button>
                <button
                  onClick={() => record("out_of_order")}
                  className="flex items-center justify-center gap-2 rounded bg-amber-500 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <WarningIcon size={20} /> Out of order (disused:)
                </button>
                <button
                  onClick={() => record("removed")}
                  className="flex items-center justify-center gap-2 rounded bg-red-600 py-3 font-semibold text-white disabled:opacity-50"
                >
                  <TrashIcon size={20} /> Removed (abandoned:)
                </button>
              </div>
            )}

            <button onClick={skip} className="flex items-center justify-center gap-1 text-sm text-neutral-500">
              <SkipForwardIcon size={16} /> Skip this one
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Add a new instance of the surveyed type at the current location.
            Always available — a passed-by point need not be the current stop. */}
        {osm?.loggedIn && (
          <button
            disabled={adding || !pos}
            onClick={addHere}
            className="flex items-center justify-center gap-2 rounded border border-dashed border-green-500 py-2.5 text-sm font-semibold text-green-700 disabled:opacity-50"
          >
            <PlusCircleIcon size={18} />
            Add {addLabel} here{added.length > 0 ? ` · ${added.length} added` : ""}
          </button>
        )}

        {lastSaved && (
          <div className="flex items-center gap-2 rounded bg-green-50 p-2 text-sm text-green-800">
            <CheckCircleIcon size={18} className="shrink-0" />
            <span className="flex-1 text-left">
              Saved · node {lastSaved.nodeId} · {lastSaved.summary}
            </span>
          </div>
        )}

        {err && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}

        {/* Live OSM delivery status + retry, available during the run too. */}
        <SyncStatus className="mt-auto" />
      </div>
    </main>
  );
}
