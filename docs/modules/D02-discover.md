# D2 — Discover (WeOverse v4 design update)

| Branch | Base | Backend | Design source |
|---|---|---|---|
| `feat/d02-discover` | `develop` @ b8d7a91 (D1) | `redesign/d02-discover` (from `redesign/d01-shell`) | v4 export `pages/discover.jsx`, `components/filter-menu.jsx`, `screens-discover.jsx`, `snapshot.jsx`, `css/app.css` |

v4 turns Discover into one feed with filters. Most of the change lives in the export's `app.css` overrides, so the rendered page (1440 and 390, light and dark) is the reference, not the JSX alone. Merges into `develop` and `v2/dev` after the designer signs off.

## What changed

| Area | v4 design | Build |
|---|---|---|
| Top of the page | breadcrumb gone; the hero is a 44px white pill of three figures (On the floor, WeOs in motion — now a count, From My Circle) plus Intro, on the filter bar's row | `HeroPill` (`components/FloorBar.tsx`); the page is one wrapping row so the bar stays pinned all the way down; a visually hidden h1 keeps the heading |
| Sticky filter bar | pins at 62px, frosted once pinned and widened across the row; Jump to (On the stage, Your feed, Who is trading, Circles behind the floor, Browse by interest), Closing soonest (red, pulsing) and Moving now; the feed's view switch and Enter a world only while pinned | `StickyFilters`, `FilterMenu`, `StuckViews`, `useStuck` (`components/hero/FilterMenu.tsx`) |
| On the stage | header row gone; full-width carousel, current card ≤ 1080px (70vw), neighbours at 50%, every 4s, holds on hover; swipe, drag, sideways wheel, dots | `StageDeck` (`Stage.tsx` + `.module.css`). The export defines card-edge arrows but never draws them; neither do we (D-107) |
| Your feed | Fold title at heading size with a note; chips: Everything, Closing soon, Moving now, From creators you circle, then the kinds; pages of 9 ("Showing 1–9 of N", numbered); the lead card is no bigger; red countdown pill; white resting chips | `FeedBoard`, `FeedPager`; kinds page on the server (`/frontend/feed?kind=&page=&limit=9`), lenses are the floor's WeO lists drawn as feed cards (`weoFeedItem`, D-109); the view switch lives in the pinned bar and stays in step (`useWeoView` sync) |
| Feed cover | 300–400px, no bottom wash, controls at the bottom centre, "Also in the feed" gone | `FeedCover` |
| Below the feed | Closing soonest, Moving now, Creators you circle and The whole floor removed; Who is trading, Circles and Interests stay without collapse buttons; no flow bar | `DiscoverPage`. A search still lands here as "Results for …" (the floor shows only then, D-106) |
| Fold | larger title, optional note (every page that uses it — only Discover does) | `Fold` (`components/layout/Rail.tsx`) |
| Stall tile | faint image wash, 120px orb; on hover a drawer with the price label, "N here now" and Place a bid / Collect; now only on Tracking (and search results) | `StallTile` (`components/weo/WeoBits.tsx`); the action opens Collect |
| Snapshot (Collect, Exchange, Creators) | chart and board are separate cards; the board names itself and its range (Last 7 days · 14 days · 1 month); "What wins where" is its own card with a subtitle | `SnapshotPanel`, `WhatWinsRail`; ranges on Collect and Exchange (`window=7d|14d|30d`, backend D2); Creators gets the What wins where rail from `/weos/interests` but no range — its directory has no window (D-108) |
| ViewBar | `noView` drops the View button | `ViewBar` |

## Backend

`GET /frontend/me/collections/snapshot` and `GET /frontend/me/listings/snapshot` accept `window=14d` (additive; `meta.window` can be `14d`). Shared `WindowKey`/`WindowMeta` in `shared/utils/snapshotWindow.ts`. No other backend change: the feed already filtered by kind and paged, and the floor lists already sort by close time and trend.

## Gaps

- The Creators board has no range: `/frontend/creators` ranks the current week only.
- "Closing soonest" counts WeOs with a close time (the `ending_soon` total), as the design does; "From My Circle" is the snapshot's 7-day count.

## Verify

typecheck ✅ · lint ✅ · vitest 38 files / 296 tests ✅ · build ✅ · backend tsc ✅, lint ✅, jest 87 suites / 1,136 tests ✅, docs:lint ✅ · browser (harness, MSW data): v4 design vs build at 1440 (top, pinned, Jump to menu, lens), 390, dark; Creators snapshot; Tracking stall hover.
