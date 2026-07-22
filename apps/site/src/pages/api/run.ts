import type { APIRoute } from "astro";
import { readJson, writeJson } from "@/lib/db";

export const prerender = false;

// Persist the active run plan to JSON (per project convention: file, not localStorage),
// so the mobile run view survives reloads and page hand-off.
export const POST: APIRoute = async ({ request }) => {
  const plan = await request.json();
  await writeJson("current-run.json", plan);
  return Response.json({ ok: true });
};

export const GET: APIRoute = async () => {
  const plan = await readJson("current-run.json", null);
  return Response.json(plan);
};
