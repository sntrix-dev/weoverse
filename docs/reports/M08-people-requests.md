# Test report — M08 People & requests

| | |
|---|---|
| Date | 2026-10-05 |
| Frontend | branch `feat/m08-people-requests` |
| Backend | branch `redesign/m08-people-requests` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · backend `redesign/m08-people-requests` :3002 · Surya's O-Wallet session · design reference at `/design/` |
| Result | ⚠️ pass with open items — light and dark checked; creators, the creator sheet, tracking and your own brief tested live; offering on someone else's brief and inviting into a circle are covered by tests only (no other member's open brief to answer; an invite notifies a real person) |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint | ✅ | no new errors on changed lines; new files clean |
| backend | jest | ✅ | 76 suites / 1050 tests (+3 suites, +25 tests: tracking notes and service, circle invite, brief fields and close, creator rows) — four groups in the Cowork VM; one suite re-run alone after a worker ran out of memory |
| backend | `npm run docs:lint` | ✅ | 39 warnings = base 38 + the new `request-weos/{id}/close` path shares its siblings' ambiguous-path warning |
| backend | wire-shape diff | ✅ | new: tracking, invite, close; additive fields on creator rows, the creator record's `viewer`, request briefs; nothing removed or renamed |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (D-016) |
| frontend | `npm test` | ✅ | 215 / 215 (25 files) — +19 |
| frontend | `npm run build` | ✅ | Creators, Requests, Tracking and the creator sheet load as their own chunks |

### What the new frontend tests cover

- **Creators (10):** boards sorted by their own figure; the pulse read from the directory with no delta; the page (Mya beside the creators, a record opening into its orbit and the URL); `/creators/:id` and Circle them; your own record offers nothing to yourself; Mya never ranked, no Rehearse; the sheet from the WeO page obeying hidden activity, invites and contact; Track drops and Invite from a board face; a profile that cannot open.
- **Requests (6):** the brief model (sentence case, budget, closes in days / hours); the offer dial range; cards → panel → URL; your own brief's offers and closing it; Make a WeO for this seeding the composer; offering one you hold (only regular WeOs, the accept body without server-owned fields).
- **Tracking (3):** WeOs with notes and creators; Track it from the WeO page; the empty state.
- **Router:** `/creators`, `/requests`, `/tracking` are their screens.

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /creators?sort=isr&limit=48` | rows with the M08 fields | 200 — 81 trading, weeks live and WeO counts on the records | ✅ |
| `GET /creators/:id` | profile + `viewer.tracked` | 200 — orbit of their WeOs, accept rate, your own profile marked | ✅ |
| `POST /users/:id/follow`, `DELETE …/unfollow` | circled, then back | 200 / 200 — "✓ Circled" kept after the re-read, then undone | ✅ |
| `POST /me/tracking/creators/:id`, `GET /me/tracking`, `DELETE …` | tracked, listed with a note, untracked | 200 — "Nothing new since you started tracking · 1 WeO open", then removed | ✅ |
| `GET /request-weos?status=open` | open briefs | 200 — the M07 test ask, as yours | ✅ |
| `GET /request-weos/:id/accepted-weos` | your offers | 200 — none yet | ✅ |
| `POST /request-weos/:id/close` | closed | 200 — the M07 test ask no longer takes offers and left the open board | ✅ |
| `POST /request-weos/:id/accept` | a WeO for them | tests only (no other member's open brief) | ⚠️ |
| `POST /community/circles/:id/invite` | a notification | tests only (it notifies a real person) | ⚠️ |

## 3. Browser — parity

| Part | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Creators (hero, boards, grid, record orbit) | ✅ | ✅ | ✅ | no horizontal overflow at 390 |
| Creator sheet | ✅ | ✅ | — | |
| Requests (hero, cards, panel) | ✅ | ✅ | ✅ | compared with `/design/requests.html` — same hero, card grid and panel placement |
| Tracking | ✅ | ✅ | ✅ | |

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | `/creators` → open a record | orbit of their WeOs, figures, URL `/creators/:id` | ✅ | ✅ |
| 2 | Circle them → undo | persists | ✅ | ✅ |
| 3 | WeO page → creator → sheet | the sheet over the page | ✅ | ✅ |
| 4 | Sheet → Track drops → Tracking page → untrack | listed with a note, then gone | ✅ | ✅ |
| 5 | Sheet → Invite | your circles listed | ✅ (not sent) | ⚠️ |
| 6 | Your brief → Close this brief → confirm | closed, off the board | ✅ | ✅ |
| 7 | `/create?forRequest=` | composer seeded with the brief | ✅ | ✅ |
| 8 | Console | no errors | 0 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Status |
|---|---|---|---|---|---|
| M08-B1 | Medium | creators snapshot | the boards listed the whole directory (45 rows under the podium); some rows painted blank mid-animation | boards rank twelve (D-068) | fixed |
| M08-B2 | Low | creator record | your own record offered "Collect a WeO" and "Circle them" on yourself | "This is you" instead | fixed |
| M08-B3 | Low | composer | composing for a brief autosaved a draft that would lose the ask | no autosave for an answer (D-067); the test draft was deleted | fixed |
| M08-B4 | Low | shell (pre-existing) | loading the app in a second frame mid-refresh signed both out — the frame was replaced while its refresh was in flight, so the rotated token was never stored | follow-up: a short grace window for the previous refresh token on the backend | open |

## 6. Open issues & follow-ups

- Offer one you hold and Invite were not run live: no other member has an open brief, and an invite notifies a real person. Both are covered by tests; try them with a second account.
- G-58: `GET /request-weos/:id` returns requested-WeO documents to any member — trimming is breaking for old callers (ask).
- Test data: "M07 test ask" is now closed; "M07 test print" stays paused.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, decisions D-059…D-068, API map, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m08-people-requests`; frontend `feat/m08-people-requests` → `develop`, tag `m08-done` — never `master`, D-069)
