# Decisions log

Newest first. Each entry: date · decision · why · who decided. Open questions at the bottom.

| # | Date | Decision | Why | By |
|---|---|---|---|---|
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
| Q-1 | Where is the previous frontend build (folder/repo) that holds the OAuth keys and the IdP authorize URL? Connect it to the session or share `VITE_*` names/values privately. | M01 |
| Q-2 | Stewards: the backend removed stewards (COMMUNITY_HUB_PLAN) but the design has a Stewards page + StewardGrid. Map to top contributors (`/community/snapshot/contributors`) or add a steward flag? | M05 |
| Q-3 | Templates (Create): keep the design's static template catalogue in the frontend, or serve from the backend (with Pro unlock)? | M07 |
| Q-4 | Plans/apps (Wallet "Apps and plans", Simulation Pro) — real billing or display-only for now? | M09 / M11 |
| Q-5 | The global rate limit (70 req/min/IP) will throttle local testing. OK to make it configurable via env (default unchanged)? | M01 |
