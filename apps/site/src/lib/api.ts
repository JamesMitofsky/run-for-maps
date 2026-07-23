// Single entry point for talking to the ROSM backend (the Astro `/api` endpoints).
// The site and its API share an origin, so the base is empty and the httpOnly OSM
// cookie carries auth automatically.

// Trailing slash stripped so `${API_BASE}${path}` never double-slashes.
const API_BASE = (import.meta.env.PUBLIC_API_BASE ?? "").replace(/\/$/, "");

// Resolve an `/api/...` path to an absolute URL. Absolute URLs (e.g. third-party
// APIs) pass through untouched.
export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path}`;
}

// Thrown when `apiFetch` aborts a request because it exceeded `timeoutMs`.
// Distinct from a caller-initiated abort so the UI can show a "took too long"
// message rather than a generic network error.
export class ApiTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "ApiTimeoutError";
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  // A hard client-side ceiling. The backend can retry upstream services (e.g.
  // Overpass across mirrors) for far longer than a user should wait, so callers
  // cap the total wait here; on expiry the request aborts and throws
  // ApiTimeoutError. Omit to wait indefinitely (previous behavior).
  { timeoutMs }: { timeoutMs?: number } = {},
): Promise<Response> {
  const base: RequestInit = {
    ...init,
    // Same-origin cookie auth on web.
    credentials: init.credentials ?? "include",
  };
  if (!timeoutMs) return fetch(apiUrl(path), base);

  const ctrl = new AbortController();
  const timedOut = { hit: false };
  const timer = setTimeout(() => {
    timedOut.hit = true;
    ctrl.abort();
  }, timeoutMs);
  // Honor a caller-supplied signal too: if it aborts, propagate to our fetch.
  if (init.signal) {
    if (init.signal.aborted) ctrl.abort();
    else init.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  try {
    return await fetch(apiUrl(path), { ...base, signal: ctrl.signal });
  } catch (e) {
    if (timedOut.hit) throw new ApiTimeoutError(timeoutMs);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
