# M06 — Collect & Exchange

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ⏳ in progress | `feat/m06-collect-exchange` | `redesign/m06-collect-exchange` (from `redesign/m05-community`) | `reports/M06-collect-exchange.md` |

Product answers (Surya, 2026-10-03): **Redeem = confirm receipt** — the holder marks a holding received; no money moves (settlement already happened at collect). **Dispute = report + disputed flag** — a moderation report on the WeO, and the holding is marked disputed (no relist, no confirm).

## Screens

| Path | Design | Blocks, in design order |
|---|---|---|
| `/collect` | `collect.jsx` `CollectedScreen` | PathBar · SectionHero "02 of 04 / Collect" (stats Holdings / You put in / Value now / If you resold today; directory Needs you · Your WeOs · Snapshot & wallet; foot `SnapshotChart` movers/formats/creators/pending) · **00 Needs you** (`NeedsYou` cards) · **01 Held** "WeOs you hold" (Tabs All + five formats → `HoldingRow` grid, hover Resell / Track + Circle) · Rows **Snapshot · 7d** (`SnapshotPanel` + "Where your Os sit" `ValueLadder` rail) / **Wallet** (`OWalletPanel`) · FlowFoot → Create |
| `/exchange` | `exchange.jsx` `ListedScreen` | PathBar · SectionHero "04 of 04 / Exchange" (stats Collects · 7d / Collect-through / Drafts / Resellable; "New WeO"; directory Your listings · Creators & snapshot; foot `SnapshotChart` performing/views/earning/ready) · **01 In flow** "WeOs you flow" (Tabs All/Live/Draft/Closed → `ListingRow`s, ⋯ menu Edit / Inactivate-Activate / Push to hub; preflight bar on drafts) · Rows **Snapshot · 7d** (`SnapshotPanel` + `SnapshotRail` "Needs attention") / **Creators in your circles** (`CircleCreatorsOrbit`) · FlowFoot Community ← → Discover |

Sheet: `RelistSheet` (`screens-flows.jsx`) — the CardFlow portal with your ask on the dial, driven by the resell quote. Hosted by `RelistHost` over any page (`stores/flow.ts` `relist`).

## Components

| Component | File |
|---|---|
| `HoldingRow`, `KIND_TONE` | `features/collect/components/HoldingRow.tsx` |
| `NeedsYou` | `features/collect/components/NeedsYou.tsx` |
| `RelistSheet`, `RelistHost` | `features/collect/components/RelistSheet.tsx`, `RelistHost.tsx` |
| `ListingRow`, `STATE_TONE` | `features/exchange/components/ListingRow.tsx` |
| `SnapshotRail` | `components/snapshot/SnapshotRail.tsx` (shared kit) |
| `CircleCreatorsOrbit` | `features/exchange/components/CircleCreatorsOrbit.tsx` |
| `WalletRow` (moved from community — used by the hub and Collect) | `features/wallet/components/WalletRow.tsx` |

## API map

| Block | Endpoint | Status |
|---|---|---|
| holdings, needs-you, hero stats, pulse, boards, "Where your Os sit" | `GET /frontend/me/collections/snapshot?window=7d` | BE fix: Os everywhere (was dollars for regular rows), `format`, `sellerAvatar`, `redeemedAt`, `disputedAt`, resellable mirrors the resell guards, `format:<Label>` groups |
| confirm receipt | `POST /frontend/me/collections/:collectionId/redeem` | BE new |
| something is wrong | `POST /frontend/me/collections/:collectionId/dispute {reason, description?}` | BE new |
| relist sheet | `GET /frontend/weos/:id/resell/quote?collectionId=` | BE new |
| relist | `POST /frontend/weos/:id/resell {title, description, amountOs, quantity, tags, collectionId}` | BE additive (`amountOs`, `collectionId`) + fixes |
| listings, exchange stats, pulse, boards | `GET /frontend/me/listings/snapshot?window=7d` | BE fix: re-listings live, sold-through closed, ask/settled in Os, stock = left + sold; additive `status`, `paused`, `isResellable`, `format` |
| drafts in the list | `GET /frontend/me/drafts` | OK |
| Inactivate / Activate | `PATCH /frontend/weos/:id/status {active\|inactive}` | BE new (PUT re-versions a regular WeO with sales) |
| Push to hub | `POST /frontend/community/push` (push sheet, D-040) | OK |
| creators in your circles | `GET /frontend/creators?circle=joined&limit=6` (fallback: top by ISR) | BE additive (`circle`, `bio`) |
| wallet row | `GET /frontend/wallet/overview`, `POST /frontend/wallet/transfer` | OK (M05) |

## Decisions (see `decisions.md`)

- D-044 Redeem is "confirm receipt": the Needs-you card asks you to confirm it arrived; nothing is held or released (settlement is immediate). The design's "held until redemption · redeeming pays the creator" copy is replaced with what happens.
- D-045 "Something is wrong" opens the gate as in the design and files `POST …/dispute` (reason `other`); the holding shows "Dispute open".
- D-046 Relist: no fee lines (the quote's `fees` is empty — settlement takes none, G-52); "recover" says a re-listing stays on the floor until collected (a `resold` WeO cannot be paused).
- D-047 Exchange "Draft" = your drafts (`/me/drafts`); a paused listing is "Paused" under Live with Activate. Draft "N open" = the share of the five preflight checks the composer records (`ready`).
- D-048 "Where your Os sit": Available = wallet balance; Protected / Pending / Locked = the snapshot's `osPlacement` (backed / entries / committed holdings) — the wallet buckets are hard-coded 0 (G-51).
- D-049 Pulse tiles and boards use the backend's measures and labels (Collects, Views · lifetime, Settled, Preflight…); a tile with no daily source shows no sparkline.

## Gaps / questions

| Need | Status |
|---|---|
| Bid held / standing bids ("You are the standing bid…") | G-50 — M11 |
| "Offers waiting · Reply" in Needs attention | no offers model on listings — omitted |
| Fees on resale (design 2% + 2%) | G-52 — product |
| Other members' email in circle / follow lists | G-49 — asked |
| Rehearse | M11 (D-027) |
| Edit a live WeO | M07 (opens the WeO until then) |

## Acceptance criteria

- Holdings and listings show real data in Os with correct formats; rows open the WeO (`weoId`).
- Confirm receipt and dispute persist (pip/note change, card leaves Needs you).
- Relist creates a re-listing visible (Live) in Exchange; Inactivate / Activate persists and a paused WeO cannot be collected.
- Both screens at parity (1440×900, 390×844, light and dark), network 2xx, zero console errors.
