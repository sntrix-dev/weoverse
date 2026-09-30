# 01 — Architecture

## Stack

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite** (latest stable, pinned exact in M01) | Fast dev server on `:5173` — the port the backend's OAuth redirect (`O_REDIRECT_URI=http://localhost:5173/callback`) already expects. |
| UI | **React 19** + **TypeScript** (strict) | Backend is TS; typed API contracts. The prototype's React 18 components are plain function components and port unchanged. |
| Routing | **React Router** (library mode, `createBrowserRouter`) | Real URLs replace the prototype's one-HTML-file-per-page + `?id=`. |
| Server state | **TanStack Query v5** | Caching, retries, optimistic updates for join/vote/like/follow. |
| Client state | **Zustand** (small slices) | Replaces the prototype's 80-field `app` god object. |
| Styling | Design tokens as global CSS variables + **CSS Modules** per component | Exact visual parity with the design's token set, readable components. See §Styling. |
| API types | **openapi-typescript** generated from the backend's `/api/docs.json` | One source of truth for wire shapes; schema drift fails `tsc`. |
| 3D | **three** pinned to `0.184.0` (the design's version), lazy-loaded | Only the World Studio (M11) needs it. |
| Tests | **Vitest** + **React Testing Library** + **MSW** | Unit/component/integration without a server. Browser pass via Claude in Chrome (see `06-testing-strategy.md`). |
| Lint/format | ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier | |

Exact versions are recorded in `package.json` (no `^` on runtime deps) and in `decisions.md` when chosen.

## Folder structure

```
v2-redesign-app/
├─ CLAUDE.md                 rules for Claude Code in this repo
├─ docs/                     all development docs (start at docs/README.md)
├─ skills/                 project skills (module-delivery, design-port, api-integration, browser-test)
├─ public/                   static files served as-is (videos, Mya clips, logo webm)
├─ scripts/                  repo scripts (api:types, asset sync, parity screenshots)
└─ src/
   ├─ main.tsx               entry: providers + router
   ├─ app/
   │  ├─ router.tsx          every route, lazy per feature
   │  ├─ routes.ts           typed route builders: routes.weo(id) → "/weos/:id"
   │  ├─ providers.tsx       QueryClient, auth, theme, toasts
   │  └─ AppLayout.tsx       shell + <Outlet/> + global overlays
   ├─ design-system/         ported DS bundle — pure, no data fetching
   │  ├─ tokens/             colors.css, typography.css, spacing.css, effects.css, governance.css, world.css (verbatim from design)
   │  ├─ primitives/         Button, OButton, OMark, Orb, Avatar, Chip, Badge, Tabs, Toggle, Input, Card, Progress, Tooltip, Spinner, EmptyState, Alert …
   │  ├─ data/               ISRRing, StatGrid, OPower, ValueLadder
   │  ├─ surfaces/           WeOCard, PassportIcon
   │  ├─ exchange/           CommitReview, FeeDisclosure, FlowReceipt
   │  ├─ navigation/         RingNav, OPortal, PortalJump
   │  ├─ marks/              WeOverseLettering, WeODrawnO, DrawnMark, icons (ICO/SICO set)
   │  └─ index.ts            public barrel
   ├─ components/            shared composites used by ≥2 features (from design src/components)
   │  ├─ shell/              TopBar, SplitShell, SectionSwitch, QuickJump, WalletMenu, IdSheet, MyaDock, Footer, PathBar, FlowBar
   │  ├─ hero/               SectionHero, HeroStat, DirChip, ViewBar
   │  ├─ layout/             Scene, Rows, SectionHead, SectionMark, Fold, Rail, RailHead, IconSegs
   │  ├─ weo/                WeoTile, StallTile, WeoView (cards/rail/carousel/orbit/list), WeoActions, WeoPriceAtRest
   │  ├─ circle/             CircleRecord, CircleOi, CircleChip
   │  ├─ people/             PersonOi, Spark, StandChip, CreatorSheet, PublicProfileSheet
   │  ├─ snapshot/           SnapshotChart, SnapshotPanel, Podium
   │  ├─ wallet/             OWalletPanel, MoveOsSheet
   │  ├─ flows/              CardFlow, CollectSheet, RelistSheet, OfferSheet, PostSheet, SuccessMoment
   │  └─ feedback/           Toasts, AckRipple, ExternalGate, Sheet
   ├─ features/              one folder per module area (pages + feature-only parts)
   │  └─ <feature>/
   │     ├─ pages/           <Name>Page.tsx (+ .module.css)
   │     ├─ components/      used only by this feature
   │     ├─ api/             queries.ts, mutations.ts (TanStack hooks)
   │     ├─ model/           adapters: backend DTO → view model
   │     └─ __tests__/
   ├─ api/
   │  ├─ client.ts           fetch wrapper: base URL, bearer, envelope unwrap, refresh-on-401, ApiError
   │  ├─ auth.ts             PKCE login, token storage, refresh, logout
   │  ├─ queryKeys.ts        one factory for every query key
   │  └─ generated/schema.d.ts   openapi-typescript output — never hand-edit
   ├─ stores/                zustand: ui.ts (sheets, toasts, dock), prefs.ts (mirrors uiPreferences), mya.ts
   ├─ lib/                   pure helpers: os.ts (O formatting/peg), time.ts, cardModel.ts, format.ts
   ├─ styles/                global.css (reset, atmo, html[data-*] rules, keyframes from design app.css)
   ├─ assets/                images imported by code
   └─ test/                  setup.ts, msw/handlers.ts, fixtures/
```

**Placement rule:** a component used by one feature lives in that feature; the moment a second feature needs it, move it to `components/` (design's rule: "anything used by two or more pages lives in src/components").

## Routing

| Design route (`js/pages.js`) | Design file | App path | Page component |
|---|---|---|---|
| create | create.html | `/create` | `features/create/pages/CreatePage` |
| discover | discover.html | `/discover` | `features/discover/pages/DiscoverPage` |
| collected | collect.html | `/collect` | `features/collect/pages/CollectPage` |
| listed | exchange.html | `/exchange` | `features/exchange/pages/ExchangePage` |
| hub | community.html | `/community` | `features/community/pages/CommunityPage` |
| manage | circles.html | `/community/circles` | `features/community/pages/ManageCirclesPage` |
| circle `?id=` | circle.html | `/community/circles/:circleId` | `features/community/pages/CirclePage` |
| thread `?id=` | thread.html | `/community/threads/:threadId` | `features/community/pages/ThreadPage` |
| stewards | stewards.html | `/community/stewards` | `features/community/pages/StewardsPage` |
| stories | stories.html | `/community/stories` | `features/community/pages/StoriesPage` |
| weo `?id=` | weo.html | `/weos/:weoId` | `features/weo/pages/WeoPage` |
| creators `?id=` | creators.html | `/creators` and `/creators/:creatorId` | `features/creators/pages/CreatorsPage` |
| requests `?id=` | requests.html | `/requests` and `/requests/:requestId` | `features/requests/pages/RequestsPage` |
| passport | passport.html | `/passport` (`#isr` anchors) | `features/passport/pages/PassportPage` |
| wallet | wallet.html | `/wallet` | `features/wallet/pages/WalletPage` |
| notifications | notifications.html | `/notifications` | `features/notifications/pages/NotificationsPage` |
| tracking | tracking.html | `/tracking` | `features/tracking/pages/TrackingPage` |
| company `?id=` | company.html | `/company/:doc?` | `features/company/pages/CompanyPage` |
| settings `?id=` | settings.html | `/settings` (`#section`) | `features/settings/pages/SettingsPage` |
| — | — | `/login`, `/callback` | `features/auth/pages/*` |
| index → create | index.html | `/` → redirect `/create` | |

`app.go(name, id)` in the prototype becomes `navigate(routes.x(id))`. The prototype's cross-page "carry" (toasts raised before navigation) is unnecessary in an SPA — toasts live in the store and survive route changes.

## State: splitting the prototype's `app` object

| Prototype `app` field(s) | New home |
|---|---|
| route, go, goQuiet, jump, goHome, openWeo, openIsr | React Router + `app/routes.ts` + `useJump()` hook |
| joined, notif, followed, votes, scores, accepted, resolved, replies, extraAnswers, tracked, pubProfile | **Server state** (TanStack Query), optimistic mutations. Never local/session storage. |
| theme, currency, navMode, railOpen, myaHidden, home, dockPosition, view prefs (density/media/motion/value, muted formats/kinds), weoView, snapshotBoard | `stores/prefs.ts`, hydrated from `GET /users/me/preferences` (or nav-summary), written with `PATCH /users/me/preferences` (debounced). localStorage only as a first-paint cache. |
| compose, push, report, idSheet, world, flow{kind}, creator sheet, dock{open,tab} | `stores/ui.ts` (which sheet/modal is open + its payload) |
| toasts, ack | `stores/ui.ts` toast queue + `AckRipple` |
| mya{open, thinking, feed, draft} | `stores/mya.ts`; answers from backend chatbot when wired, FAQ matcher fallback |
| V3 lifecycle store (`window.V3`) | M11 — server-backed; until then In-flight = drafts |

## Data flow

```
Page → feature hook (useDiscoverFeed) → api/client (fetch + bearer)
     → backend envelope {success,message,data} → client unwraps data
     → feature model/adapter (DTO → view model, e.g. cardModel) → component props
```

- Components never see raw DTOs. Adapters in `features/*/model/` (or `lib/cardModel.ts` for WeOs) convert. This mirrors the design's own contract in `src/data/weo-model.js`: *"No screen may read a raw WeO field."*
- Every list uses the backend pagination convention `{ items|rows, pagination: {total,page,limit,totalPages} }`.

## Auth

- Real login: OAuth2 authorization code + PKCE against `AUTH_SERVER` (the IdP). Frontend builds the authorize URL (client id, redirect `http://localhost:5173/callback`, `code_challenge`), the IdP redirects back to `/callback`, the app posts `{code, codeVerifier, redirectUri}` to `POST /api/frontend/auth/verify` and receives first-party `accessToken` (15 min) + `refreshToken` (30 days).
- Refresh: on a 401 the client calls `POST /api/frontend/auth/new_access_token` once, retries the request, and logs out if that fails. Logout: `POST /api/frontend/auth/logout`.
- Storage: access token in memory; refresh token in `localStorage` (the backend is bearer-only, no cookies).
- Dev/testing: a backend script mints an access token for the seeded Mya user (`VITE_DEV_ACCESS_TOKEN` in `.env.local`) so tests never depend on the IdP. The dev token path is compiled out of production builds.
- Frontend env (all in `.env.local`, never committed — the repo is public): `VITE_API_BASE_URL`, `VITE_AUTH_SERVER`, `VITE_O_CLIENT_ID`, `VITE_OAUTH_REDIRECT_URI`, `VITE_DEV_ACCESS_TOKEN`. `.env.example` lists names only. Values come from the previous frontend build (auth keys) and the backend `.env`.

## Styling

1. `design-system/tokens/*.css` are copied **verbatim** from `css/ds/tokens/`. Never edit a token value in a component; add a token if needed and note it in `decisions.md`.
2. `styles/global.css` ports `css/app.css`: reset, `#atmo`/`#dots` layers, `html[data-theme|data-nav|data-motion|data-weo-*]` rules, keyframes, breakpoints.
3. Component styles: CSS Module next to the component. The design uses inline `style={{…}}` objects; static declarations move to the module, **dynamic values** (tone colour, progress %, positions) are passed as CSS custom properties: `style={{'--tone': tone}}` and used as `var(--tone)` in the module.
4. Fonts: the design loads none — system `Helvetica Neue` stack via `--font-sans`. Keep it.
5. Themes: `data-theme="dark"` on `<html>`; light is default.

## Performance

- Route-level code splitting (`lazy()` per feature page).
- three.js + World Studio loaded only when a world opens.
- Videos (`public/media`, `public/mya`) are `preload="none"` except the visible one; unused design clips (mya/clip-a…h, IntroWeO, WebsiteIntroWeO, gifs) are not copied.
