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
| M01 | Token refresh / logout | `POST /frontend/auth/new_access_token`, `POST /frontend/auth/logout` | wired (`api/client.ts` single-flight refresh, `api/auth.ts` logout); Swagger fixed in M01 |
| M02 | Shell (avatar, balance, tier, counts, prefs) | `GET /frontend/users/me/nav-summary` | exists |
| M02 | UI preferences | `GET/PATCH /frontend/users/me/preferences` | exists |
| M02 | Bell badge | `GET /frontend/notifications/unread-count` | exists |
| M02 | Mya dock | `POST /chatbot/ask` (`/ask/stream` SSE) | exists |
| M03 | Every WeO card (kit, via `lib/cardModel.ts`) | `WeoCardView` rows — `weoverse.priceOs/priceUsd`, crowdfund `contribution` (added M03) | adapter + fixtures; fetched from M04 |
| M04 | Discover hero stats | `GET /frontend/weos/discovery-snapshot` | exists |
| M04 | Browse by interest | `GET /frontend/weos/interests` | exists |
| M04 | Feed | `GET /frontend/feed` | exists |
| M04 | Floor / closing / moving | `GET /frontend/weos?sort=recent|trending|ending_soon&weoType&categoryId&search&minPrice&maxPrice&feed=following` | exists |
| M04 | Search | `GET /frontend/search`, `GET /frontend/weos/search` | exists |
| M04 | WeO detail | `GET /frontend/weos/:id`, `/collectors`, `/ratings` | exists |
| M04 | Collect flow | `GET /frontend/weos/:id/collect/quote`, `POST /frontend/weos/:id/collect` | exists |
| M04 | Like | `POST/DELETE /frontend/weos/:id/like` | exists |
| M05 | Circles, members, WeOs, join/leave/mute | `/frontend/community/circles*` | exists |
| M05 | Threads, answers, votes, replies, accept | `/frontend/community/threads*`, `/community/answers/*` | exists |
| M05 | Stories, pulse, contributors, my standing, search | `/frontend/community/stories`, `/community/snapshot/*`, `/community/search` | exists |
| M05 | Push WeO to circle | `POST /frontend/community/push` | exists |
| M05 | Report | `POST /frontend/report` | exists |
| M06 | Holdings | `GET /frontend/me/collections`, `/snapshot`, `/:collectionId` | exists |
| M06 | Listings | `GET /frontend/me/listings`, `/history`, `/snapshot`, `/:id` | exists |
| M06 | Relist | `POST /frontend/weos/:id/resell` | exists |
| M06 | Rate | `POST /frontend/weos/:id/rating` | exists |
| M07 | Create / update | `POST /frontend/weos`, `PUT /frontend/weos/:id` | exists |
| M07 | Drafts | `/frontend/me/drafts*` | exists |
| M07 | Media upload | — | **gap** |
| M07 | AI draft | — | **gap** |
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
