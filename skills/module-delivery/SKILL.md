---
name: module-delivery
description: Run one WeOverse redesign module end to end (spec → frontend port → backend audit/branch/changes → swagger → checks → code + browser tests → report → fixes → commit/push → docs). Use when starting, resuming or finishing any module MNN.
---

# Module delivery

The master procedure for a module. Source of truth: `docs/04-module-workflow.md`. Other skills do the detailed steps: `design-port`, `api-integration`, `browser-test` (this repo) and `backend-endpoint`, `backend-verify` (in `weo-3.0/skills/`).

## 0. Orient (every session)

1. Read `CLAUDE.md`, `docs/03-module-plan.md` (which module is ⏳), and the module spec `docs/modules/MNN-*.md`.
2. `git status` + current branch in **both** repos (`v2-redesign-app`, `weo-3.0`). Never touch files you didn't create; in the backend stage by path only.
3. Check `docs/decisions.md` open questions that block this module. If one blocks, ask the user before building that part.
4. Create a task list mirroring the 10 steps below.

## 1. Spec
Fill the module spec: screens, blocks (design order), components (DS / shared / feature), API map, gaps, acceptance criteria. Mark ⏳ in the plan.

## 2. Frontend port
`git switch develop && git pull --ff-only && git switch -c feat/mNN-<slug>` (never from or into `master`, D-069). Use the `design-port` skill per component/page. Data via MSW fixtures first (`api-integration` skill).

## 3. Backend audit
For each API-map row: confirm in code (`weo-3.0/src/routes/frontend/index.ts` → module route), curl it with the dev token, save a trimmed sample into the spec and `src/test/fixtures/`, classify: OK / FE adapter / BE additive / BE breaking (breaking → ask user).

## 4. Backend branch
In `weo-3.0`: `git switch -c redesign/mNN-<slug>` from the current (previous module's) branch. Never from `main`.

## 5–6. Backend changes + Swagger
`backend-endpoint` skill for each change. Log every change in `weo-3.0/docs/redesign/modules/MNN-<slug>.md`. Then `npm run api:types` here.

## 7. Rules & schema check
`backend-verify` skill (tsc, lint, jest, docs:lint, schema rules, wire-shape diff). Frontend: `npm run typecheck && npm run lint && npm test && npm run build`.

## 8. Test
Code tests green in both repos; then `browser-test` skill for every screen in scope.

## 9. Report & fix
Write `docs/reports/MNN-<slug>.md` from `_TEMPLATE.md`. Fix all High/Medium bugs, re-test, update the report.

## 10. Commit, push, docs
- Docs: spec status ✅ + final API map; `03-module-plan.md`; `05-api-integration.md` endpoint table; `decisions.md`; `CHANGELOG.md`; backend `docs/redesign/*`.
- Backend: `git add <paths>`; `git commit -m "feat(redesign-mNN): <summary>"`; `git push -u origin redesign/mNN-<slug>`.
- Frontend: commit, `git push -u origin feat/mNN-<slug>`, then `git switch develop && git merge --ff-only feat/mNN-<slug> && git push && git tag mNN-done && git push --tags`. Never merge or push into `master` (D-069).
- Save a short module summary to the claude.ai project (Projects tool, `modules/MNN-<slug>.md`).
- Tell the user: what shipped, test result, open issues, next module.

## Guardrails
- The user authorised commit + push at the end of each module. Never `--no-verify`, amend, or force-push. Never merge into the backend's `phase1/v3`/`main` without asking.
- Frontend repo is public: no secrets, no real personal data in fixtures.
- Git in the Linux VM needs delete permission on the repo folder for lock files; if a git command fails on `index.lock`, request it and remove only the stale lock.
