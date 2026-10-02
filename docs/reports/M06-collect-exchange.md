# Test report — M06 Collect & Exchange

| | |
|---|---|
| Date | 2026-10-03 |
| Frontend | branch `feat/m06-collect-exchange` |
| Backend | branch `redesign/m06-collect-exchange` @ `a9653e2` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM with the real `.env` |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · backend `redesign/m06-collect-exchange` :3002 · Surya's O-Wallet session |
| Result | ⚠️ pass with open issues — both screens live, Inactivate / Activate round-trip; confirm receipt, dispute and relist tested with mocks only (the account holds no regular WeO yet) |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint | ✅ | no new errors (rule-by-rule diff against `redesign/m05-community`) |
| backend | jest | ✅ | 69 suites / 1000 tests (+67: holding redeem/dispute, status toggle + owner delete, resell quote and Os ask, auto-pay credit, Os-true snapshots, stock, Drop edition, anonymous backers, creators `circle=joined`, email out of follow lists) |
| backend | `npm run docs:lint` | ✅ | 38 warnings = base + one `no-ambiguous-paths` (`/weos/{id}/status` vs `/weos/creators/{id}`, same class as `version-history`) |
| backend | wire-shape diff | ✅ | additive, plus value fixes logged in `weo-3.0/docs/redesign/modules/M06-collect-exchange.md`; one approved removal (G-49) |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (D-016) |
| frontend | `npm test` | ✅ | 172 / 172 (20 files) — +12 |
| frontend | `npm run build` | ✅ | Collect, Exchange and the relist sheet load as their own chunks |

### What the new frontend tests cover

- **Models (4):** holdings speak Os and the design's kinds; Needs-you picks confirm / resell / report and stops once confirmed; listings file paused under Live and sold-through under Closed, a re-listing cannot pause; attention order (restock, fix, finish) and a draft's open-check count.
- **Screens (8):** Collect — stats in Os, needs-you, format tabs, a holding opens its WeO; Received posts redeem and the card leaves; a dispute goes through the gate; relist posts `amountOs` + `collectionId` with no fee lines; a quote blocker keeps Confirm off. Exchange — listings + drafts, tabs, a draft opens the composer; Activate in place and roll-back on a refusal; the menu offers only what a row can do; the snapshot's attention rail and the creators orbit (`circle=joined`).

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /me/collections/snapshot` | Os, kinds, formats | 2 holdings (Pool 20, Hunt 5), O 25 in, osPlacement protected 20 / pending 5 | ✅ |
| `GET /me/listings/snapshot` | asks in Os, live states | 6 listings, `Weo bid 21` 990 (was $10 shown as 10) | ✅ |
| `PATCH /weos/:id/status` | 200, persists | `Test weo 22` → Paused (reload: still Paused) → Live | ✅ |
| `GET /creators?circle=joined` | creators sharing your circles | 1 (sanjiv_kumar_pandit, with bio) | ✅ |
| `GET /weos/:id/resell/quote`, `POST …/redeem`, `…/dispute`, `…/resell` | route mounted | 401 without a session (route present); exercised in unit + screen tests | ✅ |

## 3. Browser — parity

| Part | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Collect hero, Needs you, WeOs you hold, Snapshot (+ Where your Os sit), Wallet | ✅ | ✅ | ✅ | format tabs scroll sideways on a phone; hero stats fold away at 390 as in the design |
| Exchange hero, WeOs you flow, ⋯ menu, Snapshot (+ Needs attention), Creators orbit | ✅ | ✅ | ✅ | the orbit scales to the phone width |
| Relist sheet | tests only | — | — | no resellable holding on the account |

The design server (:8000) was not running during the pass; parity was checked against `collect.jsx` / `exchange.jsx` and their components.

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Inactivate a live listing, reload, Activate | Paused persists, then Live | ✅ | ✅ |
| 2 | Read the report on a pool with no circle | opens its WeO | ✅ | ✅ |
| 3 | Hover a creator in the orbit | name, bio, ISR chip, Open / Circle them | ✅ | ✅ |
| 4 | Confirm receipt, dispute, relist | persist | no regular holding — mocks only | ⚠️ |
| 5 | Console | no errors | 0 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Status |
|---|---|---|---|---|---|
| M06-B1 | Medium | backend · Collect | a pool holding read "0% funded · held until the goal decides": a pledge settles to the creator at once, and 20 of 10,000 rounds to 0 | note from raised / goal, "under 1% funded · the pool is still open" | fixed |
| M06-B2 | Medium | backend · Collect pulse | the Uplift tile printed a spend trend ("+25" beside 0) | no trend on a position | fixed |
| M06-B3 | Low | backend · Exchange board | "moving best" listed every 0% listing | 0% rows left off | fixed |
| M06-B4 | Low | Collect snapshot | an empty board left a blank well | "Nothing on this board yet." | fixed |
| M06-B5 | Low | Collect · phone | Resell / Track / Circle only appeared on hover — never on a touch screen | always visible where there is no hover | fixed |

## 6. Open issues & follow-ups

- Live check of confirm receipt, dispute and relist needs a regular (Listing / Drop / Bid) holding on the test account — collecting one spends Os, so it waits for Surya's go-ahead.
- Standing bids ("Bid held"), offers waiting on listings, resale fees — G-50, G-52.
- Wallet buckets other than Available are still 0 in the wallet read (G-51); Collect uses the snapshot's placement (D-048).
- Test data changed: none left behind (`Test weo 22` was paused and re-activated).

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, decisions D-044…D-049, API map, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m06-collect-exchange`; frontend `feat/m06-collect-exchange` → `master`, tag `m06-done`)
