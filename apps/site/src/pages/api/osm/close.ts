import type { APIRoute } from "astro";
import { getOsmToken } from "@/lib/osmToken";
import { closeChangeset, changesetUrl } from "@/lib/osm";

export const prerender = false;

// Close the run's changeset when the run ends.
export const POST: APIRoute = async ({ request }) => {
  const token = await getOsmToken(request);
  if (!token) return Response.json({ ok: false, error: "not signed in" }, { status: 401 });
  const { changesetId } = (await request.json()) as { changesetId?: number };
  if (!changesetId) return Response.json({ ok: true });
  try {
    await closeChangeset(token, changesetId);
    return Response.json({ ok: true, changesetUrl: changesetUrl(changesetId) });
  } catch (e) {
    // Edits already PUT are live regardless; the changeset also auto-closes
    // server-side after idle. Surface the exact error so the user knows.
    return Response.json(
      {
        ok: false,
        error: `${(e as Error).message} (edits already saved; changeset auto-closes later)`,
      },
      { status: 502 },
    );
  }
};
