# M06 — Collect & Exchange

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m06-collect-exchange` | `redesign/m06-collect-exchange` | `reports/M06-collect-exchange.md` |

## Screens

| Path | Design | Blocks |
|---|---|---|
| `/collect` | `collect.jsx` `CollectedScreen` | SectionHero "02 of 04 / Collect" (COL_STATS, directory, SnapshotChart pulse) · **Needs you** (redeem / "Something is wrong" → dispute; "would fetch more" → Resell/Keep; Backed → report; Bid held → open) · **WeOs you hold** (Tabs All + formats, `HoldingRow` hover Resell/Track/Circle) · Rows Snapshot·7d (`SnapshotPanel` COL_BOARDS + `ValueLadder`) / Wallet · FlowFoot |
| `/exchange` | `exchange.jsx` `ListedScreen` | SectionHero "04 of 04 / Exchange" (LST_STATS, "New WeO", pulse) · **WeOs you flow** (Tabs All/Live/Draft/Closed; `ListingRow` ⋯ Edit / Inactivate-Activate / Push to hub / Rehearse; preflight bar on drafts) · Rows Snapshot·7d (LST_BOARDS + "Needs attention") / Creators in your circles (orbit) · FlowFoot |

Sheets: `RelistSheet` (resell a holding) from `screens-flows.jsx`.

## API map

| Block | Endpoint |
|---|---|
| holdings | `GET /frontend/me/collections` (+ `/:collectionId`) |
| collect stats/pulse/boards | `GET /frontend/me/collections/snapshot` |
| listings | `GET /frontend/me/listings`, `/history`, `/:id` |
| exchange stats/pulse/boards | `GET /frontend/me/listings/snapshot` |
| drafts in list | `GET /frontend/me/drafts` |
| relist | `POST /frontend/weos/:id/resell` |
| pay installment | `POST /frontend/installments/pay` |
| rating after collect | `POST /frontend/weos/:id/rating` |
| edit | → `/create?edit=:id` (M07) |
| push to hub | `POST /frontend/community/push` |

## Gaps (confirm in step 3)

| Need | Candidate |
|---|---|
| Inactivate / Activate a listing | `PUT /weos/:id {weoType, status}` if allowed, else additive `PATCH /weos/:id/status` |
| Redeem (mark delivered/used) | additive endpoint on regular collection → `delivered` |
| Dispute ("Something is wrong") | `POST /report` with `targetType: weo` + collection ref, or new dispute status |
| Listing card fields the discarded `phase1/v3` edit added (`publicId`, `categoryName`, `tags`, `closesAt`, `isResellable`, `isNegotiable`, `isLimitedDrop`, `negotiableUpTo`, `availabilityTill`, `duration`) | re-add if the design needs them (reference: stash) |
| "Creators in your circles" orbit | `/circle/my-circle` + creators |

## Acceptance criteria

- Holdings/listings show real data with correct formats; each row opens the right WeO (`weoId`, not the row id).
- Relist creates a resold WeO visible in Exchange; pause/activate persists; redeem & dispute work.
- Both screens at parity.
