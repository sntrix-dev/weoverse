# M08 — People & requests

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ⏳ in progress | `feat/m08-people-requests` | `redesign/m08-people-requests` (from `redesign/m07-create`) | `reports/M08-people-requests.md` |

## Screens

| Path | Design | Blocks, in design order |
|---|---|---|
| `/creators`, `/creators/:creatorId` | `creators.jsx` `CreatorsScreen` | PathBar (WeOverse › Creators) · SectionHero "01 — Creators / Who is trading, and how well" (stats Creators trading / You circle / WeOs from them / Stewards; priorities; directory; foot `SnapshotPanel` boards standing / settled / reach / consistency) · **02 — People** "Creators, by standing" (`CreatorGrid`: `MyaRecord` ↔ `MyaPanelProfile`, `CreatorRecord` ↔ `CreatorPanel` with the WeO orbit, Collect a WeO / Circle them / Close; `:creatorId` opens that record) · **03 — Their work** "WeOs from creators you follow" (`WeoView`) |
| `/requests`, `/requests/:requestId` | `requests.jsx` `RequestsScreen` | PathBar · SectionHero "01 — Requests / Someone wants it made" (stats Open briefs / Offers in / WeOs that could answer / Circles asking; priorities incl. Post a request; foot: Open briefs with Cards / List, Ask in a Circle, `RequestCard` / `RequestRecord` → `RequestPanel`: Offer one you hold → `OfferSheet`, Ask in {circle}, Close, the orb "Make a WeO for this" → `/create?forRequest=`) · **02 — Answering** "WeOs that could answer these" (`WeoList`). `:requestId` opens that brief (design bug #1 fixed) |
| `/tracking` | `tracking.jsx` `TrackingScreen` | PathBar (hub path) · lead Scene (SectionMark Tracking, h1, Tabs WeOs N / Creators N, search) · WeOs: `WeoView` (stall tiles; Rail / Cards / Orbit / List) + note cards · Creators: `TrackedCreatorRow`s (Open record, Track) |

Global sheets: `CreatorSheet` (`screens-network.jsx`) opened from any face or name (snapshot boards, WeO page creator, orbit, stewards…); `OfferSheet` (`screens-flows.jsx`, the card flow).

## API map

| Block | Endpoint | Status |
|---|---|---|
| creators grid, boards, hero | `GET /frontend/creators?sort=isr&limit=48` | OK + additive `weos`, `weeksLive`, `circlesLed` (BE) |
| creator record / sheet | `GET /frontend/creators/:id` (stats, orbit, activity, `shows`, `viewer`) | OK (+ `viewer.tracked`, BE) |
| their work | `GET /frontend/weos?feed=following` | OK |
| stewards stat | `GET /frontend/community/snapshot/contributors` | OK |
| circle them | `POST /frontend/users/:id/follow`, `DELETE …/unfollow` | OK |
| track drops / tracking page | `GET /frontend/me/tracking`, `POST/DELETE /frontend/me/tracking/weos/:id`, `…/creators/:id` | **BE new** (notes from what changed since you started tracking; trackers hear when a tracked creator lists) |
| invite into a Circle | `POST /frontend/community/circles/:id/invite {userId}` | **BE new** (a notification; obeys `publicProfile.invites`) |
| contact | compose (`/community/threads`) in a shared circle | OK |
| open briefs, offers, circles asking | `GET /frontend/request-weos?status=open` | OK + additive `status` filter, `where`, `offerers`, `circle {id,name,image}`, `mine` (BE) |
| one brief | `GET /frontend/request-weos/:id` | OK (+ same additive fields) |
| offer one you hold | `POST /frontend/request-weos/:id/accept` (a requested WeO at your figure, made from one of your WeOs) | OK |
| offers on my brief | `GET /frontend/request-weos/:id/accepted-weos` | OK |
| make a WeO for this | `/create?forRequest=:id` → `POST /frontend/weos` with `requestedId` | OK |
| post a request | `/create` → Request | OK (M07) |

## Decisions

- D-059 "Circle them" follows (as M05 / M06); "Track drops" is the tracking watchlist — trackers are notified when that creator lists.
- D-060 Tracked WeO notes are computed by the backend from what changed since you started tracking (price, what is left, status, closing soon).
- D-061 "Offer one you hold" offers one of your own live WeOs at your figure: the backend's accept endpoint makes a requested WeO (visible only to the requester) from it. No fee line (settlement takes none, D-055).
- D-062 A WeO is tracked from its page (a directory entry "Track it"), which the tracking page's empty state points to.
- D-063 "Circles asking" = category circles with an open brief; a brief's image is its category circle's cover.
- D-064 Rehearse buttons (creator panel, Mya, request panel) wait for M11 (D-027).

## Gaps

| Need | Status |
|---|---|
| Tracking watchlist + notes + drop alerts | BE new |
| Invite into a community circle | BE new |
| Request `where`, offerers, circle, open filter | BE additive |
| Creator `weeksLive`, `weos`, `circlesLed` on the list | BE additive |
| Steward role | none (M05: top contributors) |

## Acceptance criteria

- Creator sheet opens from anywhere; Circle them, Track drops and Invite persist.
- `/creators/:id` and `/requests/:id` open that record / brief.
- Offer one you hold reaches the requester's offers; Make a WeO for this pre-fills Create and posts to that ask.
- Tracking add / remove persists; the page shows tracked WeOs (with notes) and creators.
- All three screens at parity (1440×900, 390×844, light and dark), network 2xx, zero console errors.
