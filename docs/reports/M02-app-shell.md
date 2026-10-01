# Test report — M02 App shell

| | |
|---|---|
| Date | 2026-10-01 |
| Frontend | branch `feat/m02-app-shell` (commits in §7) |
| Backend | branch `redesign/m02-app-shell` @ `7578da1` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM with the real `.env` |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · design at `/design/` |
| Result | ⏳ in progress — automated checks pass; browser parity (bar, split, light) checked without the backend; the live-data pass waits for the backend to run on the Mac |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | 0 errors |
| backend | `npm run lint` | ✅ (no regression) | 546 errors / 1068 warnings — identical to base; 0 in new/changed lines |
| backend | `npm test` | ✅ | 60/60 suites, 901/901 tests, 19 new (preferences defaults + validation, chatbot controller) |
| backend | `npm run docs:lint` | ✅ | valid; 38 unused-component warnings = base |
| backend | wire-shape diff | ✅ additive | see `weo-3.0/docs/redesign/modules/M02-app-shell.md` |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (unchanged, D-016) |
| frontend | `npm test` | ✅ | 84 / 84 (9 files) — +31; no React warnings |
| frontend | `npm run build` | ✅ | JS 489 kB (155 kB gzip), CSS 61 kB |

### What the new frontend tests cover

- **Shell integration (19, real route tree + MSW):** passport pill shows the real balance and tier dot; section pill names the section and queues the next; section menu order and navigation; "every section in the bar" saves `navSections`; search lands on `/discover?q=`; split nav ↔ bar (`data-nav`, `--shell-left` 270/86/0, PATCHes); wordmark opens the saved home; saved dark theme paints; passport dropdown (name, handle, joined, ISR stage, WeO ID copy, tier chip, four counts, buckets); real log out (revokes refresh token, clears session, `/login`, toast); Mya dock (starter answer, Settings tab theme switch saved, close back to the orb); Mya switched off hides the orb; O nav park → confirm → parked fan (7 jumps) → float again; flow bar back/next and fold-to-pill saved; footer sitemap routing, newsletter subscribe and already-subscribed; external gate stay / continue (opens new tab).
- **Prefs store (4):** optimistic + one batched PATCH; rollback + error callback; hydrate never clobbers a pending change; older payloads filled with defaults.
- **Mya (4):** three FAQ starters; starter answered from the FAQ without a request; chatbot answer + `sessionId` threading; degraded/down → FAQ matcher → "I don't have that one yet".
- **Adapter (4):** nav-summary → shell view model, tier rules, ISR clamp, missing fields.

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /frontend/users/me/nav-summary` (dev token) | 200, complete `uiPreferences` | pending backend on the Mac | ⏳ |
| `PATCH /frontend/users/me/preferences` `{home:"discover"}` | 200, full set | pending | ⏳ |
| `POST /chatbot/ask` | 200 `{answer, sessionId, degraded}` | pending | ⏳ |
| `POST /frontend/email-subscription/subscribe` | 201 / 400 already | pending | ⏳ |
| M01 carry-over: IdP sign-in → `/callback` → verify, refresh, logout | | pending | ⏳ |

## 3. Browser — parity (Chrome, 1440 wide, design `/design/discover.html` vs app `/discover`)

| View | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Bar mode | ✅ | ⏳ | ⏳ | top bar, section pill + Next, support row, flow bar capsules, O nav, Mya orb match |
| Split mode | ✅ | ⏳ | ⏳ | left panel (labels, lit active item with its long label), support cluster match |

## 4. Browser — interactions

⏳ with the backend running.

## 5. Bugs

| ID | Sev | Where | Description | Fix | Commit | Status |
|---|---|---|---|---|---|---|
| M02-B1 | Medium | Mya dock | The orb sat on the flow bar's right capsule (backend default `b: 22`; the design rests it at `b: 96`) | untouched default = rest at 96 (D-023); backend default change asked (Q-7) | 8ddaae2 | fixed |

## 6. Open issues & follow-ups

- Gaps shown as absent: tier advantage % (G-23, Q-6), O Power (G-24), wallet buckets (G-25), Verified (G-26).
- Q-7 (dock default), Q-8 (social handles).

## 7. Sign-off

- [ ] All High/Medium fixed and re-tested
- [ ] Docs updated
- [ ] Commits pushed
