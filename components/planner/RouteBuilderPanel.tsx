"use client";

import { useMemo } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import ErrorNotice from "@/components/ui/ErrorNotice";
import SegmentedControl from "@/components/ui/SegmentedControl";
import StepProgress, {
  BUILD_STEP_INDEX,
  REVIEW_STEP_INDEX,
} from "@/components/planner/StepProgress";
import EditSyncPanel from "@/components/EditSyncPanel";
import type { OsmEdits } from "@/hooks/useOsmEdits";
import { usePlanner, pinnedOf, removedOf } from "@/store/planner";
import type { Fountain } from "@/lib/schemas";
import { fmtDist } from "@/lib/geo";

// Route sizing modes, shown as a segmented control on the map phase.
const SIZE_MODES = [
  { key: "distance", label: "Target distance" },
  { key: "points", label: "By waypoints" },
] as const;

function markLabel(f: Fountain) {
  return f.tags.name ?? "Unnamed fountain";
}

// Map phase, second half of the setup sequence. Two steps share this panel:
// BUILD (sizing controls → "Plan route" advances) and REVIEW (the route summary
// → "Start run" launches). Both keep the wizard's bottom Back/Next nav.
export default function RouteBuilderPanel({ osmEdits }: { osmEdits: OsmEdits }) {
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
  const planHint = p.sizeMode === "distance" ? "Enter a target distance above." : null;

  const isReview = p.step === REVIEW_STEP_INDEX;

  // "Plan route": build, then (only on success) page over to the review step.
  async function handlePlan() {
    await p.makeRoute();
    if (usePlanner.getState().stops.length > 0) p.setStep(REVIEW_STEP_INDEX);
  }

  return (
    <section className="flex w-full max-w-sm flex-col gap-4 md:h-full md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
      {/* Setup-sequence steps continue here — same progress bar as the wizard. */}
      <StepProgress current={p.step} />
      <h2 className="font-display text-2xl leading-tight font-bold">
        {isReview ? "Your Route" : "Route Builder"}
      </h2>

      {/* BUILD step — route sizing: by a target distance, or by the points picked. */}
      {!isReview && (
        <div className="flex flex-col gap-2">
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
                onChange={(e) => p.setTargetMi(e.target.value === "" ? "" : Number(e.target.value))}
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
            Loop to start
          </label>
          {p.fountains.length > 0 && !sizingReady && planHint && (
            <p className="text-ink-dim text-xs">{planHint}</p>
          )}
        </div>
      )}

      {/* REVIEW step — the built route's summary, plus removed-point recovery. */}
      {isReview && p.stops.length > 0 && (
        <>
          <div className="border-sky-deep/30 bg-sky/10 rounded-2xl border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink font-semibold">{p.stops.length} stops</span>
              <span className="text-sky-deep font-semibold">{fmtDist(p.distanceM)}</span>
            </div>
            {p.autoCount > 0 && (
              <p className="text-ink-dim mt-1 text-xs">
                +{p.autoCount} grabbed for a small detour off your route. Remove any you don&apos;t
                want.
              </p>
            )}
            {p.stops.length > 1 && (
              <Button
                onClick={p.reverseRoute}
                disabled={p.busy !== null}
                variant="accent"
                className="mt-3 flex w-full items-center justify-center gap-2"
              >
                <ArrowsLeftRightIcon size={16} />
                {p.busy === "reverse" ? "Reversing…" : "Direction"}
              </Button>
            )}
          </div>

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
        </>
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
              It&apos;s marked <span className="font-bold">!</span> in red on the map. Remove that
              point (or move your nearest waypoint), then the route re-plans on its own.
            </span>
          )}
        </ErrorNotice>
      )}

      {/* Bottom nav mirrors the wizard: Back on the left, primary action on the
          right. BUILD advances by planning; REVIEW launches the run. */}
      <div className="mt-auto flex items-center gap-3 pt-4 pb-4 md:pb-0">
        <button
          onClick={() => {
            if (isReview) {
              p.setStep(BUILD_STEP_INDEX);
            } else {
              p.setStep(BUILD_STEP_INDEX - 1);
              p.setPhase("config");
            }
          }}
          className="border-paper-line text-ink-dim hover:text-ink flex items-center gap-1.5 rounded-sm border px-4 py-2.5 text-sm font-semibold transition"
        >
          <ArrowLeftIcon size={16} />
          Back
        </button>
        {isReview ? (
          <Button
            onClick={p.startRun}
            disabled={p.busy !== null || p.stops.length === 0}
            className="ml-auto flex items-center gap-1.5"
          >
            Start run
            <ArrowRightIcon size={16} />
          </Button>
        ) : (
          <Button
            onClick={handlePlan}
            disabled={p.fountains.length === 0 || p.busy !== null || !sizingReady}
            className="ml-auto flex items-center gap-1.5"
          >
            {p.busy === "route" ? "Planning…" : "Next"}
            <ArrowRightIcon size={16} />
          </Button>
        )}
      </div>
    </section>
  );
}
