"use client";

import { useEffect, useState } from "react";

export type OsmStatus = { loggedIn: boolean; apiBase: string; live: boolean };

export function useOsmStatus() {
  const [status, setStatus] = useState<OsmStatus | null>(null);
  const refresh = () =>
    fetch("/api/osm/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  useEffect(() => {
    refresh();
  }, []);
  return { status, refresh };
}

export default function OsmStatusBar() {
  const { status } = useOsmStatus();
  if (!status) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      {status.loggedIn ? (
        <span
          className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
          title={status.apiBase}
        >
          Connected
        </span>
      ) : (
        <a href="/api/osm/auth" className="font-medium text-blue-600 underline underline-offset-2">
          Sign in to OSM
        </a>
      )}
    </div>
  );
}
