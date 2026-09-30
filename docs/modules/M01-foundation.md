# M01 — Foundation

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ⏳ next | `feat/m01-foundation` | `redesign/m01-foundation` | `reports/M01-foundation.md` |

## Scope

Everything later modules stand on. No product screen yet except `/login`, `/callback` and a dev-only `/dev/ds` gallery that renders every DS component (used for visual parity checks).

1. **Scaffold** — Vite + React + TS (strict), path alias `@/`, ESLint + Prettier, Vitest + RTL + MSW, `npm run typecheck|lint|test|build|api:types`.
2. **Tokens & global CSS** — copy `css/ds/tokens/*.css` verbatim → `src/design-system/tokens/`; port `css/app.css` → `src/styles/global.css` (reset, `#atmo`/`#dots`, `html[data-*]` rules, keyframes, breakpoints).
3. **Static assets** — `public/media/` (CreationWeO, CollectionsWeO, DiscoverWeO, ListingsWeO .mp4, WEO_Logo.webm, plaza-mural.png), `public/mya/` (mya-face/orb/desk/answer/chip.png, clip-intro.mp4), logos, orb-market/coffee.png, o-flow-mark.svg. Skip unused clips/gifs.
4. **Design-system port** (from `js/ds/_ds_bundle.js`, `// components/<group>/<Name>.jsx` sections), used-by-src set only:
   - core: `Button`, `OButton`, `OMark`, `Orb`, `OPortal` (+`O_SECTION_ICONS`)
   - data: `Avatar`, `AvatarGroup`, `Badge`, `Chip`, `ISRRing`, `StatGrid`
   - exchange: `CommitReview`, `FeeDisclosure`, `FlowReceipt`, `OPower`, `ValueLadder`
   - feedback: `Alert`, `EmptyState`, `Progress`, `Spinner`, `Tooltip` (+ `Skeleton` for loading states)
   - forms: `Input`, `Toggle`
   - motion/nav: `PortalJump`, `RingNav`, `Tabs`
   - surfaces: `Card`, `WeOCard`, `PassportIcon`
   - `marks.jsx`: `WeOverseLettering`, `WeOLettering`, `WeODrawnO`, `DrawnMark`; icon sets `ICO` (chrome.jsx), `SICO` (shell.jsx)
   - `WeOCard` QR: replace `api.qrserver.com` with a local QR renderer (e.g. `qrcode` package) — no third-party calls.
5. **API layer** — `api/client.ts` (base URL, bearer, envelope unwrap, `ApiError`, plain-text 401 handling, single-flight refresh on 401, 429 backoff), `queryKeys.ts`, `api:types` script, QueryClient defaults (staleTime 30 s, retry skips 4xx).
6. **Auth** — PKCE (`code_verifier`/`challenge` S256, `state`), `/login` (design-styled screen using DS components), `/callback` → `POST /frontend/auth/verify`, token store, refresh, logout, `RequireAuth` route guard; dev token path (`VITE_DEV_ACCESS_TOKEN`) only when `import.meta.env.DEV`.
7. **Router skeleton** — all routes from `01-architecture.md` registered, each rendering a placeholder with the design's page title, so later modules only fill pages in.
8. **lib/** — `os.ts` (format Os, peg from backend), `time.ts` (relative time like design `relTime`), `cardModel.ts` stub with types.

## Backend work (`redesign/m01-foundation`)

| Change | Type | Notes |
|---|---|---|
| `scripts/dev-token.ts` + `npm run dev:token -- <userId?>` — mints an access token for the seeded Mya user (default) using `signAccessToken` | new script, dev only | refuses to run when `NODE_ENV=production` |
| `.env.example` — add missing names (`MONGO_URI`, `SESSION_SECRET`, `O_CLIENT_ID`, `O_CLIENT_SECRET`, `O_REDIRECT_URI`, Firebase, media vars) | docs | names only |
| Optional (Q-5): `RATE_LIMIT_PER_MINUTE` env for the global limiter, default 70 | additive | ask first |
| `CORS_ALLOWED_ORIGINS` must include `http://localhost:5173` | config | local `.env` currently `*` |

## API map

| Block | Endpoint |
|---|---|
| callback | `POST /frontend/auth/verify` `{code, codeVerifier, redirectUri}` → `{accessToken, refreshToken, user}` |
| refresh | `POST /frontend/auth/new_access_token` `{refresh_token}` |
| logout | `POST /frontend/auth/logout` `{refresh_token}` |
| smoke | `GET /frontend/users/me/nav-summary` (proves the token works) |

## Open questions

- Q-1 (previous build's auth keys + IdP authorize URL path). Blocks step 6 only; the dev token unblocks everything else.

## Acceptance criteria

- `/dev/ds` renders every ported DS component; each matches the design bundle's own rendering at 1440 and 390, light and dark.
- Login round-trip works against the IdP (or is blocked only by Q-1, noted in the report); dev token works; 401 → refresh → retry works (MSW test).
- `npm run typecheck|lint|test|build` green; `api:types` generates from a running backend.

## Definition of done

See `04-module-workflow.md`.
