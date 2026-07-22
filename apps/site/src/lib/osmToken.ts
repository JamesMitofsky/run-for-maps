// Resolve the OSM access token for an incoming API request.
//
// Web app: the token rides in the httpOnly `osm_token` cookie (same origin).
// Native app: there is no shared cookie across the capacitor:// origin, so the
// token is sent as an `Authorization: Bearer` header. The header wins when both
// are present.
//
// Cookie is read straight off the request's `Cookie` header so this stays
// framework-agnostic (no next/headers).
export async function getOsmToken(req: Request): Promise<string | undefined> {
  const auth = req.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  return readCookie(req.headers.get("cookie"), "osm_token");
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}
