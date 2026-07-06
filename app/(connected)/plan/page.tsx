"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPinIcon,
  CrosshairIcon,
  PathIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsLeftRightIcon,
  SlidersHorizontalIcon,
  DeviceMobileIcon,
} from "@phosphor-icons/react";
import { fmtDist } from "@/lib/geo";
import type { Fountain, RecencyMode } from "@/lib/schemas";
import { useRun } from "@/store/run";
import { usePlanner, pinnedOf, removedOf, inRouteIdsOf } from "@/store/planner";
import type { MapMarker } from "@/components/MapView";
import AccountChip from "@/components/AccountChip";
import OsmStatusBar, { useOsmStatus } from "@/components/OsmStatus";
import PointPopup from "@/components/PointPopup";
import EditSyncPanel from "@/components/EditSyncPanel";
import Button from "@/components/ui/Button";
import ErrorNotice from "@/components/ui/ErrorNotice";
import SegmentedControl from "@/components/ui/SegmentedControl";
import RunGuide from "@/components/run/RunGuide";
import RunComplete from "@/components/run/RunComplete";
import CompassEnableModal from "@/components/run/CompassEnableModal";
import { useRunSession } from "@/hooks/useRunSession";
import { useOsmEdits } from "@/hooks/useOsmEdits";
import { usePlannerDraftSync } from "@/hooks/usePlannerDraftSync";
import { EDIT_COLOR, EDIT_LABEL } from "@/lib/editStatus";
import { apiFetch, isNative } from "@/lib/api";
import { getArchivedRoutes } from "@/lib/routeArchive";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// Recency filter modes, shown as a segmented control in the radius step.
const RECENCY_MODES: { key: RecencyMode; label: string }[] = [
  { key: "stale", label: "Not checked in" },
  { key: "fresh", label: "Checked within" },
  { key: "any", label: "Any time" },
];

// Route sizing modes, shown as a segmented control on the map phase.
const SIZE_MODES = [
  { key: "distance", label: "Target distance" },
  { key: "points", label: "By waypoints" },
] as const;

// The guided config steps, answered one at a time before the map takes over.
const STEPS = [
  { key: "where", title: "Where do you start?", hint: "Click on the map or search" },
  { key: "radius", title: "How wide should we search?", hint: undefined },
] as const;

// The device class can't change mid-session, so the mobile check never
// re-notifies — subscribe is a stable no-op (required by useSyncExternalStore).
const subscribeNever = () => () => {};

