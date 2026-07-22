import type { APIRoute } from "astro";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";

export const prerender = false;
export type { LeaderboardEntry };

// Public contributor leaderboard for the landing page. Served from a 1h cache;
// see lib/leaderboard for how the ranking is built from a single Overpass query.
export const GET: APIRoute = async () => {
  const leaders = await getLeaderboard(Date.now());
  return Response.json({ leaders });
};
