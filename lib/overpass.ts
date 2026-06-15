// Fetch OSM points from the Overpass API.
import type { Fountain } from "./schemas";
import type { TagFilter, RecencyMode } from "./schemas";

// OSM tags surveyors use to record when a point was last verified on the ground.
const CHECK_DATE_KEYS = ["check_date", "survey:date", "checked"];

// Parse an OSM date tag (YYYY, YYYY-MM, or YYYY-MM-DD) to a UTC epoch ms, or
// null if missing/unparseable. Partial dates resolve to their earliest instant.
export function parseCheckDate(raw?: string): number | null {
  if (!raw) return null;
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(raw.trim());
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), m[2] ? Number(m[2]) - 1 : 0, m[3] ? Number(m[3]) : 1);
  return Number.isNaN(t) ? null : t;
}

// True if a point passes the recency filter. "stale" keeps points last surveyed
// before the cutoff OR never surveyed (the ones worth verifying); "fresh" keeps
// only points surveyed on/after the cutoff; "any" keeps everything.
export function matchesRecency(
  tags: Record<string, string>,
  mode: RecencyMode,
  cutoffMs: number,
): boolean {
  if (mode === "any") return true;
  const raw = CHECK_DATE_KEYS.map((k) => tags[k]).find((v) => v != null);
  const checked = parseCheckDate(raw);
  if (mode === "stale") return checked === null || checked < cutoffMs;
  return checked !== null && checked >= cutoffMs;
}

// Cutoff epoch ms for "N months ago" from now.
function monthsAgo(months: number): number {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.getTime();
}

const OVERPASS_URL =
  process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";

type OverpassEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

// Build a query for nodes/ways/relations matching key=value within radius.
export function buildQuery(
  lat: number,
  lon: number,
  radiusM: number,
  tag: TagFilter,
): string {
  const sel = `["${tag.key}"="${tag.value}"]`;
  const around = `(around:${Math.round(radiusM)},${lat},${lon})`;
  return `[out:json][timeout:25];
(
  node${sel}${around};
  way${sel}${around};
  relation${sel}${around};
);
out center tags;`;
}

export async function fetchFountains(
  lat: number,
  lon: number,
  radiusM: number,
  tag: TagFilter,
  recencyMode: RecencyMode = "any",
  recencyMonths = 6,
): Promise<Fountain[]> {
  const query = buildQuery(lat, lon, radiusM, tag);
  const cutoffMs = monthsAgo(recencyMonths);
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "run-for-maps/1.0 (OSM survey tool)",
    },
    body: new URLSearchParams({ data: query }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Overpass error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { elements: OverpassEl[] };
  return json.elements
    .map((el): Fountain | null => {
      const lt = el.lat ?? el.center?.lat;
      const ln = el.lon ?? el.center?.lon;
      if (lt == null || ln == null) return null;
      return { id: el.id, lat: lt, lon: ln, tags: el.tags ?? {} };
    })
    .filter((f): f is Fountain => f !== null)
    .filter((f) => matchesRecency(f.tags, recencyMode, cutoffMs));
}
