# M04 — Discover · WeO detail · Collect flow

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ 2026-10-01 | `feat/m04-discover` | `redesign/m04-discover` | `reports/M04-discover.md` |

## Screens

### `/discover` — design `src/pages/discover.jsx` → `features/discover/pages/DiscoverPage.tsx`

| # | Block (design order) | App component | Data |
|---|---|---|---|
| 1 | PathBar · SectionHero "01 of 04 / Discover" (stats, 9 places, All/Closing/Moving tabs, foot) | `SectionHero` (M03) | `discovery-snapshot` |
| 1a | Hero foot: StageDeck + StageWeo poster | `components/Stage.tsx` | `GET /weos?sort=recent&status=active&limit=8`, live only |
| 2 | Fold **Your feed**: FeedCover (rotates 9 s), kind chips, editorial / cards / list | `components/Feed.tsx` | `GET /feed?limit=24` → `model/feed.ts` |
| 3 | Fold **Closing soonest** (rail · cards · orbit · list) | `WeoView` (M03) | `GET /weos?sort=ending_soon&status=active` |
| 4 | Fold **Moving now** | `WeoView` | `GET /weos?sort=trending&status=active` |
| 5 | Fold **Creators you circle** (empty state) | `WeoView` | `GET /weos?feed=following&status=active` |
| 6 | Fold **Who is trading** | `CreatorStall` | `GET /creators?sort=isr` → `model/rails.ts` |
| 7 | Fold **Circles behind the floor** | `CircleRecord` (M03) | `GET /community/circles?filter=all` |
| 8 | Fold **Browse by interest** | `InterestTile` | `GET /weos/interests` |
| 9 | Fold **The whole floor** (lenses, search results, empty state → Ask Mya / Post a request) | `FloorGrid` | `GET /weos?…&search=&limit=24` |
| 10 | FlowFoot (back: Community) | `FlowFoot` (M02) | — |

Top-bar search lands on `/discover?q=` → the floor opens, scrolls to it and shows "Results for …".

### `/weos/:weoId` — design `src/pages/weo.jsx` → `features/weo/pages/WeoPage.tsx`

PathBar → SectionHero (eyebrow `format · # passport`, lede = first point, `WeoPriceFeature`, stats collectors / edition / closes-in, the one priority, directory incl. circles and creator) → card section (`WeOCard`, `WeoPriceAtRest`, key terms + resale + passport, main act / Closed, progress for Pool · Hunt · Drop, creator, circle chips) → What you actually get. Missing WeO → empty state with Back to Discover.

### Collect flow — design `screens-flows.jsx` → `components/flow/` (shared) + `features/collect/`

`CardFlow` (card → terms → review → done), `Dial`, `PortalStage`, `StageRail`, `SuccessMoment` in `components/flow/` (M06 relist and M08 offers reuse them); `CollectSheet` + `CollectHost` (mounted once in AppLayout, opened by `stores/flow.ts` `openCollect(weoId)` from Discover, the feed, the stage and the WeO page). The sheet is driven by the collect quote (D-032).

## API map

| Block | Endpoint | Notes |
|---|---|---|
| hero stats | `GET /frontend/weos/discovery-snapshot` | `liveCount`, `settledOs7d` ("In motion", tooltip says 7 days), `followingNewCount` |
| feed | `GET /frontend/feed?limit=24` | four kinds; `format` (M04) colours WeO items; legacy `href`s mapped to app routes |
| rails / floor | `GET /frontend/weos?sort&status&feed&search&limit` | `status=active` for live rails |
| creators rail | `GET /frontend/creators?sort=isr&limit=12` | `trace7d` (M04) |
| circles rail | `GET /frontend/community/circles?filter=all` | joined + suggested, de-duplicated |
| interests | `GET /frontend/weos/interests?limit=12` | |
| WeO page | `GET /frontend/weos/:id` | |
| collect | `GET /frontend/weos/:id/collect/quote?amount=&bundle=` → `POST /frontend/weos/:id/collect` with `quote.payload` | then re-read nav-summary, WeOs, Discover |

## Backend work (`redesign/m04-discover`)

Quote in Os + `payload`; feed prices via `priceOsOf` + `format`; list cards get holdings and circles; `settledOs7d` counts regular sales; `/creators` `trace7d` and floor-only `settled7d`; Swagger for `/creators`. Log: `weo-3.0/docs/redesign/modules/M04-discover.md`. Gaps G-30…G-34 done, G-35…G-41 opened.

## Gaps and deliberate absences

| Design shows | Handling |
|---|---|
| Watch on a card (G-06) | not offered until tracking (M08) |
| Rehearse it / Ask about it / Push to Circle | hidden until M11 / M05 (D-033) |
| Tier advantage on the review and receipt (G-40, Q-6) | not shown — settlement doesn't apply it |
| Flow fee + creator royalty rows | hidden — settlement withholds nothing (quote `fees: []`) |
| "Standing bid", "every pledge refunds" copy | replaced: settlement is immediate (D-032) |
| Circle "desire" band | filled from `resolvedRate7d` (D-035) |
| Feed cover masthead date | the current week |

## Acceptance criteria

- ✅ All 10 Discover blocks render live data; folds collapse/expand (state per visit, as in the design).
- ✅ Search from the top bar lands on the floor with results.
- ✅ WeO page works for all 5 formats; a closed WeO shows a disabled "Closed".
- ✅ Collect completes against the live backend for a Hunt and a Pool (Surya approved 25 Os); the Listing path runs to Confirm live and is covered end to end by code tests; balance updates; receipt shown.
