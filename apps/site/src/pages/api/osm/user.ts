import type { APIRoute } from "astro";
import { API_BASE } from "@/lib/osm";
import { getOsmToken } from "@/lib/osmToken";

export const prerender = false;

// The signed-in user's OSM identity, trimmed to what the UI needs. Kept separate
// from /api/osm/status (polled everywhere) so a status check never costs an OSM
// API roundtrip.
export const GET: APIRoute = async ({ request }) => {
  const token = await getOsmToken(request);
  if (!token) return Response.json({ error: "not signed in" }, { status: 401 });
  const r = await fetch(`${API_BASE}/api/0.6/user/details.json`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    return Response.json({ error: "couldn't load OSM user" }, { status: r.status });
  }
  const j = await r.json();
  const u = j.user ?? {};
  return Response.json({
    id: u.id ?? null,
    username: u.display_name ?? null,
    avatarUrl: u.img?.href ?? null,
    changesetCount: u.changesets?.count ?? 0,
    accountCreated: u.account_created ?? null,
  });
};
