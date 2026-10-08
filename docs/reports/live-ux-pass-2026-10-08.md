# Live UX pass — production backend (2026-10-08)

The app was run at `localhost:5173` against the deployed backend `https://api.ocono.me`. This is the same code as the Netlify `v2/dev` build at `32c0ef2`. Scope was agreed with Surya:

- Create one WeO of each kind, then pause them.
- Collect: stop at the review step.
- Top-up: stop at the payment step.
- Hub, Circles, profile and settings: read-only.

## Blockers on the deployed backend (not app code)

| # | What people see | Cause | Fix (owner: Surya) |
|---|---|---|---|
| B1 | No WeO can be posted. The cover upload fails, so Preflight never clears. | `POST /frontend/media` → 500 `S3 media upload not configured: S3_MEDIA_BUCKET is required.` | Set `S3_MEDIA_BUCKET`, `AWS_REGION`, AWS credentials (and optionally `S3_MEDIA_PUBLIC_URL`) on the server, then restart. |
| B2 | About 9 in 10 WeOs in the feed can't be opened. Their page and the Collect sheet fail, so collecting is impossible. `/weos` lists 500 too. | `GET /frontend/weos/:id` and `/weos` → 500 `[weo.projection] Unknown weoType: undefined`: the prod DB has not run the unification migration. | `npx ts-node scripts/migrations/run-unification.ts` (dry run), then `--confirm`. The backend list-safety fix `e9d2d34` (`redesign/m12-hardening`) is not in backend `v2/dev` yet. |
| B3 | Circles: none to join, none joined. | `GET /community/circles` → `{joined: [], suggested: []}`: the predefined circles were never seeded on prod. | `npm run seed:community` (needs categories: `npm run seed:categories`). |

## Fixed in the app

| # | Issue | Fix | Files |
|---|---|---|---|
| F1 | When the backend stalled, requests and the token refresh hung with no end. Every tab sat empty with a balance of "—", then signed out. | Every request has a deadline: 20 s, uploads 120 s, refresh 15 s. A stall becomes a readable 504. A refresh that can't reach the server keeps the session, and the cross-tab lock is released. | `src/api/client.ts` |
| F2 | Server errors were shown to people word for word (e.g. "S3_MEDIA_BUCKET is required"). An Express 404 page was shown as raw HTML. | A 5xx reads "Something went wrong on our side — try again in a moment."; the server's text stays in `ApiError.detail`. HTML bodies are never used as messages. Upload failures say the draft is kept. | `src/api/client.ts`, `MediaUploader.tsx` |
| F3 | Toasts rendered under the floating O nav and the flow bar. `#root` is its own stacking context, so z-index 3000 inside it lost to body portals at 2000 and 1300. | Toasts portal to `<body>` and sit above the bottom chrome. | `Toasts.tsx`, `Toasts.module.css` |
| F4 | A failing WeO read showed a spinner for about 10 s (a 500 was retried twice with backoff) before the error. | Only 502/503 are retried, once. A 500 or a 504 (which already waited its deadline) fails straight away. | `src/api/queryClient.ts` |
| F5 | The WeO page was blank while loading. Any failure said "isn't on the floor", even when the server was at fault. | It shows a spinner while loading. A 5xx shows "This WeO didn't open" with Try again; a 404 still says it isn't on the floor. | `WeoPage.tsx` |
| F6 | Your own WeO's price block offered "Ask". | It's hidden on your own WeO; Edit / Push to the Hub carry it. | `WeoPage.tsx` |
| F7 | Google profile photos showed the broken-image glyph. `lh3.googleusercontent.com` refuses hotlinks that send a Referer. | `<meta name="referrer" content="no-referrer">`. Any avatar that still fails falls back to its initials. | `index.html`, `Avatar.tsx` |
| F8 | Composer module row: the title overlapped its value ("Categor[Technology]…"). | The title keeps its width; the value ellipsizes. | `ModWell.tsx` |
| F9 | When scrolled, the composer's sticky module rail slid under the sticky breadcrumb. | The rail sticks below the breadcrumb (top 120). | `ModRail.tsx` |
| F10 | Manage Circles: "Open Circles" stood over nothing. A failed load said "You have not joined a circle yet". | Added an empty state and an error line. | `ManagePage.tsx` |

Tests were added for F2 (5xx message, HTML body) and F7 (avatar fallback). The F1 tests are in `client.test.ts`.

## Open — needs a decision

| # | Issue | Options |
|---|---|---|
| D1 | **Top-up is a dead end.** The design makes Top up a toast: "Top up in WeO Local — money moves there". Collect's "short by" sends people to the wallet, where Top up only shows that toast. The backend already has `POST /frontend/wallet/topup`: it debits the O-Wallet and credits Os, with a 1,000 O daily limit, and `GET /wallet/o_balance`. | (a) Build an in-app Top up sheet over those endpoints: the O-Wallet balance, an amount, the daily limit, then confirm. (b) Link out to WeO Local / O-Wallet. (c) Keep the design as is. |
| D2 | Hunt and Drop are "coming soon" on the create ring (CRE-12, D-051). Only Sell, Bid, Pool and Request have composers. | Build their composers (new module), or keep "soon". |

## Not reached

- Posting, pausing, the Collect review and Push to the Hub on someone else's WeO: blocked by B1/B2. Two drafts, "[UX test] Sell" and "[UX test] Bid", are left in the Hub's drafts.
- 390 px: the browser window could not be resized from the test harness. The phone layouts were last checked in M12.

## Seen and left as designed

- The floating O nav sits over page content mid-scroll (design: chrome.jsx QuickJump). Pages keep 190 px of bottom padding, so nothing ends up hidden under it.
- Section intros and the Mya tour play on a first visit to each section.
