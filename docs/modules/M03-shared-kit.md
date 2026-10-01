# M03 — Shared WeO & list kit

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ 2026-10-01 | `feat/m03-shared-kit` | `redesign/m03-shared-kit` | `reports/M03-shared-kit.md` |

## Scope

Composites reused by two or more pages, built once and shown in the `/dev/ds` gallery (section "Shared kit") with the WeO fixtures run through `cardModel`. All are pure: props in, callbacks out, no fetching. Styles are the design's inline objects, typed (D-027).

| Group | App file | Components | Design source |
|---|---|---|---|
| card model | `src/lib/cardModel.ts` | `cardModel`, `formatOf`, `progressOf`, `hhmmss`, `shortLeft`, `FORMAT_TONE/CTA`, `PRICE_LABEL`, `formatHex` | `src/data/weo-model.js` |
| hero | `components/hero/SectionHero.tsx`, `HeroParts.tsx`, `ViewBar.tsx`, `icons.tsx` | `SectionHero`, `HeroStat`, `DirChip`, `PriorityRow`, `withTabIcons`, `useCurrentPlace`, `ViewBar`, `ViewPanel`, `PrefSeg`, `PrefRow`, `useViewPrefs`, `PLACE_ICONS`, `TAB_ICONS` | `section-hero.jsx`, `view-prefs.jsx` |
| layout | `components/layout/{Scene,Rows,SectionMark,Rail,Note,Pip}.tsx` | `Scene` + `useDepth`, `Rows`, `SectionMark`, `SectionHead`, `IconSegs`, `VIEW_ICONS`, `Rail`, `RailHead`, `Fold`, `NoteDot`/`NoteBody`/`useNote`, `Pip`, `StatStrip` | `screens-hub.jsx`, `v3-screens.jsx`, `screens-discover.jsx`, `screens-holdings.jsx` |
| text | `components/text/{OsText,Clamp}.tsx` (+ `OsRun` from M02) | `OsText`, `Clamp` | `section-hero.jsx` |
| weo | `components/weo/{WeoBits,WeoCards,WeoView,StageRing}.tsx`, `weoCardProps.ts` | `WeoTimer`, `WeoPriceAtRest`, `StallTile`, `WeoActions`, `WeoTile`, `MyWeoCard`, `WeoCarousel`, `WeoOrbitView`, `WeoList`, `WeoView` + `useWeoView` (cards · carousel · orbit · list · rail), `weoCardProps`, `StageRing` | `screens-hub.jsx`, `screens-discover.jsx`, `v3-spine.jsx` |
| circle | `components/circle/Circle.tsx` | `CIRCLE_ICONS`, `CircleChip`, `CircleOi`, `CircleRecord` (+ `CircleCardModel`) | `screens-hub.jsx` |
| people | `components/people/People.tsx` | `Spark`, `PersonOi`, `StandChip`, `OAvatarOrb` | `screens-network.jsx`, `section-hero.jsx` |
| snapshot | `components/snapshot/Snapshot.tsx` | `BOARD_TABS`, `BOARD_SECTION`, `LeaderFace`, `Podium`, `SnapshotChart`, `SnapshotPanel`, `WhatWinsRail` (+ `Board`, `BoardRow`, `Pulse`) | `snapshot.jsx` |
| helpers | `lib/glide.ts`, `lib/feedKinds.ts`; `useApplyPrefs` sets `data-weo-density/media/motion/value` | | `app.jsx`, `screens-hub.jsx` |

How the design's globals became props: `app.openWeo` → `WeoHandlers.onOpen`; `app.openPush` / `openWorld` → `onPush` / `onRehearse` (a control is hidden when its handler isn't passed); `app.joined[c.id]` → `joined`; `app.tw.typeColorCircles` → `coded` (default on); `HUB.ME` → `me`; `WV.MY_TIER` → `tier`; `app.board` / `setBoard` → `board` / `onBoard`; `app.go(BOARD_SECTION[k])` → `onOpenSection`; `HUB.BOARDS` / `PULSE` / `CONTEXTS` → props.

### Deferred (D-028)

