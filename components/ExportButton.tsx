"use client";

import { useEffect, useState } from "react";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useRun } from "@/store/run";
import type { EditLogEntry } from "@/lib/schemas";

// Downloads a "hard copy" JSON of the run plan + OSM edit log. Fallback in case
// the OSM submission went wrong and the surveyor needs a local record.
//
// The file is built CLIENT-SIDE from the live zustand store, not fetched from
// the server: on Vercel the pseudo-DB lives in per-instance /tmp, so a server
// export could land on a cold instance and return an empty backup — useless
// exactly when needed. The browser store always holds the real plan + statuses.
//
// The server edit-log (changeset + node version per OSM write) is prefetched on
// mount and merged best-effort, so the click handler stays synchronous and iOS
// Safari keeps the user-gesture required to trigger a blob download.
export default function ExportButton({ className = "" }: { className?: string }) {
  const run = useRun();
  const [editLog, setEditLog] = useState<EditLogEntry[]>([]);

  useEffect(() => {
    fetch("/api/export")
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => Array.isArray(b?.editLog) && setEditLog(b.editLog))
      .catch(() => {}); // best-effort enrichment only
  }, []);

  function download() {
    const bundle = {
      exportedAt: new Date().toISOString(),
      plan: {
        start: run.start,
        loop: run.loop,
        tagKey: run.tagKey,
        stops: run.stops,
        vias: run.vias,
        routeCoords: run.routeCoords,
        distanceM: run.distanceM,
        index: run.index,
        changesetId: run.changesetId,
      },
      editLog,
    };
    const stamp = bundle.exportedAt.slice(0, 19).replace(/[:T]/g, "-");
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run-for-maps-export-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className={`flex items-center justify-center gap-2 rounded border border-neutral-300 py-2 text-sm font-medium text-neutral-700 ${className}`}
    >
      <DownloadSimpleIcon size={18} /> Export JSON backup
    </button>
  );
}
