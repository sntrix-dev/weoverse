# 05 — API integration

Backend: `weo-3.0`, local base URL **`http://localhost:3002/api`**. Full endpoint inventory: `reference/backend-inventory.md` §5. Swagger UI: `/api/docs`, JSON: `/api/docs.json`.

## Surfaces

| Prefix | Used by this app | Auth |
|---|---|---|
| `/api/frontend/*` | everything the user does | `Authorization: Bearer <accessToken>` |
| `/api/frontend/auth/*` | login/refresh/logout | public (rate-limited 15 / 15 min) |
| `/api/chatbot/ask`, `/ask/stream` | Mya dock (M02) | public |
| `/api/admin/*`, `/api/mcp`, `/api/weo-website/*` | not used | — |

## Envelope

```ts
// success
{ success: true,  message: string, data: T }
// error (ResponseHandler / errorHandler)
{ success: false, message: string, data: null | unknown, error: string, errors?: {field:string; message:string}[] | null }
```

`api/client.ts` unwraps `data` and throws `ApiError { status, message, fieldErrors?, code? }`.

**Non-envelope responses the client must tolerate** (known backend quirks):
- `authenticate` failures return **plain text** (`No token`, `Invalid token`, `Not an access token`) with 401; deleted/banned/suspended accounts return an envelope with `data.code` `ACCOUNT_DELETED|ACCOUNT_BANNED|ACCOUNT_SUSPENDED` (401/403).
- Rate limiters return `{message}` with **429**. The global limit is **70 req/min per IP** by default (`RATE_LIMIT_PER_MIN` in the backend env, M12) — batch reads, rely on the query cache, and prefer the screen-shaped endpoints (`nav-summary`, `wallet/overview`, `*/snapshot`, `users/me/passport`).
- `GET /frontend/categories` returns raw documents (no envelope).
- Validation failures are **422** with `errors[]` → map to form field errors.

## Pagination

`?page=&limit=` (limit ≤ 100). Response `data: { <items|rows|…>, pagination: { total, page, limit, totalPages } }`. Use `useInfiniteQuery` for feeds and rails.

## Types

`npm run api:types` → `openapi-typescript http://localhost:3002/api/docs.json -o src/api/generated/schema.d.ts`. Without a running backend: `npx ts-node src/docs/swagger/build-cli.ts 2>/dev/null | grep -v '^◇' > /tmp/openapi.json` in `weo-3.0`, then `npm run api:types -- /tmp/openapi.json`. Feature code imports DTO types from there (`components['schemas']['WeoCardView']`). Swagger is partly stale for older endpoints (see inventory §6); when the live response disagrees with Swagger, fix the YAML in the backend module's branch — the code wins.

## Conventions

- One `queryKeys` factory: `qk.weos.list(params)`, `qk.weos.detail(id)`, `qk.community.circle(id)` …
- Query hooks live in `features/<f>/api/queries.ts`; mutations in `mutations.ts` with optimistic update + rollback + invalidation.
- Adapters in `features/<f>/model/` turn DTOs into view models. WeO cards use `lib/cardModel.ts` — a typed port of the design's `weo-model.js` `cardModel()` (format: `crowdfund→Pool`, `lottery→Hunt`, regular + negotiable → `Bid`, regular + limited drop → `Drop`, else `Listing`).
- Money: backend stores Os and USD; display with `lib/os.ts` only. The O↔USD peg comes from the backend (OConfig), not hard-coded.
- Dates: ISO strings from the API; relative time via `lib/time.ts`.

## Endpoint map (living — update at step 10 of every module)

