# 03 — Module plan

Twelve build modules after setup. Each is delivered with the workflow in `04-module-workflow.md` and has a spec in `modules/`. Order is fixed by dependencies; do not start a module until the previous one is merged.

| # | Module | Design pages / parts | Backend work (summary) | Depends on | Status |
|---|---|---|---|---|---|
| M00 | Setup & docs | — | CLAUDE.md drift fixes, redesign docs, skills | — | ✅ done |
| M01 | Foundation | tokens, global CSS, DS primitives, marks/icons, API client, auth (PKCE + dev token), router skeleton, test tooling | dev-token script, `.env.example` completeness | M00 | ✅ 2026-10-01 (live auth round trip carried to M02) |
| M02 | App shell | TopBar, split Shell, SectionSwitch, QuickJump/RingNav, WalletMenu + ID sheet, Mya dock, footer + SettingsBody, PathBar, toasts/ack, ExternalGate, flow bar (stub) | nav-summary + preferences (exist); Mya → chatbot | M01 | ✅ 2026-10-01 (IdP sign-in round trip still open) |
| M03 | Shared WeO & list kit | SectionHero, ViewBar/view prefs, Scene, Rows, SectionHead/Mark, Fold/Rail, IconSegs, WeoTile/StallTile/WeoView, CircleRecord/Oi/Chip, PersonOi/Spark/StandChip, Snapshot chart/panel, Pip, OWalletPanel, `cardModel` | card price in Os + crowdfund pledge bounds on the projection (G-29) | M02 | ✅ 2026-10-01 (wallet/profile composites → M09, D-028) |
| M04 | Discover · WeO · Collect flow | discover, weo, CollectSheet/CardFlow | quote in Os + payload, feed/list/creators fixes (G-30…G-34) | M03 | ✅ 2026-10-01 |
| M05 | Community | community (hub), circle, thread, circles (manage), stewards, stories; Compose/Push/Report modals; O-Wallet panel | steward fields, collect-through, WeO faces, author fixes, follow statuses (G-42…G-46 logged) | M03 | ✅ 2026-10-01 |
| M06 | Collect & Exchange | collect (holdings), exchange (listings), RelistSheet, NeedsYou | pause/activate, redeem, dispute, resell quote, Os-true snapshots (G-49…G-53) | M04 | ✅ 2026-10-03 |
| M07 | Create | create (hero, composer, preflight, posted), templates, media upload, PostSheet, AI draft | O peg, media upload, AI describe, templates, stored format | M05, M06 | ✅ 2026-10-05 |
| M08 | People & requests | creators, requests, tracking; CreatorSheet, OfferSheet, make-for-request | tracking watchlist, circle invite, brief fields + close, creator rows | M04 | ✅ 2026-10-05 |
| M09 | Identity & money | passport, wallet, settings; profile/tier/ISR sheets, MoveOsSheet, plans | settings store, account request, export, profile photo, peg fix | M03 | ✅ 2026-10-05 |
| M10 | Notifications & company | notifications, company | fix `DELETE /notifications/read` shadowing, category map | M02 | ✅ 2026-10-06 |
| M11 | Worlds & lifecycle | WorldStudio + `<weo-world>` (three.js, lazy), V3 lifecycle (rehearse → react → pledge → live), In-flight, arrivals/walkthrough | reactions & pledges endpoints | M07 | ✅ 2026-10-06 |
| M12 | Hardening | full regression, a11y, perf, error states, final report | as found | all | |

Legend: ⏳ in progress · ✅ merged · ⛔ blocked

## Why this order

- Everything renders inside the shell (M02), which needs the DS (M01).
- M03 is the shared kit reused by 9 pages; building it once keeps components consistent.
- Discover (M04) is the first real data surface and validates `cardModel` against the backend's unified WeO projection.
- Create (M07) needs circles (M05) for "post to a circle" and listings (M06) for drafts.
- Worlds (M11) is the heaviest and most isolated (three.js) — last feature module. Until then "Rehearse" buttons open a "coming in M11" toast, and the flow bar hides world actions.

## Tracking progress

Update the Status column here and the header table in the module spec at every state change. Test reports go to `reports/MNN-<slug>.md`.
