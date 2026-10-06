# M10 — Notifications & company

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ done 2026-10-06 | `feat/m10-notifications-company` (from `develop`) | `redesign/m10-notifications-company` (from `redesign/m09-identity-money`) | `reports/M10-notifications-company.md` |

## Screens

| Path | Design | Blocks, in design order |
|---|---|---|
| `/notifications` | `notifications.jsx` `NotificationsScreen` | PathBar (hub path) · lead: SectionMark "Notifications", h1 "N waiting on you" / "Nothing waiting", Unread only · Mark all read · Settings (→ `/settings#notifications`) · category chips with counts · day groups (Today / Yesterday / This week / Earlier) of Card rows: tone bar, picture or O mark, title, body, time, unread dot · EmptyState "Nothing under this lens" with Show everything · Show earlier (more pages) |
| `/company/:doc?` | `company.jsx` `CompanyScreen` | PathBar · lead: SectionMark "WeO Global", h1 = the page's lead, chips About / Careers / Privacy / Terms / Cookies · body paragraphs · facts StatGrid (About) · Careers: no openings + "Tell us about you" sheet · draft note on the legal pages · Back to the WeOverse, Ask Mya about this |

## API map

| Block | Endpoint | Status |
|---|---|---|
| list, day groups, unread, chips | `GET /frontend/notifications?limit&page&category&read=false` (+ `target`, `categories`, sender without email — M10) | BE additive / approved removal |
| open a row | `PATCH /frontend/notifications/:id/read` → navigate to `target` | OK |
| Mark all read | `PATCH /frontend/notifications/read-all` | OK |
| the bell | nav summary `notifications.unread` (M02) — invalidated on read | OK |
| company pages | `GET /frontend/company` (new, public) | BE new |
| Careers interest | `POST /weo-website/careers-module {name, email, role, experience, portfolio?}` | OK (the website's form) |

## Mapping

- `target.kind` → route: `weo` → `/weos/:id`, `request` → `/requests/:id`, `collected` → `/collect`, `listed` → `/exchange`, `wallet` → `/wallet`, `creator` → `/creators/:id`, `passport` → `/passport`, `thread` → `/community/threads/:id`, `circle` → `/community/circles/:id`; `null` → marked read, stays.
- Chips: Everything, WeOs (`weo`), Requests (`weo-request`), Collections (`collection`), Payments (`payment`), Resell (`resell`), Wallet (`wallet`), General (`general`); Community and System appear when they hold something. Counts are totals (the design counts everything in a category).
- Tone bar ← `type` (info / success / warning / error); picture ← `image`, else the sender's photo, else the O mark.

## Decisions (to `decisions.md`)

- D-080 Company pages: the design's copy, corrected — the settlement peg, no invented figures or openings, Privacy / Terms / Cookies matched to what the app does — served by the backend and marked draft until reviewed. (Surya)
- D-081 A notification's sender is a name and a face; the email is no longer sent. (Surya)
- D-082 Where a notification goes is resolved by the backend (`target`); a row with nowhere to go is marked read and stays.
- D-083 Careers lists no openings; "Tell us about you" sends the website's careers form, name and email prefilled from your account.
- D-084 Day groups come from `createdAt` in your local time: Today, Yesterday, This week, Earlier. Fifty rows a page, "Show earlier" for more.
- D-085 The bell stays a dot fed by the nav summary; real-time push to the bell waits for a socket emit (G-71).

## Gaps

| Need | Status |
|---|---|
| `DELETE /notifications/read` shadowed by `/:id` | fixed (G-18) |
| Where a notification opens | BE additive (G-67) |
| Sender email exposed | fixed (G-68, Surya) |
| Category totals; `community` missing from counts | BE additive (G-69) |
| Company / legal content | BE new (G-70); legal review open |
| Real-time bell | open (G-71) |

## Acceptance criteria

- Notifications at parity: h1 count, Unread only, Mark all read, Settings link, chips with counts, day groups, unread styling, empty state.
- Opening a row marks it read (the bell follows) and goes where `target` says; Mark all read clears the dot.
- Company: all five pages from the backend, the chips switch pages and the URL, the peg reads 99, the legal pages say they are drafts, Careers sends the interest form (tested by code).
- 1440×900 and 390×844, light and dark, network 2xx, zero console errors.
