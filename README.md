# Fountain Run Planner

Plan a running route past OpenStreetMap points (drinking fountains by default), run it
on your phone with turn-toward-next-point guidance, and record each point's real-world
state back to OSM (`check_date`, `disused:`, `abandoned:`) as you go.

## How it works

1. **Find points** — fetches OSM features matching a tag (`amenity=drinking_water` default,
   any `key=value` supported) within a radius via the Overpass API.
2. **Plan route** — picks and orders a subset that fits a **target run distance** (so you can
   split the city across multiple runs), then draws a real walking/running route via the free
   BRouter API (`foot-fast` profile). Loop or one-way, your choice.
3. **Run** (`/run`) — mobile-first view: live distance + compass arrow to the next point.
   On arrival, mark it **Working** / **Out of order** / **Removed**, which writes the edit to
   OSM under one changeset for the run.

State mapping (OSM lifecycle convention):

| Action       | Effect on the node                                                |
| ------------ | ---------------------------------------------------------------- |
| Working      | set `check_date=<today>`                                          |
| Out of order | move `amenity=drinking_water` → `disused:amenity=...`, stamp date |
| Removed      | move → `abandoned:amenity=...`, stamp date                        |
| Delete (adv) | delete the node entirely                                          |

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in OSM_CLIENT_ID (see below)
pnpm dev                     # http://localhost:3000
```

### OSM OAuth2 (for write-back)

Reading points and planning routes needs no auth. Writing status back does.

1. **Use the sandbox first.** Create an account on
   <https://master.apis.dev.openstreetmap.org> (separate from the real OSM).
2. There, go to **Settings → OAuth 2 applications → Register new application**:
   - Redirect URI: `http://localhost:3000/api/osm/callback`
   - Permissions: `read_prefs`, `write_api`
   - Leave it a public (PKCE) client.
3. Put the client ID in `.env.local` as `OSM_CLIENT_ID`. Leave `OSM_*_BASE` at their
   sandbox defaults.
4. In the app, click **Sign in to OSM**, plan a route, and test edits. The badge shows
   **SANDBOX**.

### Going live

Only after verifying on sandbox: register the same app at <https://www.openstreetmap.org>,
then set in `.env.local`:

```
OSM_OAUTH_BASE=https://www.openstreetmap.org
OSM_API_BASE=https://api.openstreetmap.org
OSM_CLIENT_ID=<live app id>
```

The badge turns **LIVE OSM** in red. Edits now change the real map — they are public and
attributed to your account.

## Data

Local JSON files under `data/` (gitignored): `fountains-cache.json`, `current-run.json`,
`edit-log.json`.

## External services

OSM Overpass, BRouter, Nominatim (geocoding), and OSM tiles — all public and rate-limited;
be gentle. No keys required except your OSM OAuth client ID.

## Contributing

### Before you start

- Open an issue describing the bug or change before writing code for anything non-trivial,
  so the approach can be agreed on first.
- One logical change per pull request. Keep unrelated refactors out of the diff.
- All write-back testing goes through the OSM **sandbox** (`master.apis.dev.openstreetmap.org`),
  never the live API. Do not commit edits that hit production OSM.

### Local setup

```bash
pnpm install
cp .env.example .env.local   # set OSM_CLIENT_ID (see "OSM OAuth2" above)
pnpm dev
```

Node ≥ 20 and pnpm are required. Use pnpm — do not add a `package-lock.json` or `yarn.lock`.

### Before opening a PR

```bash
pnpm lint      # eslint, must pass with no errors
pnpm build     # next build, must succeed
```

- TypeScript strict mode is on; do not introduce `any` or `@ts-ignore` to silence errors.
- Match the existing code style; no formatter config is shipped, so keep diffs minimal and
  consistent with surrounding code.
- Don't commit anything under `data/` — it is gitignored runtime state.

### Commit and PR conventions

- Conventional Commits for messages: `feat(scope): …`, `fix(scope): …`, `chore: …`.
  See `git log` for existing scopes (`fountains`, `landing`, `plan`, `pwa`, …).
- PR description: what changed, why, and how it was tested. Note whether write-back was
  verified against the sandbox.
- Rebase on the target branch before requesting review; keep history linear.

### Scope of contributions

Useful areas: new OSM tag presets, additional lifecycle mappings, routing-profile options,
geolocation/compass accuracy on the `/run` view, and offline/PWA behavior. Changes that write
to OSM must preserve the single-changeset-per-run guarantee and the lifecycle tag convention
documented above.
