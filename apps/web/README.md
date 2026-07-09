# @rosm/web

The Next.js 16 (App Router) site: the public landing/fountain pages, the app UI
(plan → run → edit), and the `/api/*` backend (OSM OAuth, BRouter, Overpass, run
state). Shared logic comes from [`@rosm/core`](../../packages/core). Deployed to
Vercel; also the source of the installable PWA.

## Run it

From the repo root (deps are installed once at the root):

```bash
pnpm dev                      # this app → http://localhost:3000
# or explicitly:
pnpm --filter @rosm/web dev
```

Other scripts (run from anywhere with `pnpm --filter @rosm/web <script>`):
`build`, `start`, `lint`, `typecheck`, `test`, `test:watch`.

## Environment

Copy the example into this directory (Next reads env from the app root):

```bash
cp apps/web/.env.example apps/web/.env.local   # then fill in OSM_CLIENT_ID
```

Reading points and planning routes needs no auth. **Writing status back to OSM does.**

### OSM OAuth2 (for write-back)

1. **Use the sandbox first.** Create an account on
   <https://master.apis.dev.openstreetmap.org> (separate from real OSM).
2. There, go to **Settings → OAuth 2 applications → Register new application**:
   - Redirect URI: `http://localhost:3000/api/osm/callback`
   - Permissions: `read_prefs`, `write_api`
   - Leave it a public (PKCE) client — no client secret.
3. Put the client ID in `.env.local` as `OSM_CLIENT_ID`; leave `OSM_*_BASE` at their
   sandbox defaults. The in-app badge shows **SANDBOX**.

### Going live

Only after verifying on sandbox: register the same app at
<https://www.openstreetmap.org>, then set in `.env.local`:

```
OSM_OAUTH_BASE=https://www.openstreetmap.org
OSM_API_BASE=https://api.openstreetmap.org
OSM_CLIENT_ID=<live app id>
```

The badge turns **LIVE OSM** in red — edits now change the real map.

The mobile app reuses this same OAuth flow via `/api/osm/auth?native=1`, which returns
the token over the `rosm://` deep link instead of a cookie. Nothing extra to register.

## Data

Server run/draft state and caches are plain JSON files under `apps/web/data/`
(gitignored): `fountains-cache.json`, `current-run.json`, `edit-log.json`. On Vercel
these live in the ephemeral `/tmp` — fine for this single-user tool.

## Deploy (Vercel)

The Vercel project's **Root Directory** is `apps/web` (keep "include files outside the
root directory" enabled so the workspace install works). Framework preset stays Next.js;
`apps/web/vercel.json` skips deploys when neither `@rosm/web` nor `@rosm/core` changed.
