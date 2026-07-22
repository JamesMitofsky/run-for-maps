import type { APIRoute } from "astro";
import { exchangeToken, isSafeReturnTo } from "@/lib/osm";

export const prerender = false;

// OAuth2 redirect target: verify state, exchange code, deliver the token.
//   web    → store it in an httpOnly cookie, bounce to the app.
//   native → hand it back through a `rosm://` deep link (the app stores it in the
//            native keychain and sends it as a Bearer header thereafter).
export const GET: APIRoute = async ({ request, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const verifier = cookies.get("osm_pkce")?.value;
  const savedState = cookies.get("osm_state")?.value;
  const native = cookies.get("osm_native")?.value === "1";
  const returnTo = cookies.get("osm_return")?.value;

  // Transient PKCE/state cookies are cleared on every exit path. Set-Cookie
  // headers from `cookies` are merged onto whatever Response we return.
  const clearTransient = () => {
    cookies.delete("osm_pkce", { path: "/" });
    cookies.delete("osm_state", { path: "/" });
    cookies.delete("osm_native", { path: "/" });
    cookies.delete("osm_return", { path: "/" });
  };
  const redirectTo = (dest: string) =>
    new Response(null, { status: 302, headers: { Location: dest } });
  const fail = (msg: string) => {
    clearTransient();
    return redirectTo(
      native
        ? `rosm://osm-callback?error=${encodeURIComponent(msg)}`
        : `${url.origin}/?osm=error&msg=${encodeURIComponent(msg)}`,
    );
  };

  if (!code || !state || !verifier || state !== savedState) {
    return fail("invalid oauth state");
  }

  try {
    const token = await exchangeToken(code, verifier, `${url.origin}/api/osm/callback`);
    clearTransient();
    if (native) {
      return redirectTo(`rosm://osm-callback?token=${encodeURIComponent(token)}`);
    }
    // Return to wherever sign-in started (re-validated), else home.
    const dest = new URL(returnTo && isSafeReturnTo(returnTo) ? returnTo : "/", url.origin);
    dest.searchParams.set("osm", "ok");
    cookies.set("osm_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return redirectTo(dest.toString());
  } catch (e) {
    return fail((e as Error).message);
  }
};
