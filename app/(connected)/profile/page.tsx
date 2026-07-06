"use client";

import { useEffect, useState } from "react";
import SiteNav from "@/components/SiteNav";
import SyncStatus from "@/components/SyncStatus";
import AccountCard from "@/components/profile/AccountCard";
import ContributionStats from "@/components/profile/ContributionStats";
import RunHistoryList from "@/components/profile/RunHistoryList";
import { getArchivedRoutes, type ArchivedRoute } from "@/lib/routeArchive";

// The user's home: who they are on OSM, what their runs have added up to, and
// every past run on this device. Deliberately NOT gated behind sign-in — the
// archive and the outbox live on the device and are worth showing either way.
export default function ProfilePage() {
  const [routes, setRoutes] = useState<ArchivedRoute[]>([]);

  // The archive lives in localStorage, so read it after mount (deferred off the
  // effect body so the state update doesn't cascade-render synchronously).
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) setRoutes(getArchivedRoutes());
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="bg-paper font-body text-ink min-h-screen">
      <SiteNav />
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-5 py-8">
        <h1 className="font-display text-2xl leading-tight font-bold">Profile</h1>
        <AccountCard />
        <ContributionStats routes={routes} />
        {/* Outbox review: edits still on their way to OSM (renders nothing when empty). */}
        <SyncStatus tone="light" />
        <RunHistoryList routes={routes} />
      </div>
    </main>
  );
}
