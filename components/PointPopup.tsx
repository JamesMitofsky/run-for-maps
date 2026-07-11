"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  WarningIcon,
  TrashIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  DogIcon,
  SnowflakeIcon,
} from "@phosphor-icons/react";
import { useMapPopup } from "@/components/MapView";
import type { Fountain, EditAction, EditExtras, Audience } from "@/lib/schemas";
import type { StopStatus } from "@/store/run";
import { checkedAgoLabel } from "@/lib/checkDate";
import { audienceFromTags } from "@/lib/audience";
import AudienceToggle from "@/components/AudienceToggle";
import OsmSignInLink from "@/components/OsmSignInLink";
import type { SyncState } from "@/store/outbox";
import { SyncBadge } from "@/components/SyncStatus";

// Local feedback for a point already updated in this session. The edit is saved
// on-device first; changesetUrl only exists once OSM accepts it.
export type PointEdit = {
  status: StopStatus;
  summary: string;
  syncState: SyncState;
  changesetUrl?: string;
  extras?: EditExtras;
};

const STATUS_LABEL: Partial<Record<StopStatus, string>> = {
  confirm: "Confirmed working",
  out_of_order: "Marked out of order",
  removed: "Marked removed",
};

// True when OSM tags already flag this point as dog water / not human-potable,
// so a future run shows the warning without re-surveying.
function isDogWater(tags: Record<string, string>): boolean {
  return tags.drinking_water === "no";
}

type Props = {
  fountain: Fountain;
  loggedIn: boolean;
  edit?: PointEdit;
  busy: boolean;
  onAction: (action: EditAction, extras?: EditExtras) => void;
  // Route-membership toggle (planner only). Omit on the run page, where points
  // are fixed and only OSM updates apply.
  inRoute?: boolean;
  onToggleRoute?: () => void;
};

// Map popup body for a found amenity point: optional route add/remove toggle +
// OSM status updates. Reused on the planner (with the toggle) and on the run
// (OSM updates only, so any point can be updated on the fly).
export default function PointPopup({
  fountain,
  loggedIn,
  edit,
  busy,
  onAction,
  inRoute,
  onToggleRoute,
}: Props) {
  const { close } = useMapPopup();
  // Advanced OSM params, prefilled from the node's current tags so the surveyor
  // sees and can edit what's already there.
  const [seasonal, setSeasonal] = useState(fountain.tags.seasonal === "yes");
  const [audience, setAudience] = useState<Audience>(audienceFromTags(fountain.tags));
  const [osmNote, setOsmNote] = useState(fountain.tags.note ?? "");
  // Snapshot the clock once on mount — reading Date.now() during render is
  // impure; the "checked ago" label doesn't need to tick live.
  const [now] = useState(() => Date.now());

  function buildExtras(): EditExtras | undefined {
    const note = osmNote.trim();
    const extras: EditExtras = { audience };
    if (seasonal) extras.seasonal = true;
    if (note) extras.note = note;
    return Object.keys(extras).length ? extras : undefined;
  }

  return (
    <div className="flex w-60 flex-col gap-2.5 text-neutral-800">
      <div>
        <div className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {checkedAgoLabel(fountain.tags, now)}
        </div>
        {isDogWater(fountain.tags) && (
          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-violet-700">
            <DogIcon size={14} /> Dog water — not for humans
          </div>
        )}
      </div>

      {edit ? (
        <div className="flex flex-col gap-1 rounded bg-neutral-50 p-2 text-xs text-neutral-700">
          <div className="font-medium text-neutral-800">
            {STATUS_LABEL[edit.status] ?? "Updated"}
          </div>
          <div>{edit.summary}</div>
          {edit.extras?.seasonal && (
            <div className="flex items-center gap-1 text-sky-700">
              <SnowflakeIcon size={14} /> Seasonal
            </div>
          )}
          {edit.extras?.note && <div className="text-neutral-600 italic">“{edit.extras.note}”</div>}
          <SyncBadge state={edit.syncState} />
          {edit.changesetUrl && (
            <a
              href={edit.changesetUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2"
            >
              view on OSM
            </a>
          )}
        </div>
      ) : (
        <>
          {onToggleRoute && (
            <button
              onClick={() => {
                onToggleRoute();
                close();
              }}
              className={`flex items-center justify-center gap-1.5 rounded border py-1.5 text-xs font-semibold transition ${
                inRoute
                  ? "border-red-400 text-red-600 hover:bg-red-50"
                  : "border-green-500 text-green-700 hover:bg-green-50"
              }`}
            >
              {inRoute ? (
                <>
                  <MinusCircleIcon size={14} /> Remove from route
                </>
              ) : (
                <>
                  <PlusCircleIcon size={14} /> Add to route
                </>
              )}
            </button>
          )}

          <div className={onToggleRoute ? "border-t border-neutral-200 pt-2" : ""}>
            {!loggedIn ? (
              <OsmSignInLink className="block rounded bg-blue-600 py-1.5 text-center text-xs font-semibold text-white">
                Sign in to OSM to update
              </OsmSignInLink>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  disabled={busy}
                  onClick={() => onAction("confirm", buildExtras())}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-green-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon size={16} weight="fill" /> Working — confirm
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    disabled={busy}
                    onClick={() => onAction("out_of_order", buildExtras())}
                    className="flex items-center justify-center gap-1 rounded-md border border-amber-300 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                  >
                    <WarningIcon size={14} /> Out of order
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => onAction("removed", buildExtras())}
                    className="flex items-center justify-center gap-1 rounded-md border border-red-300 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <TrashIcon size={14} /> Removed
                  </button>
                </div>

                <div className="mt-1 flex flex-col gap-2 border-t border-neutral-200 pt-2.5">
                  <AudienceToggle value={audience} onChange={setAudience} />
                  <label className="flex items-center gap-2 text-xs text-neutral-700">
                    <input
                      type="checkbox"
                      checked={seasonal}
                      onChange={(e) => setSeasonal(e.target.checked)}
                      className="size-3.5 accent-neutral-800"
                    />
                    <span>Seasonal</span>
                  </label>
                  <textarea
                    value={osmNote}
                    onChange={(e) => setOsmNote(e.target.value)}
                    placeholder="Add a public note…"
                    rows={2}
                    maxLength={255}
                    className="resize-none rounded-md border border-neutral-300 px-2 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
