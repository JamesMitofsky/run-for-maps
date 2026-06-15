"use client";

import { useEffect } from "react";
import { useOutbox } from "@/store/outbox";

// Drives the offline outbox app-wide: loads the queue on start, then flushes
// pending edits to OSM whenever we (re)gain connectivity or the tab becomes
// visible again. Mounted once in the root layout. Renders nothing.
export default function OutboxSync() {
  useEffect(() => {
    const { hydrate, flush } = useOutbox.getState();
    hydrate().then(() => flush());

    const onOnline = () => useOutbox.getState().flush();
    const onVisible = () => {
      if (document.visibilityState === "visible") useOutbox.getState().flush();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
