import { NextResponse } from "next/server";
import { readJson } from "@/lib/db";
import type { EditLogEntry } from "@/lib/schemas";

// Fallback "hard copy" export: bundles the active run plan and the local audit
// log of every OSM edit we made into one JSON file the surveyor can download.
// Lets the run be reconstructed/verified if anything went wrong server-side or
// with the OSM submission.
export async function GET() {
  const plan = await readJson("current-run.json", null);
  const editLog = await readJson<EditLogEntry[]>("edit-log.json", []);

  const bundle = {
    exportedAt: new Date().toISOString(),
    plan,
    editLog,
  };

  const stamp = bundle.exportedAt.slice(0, 19).replace(/[:T]/g, "-");
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="run-for-maps-export-${stamp}.json"`,
    },
  });
}
