# M04 — Discover · WeO detail · Collect flow

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m04-discover` | `redesign/m04-discover` | `reports/M04-discover.md` |

## Screens

### `/discover` — design `src/pages/discover.jsx` (`DiscoverScreen`)
1. SectionHero "01 of 04 / Discover": stats *On the floor*, *In motion (Os)*, *From creators you circle*; directory (9 places + "more" overflow); Tabs All/Closing/Moving; foot `StageDeck` (orb picker + `StageWeo` poster: Collect / Rehearse it / Ask about it).
2. Fold **Your feed** → `FeedBoard` (FeedCover rotating 9 s, kind chips, editorial/cards/list).
3. Fold **Closing soonest** (WeoView stall tiles; rail/cards/orbit/list).
4. Fold **Moving now**.
5. Fold **Creators you circle** (empty state).
6. Fold **Who is trading** (Rail of `CreatorStall`).
7. Fold **Circles behind the floor** (Rail of `CircleRecord`).
8. Fold **Browse by interest** (`InterestTile`).
9. Fold **The whole floor** (`FloorGrid`: query, lenses all/ending/moving/open, grid, empty state with Ask Mya / Post a request).
10. `FlowFoot`.

### `/weos/:weoId` — design `src/pages/weo.jsx` (`WeoScreen`)
SectionHero (eyebrow "type · #weoId", lede = points[0], stats collectors/edition/closes-in, priorities, directory) → card section (`WeOCard`, `WeoPriceAtRest`, `WeoActions`, key terms, main CTA / Closed, Progress, creator, circle chips) → **What you actually get**.

### Collect flow — design `screens-flows.jsx` `CollectSheet` / `CardFlow` / `StageRail` / `Dial`
Opened from Discover/WeO/notifications. Quote → CommitReview → FlowReceipt.

## API map

| Block | Endpoint | Notes |
|---|---|---|
| hero stats | `GET /frontend/weos/discovery-snapshot` | |
| feed | `GET /frontend/feed` | four kinds: weo, question, request, story |
| closing / moving / floor | `GET /frontend/weos?sort=ending_soon|trending|recent` + filters | |
| floor search | `GET /frontend/weos/search` or `GET /frontend/search` | query from `?q=` |
| creators you circle | `GET /frontend/weos?feed=following` / `GET /frontend/circle/my-circle` | |
| who is trading | `GET /frontend/weos/top-creators` or `/creators` | |
| circles behind the floor | `GET /frontend/community/circles` | |
| browse by interest | `GET /frontend/weos/interests` | |
| WeO detail | `GET /frontend/weos/:id` (+ `/collectors`, `/ratings`) | |
| like | `POST/DELETE /frontend/weos/:id/like` | optimistic |
| collect | `GET /frontend/weos/:id/collect/quote` → `POST /frontend/weos/:id/collect` | regular: quantity/installments/negotiation; crowdfund: amount; lottery: tickets/bundle |

## Known/likely gaps (confirm in step 3)

| Need | Candidate resolution |
|---|---|
| "watch" action on cards | reuse tracking (M08) — hide until then or add `watch` now |
| `circleIds` for a WeO (circle chips) | derive from threads with `attachedWeoId` / `pushedToHubAt`; additive projection field |
| `trendPct`, "In motion (Os)" | discovery-snapshot / activeNow counters |
| Rehearse / Ask about it | Rehearse → M11 toast; Ask → compose in circle (M05) — route with prefill |

## Acceptance criteria

- All 10 Discover blocks render live data with design parity; folds collapse/expand and remember state.
- Search from the top bar lands on the floor with results.
- WeO page works for all 5 formats; closed WeO shows disabled "Closed".
- Collect completes for regular, crowdfund, lottery against the live backend; wallet balance updates; receipt shown.
