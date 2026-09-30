# M03 — Shared WeO & list kit

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m03-shared-kit` | `redesign/m03-shared-kit` (only if projection gaps) | `reports/M03-shared-kit.md` |

## Scope

Composites reused by ≥2 pages, built once, shown in the `/dev/ds` gallery with fixture data.

| Group | Components | Design source |
|---|---|---|
| hero | `SectionHero` (+`HeroStat`, `DirChip`, `PriorityRow`, `Clamp`, `withTabIcons`, `useCurrentPlace`, `HeroPortalToggle`), `ViewBar`/`ViewPanel`/`PrefSeg` | `section-hero.jsx`, `view-prefs.jsx` |
| layout | `Scene`, `Rows`, `SectionHead`, `SectionMark`, `Fold`, `RailHead`, `Rail`, `IconSegs` | `screens-hub.jsx`, `v3-screens.jsx`, `screens-discover.jsx` |
| weo | `WeoTile`, `StallTile`, `MyWeoCard`, `WeoView` (cards/rail/carousel/orbit/list) + `useWeoView`, `WeoList`, `WeoActions`, `WeoPriceAtRest`, `OsRun`/`OsText`, `StageRing` | `screens-hub.jsx`, `screens-discover.jsx`, `section-hero.jsx`, `v3-spine.jsx` |
| circle | `CircleRecord`, `CircleOi`, `CircleChip` | `screens-hub.jsx` |
| people | `PersonOi`, `Spark`, `StandChip`, `OAvatarOrb` | `screens-network.jsx`, `section-hero.jsx` |
| snapshot | `SnapshotChart`, `SnapshotPanel`, `Podium`, `LeaderFace` | `snapshot.jsx` |
| wallet | `OWalletPanel`, `Pip` | `screens-hub.jsx`, `screens-holdings.jsx` |
| profile | `OProfileStage`, `OProfileHub`, `HubNode` | `screens-hub.jsx` |

## `lib/cardModel.ts`

Typed port of `src/data/weo-model.js` `cardModel(w, ctx)` over the backend `WeoCardView`. Output fields: id, weoId, name, slug, type, format, context, tone, cta, actions, os, priceOs, priceUsd, priceLabel, category, img, media, creator{…}, isr, edition, rarity, fundPct, left, total, timer, endsIn, live, urgent, collectors, watchers, likes, liked, activeNow, trend, circleIds, collected, resellable, terms[], points.

Verify each `WEO.MISSING` field against the live projection: `publicId`, `editionSize`, `minPledgeUsd`, `isCollected`, `circleIds`, `activeNow`, `trendPct`, `points`, `rarityNote`. Any absent → backend additive change in this module (projection only, no schema change) or FE-derived, recorded in the table below.

| Field | In backend? | Resolution |
|---|---|---|
| (fill in during step 3) | | |

## Acceptance criteria

- Every component renders in `/dev/ds` identically to its design counterpart (screenshot pairs in the report).
- `cardModel` unit-tested for regular/Listing, Bid, Drop, Pool (crowdfund), Hunt (lottery), closed/sold-out, missing media.
- View prefs (density/media/motion/value, muted formats/kinds, weoView) read/write through `stores/prefs.ts`.
