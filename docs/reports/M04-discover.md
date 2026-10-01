# Test report — M04 Discover · WeO · Collect

| | |
|---|---|
| Date | 2026-10-01 |
| Frontend | branch `feat/m04-discover` (commits in §7) |
| Backend | branch `redesign/m04-discover` @ `8e840c1` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM with the real `.env` |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · backend `redesign/m04-discover` :3002 (Atlas DB) · Surya's own O-Wallet session |
| Result | ✅ pass — two live collects (25 Os, approved by Surya) succeeded; one open data observation (§6) |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | `npm run lint` | ✅ | 540 errors / 1067 warnings (base 546 / 1068); nothing new in changed lines |
| backend | `npm test` | ✅ | 62/62 suites, 918/918 tests (13 new: quote per kind + payloads, feed, list enrichment, settled, creators) |
| backend | `npm run docs:lint` | ✅ | valid; 37 warnings (= base) |
| backend | wire-shape diff | ✅ additive + value corrections | see `weo-3.0/docs/redesign/modules/M04-discover.md` |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (D-016) |
| frontend | `npm test` | ✅ | 139 / 139 (16 files) — +30 |
| frontend | `npm run build` | ✅ | main JS 544 kB (166 kB gzip) + lazy chunks: Discover 49 kB, WeO 8 kB, collect sheet 24 kB (D-034) |

### What the new frontend tests cover

- **Models (6):** feed hrefs → app routes; WeO feed items take their format colour, name the format, run the clock; other kinds keep their colour; creator stall trace; circle desire/colour/icon; interest format; a pool without an edition size reads "Funded".
- **Discover (6):** hero figures from the snapshot; the rails ask for `ending_soon` / `trending` / `following` with `status=active`; cover, creators, circles, interests, empty followed row; top-bar search lands on the floor with results; a lens re-asks the floor and a fold collapses; a stall opens the WeO.
- **WeO page (4):** title, key terms, passport, what you get; the act opens the sheet; a closed WeO's Collect is disabled "Closed"; a missing WeO is an empty state.
- **Collect (6):** Listing card → terms → review → confirm POSTs exactly `quote.payload`, success moment, receipt with the collection ref; short balance shows "Short by", Top up, Confirm off; a Hunt offers the real bundles and re-prices; a Bid moves on the dial and warns about negotiation; a refused collect shows the backend's reason and no success; Escape closes.
- Router/shell updated: `/discover` and `/weos/:id` are real screens in their sections.

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /weos/discovery-snapshot` | live figures | 102 on the floor, 0 Os settled in 7 days, 0 from followed creators | ✅ |
| `GET /feed` | Os prices, format | regular items in Os (e.g. 990 for $10), `format` set | ✅ |
| `GET /weos?status=active&sort=…` | live rails | 3 closing, 102 moving | ✅ |
| `GET /creators?sort=isr` | rows with `trace7d` | 6+ creators, 7-point traces | ✅ |
| `GET /weos/:id/collect/quote` (regular $2,000) | Os, payload | `ask 198000`, `insufficient_balance`, `payload {amount: 2000, isFullyPaid: true}` | ✅ |
| `POST /weos/:id/collect` — Hunt, 1 entry | 201, ticket number | entry `000006`; balance 1,703 → 1,698 | ✅ |
| `POST /weos/:id/collect` — Pool, 20 Os | 201 | "You are in the pool at O 20"; balance → 1,678; collectors 0 → 1 | ✅ |

## 3. Browser — parity

The screens are line-for-line ports of `discover.jsx` / `weo.jsx` / `screens-flows.jsx`; measured against the design's own values:

| Part | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Discover hero + stage (StageWeo padding 34, radius 34) | ✅ | ✅ | ✅ | at 390 stats and art hide as in the design |
| Feed cover (min-height clamp → 560 px, radius 36, h2 60 px) / editorial grid (lead spans all columns, 3 / 2 / 1 columns by width) | ✅ | ✅ | ✅ | |
| Rails, stall tiles, circle records, creator stalls | ✅ | ✅ | ✅ | |
| WeO page | ✅ | — | ✅ | no horizontal page scroll at 390 |
| Collect sheet: card, terms (dial + bundles), review, success moment, receipt | ✅ | — | — | |

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Search "Sweepstakes" from the floor URL | results on the floor | 1 match, tile opens the WeO | ✅ |
| 2 | Hunt: card → terms → 5 entries → review | O 25 ≈ $0.25 | ✅ | ✅ |
| 3 | Hunt: 1 entry → Confirm | success moment, receipt, toast, balance −5 | ✅ | ✅ |
| 4 | Pool: pledge 20 → Confirm | receipt, balance −20, collectors +1 | ✅ | ✅ |
| 5 | Drop $2,000 with 1,678 Os | Short by 196,322, Confirm off, Top up | ✅ | ✅ |
| 6 | Console | no errors | 0 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Commit | Status |
|---|---|---|---|---|---|---|
| M04-B1 | High | backend quote | regular WeOs quoted in dollars as Os (balance check off by 99×) | quote in Os + payload | b75f4b3 (BE) | fixed |
| M04-B2 | Medium | Discover stage | an active WeO past its close time took the stage | stage = live only; `live` honours the close time | 09b6604 | fixed |
| M04-B3 | Medium | cards | a WeO with no close time read "Closes: closed" (design bug) | reads "open" | c932999 | fixed |
| M04-B4 | Low | WeO page / sheet | Pool "Left 0 of 0"; a pledge read "Very unlikely" at the minimum | "Funded n%"; pledges always likely | 136b090 | fixed |
| M04-B5 | Low | sheet / WeO page | entry and circle chips were not keyboard controls | role + Enter/Space | 09b6604 | fixed |

## 6. Open issues & follow-ups

- Seed data: `Weo Bid` / `Test weo 22` are priced $2,400 (= 237,600 Os) — probably Os typed into the dollar field.
- Backend gaps opened: G-35 regular collect guards + oversell race, G-36 negotiation floor two ways, G-37 search/top-creators leak creator email, G-38 suggested circles, G-39 no idempotency key, G-40 tier advantage not applied, G-41 anonymous backers exposed.
- Long close times read as hours ("2189:03:45"), as the design's timer does — a days format would be a design change.
- One shell test (`splits the nav…`) showed a preference PATCH that never completed inside the full suite; the assertion now checks the store; worth a look in M12.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, decisions D-032…D-035, design-port guide, API map, backend inventory, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m04-discover`; frontend `feat/m04-discover` → `master`, tag `m04-done`)
