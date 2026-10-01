# 06 — Testing strategy

Two halves, both required per module: **by code** and **in the browser**. Results go to `reports/MNN-<slug>.md` (template `reports/_TEMPLATE.md`). Skill: `skills/browser-test/SKILL.md`.

## 1. By code

### Frontend (`v2-redesign-app`)

| Command | What |
|---|---|
| `npm run typecheck` | `tsc --noEmit` against generated API types |
| `npm run lint` | ESLint (react-hooks, jsx-a11y, typescript-eslint) |
| `npm test` | Vitest + RTL + MSW (jsdom) |
| `npm run build` | production build must succeed with no warnings about missing assets |

What to cover per module:
- **Adapters** (pure): DTO fixture → view model, every branch (each WeO kind/format, nulls).
- **Components**: renders design copy, states (loading/empty/error), key interactions (tabs, sheets, forms, optimistic toggles).
- **Hooks**: query/mutation hooks against MSW handlers, including 401 → refresh → retry, 422 field errors, 429.
- Fixtures in `src/test/fixtures/` are copied from **real** backend responses captured in step 3 of the workflow.

### Backend (`weo-3.0`)

| Command | What |
|---|---|
| `npx tsc --noEmit` | types |
| `npm run lint` | ESLint |
| `npm test` | Jest (existing suite is mock-based unit tests in `__tests__/`) |
| `npm run docs:lint` | builds + lints the OpenAPI spec |

New code gets unit tests in the module's `__tests__/` (service logic, projections, validators). Route-level tests use supertest with the service mocked. Every touched existing endpoint gets a **wire-shape diff** (response JSON before vs after; only additions allowed).

## 2. In the browser (Claude in Chrome on the Mac)

The user's Chrome has the Claude extension; MongoDB runs on the Mac. The Linux workspace cannot reach the Mac's `localhost`, so **the stack runs on the Mac**:

```bash
# Terminal 1 — MongoDB (if not already a service)
brew services start mongodb-community     # or: mongod --config /opt/homebrew/etc/mongod.conf
# Terminal 2 — backend
cd ~/Documents/projects/weoverse/weo-3.0 && npm run dev                  # :3002, Swagger /api/docs
# Terminal 3 — frontend
cd ~/Documents/projects/weoverse/v2-redesign-app && npm run dev          # :5173
```

The design reference needs no extra server: the frontend dev server serves it at **`http://localhost:5173/design/`** (`index.html` → `create.html`, `discover.html`, …; D-019).

At each module's test step Claude asks the user to start these (or, with permission, uses computer use to open Terminal and run them).

Seed data: `npm run seed` (config, categories), `npm run seed:mya`, `npm run seed:mya:circle`, `npm run seed:community`; module specs list any extra fixtures to create through the API.

### Browser checklist per screen

1. **Parity:** open design `http://localhost:5173/design/<file>.html` and app `http://localhost:5173/<path>` in two tabs, same window size. For components, prefer the **DOM parity harness** (render the same props with the design's `window.WeODesignSystem_edbb0f` and the app's `@/design-system`, compare normalised HTML via localStorage — see `reports/M01-foundation.md` §3). Compare at **1440×900** and **390×844**, **light** and **dark**. Screenshot both; note differences (layout, spacing, type, colour, copy, motion).
2. **Interactions:** every action listed in the module spec's acceptance criteria; confirm the UI updates and the change persists after reload.
3. **Network:** `read_network_requests` — expected endpoints, 2xx, no duplicate storms (remember the 70 req/min limit), no calls to unsplash/b-cdn placeholders.
4. **Console:** `read_console_messages` — zero errors, zero React warnings.
5. **States:** throttle/kill the backend to see error UI; empty account for empty states.
6. **Auth:** expired token refreshes silently; logout clears state.

Record a short GIF (`gif_creator`) for key flows (collect, create, post) and reference it in the report.

## 3. Severity scale

| Severity | Meaning | Rule |
|---|---|---|
| High | broken flow, data loss, crash, security, wrong money figure | fix before commit |
| Medium | visible parity miss, wrong state, console error | fix before commit |
| Low | pixel nit, copy nit, minor perf | may defer with a target module |
