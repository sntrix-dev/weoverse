# Changelog

All notable changes per module. Newest first.

## M05 — Community (2026-10-01)

- The Community hub: your WeOs in flight (drafts and live WeOs as Next-Os), your circles and the ones you can join (records that open into their orbit), questions / stewards / stories, and the O-Wallet panel (moved forward from M09).
- Circle page (header figures, snapshot cards as tabs, discussions with trending-tag filter, members, WeOs), thread page (answers by score, vote, reply, accept, answer, report, attached WeO), manage circles (mute, leave, join), stewards (top contributors, format tabs, follow), stories.
- Compose, push / ask and report sheets over any page; "Ask" and "Push to Circle" now live on the WeO page and cards.
- Backend (`redesign/m05-community`): steward fields on contributors, circle collect-through, WeO faces in the feed, real thread authors and circle names, my-weos no longer empty, follow errors with real statuses.

## M04 — Discover · WeO · Collect (2026-10-01)

- Discover: hero with live figures, the stage, the feed (cover + editorial / cards / list), closing / moving / creators-you-circle rails, who is trading, circles, interests and the whole floor with lenses and search.
- The WeO's own page: card, price, key terms, the act, progress, creator, circles, what you get.
- The collect flow: card → terms → review → receipt, priced by the backend quote; Hunt bundles, Pool pledges and Bid offers on the dial.
- Backend (`redesign/m04-discover`): collect quote in Os with the exact POST body, feed prices in Os, list cards know holdings and circles, creators' seven-day trace.

## Auth fixes (2026-10-01, after M03)

- O-Wallet authorize path is `/api/oauth/authorize`; `state` is 43 characters (the wallet requires ≥ 32).
- First real O-Wallet sign-in verified end to end; the dev token no longer replaces a signed-in person on reload.
- From the previous build's O-Wallet logic: "Continue with Google" through the O-Wallet, and log out also ends the O-Wallet session (D-030).

## M03 — Shared WeO & list kit (2026-10-01)

- `cardModel`: one typed adapter from the backend WeO card to every card, row and board (format, tone, price, timer, edition, terms…), with fixtures for all five formats.
- Section hero (stats, priorities, directory chips, view controls), view preferences panel, Scene, Rows, Rail/Fold, section marks, notes, pips and stat strips.
- WeO views: cards, carousel, orbit, list, rail — one switch, remembered per group; stall tiles and the shared WeO card props.
- Circle chip/orb/record, person orb, sparkline, standing chip, avatar orb, stage ring, snapshot chart/panel/podium.
- `/dev/ds` gallery section for the kit; 25 new tests (109 total).
- Backend (`redesign/m03-shared-kit`): `weoverse.priceOs/priceUsd` on every card, crowdfund `contribution`, card Swagger fixed.

## M02 — App shell (2026-10-01)

- Top bar (shrinks on scroll), split nav (left panel + support cluster), section switch with Next pill and an every-section option.
- Floating O nav (RingNav) with park/float flight, parked fan in the bar, auto-park below 720 px height.
- Passport dropdown from real nav-summary data (balance, tier, ISR, WeO ID copy, counts) with real log out.
- Mya dock: draggable orb, Ask Mya (backend chatbot, FAQ fallback) and Settings tabs.
- Footer with sitemap, newsletter (email-subscription API) and the external-link gate; flow bar; PathBar; toasts, ack ripple, sheet.
- Preferences saved to the backend (theme, layout, wordmark home, Mya, dock position, flow bar).
- Backend (`redesign/m02-app-shell`): complete `uiPreferences` on every read, `home/navSections/flowBar/flowBarTools`, chatbot `degraded`, Swagger fixes.

## M01 — Foundation (2026-10-01)

- Vite 8 + React 19 + TypeScript strict scaffold; ESLint, Prettier, Vitest + RTL + MSW (53 tests).
- Design tokens and global CSS verbatim; design assets in `public/`.
- 28 design-system components converted from the design's DS bundle and typed — DOM-identical to the design (64/64 cases).
- API client (envelope, field errors, single-flight refresh), OAuth2 + PKCE sign-in, dev token, every design route registered.
- Dev server serves the design reference at `/design/`.
- Backend (`redesign/m01-foundation`): `npm run dev:token`, `.env.example`, auth Swagger fixes.

## M00 — Setup & docs (2026-09-30)

- Development docs (`docs/`), module specs M01–M12, test report template, decisions log.
- Design and backend inventories (`docs/reference/`).
- Project skills (`skills/`) and `CLAUDE.md`.
