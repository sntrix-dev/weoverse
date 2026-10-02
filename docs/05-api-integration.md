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
- Rate limiters return `{message}` with **429**. The global limit is **70 req/min per IP** — batch reads, rely on the query cache, and prefer the screen-shaped endpoints (`nav-summary`, `wallet/overview`, `*/snapshot`, `users/me/passport`).
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
| M07 | Media upload | `POST /frontend/media` (new, M07; raw body, image ≤ 10 MB, video ≤ 100 MB) | wired (`MediaUploader`) |
| M07 | Draft with Mya | `POST /frontend/ai/describe` (new, M07; 10/min per user) | wired (`AiDraft`) |
| M07 | Templates | `GET /frontend/templates` (new, M07; tier gating) | wired (D-050) |
| M07 | Drafts (autosave, carry on) | `/frontend/me/drafts*` | wired (`useAutosave`, 2.5 s quiet) |
| M07 | Categories, asks | `GET /frontend/categories`, `GET /frontend/request-weos` | wired |
| M07 | Post into a circle | `POST /frontend/community/push` after the create (D-056) | wired |
| M08 | Creators | `GET /frontend/creators`, `/creators/:id`, `/weos/top-creators` | exists |
| M08 | Follow / circle a person | `/frontend/users/:id/follow`, `/circle/*` | exists |
| M08 | Requests | `/frontend/request-weos*` | exists |
| M08 | Tracking | — | **gap** |
| M09 | Passport, graph, profile | `/frontend/users/me/passport`, `/graph`, `/profile`, `/public-profile`, `/me/tier` | exists |
| M09 | Wallet | `/frontend/wallet/overview`, `/transfer`, `/topup`, `/withdraw`, `/transaction-logs`, `/owallet/overview` | exists |
| M09 | ISR / activity | `/frontend/activity/me`, `/me/history`, `/leaderboard` | exists |
| M10 | Notifications | `/frontend/notifications*` | exists (one route bug) |
| M11 | Rehearsals | `POST/GET /frontend/weos/:id/rehearsals`, `GET /frontend/me/rehearsals` | exists |
| M11 | Reactions / pledges lifecycle | — | **gap** |

Gaps are tracked in detail in each module spec and in `weo-3.0/docs/redesign/api-gaps.md`.
