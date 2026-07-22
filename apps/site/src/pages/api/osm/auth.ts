import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { makePkce, authUrl, isSafeReturnTo } from "@/lib/osm";

export const prerender = false;

// Start OAuth2 login: redirect to OSM authorize with PKCE.
// `?native=1` marks a native-app sign-in (the Expo app): the callback returns the
// token via a `rosm://` deep link instead of an httpOnly cookie (cookies don't
// reach the native origin). The PKCE/state hop itself still works — auth + callback
// both run on this origin inside the same in-app browser session.
export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const native = url.searchParams.get("native") === "1";
  const redirectUri = `${url.origin}/api/osm/callback`;
  const { verifier, challenge } = makePkce();
  const state = crypto.randomBytes(8).toString("hex");
  const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  cookies.set("osm_pkce", verifier, opts);
  cookies.set("osm_state", state, opts);
  if (native) cookies.set("osm_native", "1", opts);
  // Remember where the sign-in started so the callback can return there. Only
  // same-origin relative paths (single leading slash, not `//` or `/\`) — an
  // open-redirect guard.
  const returnTo = url.searchParams.get("returnTo");
  if (returnTo && isSafeReturnTo(returnTo)) {
    cookies.set("osm_return", returnTo, opts);
  }
  return redirect(authUrl(redirectUri, challenge, state));
};
