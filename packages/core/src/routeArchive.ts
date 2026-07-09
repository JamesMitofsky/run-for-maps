import type { Pt } from "./geo";
import type { Turn } from "./brouter";
import type { Fountain } from "./schemas";
import type { RunStop } from "./stores/run";
import type { OutboxItem } from "./stores/outbox";
import { corePorts } from "./configure";

// Durable on-device record of every route the surveyor runs. Replaces the old
// "Export JSON backup" download: instead of a one-off file the user has to
// remember to save, each route — plus every node change made along the way — is
// written to localStorage automatically and kept across N routes. Survives
// reloads, OSM submission failures, and moving between runs.
//
// Keyed by routeId so a single run is updated in place (not duplicated) as it
// progresses and across reloads. The newest snapshot wins.

const KEY = "run-for-maps:archive";

export type ArchivedRoute = {
  routeId: string;
  startedAt: string; // ISO — first time this route was archived
  updatedAt: string; // ISO — last snapshot
  plan: {
    start: Pt;
    loop: boolean;
    tagKey: string;
    tagValue: string;
    stops: RunStop[]; // carries each node's recorded status
    vias: Pt[];
    pool?: Fountain[]; // nearby non-target fountains shown dimmed during the run
    added: Fountain[]; // nodes created on the fly
    routeCoords: [number, number][];
    distanceM: number;
    turns: Turn[];
    index: number;
    changesetId?: number;
  };
  edits: OutboxItem[]; // full outbox: per-edit changeset + sync state
};

export type RouteSnapshot = Pick<ArchivedRoute, "routeId" | "plan" | "edits">;

function loadAll(): ArchivedRoute[] {
  try {
    const raw = corePorts().kv.get(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    // corrupt / unavailable storage, or ports not configured yet (SSR) — start
    // fresh rather than throw.
    return [];
  }
}

function saveAll(list: ArchivedRoute[]) {
  try {
    corePorts().kv.set(KEY, JSON.stringify(list));
  } catch {
    // storage full or disabled — archiving is best-effort, never block the run
  }
}

// Upsert one route's current state into the archive. Called on every persist so
// node changes are captured as they happen.
export function archiveRoute(snap: RouteSnapshot) {
  if (!snap.routeId) return;
  const now = new Date().toISOString();
  const list = loadAll();
  const i = list.findIndex((r) => r.routeId === snap.routeId);
  if (i === -1) {
    list.push({ ...snap, startedAt: now, updatedAt: now });
  } else {
    list[i] = { ...list[i], ...snap, updatedAt: now };
  }
  saveAll(list);
}

// Read the full archive, newest run first. For surfacing past routes later.
export function getArchivedRoutes(): ArchivedRoute[] {
  return loadAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