export default function PlannerPage() {
  const router = useRouter();
  const { status: osm } = useOsmStatus();

  // All planner data + route-building actions live in the store (see
  // store/planner.ts); this page composes it with the map, the run session,
  // and the phase panels. Whole-store subscription — the page re-renders on
  // any planner change, exactly as the old local-state version did.
  const p = usePlanner();

  // Route planning + the live run rely on the phone's GPS and compass, so the
  // planner is gated to mobile. null = not yet determined (the server snapshot,
  // so SSR never flashes the wrong screen before the client checks the device).
  const isMobileDevice = useSyncExternalStore<boolean | null>(
    subscribeNever,
    () =>
      isNative() || (window.matchMedia("(pointer: coarse)").matches && "ontouchstart" in window),
    () => null,
  );

  // The live run, fed from the shared hook. Armed only once we reach the run
  // phase so the location prompt doesn't fire while building a route.
  const session = useRunSession({ enabled: p.phase === "run" });

  // Direct OSM edits made from the map, before any run. Backed by the offline
  // outbox: saved on-device first, sent to OSM in the background.
  const osmEdits = useOsmEdits({ tagKey: p.tag.key, onError: p.setErr });
  const { edits, updatePoint } = osmEdits;

  // Contract: draft loads on mount (resume offer) and auto-persists on change.
  usePlannerDraftSync();

  const scope = useRef<HTMLElement>(null);

  // Fade the active question in whenever the step changes. Opacity only — no
  // transforms, so an interrupted tween can never leave a translated ghost copy.
  useGSAP(
    () => {
      gsap.fromTo(
        ".wizard-step",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.4, ease: "power3.out" },
      );
    },
    { dependencies: [p.step], scope },
  );

  // Fade the floating card when switching between config and map-only views.
  useGSAP(
    () => {
      gsap.fromTo(
        ".phase-card",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: "power3.out" },
      );
    },
    { dependencies: [p.phase], scope },
  );

  // Status resolved to logged-out → bounce to the sign-in page. Only on
  // mobile; desktop users see the "plan on your phone" intercept instead.
  useEffect(() => {
    if (isMobileDevice && osm && !osm.loggedIn) router.replace("/login?returnTo=/plan");
  }, [isMobileDevice, osm, router]);

  // On mount, recover an in-progress run (the run lives here, not on a
  // separate page — a reload mid-survey must drop straight back into it). A
  // finished run (index past the last stop) is ignored so it can't hijack a
  // fresh planning session.
  useEffect(() => {
    // Native: recover an interrupted run from the on-device archive (no server
    // run state). Web: read it back from /api/run. Deferred off the effect body so
    // the state update doesn't cascade-render synchronously.
    if (isNative()) {
      Promise.resolve().then(() => {
        const plan = getArchivedRoutes()[0]?.plan;
        if (plan && plan.stops?.length && (plan.index ?? 0) < plan.stops.length) {
          useRun.getState().hydrate(plan);
          usePlanner.getState().setPhase("run");
        }
      });
      return;
    }
    apiFetch("/api/run")
      .then((r) => r.json())
      .then((plan) => {
        if (plan && plan.stops?.length && (plan.index ?? 0) < plan.stops.length) {
          useRun.getState().hydrate(plan);
          usePlanner.getState().setPhase("run");
        }
      })
      .catch(() => {});
  }, []);

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
  const inRouteIds = useMemo(
    () => inRouteIdsOf(p),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.stops, p.pinnedIds, p.excludedIds],
  );

  function markLabel(f: Fountain) {
    return f.tags.name ?? "Unnamed fountain";
  }

  // Leave the finished run and return to a clean planner, keeping the start area
  // so the surveyor can quickly build another route nearby.
  function exitRun() {
    session.reset();
    usePlanner.getState().resetAfterRun();
  }

  const markers: MapMarker[] = useMemo(() => {
    const chosenIds = new Map(p.stops.map((s, i) => [s.id, i + 1]));
    const pinnedSet = new Set(p.pinnedIds);
    const excludedSet = new Set(p.excludedIds);
    const { toggleStop } = usePlanner.getState();
    return p.fountains.map((f) => {
      const n = chosenIds.get(f.id);
      const isPinned = pinnedSet.has(f.id);
      const isExcluded = excludedSet.has(f.id);
      const inRoute = inRouteIds.has(f.id);
      const edit = edits[f.id];
      // edited (this session) wins; then: dim "–" = explicitly removed; green
      // numbered = chosen; amber star = pinned (forced); gray = available.
      const color = edit
        ? (EDIT_COLOR[edit.status] ?? "#9ca3af")
        : isExcluded
          ? "#52525b"
          : n
            ? "#16a34a"
            : isPinned
              ? "#f59e0b"
              : "#9ca3af";
      const label = edit
        ? EDIT_LABEL[edit.status]
        : isExcluded
          ? "–"
          : n
            ? String(n)
            : isPinned
              ? "★"
              : undefined;
      return {
        id: f.id,
        lat: f.lat,
        lon: f.lon,
        color,
        label,
        // Tap adds/removes the point; the route re-plans automatically.
        onClick: () => toggleStop(f.id),
        // Long-press / right-click opens the popup to update the point in OSM.
        popupTrigger: "contextmenu" as const,
        popup: (
          <PointPopup
            fountain={f}
            loggedIn={!!osm?.loggedIn}
            inRoute={inRoute}
            edit={edit}
            busy={false}
            onToggleRoute={() => toggleStop(f.id)}
            onAction={(action, extras) => updatePoint(f.id, action, markLabel(f), extras)}
          />
        ),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fountains, p.stops, p.pinnedIds, p.excludedIds, inRouteIds, edits, osm?.loggedIn]);

  // Highlight the unreachable ("target island") point, if any.
  const islandMarker: MapMarker[] = p.islandPt
    ? [{ id: "island", lat: p.islandPt.lat, lon: p.islandPt.lon, color: "#dc2626", label: "!" }]
    : [];

  const startMarker: MapMarker[] = p.center
    ? [{ id: "start", lat: p.center.lat, lon: p.center.lon, color: "#16a34a", label: "⚑" }]
    : [];

  const viaMarkers: MapMarker[] = p.vias.map((v, i) => ({
    id: `via-${i}`,
    lat: v.lat,
    lon: v.lon,
    color: "#7c3aed",
    label: "✦",
    onClick: () => usePlanner.getState().removeVia(i),
  }));

  const active = STEPS[p.step];
  const canAdvance = p.step === 0 ? !!p.center : true;

  // Whether the current sizing mode has enough input to plan a route.
  const sizingReady =
    p.sizeMode === "distance" ? (p.targetMi || 0) > 0 : pinned.length > 0 || p.vias.length > 0;
  const planHint = p.sizeMode === "distance" ? "Enter a target distance above." : null;

  // Not a phone → intercept. You navigate the route on foot with your phone's
  // GPS/compass, so planning belongs there too. Blank while the check resolves.
  if (isMobileDevice === null) {
    return <main className="bg-paper h-screen w-screen" />;
  }
  if (!isMobileDevice) {
    return (
      <main className="bg-paper font-body text-ink flex min-h-screen w-screen items-center justify-center px-6">
        <div className="flex max-w-md flex-col items-center gap-5 text-center">
          <DeviceMobileIcon size={48} weight="duotone" className="text-sky-deep" />
          <h1 className="font-display text-2xl leading-tight font-bold">Plan this on your phone</h1>
          <p className="text-ink-dim">
            Routes have to be planned on your phone since that&apos;s how you navigate around!
          </p>
          <Link
            href="/"
            className="border-ink text-ink hover:bg-ink hover:text-paper rounded-full border px-5 py-2 text-sm font-bold transition"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  // Gate the whole planner behind OSM sign-in — no map until logged in. Once the
  // status resolves to logged-out, send the user to the dedicated sign-in page.
  if (osm === null) {
    return <main className="bg-paper h-screen w-screen" />;
  }
  if (!osm.loggedIn) {
    // Redirect handled by the effect above; render blank while it fires.
    return <main className="bg-paper h-screen w-screen" />;
  }

  // The map view tracks the chosen start point.
  const DEFAULT_CENTER: [number, number] = [38.9072, -77.0369];
  const viewCenter: [number, number] = p.center ? [p.center.lat, p.center.lon] : DEFAULT_CENTER;

  return (
    <main
      ref={scope}
      className="safe-pb bg-paper font-body text-ink relative flex min-h-screen w-screen flex-col md:block md:h-screen md:overflow-hidden"
    >
      {/* Mobile: map sits at the top with a fixed height and the panel flows below it.
          Desktop (md+): map fills the screen and the cards float on top.
          The map is rendered unconditionally — phase changes only swap which data
          feeds it, so Leaflet never remounts under the user. */}
      <div className="relative h-[55vh] w-full shrink-0 md:absolute md:inset-0 md:h-full">
        <MapView
          center={p.phase === "run" ? session.center : viewCenter}
          zoom={p.phase === "run" ? 16 : 14}
          recenterKey={p.phase === "run" ? session.recenterKey : p.recenterKey}
          fitPoints={p.phase === "run" ? session.fitPoints : undefined}
          markers={
            p.phase === "run"
              ? session.markers
              : [...markers, ...viaMarkers, ...startMarker, ...islandMarker]
          }
          line={p.phase === "run" ? session.line : p.line}
          userPos={p.phase === "run" ? session.userPos : undefined}
          userHeading={p.phase === "run" ? session.userHeading : undefined}
          onMapClick={p.phase === "run" ? undefined : p.mapClick}
          className="absolute inset-0 h-full w-full"
        />
        {p.phase === "run" && (
          <CompassEnableModal
            open={session.needsCompassPermission}
            onEnable={session.requestCompass}
          />
        )}
      </div>

      {/* Top bar: OSM status, floating over the map. Hidden during a run so the
          map is the topmost element on the route — nothing overlaps its top edge. */}
      {p.phase !== "run" && (
        <header className="safe-top pointer-events-none absolute inset-x-0 z-[1000] flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
          <div className="pointer-events-auto">
            <OsmStatusBar />
          </div>
          <div className="pointer-events-auto ml-auto">
            <AccountChip />
          </div>
        </header>
      )}

      {/* Resume offer: a route from a prior session survived a refresh. */}
      {p.resumable && (
        <div className="border-sky-deep/40 bg-paper-deep/95 pointer-events-auto absolute top-20 left-1/2 z-[1001] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md md:top-6">
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-ink text-sm font-bold">Resume your route?</span>
            <span className="text-ink-dim text-xs">
              {p.resumable.stops.length} stops · {fmtDist(p.resumable.distanceM)} — saved from your
              last session.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={p.resumeDraft} size="sm" className="flex-1">
              Resume
            </Button>
            <Button onClick={p.dismissDraft} variant="outline" size="sm">
              Start fresh
            </Button>
          </div>
        </div>
      )}

      {/* ----- CONFIG PHASE: one question at a time ----- */}
      {p.phase === "config" && (
        <div className="phase-card z-[1000] flex flex-1 justify-center p-4 md:absolute md:inset-y-0 md:right-auto md:left-0 md:flex-none md:items-center md:p-6">
          <section className="flex w-full max-w-md flex-col gap-5 md:h-full">
            {/* Step progress */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i <= p.step ? "bg-sky-deep" : "bg-paper-deep"}`}
                />
              ))}
            </div>

            <div className="wizard-step flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-2xl leading-tight font-bold">{active.title}</h2>
                {active.hint && <p className="text-ink-dim text-sm">{active.hint}</p>}
              </div>

              {/* Step 1 — start location */}
              {active.key === "where" && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <div className="border-paper-line bg-paper/40 focus-within:border-sky-deep/60 flex flex-1 items-center gap-2 rounded-lg border px-2">
                      <MagnifyingGlassIcon size={16} className="text-ink-dim" />
                      <input
                        className="text-ink placeholder:text-ink-dim w-full bg-transparent py-2 text-sm outline-none"
                        placeholder="Search address / city"
                        value={p.addr}
                        onChange={(e) => p.setAddr(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && p.searchAddr()}
                      />
                    </div>
                    <button
                      onClick={p.geolocate}
                      title="Use my location"
                      className="border-paper-line bg-paper/40 text-ink hover:border-sky-deep/60 hover:text-sky-deep rounded-lg border px-3 transition"
                    >
                      <CrosshairIcon size={18} />
                    </button>
                  </div>
                  {!p.center && (
                    <p className="border-paper-line bg-paper/40 text-ink-dim rounded-lg border px-3 py-2 text-xs">
                      No start point yet — search, locate, or tap the map.
                    </p>
                  )}
                </div>
              )}

              {/* Step 2 — search radius (defines the pool of points to choose from) */}
              {active.key === "radius" && (
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={p.radiusMi}
                      onChange={(e) =>
                        p.setRadiusMi(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="border-paper-line bg-paper/40 text-ink focus:border-sky-deep/60 w-20 rounded-lg border px-2 py-2 outline-none"
                    />
                    mile search radius
                  </label>

                  {/* Recency filter — narrow the pool by when each point was last
                      surveyed (OSM check_date). Defaults to points not checked in
                      the last 6 months: the ones worth verifying on the ground. */}
                  <div className="flex flex-col gap-2">
                    <SegmentedControl
                      options={RECENCY_MODES}
                      value={p.recencyMode}
                      onChange={p.setRecencyMode}
                    />
                    {p.recencyMode !== "any" && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={p.recencyMonths}
                          onChange={(e) =>
                            p.setRecencyMonths(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="border-paper-line bg-paper/40 text-ink focus:border-sky-deep/60 w-20 rounded-lg border px-2 py-2 outline-none"
                        />
                        <span className="text-ink-dim">months</span>
                      </label>
                    )}
                    <p className="text-ink-dim text-xs">
                      {p.recencyMode === "stale"
                        ? `Show points not surveyed in the last ${p.recencyMonths || 6} months (or never) — the ones worth checking.`
                        : p.recencyMode === "fresh"
                          ? `Show only points surveyed within the last ${p.recencyMonths || 6} months.`
                          : "Show all matching points regardless of when last surveyed."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {p.err && (
              <ErrorNotice
                message={p.err}
                onRetry={p.errRetryable ? p.findPoints : undefined}
                retrying={p.busy === "find"}
              />
            )}

            {/* Wizard nav */}
            <div className="mt-auto flex items-center gap-3 pt-4 pb-4 md:pb-0">
              <button
                onClick={() => p.setStep(Math.max(0, p.step - 1))}
                disabled={p.step === 0}
                className="border-paper-line text-ink-dim hover:text-ink flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-0"
              >
                <ArrowLeftIcon size={16} />
                Back
              </button>
              {p.step < STEPS.length - 1 ? (
                <Button
                  onClick={() => p.setStep(Math.min(STEPS.length - 1, p.step + 1))}
                  disabled={!canAdvance}
                  className="ml-auto flex items-center gap-1.5"
                >
                  Next
                  <ArrowRightIcon size={16} />
                </Button>
              ) : (
                <Button
                  onClick={p.finishConfig}
                  disabled={!p.center || p.busy !== null}
                  className="ml-auto flex w-40 items-center justify-center gap-1.5"
                >
                  <MapPinIcon size={16} />
                  {p.busy === "find" ? "Finding…" : "Find points"}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ----- MAP PHASE: map-first, controls float over it ----- */}
      {p.phase === "map" && (
        <div className="phase-card z-[1000] flex justify-center p-4 md:absolute md:inset-y-0 md:right-0 md:left-auto md:items-center md:p-6">
          <section className="flex w-full max-w-sm flex-col gap-4 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold">Build the route</h2>
              <button
                onClick={() => p.setPhase("config")}
                className="border-paper-line text-ink-dim hover:border-sky-deep/60 hover:text-sky-deep flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              >
                <SlidersHorizontalIcon size={14} />
                Edit setup
              </button>
            </div>
            {p.fountains.length > 0 && (
              <span className="bg-sky/15 text-sky-deep -mt-2 w-fit rounded-full px-2 py-0.5 text-xs font-semibold">
                {p.fountains.length} found
              </span>
            )}

            {/* Route sizing: by a target distance, or by the points picked.
                Collapses away once a route exists to free vertical space. */}
            <AnimatePresence initial={false}>
              {p.stops.length === 0 && (
                <motion.div
                  key="sizing"
                  initial={false}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-2 overflow-hidden"
                >
                  <SegmentedControl
                    options={SIZE_MODES}
                    value={p.sizeMode}
                    onChange={p.setSizeMode}
                    textSize="sm"
                  />
                  {p.sizeMode === "distance" && (
                    <label className="flex flex-col gap-1 text-sm">
                      Target run (mi)
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={p.targetMi}
                        onChange={(e) =>
                          p.setTargetMi(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="border-paper-line bg-paper/40 text-ink focus:border-sky-deep/60 rounded-lg border px-2 py-2 outline-none"
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={p.loop}
                      onChange={(e) => p.setLoop(e.target.checked)}
                      className="accent-sky-deep h-4 w-4"
                    />
                    Loop (finish back at start)
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map interaction help */}
            <div className="flex flex-col gap-2">
              <p className="text-ink-dim text-xs">
                Tap to add / remove. Long-press to update in OSM. Click any space to add a waypoint
                {p.vias.length > 0 && (
                  <span className="text-ink-dim"> ({p.vias.length} added)</span>
                )}
                .
              </p>
              {removed.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-ink-dim text-xs font-semibold">
                    Removed from route ({removed.length})
                  </span>
                  <ul className="flex flex-col gap-1">
                    {removed.map((f) => (
                      <li
                        key={f.id}
                        className="bg-paper-deep flex items-center justify-between rounded-lg px-2 py-1 text-xs"
                      >
                        <span className="text-ink-dim flex items-center gap-1 truncate line-through">
                          {markLabel(f)}
                        </span>
                        <button
                          onClick={() => p.restoreStop(f.id)}
                          className="text-sky-deep/70 hover:text-sky-deep shrink-0 font-semibold"
                          aria-label="add point back to route"
                        >
                          Add back
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <AnimatePresence initial={false}>
              {p.stops.length === 0 && (
                <motion.div
                  key="plan-btn"
                  initial={false}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-paper-line flex flex-col gap-2 overflow-hidden border-t pt-4"
                >
                  <Button
                    onClick={p.makeRoute}
                    disabled={p.fountains.length === 0 || p.busy !== null || !sizingReady}
                    className="flex items-center justify-center gap-2"
                  >
                    <PathIcon size={16} />
                    {p.busy === "route" ? "Planning…" : "Plan route"}
                  </Button>
                  {p.fountains.length > 0 && !sizingReady && planHint && (
                    <p className="text-ink-dim text-center text-xs">{planHint}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {p.stops.length > 0 && (
              <div className="border-sky-deep/30 bg-sky/10 rounded-2xl border p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink font-semibold">
                    {p.stops.length} stops
                    <span className="text-ink-dim ml-1 font-normal">of {p.fountains.length}</span>
                  </span>
                  <span className="text-sky-deep font-semibold">{fmtDist(p.distanceM)}</span>
                </div>
                {p.autoCount > 0 && (
                  <p className="text-ink-dim mt-1 text-xs">
                    +{p.autoCount} grabbed for a small detour off your route. Remove any you
                    don&apos;t want.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  {p.stops.length > 1 && (
                    <Button
                      onClick={p.reverseRoute}
                      disabled={p.busy !== null}
                      variant="accent"
                      className="flex flex-1 items-center justify-center gap-2"
                    >
                      <ArrowsLeftRightIcon size={16} />
                      {p.busy === "reverse" ? "Reversing…" : "Direction"}
                    </Button>
                  )}
                  <button
                    onClick={p.startRun}
                    disabled={p.busy !== null}
                    className="bg-ink text-paper hover:bg-ink-soft flex-1 rounded-full py-2.5 font-bold transition disabled:opacity-40"
                  >
                    Start run →
                  </button>
                </div>
              </div>
            )}

            <EditSyncPanel osmEdits={osmEdits} />

            {p.err && (
              <ErrorNotice
                message={p.err}
                onRetry={p.errRetryable ? p.findPoints : undefined}
                retrying={p.busy === "find"}
              >
                {p.islandPt && (
                  <span className="text-xs text-red-300/80">
                    It&apos;s marked <span className="font-bold">!</span> in red on the map. Remove
                    that point (or move your nearest waypoint), then the route re-plans on its own.
                  </span>
                )}
              </ErrorNotice>
            )}
          </section>
        </div>
      )}

      {/* ----- RUN PHASE: same map, side panel becomes the live survey ----- */}
      {p.phase === "run" && (
        <div className="phase-card z-[1000] flex justify-center p-4 md:absolute md:inset-y-0 md:right-0 md:left-auto md:items-center md:p-6">
          <section className="flex w-full max-w-sm flex-col gap-4 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
            {session.done ? (
              <RunComplete session={session} tone="light" onExit={exitRun} />
            ) : (
              <RunGuide session={session} tone="light" />
            )}
          </section>
        </div>
      )}
    </main>
  );
}
