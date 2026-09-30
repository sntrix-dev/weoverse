# Decisions log

Newest first. Each entry: date · decision · why · who decided. Open questions at the bottom.

| # | Date | Decision | Why | By |
|---|---|---|---|---|
| D-018 | 2026-10-01 | Tooling pins: TypeScript 5.9.3 (openapi-typescript 7 peers on TS 5), ESLint 9.39 (eslint-plugin-jsx-a11y has no ESLint 10 support yet), React 19.3, React Router 8.4, Vite 8.3, Vitest 5, MSW 3. Exact versions, no `^`. | Latest that satisfy every peer range. | Claude |
| D-017 | 2026-10-01 | The design has **no sign-in screen**. `/login` and `/callback` are composed from DS primitives in the design's language (glass Card, drawn WeOverse lettering, violet Button, route wash). | Real OAuth needs a start and a return page. | Claude |
| D-016 | 2026-10-01 | Design-system lint exceptions: jsx-a11y interaction rules and three react-hooks rules are warnings (not errors) inside `src/design-system/` only, because they flag the design's own behaviour (clickable divs, render-time ref reads). Worked off in M12. | Keep the port faithful now, fix a11y deliberately later. | Claude |
| D-015 | 2026-10-01 | The design-system layer (`src/design-system/`) keeps the DS bundle's inline style objects (typed), converted mechanically with `scripts/ds2tsx.mjs`; CSS Modules are used from `src/components/` upward. The QR renderer (api.qrserver.com) is replaced by the local `qrcode` package; DiceBear fallback avatars stay live as in the design. | The DS computes nearly every style from props; rewriting it into CSS risks parity for no gain. The passport id must not leave the app. | Claude |
| D-014 | 2026-10-01 | No cloud credentials in the frontend (the previous build had `VITE_AWS_*` keys); media uploads go through a backend endpoint. | `VITE_*` values are bundled into public JS. | Claude |
| D-013 | 2026-10-01 | Frontend env names follow the previous build (`VITE_API_URL`, `VITE_WALLET_URL`, `VITE_OAUTH_CLIENT_ID`, `VITE_OAUTH_REDIRECT_URI`, `VITE_OAUTH_SCOPE`); authorize path configurable (`VITE_OAUTH_AUTHORIZE_PATH`, default `/oauth/authorize`, verify in browser). Client id taken from backend `O_CLIENT_ID`. | Reuse known config; the IdP isn't reachable from the Linux workspace to confirm the path. | Surya / Claude |
| D-012 | 2026-09-30 | Browser testing runs on the user's Mac through Claude in Chrome; the stack (Mongo, backend, frontend, design server) runs on the Mac. | Mongo lives on the Mac; the Linux workspace can't reach Mac `localhost`, and MongoDB downloads are blocked there. | Surya |
| D-011 | 2026-09-30 | Real OAuth PKCE login against `AUTH_SERVER`, using the auth keys from the previous frontend build; plus a dev-only minted token for tests. | Only login path the backend has; tests must not depend on the IdP. | Surya |
| D-010 | 2026-09-30 | Backend uncommitted edits on `phase1/v3` (listing projection fields, uiPreferences defaults) were discarded before branching. Kept recoverable as `git stash` "backup: phase1/v3 uncommitted edits discarded for redesign (2026-09-30)". | User asked to delete them and switch branch. | Surya |
| D-009 | 2026-09-30 | Backend work on a chain of branches `redesign/mNN-<slug>`, first cut from `phase1/v3`. | Backend CLAUDE.md §13: branch off the current local branch. | Surya / CLAUDE.md |
| D-008 | 2026-09-30 | Frontend remote `github.com/sntrix-dev/weoverse` (public), default branch `master`. | Provided by user. Public → no secrets in the repo. | Surya |
| D-007 | 2026-09-30 | Commit + push at the end of every module, in both repos, after tests pass. | User's workflow. | Surya |
| D-006 | 2026-09-30 | Fully digital product: no maps, venues, events, distances, "near you". Free-text "where" on requests stays (design has it). | Product rule. | Surya |
| D-005 | 2026-09-30 | O↔USD conversion comes from the backend (OConfig) through one helper `lib/os.ts`; the design's ×99 vs 100 conflict is not hard-coded. | Design data disagrees with itself. | Claude (confirm in M03) |
| D-004 | 2026-09-30 | Styling: design tokens verbatim as CSS variables + CSS Modules; dynamic values via CSS custom properties. | Exact parity with readable components. | Claude |
| D-003 | 2026-09-30 | Server state in TanStack Query, UI state in Zustand, UI prefs synced to `users/me/preferences`. Replace prototype session/local storage. | The prototype's `app` object is 80 fields of mock state. | Claude |
| D-002 | 2026-09-30 | React + Vite + TypeScript (strict), React Router, openapi-typescript types from backend Swagger. | Matches backend TS; typed contract. | Claude |
| D-001 | 2026-09-30 | Design `WeOverse v3 - HTML` is the UI source of truth; backend code (not its older docs) is the data source of truth. | Brief. | Surya |

## Open questions

| # | Question | Needed by |
|---|---|---|
| ~~Q-1~~ | Resolved 2026-10-01: previous build env shared (IdP `https://wallet.ocono.me`, scope `profile`, redirect `:5173/callback`); authorize path to confirm in browser. | M01 |
| Q-2 | Stewards: the backend removed stewards (COMMUNITY_HUB_PLAN) but the design has a Stewards page + StewardGrid. Map to top contributors (`/community/snapshot/contributors`) or add a steward flag? | M05 |
| Q-3 | Templates (Create): keep the design's static template catalogue in the frontend, or serve from the backend (with Pro unlock)? | M07 |
| Q-4 | Plans/apps (Wallet "Apps and plans", Simulation Pro) — real billing or display-only for now? | M09 / M11 |
| Q-5 | The global rate limit (70 req/min/IP) will throttle local testing. OK to make it configurable via env (default unchanged)? | M01 |
