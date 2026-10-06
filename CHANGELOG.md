# Changelog

All notable changes per module. Newest first.

## M12 — Hardening (2026-10-07)

- The bell is live: a new notification lights it without a reload (socket.io, loaded only when signed in); the minute poll stays as the fallback.
- In flight marks a WeO that posted itself at twenty pledges: "Live · validated".
- A suspended, banned or deleted account is said once, over everything, with the reason and Sign out; a deactivation you asked for reads as one.
- A refresh that cannot reach the server no longer signs you out of every tab.
- Offline and back online are said; a busy server (429) is said at most every 20 s.
- Every sheet, gate and curtain takes keyboard focus, keeps Tab inside and hands focus back.
- User image addresses in styles are quoted and limited to safe schemes.
- Backend (`redesign/m12-hardening`, PR into `phase1/v3`): validated mark on WeO views and the hub's cards; access-token socket handshake, per-person rooms, `notification:new`; a brief's offers private to the requester; staff confirm or reject account requests; `RATE_LIMIT_PER_MIN`.

## M11 — Worlds & lifecycle (2026-10-06)

- The World Studio: rehearse a draft in a world — Where, Who is there, Terms, Forecast, Share — and keep its terms; or simulate any live WeO with the sweep and the projection, and settle your own to your ledger. Free for everyone. The world is walkable (three.js, loaded only when a world opens); without WebGL the flat stage stands in.
- The way to live: Draft → Rehearsed → Reacting (12) → Reacted → Pledging (20) → Live. In flight shows every stage with its next step; opening to reactions asks once and names who is told; a pledge is a promise, nothing is held; at twenty it posts itself, validated.
- The vetting sheet: say what you would pay and why, or pledge — from the notification, the Circle page ("Waiting on this circle") or your In flight.
- Section intros and Mya's walkthrough, once per account; replay from the hero's Intro mark or the flow bar's ?, reset in Settings.
- Rehearse from the WeO page, Discover's stage, Exchange rows, Create's dock and preflight, briefs, creators and the O nav's Worlds; "Enter a world" in the flow bar.
- Backend (`redesign/m11-worlds-lifecycle`): the draft lifecycle (`vetting`), reactions and pledges, posting at twenty with the validated mark and the rehearsal receipt, notifications that open the vetting sheet, `seen` preferences.

## M10 — Notifications & company (2026-10-06)

- Notifications: what waits on you, Unread only, Mark all read and a way to your notification settings; chips per category with their counts; rows grouped by day with their picture, tone and time; opening one marks it read and takes you where it points (a WeO, a request, your collection, your listings, the wallet, a creator, a thread, a circle).
- Company: About, Careers, Privacy, Terms and Cookies from the backend — the peg is the real 99 Os = $1, nothing invented; the legal pages say they are drafts under review; Careers takes a note of interest.
- Every screen is now built: the "built in a later module" placeholder is gone.
- Backend (`redesign/m10-notifications-company`): each notification names where it opens; the list counts every category; a notification no longer carries the sender's email; clearing read notifications works (it answered 404); the company pages.

## M09 — Identity & money (2026-10-05)

- Passport: who you are and your passport id, your balance as the wallet's front door, ISR, tier and circles; the profile hub (what moved it, your tier, improve, your graph) around your WeOs; standing ("not tracked yet" until the backend keeps an ISR record, with what it never counts and the appeal), the tier ladder with how you reach and lose each rung and what it is worth on a WeO, and who is around you. Sheets: improve your standing, edit your profile (photo, name, handle, bio), the tier ladder, your public page, passport settings with your data download. `/passport#tier` and friends open a section.
- O-Wallet: the hub with the wallet panel and your passport as a layer, money rows, the four buckets with why nothing is held, where the passport works, the peg (99 Os = $1) and O Power "not measured yet", the apps price list with your advantage (no buttons), and the record.
- Settings: account (email and phone shown; changes open your O-Wallet account), time zone, privacy, the notification matrix with digest and quiet hours, wallet, appearance, connected apps, download your data, help and legal, and deactivate / delete as requests a person confirms — which you can cancel.
- Backend (`redesign/m09-identity-money`): the settings store (channels per group, digest, quiet hours, time zone, receipts) applied to In app and Push delivery; account requests; data export; a profile photo and a 409 for a taken handle; the ISR inputs say what they ask and their cap; the wallet peg is the settlement figure.
- Shell: the section hero no longer squeezes its controls off a phone screen when it carries a feature card.

