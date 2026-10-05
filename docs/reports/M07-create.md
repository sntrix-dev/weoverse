# Test report — M07 Create

| | |
|---|---|
| Date | 2026-10-05 |
| Frontend | branch `feat/m07-create` |
| Backend | branch `redesign/m07-create` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM with the real `.env` |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · backend `redesign/m07-create` :3002 · Surya's O-Wallet session · design reference at `/design/` |
| Result | ⚠️ pass with open issues — Listing posted, edited in place and paused; Request posted; media to S3; templates, drafts and asks live. Draft with Mya answers 503 on the Mac (no `OPENAI_API_KEY`); Pool and posting into a Circle tested with mocks only |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint | ✅ | no new errors in changed files (the `media.service.ts` error at line 55 is pre-existing) |
| backend | jest | ✅ | 73 suites / 1025 tests (+25: media upload + options, O peg, describe, templates, stored format) — run in four groups on the Mac; `models.boot` re-run alone (fails to start only under full load, as before) |
| backend | `npm run docs:lint` | ✅ | 38 warnings = base |
| backend | wire-shape diff | ✅ | four new endpoints; optional `format` on regular create/update and on WeO cards; nothing removed or renamed |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (D-016) |
| frontend | `npm test` | ✅ | 196 / 196 (22 files) — +24 |
| frontend | `npm run build` | ✅ | Create loads as its own chunk (~105 kB, 29 kB gzip) |

### What the new frontend tests cover

- **Model (15):** Listing / Bid / Pool / Request payloads (Os ÷ peg for regular, percent floors, ISO vs epoch deadlines, `requestedId`, stored `format`, a Drop kept on edit); what is still needed; media rules; templates; drafts round-trip; a live WeO back into the composer.
- **Screens (8):** the ring (live and soon formats, Notify me); docks and a locked template; a Listing from empty to posted (missing fields named, upload, peg, post sheet → Exchange); posting into a Circle (create, then push); Draft with Mya; autosave; a Request to the asks board; editing a live WeO in place.
- **Router (+1, 1 updated):** `/` opens Create; a nested sign-in link unwraps.

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /config/o` | the peg | 200 — a 495 O ask saved as $5 and reads O 495 everywhere | ✅ |
| `GET /templates` | catalogue + tiers | 200 — 10 templates, Unsplash and local images load | ✅ |
| `GET /categories`, `GET /request-weos` | real lists | 200 — 20 categories; asks total moved 0 → 1 after the test ask | ✅ |
| `POST /media` | S3 URL | 201 — cover on S3 under `weoverse/app/…`, shown on the card, the WeO page and Exchange | ✅ |
| `POST /ai/describe` | lines | 503 — no `OPENAI_API_KEY` in the Mac `.env`; the composer now says "Drafting with Mya is not available right now." | ⚠️ |
| `POST /weos` | 201 | 201 | ✅ |
| `PUT /weos/:id` (edit) | saved in place | 200, opens the WeO | ✅ |
| `POST /request-weos` | 201 | 201 | ✅ |
| `/me/drafts` (autosave, delete on post) | saved, then removed | created while composing, gone after posting ("Carry on" back to Blank WeO) | ✅ |

## 3. Browser — parity

| Part | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Hero (O, format ring, docks, template shelf) | ✅ | ✅ | ✅ | compared with `/design/create.html` at 390 — same layout (the headline sits behind the top orb in both) |
| Composer (rails, inline fields, media, card flip) | ✅ | — | — | |
| Preflight, post sheet, posted | ✅ | — | — | |

The design page's arrival curtain is not part of this module (M11).

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Sell → name, line, category, upload, ask → Preflight → Post (network) | live in Exchange | ✅ "M07 test print", O 495 | ✅ |
| 2 | Exchange ⋯ → Edit WeO → Save it | saved in place, opens the WeO | ✅ | ✅ |
| 3 | Request → budget 100–200 → Post | on the asks board, Posted screen | ✅ | ✅ |
| 4 | Templates dock → shelf; locked template | tiles load; locked says the plan | ✅ | ✅ |
| 5 | Draft with Mya | lines, or why not | 503 on this Mac (no key) | ⚠️ |
| 6 | Console | no errors | 0 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Status |
|---|---|---|---|---|---|
| M07-B1 | Medium | shell · sign-in | a session expiring on the sign-in page wrapped the link again (`/login?next=/login?next=…`) | a sign-in link never wraps itself; nested ones unwrap to where they were going | fixed |
| M07-B2 | High | backend + every surface | the backend derived Drop from edition size, so any Sell of 100 or fewer copies posted as a "Drop" (and a Listing taking offers read as a Bid) | optional stored `format` (D-058); cards read the backend's `format` | fixed |
| M07-B3 | Low | composer | Draft with Mya said "try again" when the server has no model | shows the server's reason on 503 / 429 | fixed |
| M07-B4 | Low | preflight | the flow bar sat above the post sheet | hidden while the sheet is open | fixed |

## 6. Open issues & follow-ups

- Set `OPENAI_API_KEY` in the Mac `.env` to try Draft with Mya live (the chatbot needs it too).
- Pool and "post into a Circle" are covered by tests only — posting into a real circle creates a public thread, so it waits for Surya's go-ahead.
- Test data left: "M07 test print" (paused) and the "M07 test ask" request (requests cannot be paused yet — M08).
- The MCP `create_weo` description calls `negotiableUpTo` an absolute discount; the server reads a percent (pre-existing).
- Hunt / Drop / Gift / Subscription creation and premium unlock (M09) remain out of scope.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, decisions D-051…D-058, API map, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m07-create`; frontend `feat/m07-create` → `master`, tag `m07-done`)
