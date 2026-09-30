# 00 — Overview

WeOverse v2 redesign app: a production React + Vite + TypeScript build of the **WeOverse v3** design, wired to the **weo-3.0** backend. Built module by module; every module ends tested, documented, committed and pushed in both repos.

## The three folders

| Role | Folder (on the Mac, under `~/Documents/projects/weoverse/`) | What it is | Git |
|---|---|---|---|
| **Design (read-only)** | `redesign/project/WeOverse v3 - HTML/` | Static React/JSX prototype. **Source of truth for UI.** Pages in `src/pages/*.jsx`, shared UI in `src/components/*.jsx`, tokens in `css/ds/tokens/`, global CSS in `css/app.css`, design-system components compiled in `js/ds/_ds_bundle.js`. | none — never edit |
| **Frontend (this repo)** | `v2-redesign-app/` | The app we are building. | `github.com/sntrix-dev/weoverse` (public), default branch `master` |
| **Backend** | `weo-3.0/` | Express 5 + Mongoose 8.16.1 + Zod 3 API. Has its own `CLAUDE.md` — obey it. | `github.com/ksanjiv05/weo-3.0`, redesign work branches `redesign/mNN-*` |

## Sources of truth, in order

1. **UI / layout / copy / motion** → the design folder. Match it exactly (see `02-design-port-guide.md`).
2. **Data shapes / behaviour** → the backend *code* (not its older docs — see `reference/backend-inventory.md` §14 for known drift) and its Swagger at `http://localhost:3002/api/docs`.
3. **Product rules** → `decisions.md` in this folder.
4. **Process** → `04-module-workflow.md`.

## Product rules that override the design

- **Fully digital.** No maps, venues, distances, events or "near you". A free-text "where" on a request (e.g. "Remote", "Lisbon") is allowed because the design has it; nothing geo-computed.
- The prototype's fakes are replaced by real data: the 2.6 s "community reactions" timer, sessionStorage/localStorage state for joins/votes/plans/settings, `window.claude.complete`, and `boot.js` resource fallbacks are **not** ported.
- The design's `TweaksPanel` (design-tool harness) is **not** ported.

## How to find things fast

| Need | Go to |
|---|---|
| What a design page contains / which data it reads | `reference/design-inventory.md` §C |
| Which backend endpoint exists | `reference/backend-inventory.md` §5 |
| What a module covers, its API map and gaps | `modules/MNN-*.md` |
| How to port one component | `02-design-port-guide.md` + skill `skills/design-port` |
| How to run a module end to end | `04-module-workflow.md` + skill `skills/module-delivery` |
| How to test in the browser | `06-testing-strategy.md` + skill `skills/browser-test` |
| Test results per module | `reports/` |
| Why something was decided | `decisions.md` |
