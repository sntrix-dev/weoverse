# Test report — M10 Notifications & company

| | |
|---|---|
| Date | 2026-10-06 |
| Frontend | branch `feat/m10-notifications-company` |
| Backend | branch `redesign/m10-notifications-company` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · backend `redesign/m10-notifications-company` :3002 · Surya's O-Wallet session · design reference at `/design/` |
| Result | ✅ pass — notifications and all five company pages checked live in light, dark and at 390. Marking one / all read was tested by code: the account has no unread notifications, and making one would mean acting on someone. The careers form was not sent live (it reaches the company's applications). |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint | ✅ | new files clean; no new errors on changed lines |
| backend | jest | ✅ | 79 suites / 1,084 tests in the Cowork VM, four groups (+2 suites, +34 tests: targets, category totals, route order, sender fields, company pages) |
| backend | `npm run docs:lint` | ✅ | 40 warnings = base 39 + the company list has no 4XX to document |
| backend | wire-shape diff | ✅ | additive: `target`, `categories`, `community` in counts, sender name fields; removed `sender.email` (Surya); new `/company`; `DELETE /notifications/read` now reachable |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (D-016) |
| frontend | `npm test` | ✅ | 236 / 236 (30 files) — +10 |
| frontend | `npm run build` | ✅ | Notifications and Company load as their own chunks |

### What the new frontend tests cover

- **Notifications (7):** day groups in local time and the design's time labels; routes from `target` (and none); the h1 count, day sections, chips with totals (System shown when it holds something, Community not); opening a row marks it read and navigates; a row with nowhere to go is marked read and stays; Mark all read, Unread only (`read=false`), a category (`category=payment`), the empty state and Show everything.
- **Company (3):** the page from the backend with the 99 peg and no draft note on About; chips switch pages and the URL, Privacy says it is a draft; Careers lists no openings and sends the interest form with your name and email (a bad link is caught first).
- **Router:** `/notifications` and `/company/about` are their screens.

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /notifications?limit=50` | rows with `target`, `categories`, no sender email | 200 — 6 rows: top-ups → wallet, WeO created → the WeO, collected and paid → collected; categories weo 2, collection 1, payment 1, wallet 2 | ✅ |
| `GET /notifications?read=false` | none unread | 200 — empty, the empty state | ✅ |
| `GET /notifications?category=wallet` | the two top-ups | 200 | ✅ |
| `GET /company` | five pages, the 99 peg, legal drafts | 200 | ✅ |
| `PATCH /notifications/:id/read`, `/read-all` | read | tests only (nothing unread) | ⚠️ |
| `POST /weo-website/careers-module` | an application | tests only (it reaches the company) | ⚠️ |

## 3. Browser — parity

| Part | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Notifications (lead, chips, day groups, rows, empty state) | ✅ | ✅ | ✅ | compared with `/design/notifications.html`; at 390 the three buttons wrap instead of running off the screen |
| Company (About with facts, Careers, Privacy / Terms / Cookies with the draft note) | ✅ | ✅ | ✅ | compared with `/design/company.html`; no horizontal overflow |
| Careers sheet | ✅ | — | — | opened and closed, not sent |

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Open "WEO Created Successfully" | the WeO page | `/weos/…` "Crowd Fund" | ✅ |
| 2 | Unread only | the empty state, the button filled | ✅ after M10-B1 | ✅ |
| 3 | Wallet chip | the two top-ups | ✅ | ✅ |
| 4 | Company chips | page and URL change | ✅ | ✅ |
| 5 | Careers → Tell us about you | your name and email filled in | ✅ (not sent) | ✅ |
| 6 | Console | no errors | 0 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Status |
|---|---|---|---|---|---|
| M10-B1 | Low | notifications | "Unread only" looked the same on and off (the DS button fills only when `selected`) | `selected` follows the toggle | fixed |
| M10-B2 | Low | Mac repos (process) | switching branches in a new Cowork session stopped halfway — git could not replace files without delete permission | asked once for it, checked the leftovers were the previous versions, finished the switch | resolved |

## 6. Open issues & follow-ups

- The legal pages are drafts until someone qualified reviews them (G-70).
- The bell is not real-time — nothing is emitted when a notification is created (G-71).
- Notifications still use the previous app's titles ("WEO Created Successfully"); rewording them is a backend copy change for later.
- Mark one / all read and the careers form were tested by code only.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, decisions D-080…D-085, API map, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m10-notifications-company`; frontend `feat/m10-notifications-company` → `develop`, tag `m10-done` — never `master`, D-069)
