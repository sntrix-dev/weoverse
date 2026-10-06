# CLAUDE.md — WeOverse v2 redesign app

Guidance for Claude (Claude Code / Cowork) in this repo. Read it fully before changing anything. Docs index: `docs/README.md`.

## 1. What this is

React + Vite + TypeScript build of the **WeOverse v3** design, integrated with the **weo-3.0** backend, delivered **module by module** (`docs/03-module-plan.md`).

| Folder (siblings under `~/Documents/projects/weoverse/`) | Role | Rule |
|---|---|---|
| `redesign/project/WeOverse v3 - HTML/` | Design prototype — UI source of truth | **read-only**, never edit |
| `v2-redesign-app/` (this repo) | The app | repo `github.com/sntrix-dev/weoverse` (**public**), integration branch `develop` (never merge into `master`, D-069) |
| `weo-3.0/` | Backend (Express 5, Mongoose 8.16.1 pinned, Zod 3) | obey **its own `CLAUDE.md`**, especially §4 envelope, §5 wire-shape preservation, §13 git rules, §16 redesign workflow |

## 2. Non-negotiables

1. **Exact design parity.** Same structure, copy, tokens, motion, states, light/dark, breakpoints as the design page. How: `docs/02-design-port-guide.md`, skill `design-port`.
2. **Real data only.** No mock data from the design's `src/data/*.js` in app code; no session/local storage for server state. Missing API data = a gap logged in the module spec, never faked.
3. **Every module follows the 10-step workflow** in `docs/04-module-workflow.md` (skill `module-delivery`): spec → FE port → backend audit → backend branch → backend changes → Swagger → rules/schema check → code + browser tests → report & fix → commit, push, docs.
4. **Docs are part of the work.** A module isn't done until its spec, the plan status, the API map, decisions, changelog and test report are updated.
5. **Public repo.** Never commit `.env*` values, tokens, client secrets or real personal data. The GitHub token lives only in the local git remote config.
6. **Fully digital product.** No maps, venues, events, distances or "near you".

## 3. Stack & structure

Vite · React 19 · TypeScript strict · React Router · TanStack Query · Zustand · CSS Modules over design tokens · openapi-typescript · Vitest + RTL + MSW. Details and folder tree: `docs/01-architecture.md`.

```
src/app (router, providers, layout) · src/design-system (ported DS bundle) · src/components (shared composites)
src/features/<feature>/{pages,components,api,model,__tests__} · src/api (client, auth, queryKeys, generated)
src/stores · src/lib · src/styles · src/test
```

- A component used by one feature lives in the feature; used by two → `src/components/`.
- DS and shared components are pure (props in, no fetching). Pages/features fetch through hooks.
- Components receive **view models**, never raw DTOs; adapters live in `features/*/model/` (WeO cards: `lib/cardModel.ts`).
- Tokens only (`var(--…)`); dynamic values through CSS custom properties. Exception: `src/design-system/` keeps the DS bundle's typed inline styles (D-015) — don't restyle it, extend it.
- Conventions: `docs/08-conventions.md`.

## 4. Commands

| Command | Use |
|---|---|
| `npm run dev` | dev server on :5173 (OAuth redirect expects this port) |
| `npm run typecheck` / `lint` / `test` / `build` | all four must pass before any commit |
| `npm run api:types` | regenerate `src/api/generated/schema.d.ts` from `http://localhost:3002/api/docs.json` |

Backend (in `weo-3.0`): `npm run dev` (:3002, Swagger `/api/docs`), `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run docs:lint`, `npm run dev:token`.

## 5. Backend integration

- Base URL `http://localhost:3002/api`; user routes under `/frontend/*` with `Authorization: Bearer`.
- Envelope `{ success, message, data, error?, errors? }`; 422 = Zod field errors; some 401s are plain text; global rate limit 70 req/min/IP by default (`RATE_LIMIT_PER_MIN`).
- Verify endpoints **in backend code**, not in its older docs/Swagger (known drift: `docs/reference/backend-inventory.md` §14).
- Backend changes: branch `redesign/mNN-<slug>` cut from the previous redesign branch, additive only, Swagger updated, skills `backend-endpoint` + `backend-verify` in `weo-3.0/skills/`.
- Details: `docs/05-api-integration.md`, skill `api-integration`.

## 6. Testing

Code tests in both repos + a browser pass in the user's Chrome (Claude in Chrome) with the stack running on the Mac (Mongo, backend :3002, frontend :5173, design :8000). Parity at 1440×900 and 390×844, light and dark; interactions; network; console. Report per module in `docs/reports/`. Details: `docs/06-testing-strategy.md`, skill `browser-test`.

## 7. Git

- Frontend: `feat/mNN-<slug>` from `develop` → push → merge into `develop` → push → tag `mNN-done`. **Never merge or push into `master`** (Surya, D-069).
- Backend: `redesign/mNN-<slug>` → push the branch. Never merge into `phase1/v3`/`main` unasked.
- The user has authorised commit + push at the end of each module in both repos after all checks pass. Never `--no-verify`, never amend pushed commits, never force-push; stage by path in the backend.
- Git from the Linux VM needs delete permission on the repo folder (lock files). If an `index.lock` is left behind, remove only that file.
- Details: `docs/07-git-and-release.md`.

## 8. Skills (`skills/`)

Skills are tracked in `skills/<name>/SKILL.md` (Cowork can't write into `.claude/`). To let Claude Code auto-discover them, link once on the Mac: `mkdir -p .claude && ln -s ../skills .claude/skills`. Otherwise read the SKILL.md directly when a step names it.

| Skill | When |
|---|---|
| `module-delivery` | starting/resuming/finishing any module |
| `design-port` | porting any design component/page |
| `api-integration` | wiring a screen to the backend |
| `browser-test` | browser parity/interaction testing + report |

## 9. Where things are

| Need | Doc |
|---|---|
| Current module & status | `docs/03-module-plan.md` |
| Module scope / API map / gaps | `docs/modules/MNN-*.md` |
| Design page contents | `docs/reference/design-inventory.md` |
| Backend endpoints/models/auth | `docs/reference/backend-inventory.md` |
| Decisions & open questions | `docs/decisions.md` |
| Backend redesign log & gaps | `weo-3.0/docs/redesign/` |
