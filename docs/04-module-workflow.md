# 04 — Per-module workflow

Every module follows these ten steps in order. Skill: `skills/module-delivery/SKILL.md`. Do not skip a step; if one is blocked, record why in the module spec and stop.

```
 1 Spec ─► 2 Frontend port ─► 3 Backend audit ─► 4 Branch ─► 5 Backend changes
   ─► 6 Swagger ─► 7 Rules & schema check ─► 8 Test (code + browser) ─► 9 Report & fix ─► 10 Commit, push, docs
```

## 1 · Spec (docs first)

- Open `modules/MNN-<slug>.md`. Fill/refresh: screens in scope, component list (DS / shared / feature), data each block needs, **API map** (block → endpoint → fields), gaps, acceptance criteria.
- Read the design files for every screen in scope (see `02-design-port-guide.md` §1). Note interactions and states.
- Set the module status to ⏳ in `03-module-plan.md`.

## 2 · Frontend port

- Frontend branch: `feat/mNN-<slug>` from up-to-date `master`.
- Port in order: DS primitives → shared components → feature components → page (`02-design-port-guide.md` §4).
- Build data hooks against **MSW fixtures shaped like the backend DTO** first (copy real responses when the endpoint exists).
- Keep components dumb; adapters in `features/<f>/model/`.
- Write component tests as you go (render, key interactions, states).

## 3 · Backend audit

For every row of the API map:
- Confirm the endpoint exists **in code** (`src/routes/frontend/index.ts` → module route), not only in Swagger or older docs.
- Call it (curl with the dev token) and save a sample response into the module spec (trimmed) and `src/test/fixtures/`.
- Compare fields to what the UI needs. Classify each difference: **OK**, **FE adapter** (derive in frontend), **BE additive** (new field/endpoint), **BE breaking** (needs explicit approval per the backend's wire-shape rule — ask the user).

## 4 · Backend branch

- In `weo-3.0`: `git switch -c redesign/mNN-<slug>` **from the current branch** (the previous module's branch) — backend `CLAUDE.md` §13 forbids branching from `main` unasked.
- Never stage files that aren't yours; `git add <paths>` only.

## 5 · Backend changes

Follow `weo-3.0/CLAUDE.md` and skill `weo-3.0/skills/backend-endpoint`:
- module layout (`model/service/controller/route/validate`), Zod in `<module>.validate.ts` via `zodValidate|zodQueryValidate|zodParamValidate`
- `ResponseHandler.success/error` only; envelope untouched
- additive changes only unless approved; `req.user.id`; Winston logger, no `console.log`
- unit tests beside the code in `__tests__/`
- record every change in `weo-3.0/docs/redesign/modules/MNN-<slug>.md`

## 6 · Swagger

- Add/update `docs/swagger/modules/<module>.<surface>.yaml` and component schemas. Every operation: unique camelCase `operationId`, `tags`, `summary`, `description`, `security`, parameters with `example`, 200 + 401/403/404/422/500, payload example **with optional fields**.
- `npm run docs:lint` must pass. Open `http://localhost:3002/api/docs` and check the new operations render.
- Regenerate frontend types: `npm run api:types` in this repo; fix any `tsc` errors it surfaces.

## 7 · Rules & schema check

Run the backend checklist (skill `backend-verify`):
- `npx tsc --noEmit`, `npm run lint`, `npm test` — all green.
- Mongoose schema changes: correct types/refs/indexes (no duplicate `index:true` + `Schema.index`), `pre('save')` async form, soft-delete respected, no child-schema violations of the WeO discriminator rules.
- **Wire-shape diff:** for each touched existing endpoint, diff the JSON response before/after — only additive differences allowed.
- Frontend: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## 8 · Test — by code and in the browser

See `06-testing-strategy.md`. Summary:
- Code: backend jest (new + existing), frontend vitest (components, hooks with MSW, adapters).
- Browser (Claude in Chrome, user's Mac): stack running (Mongo, backend `:3002`, frontend `:5173`, design `:8000`). For every screen in scope: visual parity with the design page (desktop 1440×900 and mobile 390×844, light + dark), every interaction in the spec, network calls hit the right endpoints with 2xx, no console errors, loading/empty/error states.

## 9 · Report & fix

- Write `reports/MNN-<slug>.md` from `reports/_TEMPLATE.md`: environment, what was tested, results table, bugs (id, severity, steps, fix, commit), parity screenshots notes, open issues.
- Fix every bug of severity High/Medium; re-run the failing checks; update the report. Low severity may be deferred only if listed under "Open issues" with a target module.

## 10 · Commit, push, docs

- Update docs: module spec (status ✅, final API map), `03-module-plan.md` status, `05-api-integration.md` endpoint table, `decisions.md` for any decision, `CHANGELOG.md`.
- Backend: commit on `redesign/mNN-<slug>` (specific files, message `feat(redesign-mNN): …`), push the branch. Never `--no-verify`, never amend, never force-push.
- Frontend: commit on `feat/mNN-<slug>`, push, then fast-forward merge into `master` and push `master`.
- Save the module summary to the claude.ai project (`qa/` or `modules/` doc) so it is readable anywhere.

The user has authorised commit + push at the end of each module in both repos once tests pass. Anything outside this workflow (e.g. force-push, merging into the backend's `main`/`phase1/v3`) still needs an explicit ask.

## Definition of done (copy into each module spec)

- [ ] Spec complete; API map final
- [ ] Every screen in scope matches the design (desktop + mobile, light + dark)
- [ ] All interactions in scope work against the live backend
- [ ] Loading / empty / error states present
- [ ] Backend changes follow `weo-3.0/CLAUDE.md`; additive only (or approved)
- [ ] Swagger updated; `docs:lint` green; FE types regenerated
- [ ] Backend: tsc, lint, jest green · Frontend: typecheck, lint, vitest, build green
- [ ] Browser pass: no console errors, no failed requests
- [ ] Test report written; High/Medium bugs fixed
- [ ] Docs updated; commits pushed in both repos
