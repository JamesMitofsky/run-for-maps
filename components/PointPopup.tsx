"use client";

import {
  CheckCircleIcon,
  WarningIcon,
  TrashIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useMap } from "react-leaflet";
import type { Fountain, EditAction } from "@/lib/schemas";
import type { StopStatus } from "@/store/run";

// Local feedback for a point already updated in this session.
export type PointEdit = {
  status: StopStatus;
  summary: string;
  changesetUrl: string;
};

const STATUS_LABEL: Partial<Record<StopStatus, string>> = {
  confirm: "Confirmed working",
  out_of_order: "Marked out of order",
  removed: "Marked removed",
  delete: "Deleted from OSM",
};

type Props = {
  fountain: Fountain;
  loggedIn: boolean;
  edit?: PointEdit;
  busy: boolean;
  onAction: (action: EditAction, comment: string) => void;
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
  const map = useMap();
  const [comment, setComment] = useState("");
  const name = fountain.tags.name ?? `node ${fountain.id}`;
  const deleted = edit?.status === "delete";

  return (
    <div className="flex w-56 flex-col gap-2 text-neutral-800">
      <div>
        <div className="font-semibold leading-tight">{name}</div>
        {fountain.tags.check_date && (
          <div className="text-xs text-neutral-500">
            Last checked in OSM: {fountain.tags.check_date}
          </div>
        )}
      </div>

      {edit ? (
        <div className="rounded bg-green-50 p-2 text-xs text-green-800">
          <div className="font-medium">{STATUS_LABEL[edit.status] ?? "Updated"}</div>
          <div className="text-green-700">{edit.summary}</div>
          <a
            href={edit.changesetUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-2"
          >
            view on OSM
          </a>
        </div>
      ) : (
        <>
          {onToggleRoute && (
            <button
              onClick={() => {
                onToggleRoute();
                map.closePopup();
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
              <a
                href="/api/osm/auth"
                className="block rounded bg-blue-600 py-1.5 text-center text-xs font-semibold text-white"
              >
                Sign in to OSM to update
              </a>
            ) : (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comment (optional)"
                  rows={2}
                  className="resize-none rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  disabled={busy}
                  onClick={() => onAction("confirm", comment.trim())}
                  className="flex items-center justify-center gap-1.5 rounded bg-green-600 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <CheckCircleIcon size={16} /> Working — confirm
                </button>
                <button
                  disabled={busy}
                  onClick={() => onAction("out_of_order", comment.trim())}
                  className="flex items-center justify-center gap-1.5 rounded bg-amber-500 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <WarningIcon size={16} /> Out of order
                </button>
                <button
                  disabled={busy}
                  onClick={() => onAction("removed", comment.trim())}
                  className="flex items-center justify-center gap-1.5 rounded bg-red-600 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <TrashIcon size={16} /> Removed
                </button>
                <details className="text-xs">
                  <summary className="cursor-pointer text-neutral-500">Advanced</summary>
                  <button
                    disabled={busy || deleted}
                    onClick={() => onAction("delete", comment.trim())}
                    className="mt-1.5 w-full rounded border border-red-600 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
                  >
                    Delete node from OSM (irreversible)
                  </button>
                </details>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
