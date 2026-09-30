# M08 — People & requests

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m08-people-requests` | `redesign/m08-people-requests` | `reports/M08-people-requests.md` |

## Screens

| Path | Design | Blocks |
|---|---|---|
| `/creators`, `/creators/:creatorId` | `creators.jsx` | SectionHero "Who is trading, and how well" (4 stats, priorities, directory, SnapshotPanel boards standing/settled/reach/consistency) · **Creators, by standing** (`CreatorGrid`, `CreatorPanel`: Collect a WeO / Circle them / Rehearse a pairing; `MyaRecord`/`MyaPanelProfile`) · **WeOs from creators you follow** |
| `/requests`, `/requests/:requestId` | `requests.jsx` | SectionHero "Someone wants it made" (Open briefs / Offers in / WeOs that could answer / Circles asking; Post a request) · Open briefs list (cards/list, `RequestPanel`: Offer one you hold → `OfferSheet`, Ask in a circle, Rehearse, Make a WeO for this → `/create?forRequest=`) · **WeOs that could answer** |
| `/tracking` | `tracking.jsx` | Tabs WeOs N / Creators N + search; WeoView + notes; `TrackedCreatorRow` |

Global sheet: `CreatorSheet` (`screens-network.jsx`) opened from any face/name.

## API map

| Block | Endpoint |
|---|---|
| creators list / one | `GET /frontend/creators`, `/creators/:id`, `/weos/creators/:id` |
| follow / circle | `POST /frontend/users/:id/follow`, `DELETE …/unfollow`, `POST /frontend/circle/add/:userId`, `DELETE /circle/remove/:userId`, `GET /circle/status/:userId` |
| creator stats | `GET /frontend/activity/user/:userId`, `/score` |
| requests | `GET /frontend/request-weos`, `/:id`, `/my-requests`, `POST /request-weos`, `POST /:id/accept`, `GET /:id/accepted-weos` |

## Gaps

| Need | Proposal |
|---|---|
| Tracking watchlist (WeOs + creators, with notes) | new module `weo-track`: `POST/DELETE /frontend/me/tracking/weos/:id`, `…/creators/:id`, `GET /frontend/me/tracking` (notes optional) |
| "Offer one you hold" to a request | accept with an existing holding → resell flow tagged `requestedId`; confirm with backend owner |
| Request "offers in" count, "circles asking" | additive fields on RFQ list |
| Request `where` (free text) | additive optional string (D-006) |
| Mya as a creator record | seeded Mya user + static profile copy (`WV.MYA`) |

## Acceptance criteria

- Creator sheet from anywhere; follow/circle persist.
- `/requests/:id` opens that panel (design bug #1 fixed); make-for-request pre-fills Create.
- Tracking add/remove persists; page shows tracked WeOs and creators.