| Module | Screen / block | Method + path | Status |
|---|---|---|---|
| M01 | Login | `POST /frontend/auth/verify` | wired (`api/auth.ts`); live round trip → M02 |
| M01 | O-Wallet (IdP, not our API) | `{wallet}/api/oauth/authorize` (PKCE), `{wallet}/api/auth/social/google` (Google via the wallet), `{wallet}/api/oauth/logout` (end the wallet session) | wired (`api/auth.ts`, D-029/D-030) |
| M01 | Token refresh / logout | `POST /frontend/auth/new_access_token`, `POST /frontend/auth/logout` | wired (`api/client.ts` single-flight refresh, `api/auth.ts` logout); Swagger fixed in M01 |
| M02 | Shell (avatar, balance, tier, counts, prefs) | `GET /frontend/users/me/nav-summary` | exists |
| M02 | UI preferences | `GET/PATCH /frontend/users/me/preferences` | exists |
| M02 | Bell badge | `GET /frontend/notifications/unread-count` | exists |
| M02 | Mya dock | `POST /chatbot/ask` (`/ask/stream` SSE) | exists |
| M03 | Every WeO card (kit, via `lib/cardModel.ts`) | `WeoCardView` rows — `weoverse.priceOs/priceUsd`, crowdfund `contribution` (added M03) | adapter + fixtures; fetched from M04 |
| M04 | Discover hero stats | `GET /frontend/weos/discovery-snapshot` | wired (`features/discover/api/discover.ts`) |
| M04 | Browse by interest | `GET /frontend/weos/interests` | wired |
| M04 | Feed | `GET /frontend/feed?limit=24` | wired (`model/feed.ts` maps legacy hrefs) |
| M04 | Rails / floor / search | `GET /frontend/weos?sort=recent\|trending\|ending_soon&status=active&feed=following&search&limit` | wired (`features/weo/api/weos.ts`) |
| M04 | Who is trading | `GET /frontend/creators?sort=isr&limit=12` | wired (`trace7d` added M04) |
| M04 | Circles behind the floor | `GET /frontend/community/circles?filter=all` | wired |
| M04 | WeO detail | `GET /frontend/weos/:id` | wired; `/collectors`, `/ratings` not used yet |
| M04 | Collect flow | `GET /frontend/weos/:id/collect/quote` → `POST /frontend/weos/:id/collect` (`quote.payload`) | wired (`features/collect/api/collect.ts`) |
| M04 | Like | `POST/DELETE /frontend/weos/:id/like` | hook ready (`useLikeWeo`); no surface in the design's M04 screens |
| M05 | Your / open circles | `GET /frontend/community/circles?filter=all` | wired (`features/community/api/community.ts`) |
| M05 | Circle page | `GET /frontend/community/circles/:id` (+ `collectThrough7d`, M05), `/members?limit`, `/weos` | wired |
| M05 | Join / leave / mute | `POST …/:id/join`, `DELETE …/:id/leave`, `PATCH …/:id/notification` | wired |
| M05 | Questions feed | `GET /frontend/community/discussions?filter=all\|open\|resolved\|mine` (+ `attachedWeoFace`, M05) | wired |
| M05 | Thread | `GET /frontend/community/threads/:id`; `POST …/threads/:id/answers`; `POST /frontend/community/answers/:id/vote\|replies\|accept` | wired (vote optimistic) |
| M05 | New discussion / push / ask about a WeO | `POST /frontend/community/threads`, `POST /frontend/community/push` | wired (D-040) |
| M05 | Report | `POST /frontend/report` | wired (D-041) |
| M05 | Stewards, stories, pulse | `GET /frontend/community/snapshot/contributors` (+ steward fields, M05), `/stories`, `/snapshot/pulse` | wired (D-036) |
| M05 | Follow | `POST /frontend/users/:id/follow`, `DELETE /frontend/users/:id/unfollow` | wired (400/404/409, M05) |
| M05 | In flight | `GET /frontend/me/drafts`, `GET /frontend/community/my-weos` (fixed M05) | wired (D-037) |
| M05 | Wallet row | `GET /frontend/wallet/overview`, `GET /frontend/me/collections?limit=3`, `POST /frontend/wallet/transfer` | wired (D-038) |
| M06 | Collect: holdings, needs you, stats, pulse, boards | `GET /frontend/me/collections/snapshot?window=7d` (Os fixes + `format`, `redeemedAt`, `disputedAt`, M06) | wired (`features/collect/api/holdings.ts`) |
| M06 | Confirm receipt / dispute | `POST /frontend/me/collections/:id/redeem`, `/dispute` (new, M06) | wired (D-044, D-045) |
| M06 | Relist | `GET /frontend/weos/:id/resell/quote` (new, M06), `POST /frontend/weos/:id/resell {amountOs, collectionId, …}` | wired (D-046) |
| M06 | Exchange: listings, stats, pulse, boards | `GET /frontend/me/listings/snapshot?window=7d` (fixes + `status`, `paused`, `isResellable`, `format`, M06), `GET /frontend/me/drafts` | wired (`features/exchange/api/listings.ts`, D-047) |
| M06 | Inactivate / Activate | `PATCH /frontend/weos/:id/status` (new, M06) | wired (optimistic, rolls back) |
| M06 | Creators in your circles | `GET /frontend/creators?circle=joined` (new param + `bio`, M06), fallback `sort=isr` | wired |
| M06 | Rate | `POST /frontend/weos/:id/rating` | exists |
| M07 | Post / save an edit | `POST /frontend/weos`, `POST /frontend/request-weos`, `PUT /frontend/weos/:id` | wired (`features/create/api/create.ts`, D-051) |
| M07 | O peg | `GET /frontend/config/o` (new, M07) | wired — every Os → dollar conversion |
| M07 | Media upload | `POST /frontend/media/presign` → `PUT` the file to the signed S3 link (D-099; image ≤ 10 MB, video ≤ 100 MB). `POST /frontend/media` (raw body) is no longer called | wired (`uploadMedia`, `MediaUploader`) |
| M07 | Draft with Mya | `POST /frontend/ai/describe` (new, M07; 10/min per user) | wired (`AiDraft`) |
| M07 | Templates | `GET /frontend/templates` (new, M07; tier gating) | wired (D-050) |
| M07 | Drafts (autosave, carry on) | `/frontend/me/drafts*` | wired (`useAutosave`, 2.5 s quiet) |
| M07 | Categories, asks | `GET /frontend/categories`, `GET /frontend/request-weos` | wired |
| M07 | Post into a circle | `POST /frontend/community/push` after the create (D-056) | wired |
| M07 | Format a WeO was made as | `format` on regular create / update and on every WeO card (additive, M07, D-058) | wired (`lib/cardModel.ts formatOf`, composer payload) |
| M08 | Creators directory, boards | `GET /frontend/creators?sort=isr&limit=48` (+ `weos`, `weeksLive`, `circlesLed`, M08) | wired (`features/creators/api/creators.ts`) |
| M08 | Creator record / sheet | `GET /frontend/creators/:id` (+ `viewer.tracked`, M08) | wired (`CreatorPanel`, `CreatorSheet`) |
| M08 | Circle them | `POST /frontend/users/:id/follow`, `DELETE …/unfollow` | wired (D-059) |
| M08 | Track drops, tracking page, Track it | `GET /frontend/me/tracking`, `POST/DELETE /frontend/me/tracking/{weos,creators}/:id` (new, M08) | wired (`features/tracking`, D-060, D-062) |
| M08 | Invite into a circle | `POST /frontend/community/circles/:id/invite {userId}` (new, M08) | wired (`CreatorSheet`) |
| M08 | Open briefs, one brief | `GET /frontend/request-weos?status=open`, `GET /frontend/request-weos/:id` (+ `by`, `offerers`, `circle`, `open`, `mine`, `offered`, M08) | wired (`features/requests`) |
| M08 | Offer one you hold | `POST /frontend/request-weos/:id/accept` (a regular-WeO body from your WeO, your figure) | wired (`OfferSheet`, D-061) |
| M08 | Offers on your brief, close it | `GET /frontend/request-weos/:id/accepted-weos`, `POST /frontend/request-weos/:id/close` (new, M08) | wired (`RequestPanel`, D-065) |
| M08 | Make a WeO for this | `/create?forRequest=:id` → `POST /frontend/weos` with `requestedId` | wired (D-067) |
| M10 | Notifications list, chips, day groups | `GET /frontend/notifications?limit=50&page&category&read=false` (+ `target`, `categories`, sender without email — M10) | wired (`features/notifications`, D-082, D-084) |
| M10 | Open a row, Mark all read | `PATCH /frontend/notifications/:id/read`, `PATCH /frontend/notifications/read-all` | wired (the bell refreshes) |
| M10 | Company pages | `GET /frontend/company` (new, public, M10) | wired (`features/company`, D-080) |
| M11 | World Studio — keep a draft's terms | `POST /frontend/me/drafts/:id/rehearsal` (new) | wired (`features/worlds`) |
| M11 | Flow simulation — settle | `POST /frontend/weos/:id/rehearsals`; contexts `GET /frontend/weos/interests`; floor `GET /frontend/weos?status=active` | wired (D-094) |
| M11 | In flight | `GET /frontend/me/drafts` (+ `vetting`), `POST /frontend/me/drafts/:id/open-reactions`, `/open-pledges` (new) | wired (D-091) |
| M11 | Vetting sheet, Circle "Waiting" | `GET /frontend/vetting/:id`, `GET /frontend/vetting?circleId=`, `POST /frontend/vetting/:id/reactions`, `POST/DELETE /frontend/vetting/:id/pledges` (new) | wired (D-086, D-090) |
| M11 | Intros seen | `PATCH /frontend/users/me/preferences` (`seen`) | wired (D-088) |
| M12 | In flight — validated | `GET /frontend/community/my-weos` (`validated`) | wired (D-095) |
| M12 | Live bell | socket.io `/authenticated` (`auth.token`), event `notification:new` | wired (`api/live.ts`, D-096) |
| M12 | Account states | any 403 with `data.code` `ACCOUNT_*` | wired (`api/accountState.ts`, D-097) |
| M12 | A rejected account request | `GET /frontend/notifications` (`target.kind: settings`) | wired → Settings `#danger` |
| M10 | Careers interest | `POST /weo-website/careers-module` | wired (`CareersSheet`, D-083) |
| M09 | Passport (hero, standing, tier, orbit, public switches) | `GET /frontend/users/me/passport` (+ `inputs[].do`, `.cap`, M09) | wired (`features/passport`, D-074) |
| M09 | Your graph | `GET /frontend/users/me/graph` | wired |
| M09 | Edit profile, photo | `PATCH /frontend/users/me/profile` (+ `avatarUrl`, 409 on a taken handle, M09) · `POST /frontend/media/presign` + S3 PUT | wired (`EditProfileSheet`) |
| M09 | Public page switches, who can reach you | `PATCH /frontend/users/me/public-profile` | wired (passport and settings) |
| M09 | O-Wallet page | `GET /frontend/wallet/overview` (peg = settlement 99, M09) · `GET /frontend/me/collections` (orbit) | wired (`WalletPage`, D-072, D-077) |
| M09 | Move Os | `POST /frontend/wallet/transfer` | wired (M05 `WalletRow`) |
| M09 | Settings | `GET/PATCH /frontend/users/me/settings` (new, M09) | wired (`features/settings`, D-075) |
| M09 | Deactivate / delete request | `POST/DELETE /frontend/users/me/account-request` (new, M09) | wired (D-070) |
| M09 | Download your data | `GET /frontend/users/me/export` (new, M09) | wired (a JSON file) |
| M09 | Appearance | `PATCH /frontend/users/me/preferences` | wired (M02 store) |
| M09 | Email, phone, password | O-Wallet account page (`manageUrl`) | link out (D-071) |
| M08 | Creators | `GET /frontend/creators`, `/creators/:id`, `/weos/top-creators` | exists |
| M08 | Follow / circle a person | `/frontend/users/:id/follow`, `/circle/*` | exists |
| M08 | Requests | `/frontend/request-weos*` | exists |
| M08 | Tracking | — | **gap** |
| M09 | Passport, graph, profile | `/frontend/users/me/passport`, `/graph`, `/profile`, `/public-profile`, `/me/tier` | exists |
| M09 | Wallet | `/frontend/wallet/overview`, `/transfer`, `/topup`, `/withdraw`, `/transaction-logs`, `/owallet/overview` | exists |
| M09 | ISR / activity | `/frontend/activity/me`, `/me/history`, `/leaderboard` | exists |
| M10 | Notifications | `/frontend/notifications*` | exists (route order fixed in M10) |
| M11 | Rehearsals | `POST/GET /frontend/weos/:id/rehearsals`, `GET /frontend/me/rehearsals` | exists |
| M11 | Reactions / pledges lifecycle | — | **gap** |

Gaps are tracked in detail in each module spec and in `weo-3.0/docs/redesign/api-gaps.md`.
