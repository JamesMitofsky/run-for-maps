import type { APIRoute } from "astro";
import { readJson, writeJson } from "@/lib/db";

export const prerender = false;

// Persist an in-progress planner draft (a built-but-not-started route) to JSON
// (per project convention: file, not localStorage), so a refresh on /plan can
// offer to resume the route instead of losing all the setup work.
export const POST: APIRoute = async ({ request }) => {
  const draft = await request.json();
  await writeJson("current-draft.json", draft);
  return Response.json({ ok: true });
};

export const GET: APIRoute = async () => {
  const draft = await readJson("current-draft.json", null);
  return Response.json(draft);
};

// Clear the draft once the route is started, or the user dismisses the resume offer.
export const DELETE: APIRoute = async () => {
  await writeJson("current-draft.json", null);
  return Response.json({ ok: true });
};
