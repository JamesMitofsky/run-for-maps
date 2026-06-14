// Foot routing via BRouter public API (free, no key). Returns street geometry + distance.
import type { Pt } from "./geo";

const BROUTER_URL = process.env.BROUTER_URL || "https://brouter.de/brouter";
// Foot profile available on the public brouter.de server.
const BROUTER_PROFILE = process.env.BROUTER_PROFILE || "hiking-beta";

export type FootRoute = {
  // GeoJSON LineString coordinates [lon, lat]
  coords: [number, number][];
  distanceM: number;
};

// A routing failure we can explain to the user. `island` is set when BRouter
// reports a point it can't connect to the foot network ("target island"); it
// carries that point's coords so the UI can highlight it on the map.
export class RouteError extends Error {
  island?: Pt;
  constructor(message: string, island?: Pt) {
    super(message);
    this.name = "RouteError";
    this.island = island;
  }
}

// points must be in visit order; loop appends start at the end.
export async function footRoute(points: Pt[], loop: boolean): Promise<FootRoute> {
  const seq = loop ? [...points, points[0]] : points;
  const lonlats = seq.map((p) => `${p.lon},${p.lat}`).join("|");
  const url =
    `${BROUTER_URL}?lonlats=${lonlats}` +
    `&profile=${BROUTER_PROFILE}&alternativeidx=0&format=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    // "target island detected for section N" => waypoint N (1-based leg, whose
    // target endpoint is seq[N]) can't be reached on foot. Map it back to the
    // offending point so the UI can show *where* the route breaks.
    const m = body.match(/target island detected for section (\d+)/i);
    if (m) {
      const idx = Math.min(Math.max(Number(m[1]), 0), seq.length - 1);
      const p = seq[idx];
      throw new RouteError(
        "A point on your route can't be reached on foot — it sits on an isolated path with no walkable connection to the rest of the route.",
        { lat: p.lat, lon: p.lon },
      );
    }
    throw new RouteError(`Routing failed (BRouter ${res.status}). ${body}`.trim());
  }
  const gj = (await res.json()) as {
    features: {
      geometry: { coordinates: [number, number][] };
      properties: { "track-length"?: string };
    }[];
  };
  const feat = gj.features?.[0];
  if (!feat) throw new RouteError("BRouter returned no route");
  const distanceM = Number(feat.properties["track-length"] ?? 0);
  return { coords: feat.geometry.coordinates, distanceM };
}
