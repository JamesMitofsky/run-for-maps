// Contributor leaderboard, sourced from OSM itself (durable + real).
//
// We rank the OSM users who are the current author of the most drinking-water
// features inside the coverage zone. Overpass indexes the *current* version of
// every element and, with `out meta`, returns each element's last editor
// (uid + user). So a single bbox query enumerates every contributor in the zone
// and their feature counts — no user list to seed, no changeset-tag scan.
//
// Metric note: this counts features a user is the *current* steward of, not raw
// edit operations. A later edit by someone else reassigns a feature; repeat edits
// by the same user on one feature count once. That's the honest limit of element
// data (changeset history is the only true per-edit record) and reads fine as a
// "who maintains the most fountains here" board.
import { readJson, writeJson } from "./db";
import { fetchOverpass } from "./overpass";

// Coverage zone, Overpass bbox order: (south, west, north, east). ≈ greater DC.
const ZONE_BBOX = "38.70,-77.20,39.05,-76.85";
// The feature the app surveys. Kept in sync with the map's default query.
const TAG = { key: "amenity", value: "drinking_water" };

const CACHE_FILE = "leaderboard-cache.json";
const TTL_MS = 60 * 60 * 1000; // 1h
const MAX_ENTRIES = 10;

export type LeaderboardEntry = {
  username: string;
  uid: number;
  points: number; // distinct in-zone features this user is the current author of
};

type Cache = { generatedAt: string; entries: LeaderboardEntry[] };

function buildQuery(): string {
  const f = `["${TAG.key}"="${TAG.value}"](${ZONE_BBOX})`;
  return `[out:json][timeout:25];
(
  node${f};
  way${f};
  relation${f};
);
out meta;`;
}

// Tally the current author of every in-zone feature. One Overpass call; group by
// uid. Elements without meta (uid/user) are skipped rather than bucketed as an
// anonymous "0" contributor.
async function tally(): Promise<LeaderboardEntry[]> {
  const { elements } = await fetchOverpass(buildQuery());
  const byUid = new Map<number, LeaderboardEntry>();
  for (const el of elements) {
    if (el.uid == null || !el.user) continue;
    const cur = byUid.get(el.uid);
    if (cur) cur.points += 1;
    else byUid.set(el.uid, { username: el.user, uid: el.uid, points: 1 });
  }
  return [...byUid.values()]
    .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username))
    .slice(0, MAX_ENTRIES);
}

// Cached top-N contributors. Rebuilds when the cache is missing or older than TTL;
// otherwise returns instantly. The rebuild is stateless (recomputed wholly from
// Overpass), so ephemeral serverless storage is fine — a cold /tmp just triggers a
// fresh fetch. On Overpass failure we return the stale cache so a transient outage
// never blanks the board. Timestamps come from the caller (no Date in render).
export async function getLeaderboard(nowMs: number): Promise<LeaderboardEntry[]> {
  const cache = await readJson<Cache | null>(CACHE_FILE, null);
  const fresh = cache && nowMs - new Date(cache.generatedAt).getTime() < TTL_MS;
  if (fresh) return cache.entries;

  try {
    const entries = await tally();
    await writeJson<Cache>(CACHE_FILE, { generatedAt: new Date(nowMs).toISOString(), entries });
    return entries;
  } catch (e) {
    console.error("[leaderboard] rebuild failed:", e);
    return cache?.entries ?? [];
  }
}
