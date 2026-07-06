# Contributing

## Before you start

- Open an issue describing the bug or change before writing code for anything non-trivial,
  so the approach can be agreed on first.
- One logical change per pull request. Keep unrelated refactors out of the diff.
- All write-back testing goes through the OSM **sandbox** (`master.apis.dev.openstreetmap.org`),
  never the live API. Do not commit edits that hit production OSM.

## Local setup

```bash
pnpm install
cp .env.example .env.local   # set OSM_CLIENT_ID (see "OSM OAuth2" in the README)
pnpm dev
```

Node ≥ 20 and pnpm are required. Use pnpm — do not add a `package-lock.json` or `yarn.lock`.

## Code style

Formatting and lint style are enforced, not a matter of taste — everyone ships the same style.

- **Prettier** (`.prettierrc.json`) owns all formatting. Config: 2-space indent, double quotes,
  semicolons, trailing commas, 100-col width, LF endings. Tailwind classes are auto-sorted by
  `prettier-plugin-tailwindcss`.
- **ESLint** (`eslint.config.mjs`) owns code correctness; `eslint-config-prettier` disables any
  rule that would fight Prettier.
- **`.editorconfig`** sets editor defaults so files are consistent before Prettier even runs.
- A **husky** `pre-commit` hook runs **lint-staged**, which auto-fixes and formats staged files.
  Do not bypass it with `--no-verify`.

Do not hand-tune formatting or add per-file overrides; change the shared config in a dedicated
PR if the style itself needs to change.

## Tests

Unit/integration tests live in `tests/` and run on [Vitest](https://vitest.dev):

```bash
pnpm test            # run the whole suite once
pnpm test:watch      # watch mode while developing
pnpm test:coverage   # v8 coverage report (text + html)
```

Layout mirrors the source tree: `tests/lib/**` (geo math, route planning, OSM tag
transforms, Overpass/BRouter clients), `tests/store/**` (run + outbox stores),
`tests/hooks/**` (the live run session), and `tests/api/**` (every `/api` route
handler, including the OAuth PKCE flow and the 409-retry edit path).

Conventions:

- Default environment is node; browser-flavored suites start with a
  `// @vitest-environment jsdom` docblock (see `tests/setup.ts` for shared setup).
- All network I/O is mocked — the suite must pass offline and never touch the
  real OSM/Overpass/BRouter APIs.
- New features need tests in the matching directory; bug fixes need a test that
  fails before the fix.

## Before opening a PR

```bash
pnpm format        # apply Prettier to the whole tree
pnpm lint          # eslint, must pass with no errors (pnpm lint:fix to auto-fix)
pnpm typecheck     # tsc --noEmit, must pass
pnpm test          # vitest, must pass
pnpm build         # next build, must succeed
```

`pnpm format:check` is the CI-equivalent read-only check.

### CI / deployment gate

`.github/workflows/ci.yml` runs Prettier, ESLint, `tsc`, the Vitest suite and a
production `next build` on every PR targeting `main` and on every push to `main`.
Vercel deploys `main` on push, so keep the **Quality** and **Build** checks
required (GitHub → Settings → Branches → protect `main`) — that makes a green
suite the precondition for anything reaching production.

- TypeScript strict mode is on; do not introduce `any` or `@ts-ignore` to silence errors.
- Don't commit anything under `data/` — it is gitignored runtime state.

## Commit and PR conventions

- Conventional Commits for messages: `feat(scope): …`, `fix(scope): …`, `chore: …`.
  See `git log` for existing scopes (`fountains`, `landing`, `plan`, `pwa`, …).
- PR description: what changed, why, and how it was tested. Note whether write-back was
  verified against the sandbox.
- Rebase on the target branch before requesting review; keep history linear.

## Scope of contributions

Useful areas: new OSM tag presets, additional lifecycle mappings, routing-profile options,
geolocation/compass accuracy on the `/run` view, and offline/PWA behavior. Changes that write
to OSM must preserve the single-changeset-per-run guarantee and the lifecycle tag convention
documented above.