## M08 — People & requests (2026-10-05)

- Creators: the snapshot boards (standing, settled, reach, weeks live), creators by standing with Mya as your guide, records that open into their WeOs in orbit (collect one, circle them), and the WeOs from creators you circle. `/creators/:id` opens that record.
- The creator sheet, from any face — the WeO page, Discover's stage, Collect and Exchange: their standing, what they made, what they did in public, and Collect, Circle them, Track drops, Invite into a Circle and Contact, each obeying their settings.
- Requests: open briefs as cards or a list, the brief panel (offer one you hold, ask in its circle, make a WeO for it), your own brief's offers and closing it. `/requests/:id` opens that brief. "Make a WeO for this" seeds the composer and posts to that ask.
- Tracking: the WeOs you track with what changed since you started, and the creators you track; a WeO is tracked from its page.
- Backend (`redesign/m08-people-requests`): the tracking watchlist with notes and drop alerts, circle invites, brief fields (who asked, who offered, its circle, open / yours / offered) and closing a brief, creator WeO counts, weeks live and circles.

## M07 — Create (2026-10-05)

- Create: the O with eight formats on its ring (Sell, Pool, Bid and Request live; Hunt, Drop, Gift and Subscription "coming soon" with Notify me), the edges playing each section's stage, docks for your drafts, templates, open asks and tracking, the template shelf and sheet.
- The composer: module rails, the WeO named and priced on itself, uploads (a cover and up to two more, one video), Draft with Mya, tags, terms per format, the card view, and drafts that save themselves.
- Preflight shows what goes live and what you receive; posting asks where — the whole network, a Circle, or one person's open ask. A Request goes straight to the asks board. "Edit WeO" in Exchange reopens a live WeO in the composer.
- Backend (`redesign/m07-create`): the O rate for the client, media upload, Mya's description draft, the templates catalogue; a regular WeO now keeps the format its creator chose (a small-edition Sell no longer reads as a Drop).
- Shell: a sign-in link no longer wraps itself.

## M06 — Collect & Exchange (2026-10-03)

- Collect: what you hold in Os (what you put in, value now, if you resold today), Needs you (confirm it arrived / something is wrong / it would fetch more / read the pool's report), your WeOs by format with Resell, Track and Circle, the snapshot (movers, formats, creators, awaiting) with "Where your Os sit", and the wallet.
- Exchange: what you flow — listings and drafts with Live / Draft / Closed tabs, a ⋯ menu (Edit, Inactivate / Activate, Push to hub), preflight on drafts, the snapshot with "Needs attention", and the creators who share your circles.
- Relist sheet: your ask in Os on the dial, figures from the backend's resell quote.
- Backend (`redesign/m06-collect-exchange`): snapshots no longer count dollars as Os or double-count stock; re-listings stay live and can be collected; confirm receipt, dispute, pause/activate and the resell quote; only a WeO's creator can delete it; auto-paid installments now reach the seller; anonymous backers stay anonymous; other members' email addresses are no longer shown or searchable in circle and follow lists.

## M05 follow-up (2026-10-03)

- Sessions survive several open tabs: one refresh at a time across tabs, and signing out in one tab signs out the others.
- Backend: votes can't double-count or fail when two land together; a thread view counts once per person; reports no longer show other reporters or moderator notes; other people's profiles no longer include contact details and the full user list is staff-only; a circle's WeO count matches its WeOs tab, which now lists every WeO the circle holds.

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
