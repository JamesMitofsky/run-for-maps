"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import SyncStatus from "@/components/SyncStatus";
import AccountCard from "@/components/connected/AccountCard";
import ContributionStats from "@/components/connected/ContributionStats";
import RunHistoryList from "@/components/connected/RunHistoryList";
import { getArchivedRoutes, type ArchivedRoute } from "@/lib/routeArchive";

// The user's home: who they are on OSM, what their runs have added up to, and
// every past run on this device. Deliberately NOT gated behind sign-in — the
// archive and the outbox live on the device and are worth showing either way.
export default function ConnectedPage() {
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
    <main className="bg-paper font-body text-ink">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-8">
        <h1 className="font-display text-sky-deep text-2xl leading-tight font-bold">
          Your Connection
        </h1>
        <div className="divide-paper-line/60 flex flex-col divide-y [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
          <ContributionStats routes={routes} />
          {/* Outbox review: edits still on their way to OSM (renders nothing when empty). */}
          <SyncStatus tone="light" />
          <RunHistoryList routes={routes} />
          <div className="flex items-center justify-between gap-4">
            <span className="font-display text-lg font-bold">Begin mapping</span>
            <Link
              href="/plan"
              className="group bg-ink text-paper inline-flex w-fit shrink-0 items-center gap-2 rounded-sm px-5 py-2.5 text-sm font-bold transition hover:gap-3"
            >
              Plan a route
              <ArrowRightIcon
                size={16}
                weight="bold"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
          <AccountCard />
        </div>
      </div>
    </main>
  );
}