| Component | Goes to | Why |
|---|---|---|
| `OWalletPanel`, `MockOsSheet`, `MoveOsSheet` | M09 | wallet data and flows; only the wallet/passport pages use them |
| `OProfileStage`, `OProfileHub`, `HubNode` | M09 | the profile hub needs passport data |
| `HeroPortalToggle` / hero portal | M11 | belongs to the section intros (with the "Intro" chip, see `SectionHero`) |
| `WeoShowcase` | M04 | one page uses it (Discover) |
| `LeaderPreview` (SnapshotPanel's built-in sheet) | M04/M05 | resolves rows against mock people/WeOs/circles; pages pass `onPick` (the design's pages already do) |
| `CreatorSheet` | M08 | creator profile data |

## `lib/cardModel.ts`

Typed port of `weo-model.js cardModel(w, ctx)` over the backend `WeoCardView` (a union narrowed on `weoType`). Fields: id, weoId, name, slug, type/format (Bid · Pool · Hunt · Drop · Listing), context, tone, hex, cta, actions, os/priceOs, priceUsd, priceLabel, category, img, media, creatorId, creator{id, handle, avatarUrl, isr, bio, tradeCount, followersCount, tier, joined}, isr, edition, rarity, fundPct, left, total, timer, endsIn, live, urgent, collectors, watchers, likes, liked, activeNow, trend, circleIds, circles, collected, resellable, resalePct, terms[], points.

| Field (design `WEO.MISSING`) | In backend? | Resolution |
|---|---|---|
| `publicId` | ✔ `weoverse.publicId` | `weoId` (null before backfill) |
| `editionSize` | ✔ `weoverse.editionSize` (crowdfund) | Pool edition / left |
| `minPledgeUsd` | ✘ — crowdfund `contribution` wasn't projected; units differ per kind | backend: crowdfund `contribution{minimum,maximum}` (Os) + `weoverse.priceOs/priceUsd` for every kind (G-29) |
| `isCollected` | ✔ `weoverse.isCollected` | `collected` |
| `circleIds` | ✔ `weoverse.circles[]` (with names) | `circleIds`, `circles` |
| `activeNow` | ✔ `weoverse.activeNow` (and top-level) | `activeNow` |
| `trendPct` | ✔ `weoverse.trendPct` (null = no prior week) | `trend` "+8%" or null |
| `points` | ✔ `weoverse.points` | `points` |
| `rarityNote` | ✔ `weoverse.rarityNote` | `rarity`, else derived (funded % / rules / availability) |
| close time | ✔ `closesAt` | `timer`, `endsIn` |

Price: the card shows `weoverse.priceOs` with `priceUsd` as the reading aid — the frontend never multiplies by a peg (design bug #5 resolved on the backend).

## API map

No screen fetches in M03. The kit reads `WeoCardView` (served by `GET /frontend/weos` and every list that embeds cards), wired from M04.

## Backend work (`redesign/m03-shared-kit`)

- `weoverse.priceOs` / `priceUsd` on every card; crowdfund `contribution{minimum,maximum}` — additive.
- Swagger `WeoCardCommon` / `RegularCardData` / `CrowdfundCardData` brought in line with the projection.
- Log: `weo-3.0/docs/redesign/modules/M03-shared-kit.md`. Gaps G-05, G-29 done.

## Gaps (shown as absent, never faked)

| # | Design shows | Backend | Handling |
|---|---|---|---|
| G-23 | Advantage % on the avatar orb's hover chip | none | `OAvatarOrb` takes `tier.adv`; without it the chip stays hidden |
| G-06 | "Watch" on a card | none | not offered until M08 |

## Acceptance criteria

- ✅ Every component renders in `/dev/ds`; layout values match the design's (hero, view switch, circle chip, stall tile, snapshot panel — see the report).
- ✅ `cardModel` unit-tested for Listing, Bid, Drop, Pool, Hunt, closed/sold-out, missing media, price units.
- ✅ View prefs (density/media/motion/value, muted formats/kinds, weoView) read/write through `stores/prefs.ts`; each WeO group remembers its view on the device (`weo.view.<id>`).
