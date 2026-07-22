import type { APIRoute } from "astro";
import { API_BASE, DRY_RUN } from "@/lib/osm";
import { getOsmToken } from "@/lib/osmToken";

export const prerender = false;

// Whether the user is signed in to OSM, and which API (sandbox vs live) is targeted.
export const GET: APIRoute = async ({ request }) => {
  const token = await getOsmToken(request);
  // In dev (test env) skip the OSM connect gate so the map is reachable without OAuth.
  const loggedIn = import.meta.env.PROD ? !!token : true;
  const live = API_BASE.includes("api.openstreetmap.org");
  // Dry run: signed in against live data, but writes are stubbed (nothing hits
  // the map). Surfaced so the UI can badge it.
  return Response.json({ loggedIn, apiBase: API_BASE, live, dryRun: DRY_RUN });
};

// Logout.
export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete("osm_token", { path: "/" });
  return Response.json({ ok: true });
};
