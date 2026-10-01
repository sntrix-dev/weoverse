# Test report — M03 Shared WeO & list kit

| | |
|---|---|
| Date | 2026-10-01 |
| Frontend | branch `feat/m03-shared-kit` (commits in §7) |
| Backend | branch `redesign/m03-shared-kit` @ `06f6c4c` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM with the real `.env` |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 (`/dev/ds` gallery) · backend `redesign/m03-shared-kit` :3002 (Atlas DB) · design at `/design/` · dev token (seeded Mya) |
| Result | ✅ pass — every automated, live-API and browser check passes |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | 0 errors |
| backend | `npm run lint` | ✅ (no regression) | 546 errors / 1068 warnings — identical to base; 0 in new/changed lines |
| backend | `npm test` | ✅ | 60/60 suites, 905/905 tests, 4 new (price per kind, pledge bounds) |
| backend | `npm run docs:lint` | ✅ | valid; 37 unused-component warnings (base 38) |
| backend | wire-shape diff | ✅ additive | `weoverse.priceOs/priceUsd`, crowdfund `contribution`; see `weo-3.0/docs/redesign/modules/M03-shared-kit.md` |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (unchanged, D-016) |
| frontend | `npm test` | ✅ | 109 / 109 (11 files) — +25; no React warnings |
| frontend | `npm run build` | ✅ | JS 489 kB (155 kB gzip), CSS 61 kB — the kit isn't on a product route yet (gallery is dev-only) |

### What the new frontend tests cover

- **cardModel (11):** three `weoType`s onto five formats; Listing (one Os price, edition, resale), Bid (negotiable, clock), Drop (capped edition, countdown, trend, circles), Pool (pledge unit from the backend, funded rarity, held flag), Hunt (entries, published rules); closed and sold out; missing media, editorial rarity note, unknown context; actions follow the context; creator view model; clock helpers.
- **Kit (14):** CircleRecord (name, compact members, joined dot, Enter/click), CircleChip icon fallback; OAvatarOrb hides the advantage chip without a figure (G-23) and shows it with one; Spark single point; StageRing segments; SnapshotPanel podium order 02·01·03, rows from 04, pick, tile switches the board, lit tile opens its section, full width without a rail; StallTile keyboard open; WeoView starts from the `weoView` pref, switches and remembers per group, hides unwired actions, empty state; SectionHero More/Less reveal remembered.

## 2. API checks (live, dev token)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /frontend/weos?limit=6` | regular rows carry `weoverse.priceOs = price.amount × 99`, `priceUsd = price.amount` | e.g. `price.amount 10 → priceOs 990, priceUsd 10`; `30 → 2970, 30` | ✅ |
| `GET /frontend/weos?weoType=crowdfund` | `contribution{minimum,maximum}`, `priceOs = minimum` | `{minimum 20, maximum null}` → `priceOs 20`, `priceUsd 0.2` | ✅ |
| `GET /frontend/weos?weoType=lottery` | `priceOs = ticket.price` | `ticket.price 5 → priceOs 5`, `priceUsd 0.05` | ✅ |

Observation (data, not code): two seeded regular WeOs have `price.amount 2400`, which the backend reads as $2,400 → 237,600 Os. They look like Os typed into the USD field when seeded; worth checking before M04 shows them on Discover.

## 3. Browser — parity (Chrome, `/dev/ds` vs the design pages that use each part)

Measured with computed styles on both sides (same origin), plus screenshots.

| Part | Design page | Light | Dark | 390 | Notes |
|---|---|---|---|---|---|
| SectionHero | community, discover | ✅ | ✅ | ✅ | radius 30, padding 20 (14 at 390), h1 38 px (27.3 at 390), `-1.596px` tracking; stats and art hidden ≤ 640 like the design |
| View switch (IconSegs) | community | ✅ | ✅ | — | segment 36 px / `0 14px` / violet; well 44 px with the inset shadow |
| WeO cards / WeoView | community | ✅ | ✅ | — | cards, carousel, orbit (with centre), list all render; price at rest under each card |
| StallTile | discover | ✅ | — | — | 239 px tall: 146 image + 93 body (`13px 15px 15px`), radius 24, same shadow |
| CircleChip / CircleOi | circles | ✅ | ✅ | — | chip 21 px tall, identical width |
| SnapshotPanel | collect | ✅ | ✅ | — | section radius 30 / padding 26; podium tile 189 px; pulse tile 131 px, radius 22, `14px 14px 12px` |
| People, StageRing | creators, community | ✅ | ✅ | — | |

No horizontal overflow at 390 (scrollWidth = clientWidth).

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Hero More → Less, reload | priorities revealed; state kept on reload | ✅ | ✅ |
| 2 | WeoView: Carousel → Orbit → List → Cards | each view renders; `weo.view.dev-kit` follows | ✅ | ✅ |
| 3 | StageRing "Next stage" | segment advances (3/5 → 4/5) | ✅ | ✅ |
| 4 | Snapshot: tap the Creators tile | board switches to "Who moved the most" | ✅ | ✅ |
| 5 | Console | no errors | 0 errors | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Commit | Status |
|---|---|---|---|---|---|---|
| M03-B1 | Low | `/dev/ds` | Orbit view had an empty centre (no `me` passed in the gallery) | gallery passes `me` | 0047ecc | fixed |

Design bug fixed while porting: `NoteBody` numeric width read as px (design-port guide §5 #10).

## 6. Open issues & follow-ups

- Deferred composites (D-028): wallet/profile → M09, hero portal → M11, WeoShowcase → M04, LeaderPreview → with the first board page, CreatorSheet → M08.
- Seed data: regular WeOs priced 2400 (see §2).
- Carried: O-Wallet IdP sign-in round trip (needs Surya's sign-in), local chatbot not initialised; Q-6, Q-7, Q-8.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested (none found)
- [x] Docs updated (spec, plan, decisions D-027/D-028, design-port guide, API map, backend inventory, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m03-shared-kit`; frontend `feat/m03-shared-kit` → `master`, tag `m03-done`)
