# Backend inventory — weo-3.0 (snapshot 2026-09-30)

> Read-only reconnaissance of the backend taken before the redesign started (branch phase1/v3 @ d8fe909). Treat code as source of truth; re-verify an endpoint before relying on it. Section 14 lists doc drift.

# weo-3.0 (weo-versh) backend: repository reconnaissance report

Paths are relative to the repo root (`weo-3.0/`). `node_modules`, `backup/`, `backups/`, `bkpup/` and `_to_delete/` were skipped. Only `.env` variable names are listed, never values.

**The main finding:** several rules in `CLAUDE.md` and `readme.md` no longer match the code, especially auth, `req.user`, LangChain, tests and CI. The drift is flagged inline and collected in §14. Treat the code as the source of truth.

---

## 1. `CLAUDE.md`, `readme.md`, `docs/` and `ACTIVITY_SERVICE_PLAN.md`

### 1.1 CLAUDE.md rules
**Project**
- The project is "weo-versh", the backend for the WeO marketplace.
- The frontend repo is `/Users/sanjivkumarpandit/Desktop/WEO/weoverse`: "Cross-check shapes there before changing API responses."
- The default PR branch is `main`.

**Dependency pins** (§2)
- "**PINNED EXACT.** Do NOT upgrade" Mongoose 8.16.1, because `pre('save')` changed in 9.x.
- TypeScript 6: `types: ["jest","node"]` must stay in tsconfig.
- "**PIN to ^3.**" for Zod.
- Firebase Admin ^14 uses the modular API.
- "any package currently pinned to an exact or `^x.y` range above is pinned for a documented reason. Do NOT bump it without a separate, explicit conversation."

**Module layout** (§3)
- Every feature lives in `src/modules/<name>/` as `<name>.model.ts`, `.service.ts` ("no HTTP, no Express types"), `.controller.ts`, `.route.ts` and `.validate.ts`.
- Admin variants are `admin.<name>.{controller,route,validate}.ts`.
- "When adding a new module, mirror an existing one (e.g. `src/modules/weo/crowdfund/`) — don't invent a new layout."

**Response envelope** (§4, "HARD CONTRACT")
- Shape: `{ success, message, data, error?, errors? }`.
- "**Always** use `ResponseHandler.success(...)` / `ResponseHandler.error(...)`. Never write `res.json(...)` by hand in a controller."
- "Never add new top-level fields to the envelope."
- `errors` is `Array<{field,message}>` and is "set ONLY by `src/shared/middlewares/zod.validate.ts`."

**Wire-shape preservation** (§5, "NON-NEGOTIABLE")
- "Every existing field stays with the same name, same type, same default, same validator."
- "New fields may be added."
- "Removed / renamed / re-typed fields require explicit user approval per field."
- Smoke-test changes and diff the JSON so the response stays "byte-identical" unless an additive change was approved.

**Auth** (§6)
- Routes use `router.get('/path', authenticate, authorizeRoles(Role.USER, Role.ADMIN), controller)`.
- "Never read JWT claims by hand in a controller — always go through `req.user`."
- Admin routes use `authenticateAdmin`.
- **Drift:** CLAUDE.md says RS256 via jwks-rsa and `req.user = { userId, role }`. The code actually uses HS256 and `req.user = { id, role }` (see §8).

**WeO unified schema** (§7)
- There is one `offers` collection. `WeoModel` is the parent, with `discriminatorKey: 'weoType'`.
- Children are `OfferModel` (regular), `CrowdfundModel` and `LotteryModel`.
- "NEVER spread `...weoBaseFields` into a discriminator child schema."
- "NEVER set `collection:` on a child."
- "NEVER add a competing text index on a child schema."
- "`weoType` is NOT declared as a field."
- Children may narrow `status`.
- `weoType` (the kind) is distinct from `type` (the Offer lifecycle: `normal | requested | resold`).
- The migration script is `scripts/migrations/2026-06-22-unify-weo-collections.ts`, which is idempotent.

**Validation** (§8)
- Every input-accepting endpoint has a Zod schema in `<module>.validate.ts` and is run by the middleware, not inside controllers.
- "do NOT use `z.issues` … or `AnyZodObject`."
- **Drift:** `zod.validate.ts` itself imports `AnyZodObject`.

**Database** (§9)
- Use `Types.ObjectId` with `ref`.
- Put indexes in the model file, never both `index:true` and `Schema.index`.
- Use the async `pre('save')` form with no `next()`.
- Soft-delete uses `isDeleted: boolean`; don't `findOneAndDelete` soft-deletable records.

**Logging** (§10)
- Use the Winston logger. "Never use `console.log`."
- Re-throw controller errors to the error middleware.

**Testing** (§11)
- "All 157 tests must pass before any commit that touches `src/`."
- "Integration tests hit a real MongoDB (no mocks…)."
- **Drift:** almost all tests are mock-based unit tests (see §11).

**Swagger** (§12)
- Specs are hand-authored YAML in `docs/swagger/`.
- Document every new endpoint "payload example **with optional fields** included."
- Check with `npm run docs:lint` and `/api/docs`.
- The `SWAGGER_MODULES` allowlist filters which modules render.

**Workflow** (§13)
- "Do not commit unless the user explicitly says so." Same for push.
- Hold at each "schema first" gate until told to proceed.
- "**Never use `--no-verify`**."
- "Never amend" and "Never force-push to `main`."
- Stage with `git add <specific files>`.
- "**Always branch off the current local branch, not `main`.** … do NOT `git checkout main` first … If you think the new work genuinely belongs on `main`, ask before switching."

**Style** (§14)
- No `any`.
- Naming: `IFoo` for interfaces, `FooSchema` for schemas, `FooModel` for models.
- Comments only for *why*.
- No emojis.
- Relative imports only, with no baseUrl aliases.

### 1.2 readme.md (adds to or differs from CLAUDE.md)
- **Quick start:** `npm install` → `cp .env.example .env` → `npm run seed` → `npm run dev`.
- **Local URLs:** API at `http://localhost:3002/api/...`, Swagger at `/api/docs`, spec at `/api/docs.json`.
- **Required env vars per the readme:** MONGO_URI, JWT_SECRET, REFRESH_TOKEN_SECRET, ADMIN_JWT_SECRET, ADMIN_REFRESH_SECRET. `config.ts` also requires AUTH_SERVER, SESSION_SECRET and OAUTH_TOKEN_ENCRYPTION_KEY.

**API surfaces table**

| Prefix | Auth |
|---|---|
| `/api/frontend/*` | userBearer |
| `/api/admin/*` | adminBearer |
| `/api/weo-website/*` | public |
| `/api/chatbot/*` | public |
| `/api/mcp` | API key `wko_…` |
| `/api/frontend/me/api-keys/*` | userBearer |
| `/api/admin/mcp/api-keys/*` | adminBearer |
| `/api/docs` | none |

**Other readme content**
- Unified WeO endpoints are `POST/GET /api/frontend/weos` and `GET /weos/:id`.
- The "kind-specific surfaces" list is partly stale: crowdfund back/backers/cancel and lottery buy no longer exist in code, and `/offers/*` is retired.
- The readme's description of test layout is stale ("157 tests across 4 suites").
- The readme's branch chain (`feature/campaigns → feature/weo-module → feature/migrate-offer-to-weo`) is stale.
- Contributing rules repeat the git rules: never commit or push without approval, no `--no-verify`, no amend, and stage by name.
- LangChain drift: the readme says "^0.3 (pinned)", but `package.json` and CLAUDE.md are on 1.x.

### 1.3 `docs/` contents

| File | Gist |
|---|---|
| `ADMIN_API.md` | Narrative reference for `/api/admin/*` and `/api/auth/admin/*`: auth, envelope, per-endpoint docs (1284 lines). |
| `ADMIN_API_PLAN.md` | 2026-07-09 plan: admin endpoint inventory, outdated fixes and new admin endpoints to add. |
| `API_RESPONSE_FORMAT_MIGRATION.md` | snake_case → camelCase response migration guide (breaking change, now done). |
| `ARCHITECTURE.md` | "Clean Architecture" layer doc from an older refactor. **Stale:** it references `src/shared/errors/*`, which doesn't exist. |
| `COMMUNITY_HUB_PLAN.md` | Community Hub (Q&A and circles layer) plan v2. The FE was built against mocks (`VITE_USE_MOCK_OFFERS`). |
| `DEPS_LATEST_BREAKAGE_REPORT.md` | Results of bumping dependencies to @latest: which were kept, which were pinned back (mongoose, zod, …), and the code fixes. |
| `FINAL_SCHEMA_SYNC_REPORT.md` | Dec 2025: IOffer interface vs OfferModel sync (historical). |
| `FRONTEND_MIGRATION_GUIDE.md` | FE guide for the snake→camel change. It mentions a transform layer that is now commented out in `ResponseHandler`. |
| `IMPLEMENTATION_CHECKLIST.md` | Checklist for an older refactor (error classes and so on). **Largely stale.** |
| `MIGRATION_GUIDE.md` | Old → new code patterns using custom error classes. **Stale.** |
| `OFFER_SCHEMA_COMPARISON.md` | Offer interface vs schema property table (historical). |
| `QUICK_START.md` | "Refactored code" usage guide for error classes. **Stale.** |
| `README_REFACTORING.md` | Index for the old refactor docs. It links files that don't exist, such as `REFACTORING_SUMMARY.md`. |
| `RESTRUCTURING_PROPOSAL.md` | Short "pro developer" folder-structure proposal. |
| `SCHEMA_INTERFACE_UPDATES.md` | Dec 2025 camelCase migration of schemas and interfaces. |
| `TEST_COVERAGE_AUDIT.md` | 2026-05-26 audit: 157 tests, supertest unused, "No CI workflow runs the suite." Now outdated: there are 57 test files. |
| `VALIDATION_SCHEMA_UPDATES.md` | Zod schema camelCase migration. |
| `WEO_COLLECT_UNIFIED_PLAN.md` | 2026-06-24 plan for the unified `/weos/:id/collect` and the `weocollections` discriminator. |
| `WEO_UNIFIED_SCHEMA_PLAN.md` | The build spec for the discriminator single-collection design ("Every existing API response must come out byte-for-byte identical"). |
| `wallet.md` | 14-line tokenomics notes: 1$=100 O, 99 O to the user and 1 to the reserve pool, incentive scheme. |
| `check_security.txt` | Security audit report: "Overall Security Rating 4/10 – High Risk", listing critical and high findings. |
| `swagger/` | OpenAPI source (see §6). |

Other docs:
- `src/mcp/MCP.md` (public MCP docs)
- `src/mcp/README.md`
- `src/modules/ai/README.md`
- `src/weo-website/PLAN.md`
- `src/weo-website/weo-website-postman-collection.json`

### 1.4 `ACTIVITY_SERVICE_PLAN.md`
An older plan for the "Enhanced Activity Count Service" in seven phases:
1. Extend `WeoActivityType`.
2. Add an `ActivityLog` model with per-event history.
3. Admin-configurable weights in `WeoActivity`.
4. An enhanced activity service.
5. Admin config controller and routes.
6. Integration points.
7. User score (ISR) calculation.

It also lists the API endpoints and default weights. This is now implemented: see `src/modules/activity/*` and `/frontend/activity/*`, plus the admin-on-frontend `/frontend/admin/activity/*`.

---

## 2. package.json, tsconfig, jest, env, Mongo and port

**Scripts**

| Script | Command |
|---|---|
| `start` | `node dist/index.js` |
| `dev` | `nodemon src/index.ts` (watches `src` and `docs/swagger`, extensions ts/js/json/yaml) |
| `build` | `tsc` |
| `test` | `jest` (also `test:watch`, `test:coverage`) |
| `lint` / `lint:fix` | eslint |
| `docs:build` | `ts-node src/docs/swagger/build-cli.ts` |
| `docs:lint` | build, then `redocly lint` |
| `migrate:passports` | `scripts/migrations/2026-09-02-backfill-weo-passports.ts` |
| Seeders | `seed`, `seed:force`, `seed:config`, `seed:categories[:force]`, `seed:mya`, `seed:mya:circle`, `seed:admin`, `seed:community` |
| Category marks | `marks:upload[:dry]` |

**Key dependencies**

| Area | Packages |
|---|---|
| Server | express ^5.1.0, body-parser, cookie-parser, cors, helmet, express-rate-limit ^8, express-session |
| Data | mongoose **8.16.1** (exact), zod ^3.25.76, zod-to-json-schema |
| Auth | jsonwebtoken ^9, jwks-rsa ^4 (unused by `authenticate`), passport, passport-google-oauth20, passport-local, passport-custom, google-auth-library, bcrypt ^6 |
| Integrations | socket.io ^4.8.1, firebase-admin ^14, nodemailer ^9.0.1 (CLAUDE.md says 7.0.4), @aws-sdk/client-s3 |
| AI | @langchain/* 1.x, langchain ^1.5, faiss-node, pdf-parse ^2, @modelcontextprotocol/sdk ^1.29 |
| Other | node-cron ^4, winston, nanoid ^5 (ESM), change-case ^5 (ESM), slugify, cheerio, json-2-csv, axios, qs |

**Dev dependencies:** jest ^30.2, ts-jest ^29.4, supertest, jest-mock-extended, @jest-mock/express, typescript ^6.0.3, ts-node, eslint ^10 with typescript-eslint, @redocly/cli, swagger-ui-express, js-yaml, nodemon.

**Other config**
- `.npmrc`: `legacy-peer-deps=true`.
- **Node version:** there is no `engines` field or `.nvmrc`. The Dockerfile uses `node:22-alpine` and CI uses `22.x`, so this is effectively Node 22.

**tsconfig.json**
- target es2016, module commonjs, `rootDir ./src`, `outDir ./dist`, `strict`, `esModuleInterop`, `resolveJsonModule`, `skipLibCheck`.
- `typeRoots ["./node_modules/@types","./src/types"]` and `types ["jest","node"]`.
- declaration and sourceMap are on.
- Excludes `src/weo-website/ai`.
- `"ts-node": { "files": true }`, so the ambient `src/types/types.d.ts` loads under ts-node.

**jest.config.ts**
- Preset `ts-jest`, `testEnvironment: node`, `roots: ['<rootDir>/src']`.
- `testMatch`: `**/__tests__/**/*.test.ts`, `**/*.test.ts`, `**/*.spec.ts`.
- `setupFiles: jest.setup.ts`, which generates `OAUTH_TOKEN_ENCRYPTION_KEY` when it's missing.
- `moduleNameMapper` maps `nanoid` and `change-case` to CJS stubs in `src/__mocks__/`.
- `clearMocks` and `restoreMocks` are on.
- Coverage is collected only for `src/modules/notification/**`.

**`.env.example` variable names**
PORT, AUTH_SERVER, NODE_ENV, SOCKET_ALLOWED_ORIGINS, CORS_ALLOWED_ORIGINS, JWT_SECRET, REFRESH_TOKEN_SECRET, JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES, ADMIN_JWT_SECRET, ADMIN_REFRESH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, OAUTH_TOKEN_ENCRYPTION_KEY, SMTP_USER, SMTP_PASS, OPENAI_API_KEY, AI_CHATBOT_PORT, SWAGGER_ENABLED, SWAGGER_ROUTE, SWAGGER_MODULES, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_MEDIA_BUCKET.

- **Missing from `.env.example` but required by `src/shared/config/config.ts` (`requireEnv`):** `MONGO_URI` and `SESSION_SECRET`. `AUTH_SERVER` is present.
- **Also read by config or other code but not in the example:** O_CLIENT_ID, O_CLIENT_SECRET, O_REDIRECT_URI, SMTP_HOST, SMTP_PORT, SMTP_SECURE, FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, MEDIA_MAX_UPLOAD_BYTES, MEDIA_MAX_BATCH_FILES, MEDIA_MAX_BATCH_TOTAL_BYTES, MEDIA_ALLOWED_CONTENT_TYPES, MCP_RATE_LIMIT_PER_MINUTE.

**Mongo connection:** `mongoose.connect(config.mongo_uri)` in `src/index.ts`. The DB name comes from the URI only; config says passing `dbName` is "a footgun." Seeders and migrations use the same style.

**Port:** `config.port = process.env.PORT || 3000`. The local `.env` has `PORT=3002`, and the Dockerfile has `EXPOSE 3000`.

---

## 3. Git state
- **Current branch:** `phase1/v3`.
- **Local branches:** `data/updated`, `main`, `phase1/v3`.
- **Remote branches:** `origin/HEAD → origin/main`, `data/updated`, `develop`, `feat/report-update-restore`, `feat/weo-list-creator-enrich`, `main`, `phase1/v3`, `prepare-v2`, `production-ready-1`, `review`, `tire-progress`.
- **Remote:** `origin` → `github.com/ksanjiv05/weo-3.0.git` (credentials in the URL were masked).

**Last 15 commits**
```
d8fe909 drafts: an unposted WeO gets somewhere to live
7d5ce61 weo: make PUT /weos/:id partial for regulars too
3b8d89b create, list and collected, also wallet
ce7b791 collecyed, listed and Profile
86fca98 Discovery Module API's added
b65c4f7 Admin Apis - Users, Weos, Report and Admin Auth
afcd8e3 feat(weo-view): add recently viewed WeOs endpoint and model
f48d015 discovery, listings, collections, community yhub
3717205 fix(mcp): stop search_weo silently ignoring its arguments; AND + relevance
c2dcab0 feat(weo): enrich creator block on /weos list + detail
b4db70b feat(community-circle): add optional `coverImage` field
1d1de7a feat(community): GET /community/search — cross-collection text search
76a7158 feat(community-story): add long-form `description` field
b7e0497 feat(community): GET /community/snapshot — rolling totals + top circles
00d0db7 feat(weo): minPrice/maxPrice filter on GET /frontend/weos (cross-kind)
```

**Uncommitted changes** (unstaged, 5 files, +325/−9)
- `docs/swagger/components/schemas/weo-listing.yaml` (+62)
- `src/modules/user/user.service.ts`: adds `UI_PREFERENCE_DEFAULTS` and `withPreferenceDefaults()`, so `uiPreferences` always comes back fully populated instead of `?? null`.
- `src/modules/weo-listing/weo.listing.projection.ts` (+83)
- `src/modules/weo-listing/weo.listing.service.ts`: `.populate('categoryId','name')` on the my-listings query, to denormalize `categoryName`.
- `src/modules/weo-listing/__tests__/weo.listing.projection.test.ts` (+115)

---

## 4. `src/` structure and architecture

**Directory tree (depth 3, trimmed)**
```
src/
  index.ts                     Express bootstrap (session, helmet, CORS, rate limit, swagger, routes, socket, jobs)
  routes/{index.ts, frontend/index.ts, admin/index.ts}
  modules/
    activity/  ai/{chains,chatbot,config,core,mcp,prompts,vector_store}  auth/  category/  circle/
    community/{circle,counters,discussions,my-weos,push,search,snapshot,story,__tests__}
    dashboard/  email-subscription/  feed/  feedback/  follow/  invitation/  media/  negotiation/
    notification/  o-wallet-token/  owallet-overview/  report/  request-weo/  search/  system-config/
    transaction/  user/{creators,passport}  wallet/{view}
    weo/{regular,crowdfund,lottery,collect/{core,query,quote,snapshot},counters,__tests__}
    weo-draft/ weo-installment/ weo-like/ weo-listing/{snapshot} weo-rating/ weo-rehearsal/ weo-resell/ weo-view/
  mcp/{auth,config,context,errors,idempotency,media,observability,server,tools,__tests__}
  interfaces/                  one I*.interface.ts per domain object (~37)
  shared/
    config/  (config, enum, constant, logger, rbac, socket, firebase, email.config, tier.config, standing.config, o.config.constant, ecosystem.config)
    middlewares/ (auth, admin.auth, error, zod.validate, rate-limit, logging, socket.auth, validate/*.validate.ts [legacy shared schemas])
    schema/ (weo.base.schema.ts, weo.collection.base.schema.ts)
    services/email.service.ts  sockets/events.ts  helper/  utils/ (responseHandler, jwt, admin.jwt, emitActivity, clampIsr, snapshotWindow, user-status, utils)
  jobs/  (node-cron registrations)
  scripts/ (seeders, one-off migrations, mongodb_bkp)
  docs/swagger/ (index.ts builder, build-cli.ts)
  weo-website/ {controllers,models,services,routes,validators,interfaces}  (public marketing forms, own layered layout)
  types/types.d.ts (Express req.user augmentation)
  __mocks__/ (nanoid, change-case CJS stubs)
scripts/migrations/  (repo-level data migrations)
```

**Request pattern**
```
router (route.ts)
  → [rate limiter] → authenticate | authenticateAdmin (+ requirePermission / authorizeRoles)
  → zodParamValidate / zodQueryValidate / zodValidate
  → Controller (static class methods or exported fns; reads req.user.id; try/catch → next(error) or ResponseHandler.error)
  → Service (business logic, Mongoose models, often static classes)
  → Model (Mongoose)
```
- **Projections:** `*.projection.ts` files shape the wire DTOs, for example `weo.projection.ts`, `weo.listing.projection.ts`, `circle.projection.ts` and `collect.projection.ts`.
- **Screen-shaped read endpoints:** "view", "snapshot" and "types" files (`wallet/view`, `*/snapshot`, `user/passport`) return one read per screen.
- **Error handling:** 65 of 72 controllers pass errors to `next(err)`, so they reach the global `errorHandler`.
- **Side effects:** notifications, activity logs and ISR updates are fired inside services, fire-and-forget.

---

## 5. Route mounting and the full endpoint inventory

**Mounting chain in `src/index.ts`**
1. `session`
2. `helmet` (CSP off)
3. COOP/CORP headers
4. `express.static('public')`
5. `cookieParser`
6. CORS (allowlist from `CORS_ALLOWED_ORIGINS`, `*` allowed, credentials on)
7. JSON body parsers: 40 MB for `/api/mcp`, 25 MB for `/api/admin/weos/import`, the default elsewhere
8. logging middleware
9. **globalLimiter: 70 requests per minute per IP on everything**
10. swagger (`/api/docs`, `/api/docs.json`)
11. `app.use('/api', routes)`
12. `app.use('/api/chatbot', chatBotRouter)`
13. `GET /health`
14. `errorHandler`

Socket.io is attached to the same HTTP server.

**`src/routes/index.ts` prefixes**

| Prefix | Router | Auth |
|---|---|---|
| `/api/auth` | `admin.auth.route` | public admin login, refresh and logout |
| `/api/frontend` | `routes/frontend/index.ts` | per-route `authenticate` |
| `/api/admin` | `routes/admin/index.ts` | `router.use(authenticateAdmin)` for everything, plus `requirePermission` on some routes |
| `/api/weo-website` | `weo-website/routes` | none |
| `/api/mcp` | `mcp/server/mcp.route` | API key |
| `/api/chatbot` | mounted in `index.ts` | none |
| `/health` | mounted in `index.ts` | none |

Router order in `frontend/index.ts` matters: `weoDiscoveryRoute` is mounted before `weoRoute` so that `/weos/discovery-snapshot` isn't captured by `/weos/:id`. The retired routers are `offerRoute`, `wishlistRoute` and `offerCollectionRoute`, with source moved to `backups/`.

**Legend**
- "JWT" means the `authenticate` middleware (end-user access token).
- "none" means a public route.
- All paths below are under `/api/frontend` unless stated.
- Purposes come from the swagger summaries. Endpoints marked † are not documented in swagger.
- Most frontend route files carry no additional validation middleware beyond what is shown.

### 5.1 Auth (`src/modules/auth/auth.route.ts`, all behind `authLimiter`: 15 per 15 min)

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| POST | /auth/is_user_exist | none | `isUserExist` | Does a user exist for `email_address` (plus whether it has an invitation code)? |
| POST | /auth/verify | none | `verifyAuthentication` | Exchange an OAuth `code` + `codeVerifier` (+ `redirectUri`) with AUTH_SERVER; returns first-party `accessToken`, `refreshToken` and `user`. |
| POST | /auth/new_access_token | none | `getNewAccessToken` | Rotate the refresh token (`refresh_token` in the body). |
| POST | /auth/logout | none | `logout` † | Revoke the refresh session (`refresh_token`). |

Swagger also documents `POST /frontend/otp` and `POST /frontend/login/verify`. **Neither exists in code.**

### 5.2 Users, passport, navigation and creators (`src/modules/user/user.route.ts`)

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /users/creator/dashboard | JWT | `getCreatorDashboard` | Creator dashboard stats |
| GET | /users/me/tier | JWT | `getUserTier` | Tier, progress and thresholds |
| GET | /users/me/nav-summary | JWT | `getNavSummary` | One read for the whole navigation shell |
| GET | /users/me/preferences | JWT | `getUiPreferences` | Shell UI preferences |
| PATCH | /users/me/preferences | JWT + zod `UI_PREFERENCES_PATCH_SCHEMA` | `updateUiPreferences` | Partial update of UI preferences |
| GET | /users/me/passport | JWT | `PassportController.getPassport` | Identity, standing and tier, one read for the whole screen |
| GET | /users/me/graph | JWT | `PassportController.getGraph` | "Who is around you" (social graph) |
| PATCH | /users/me/profile | JWT + zod | `PassportController.updateProfile` | Edit self-controlled profile fields |
| PATCH | /users/me/public-profile | JWT + zod | `PassportController.updatePublicProfile` | Public visibility and contact settings |
| GET | /creators | JWT | `CreatorsController.list` † | Creators list |
| GET | /creators/:id | JWT | `CreatorsController.get` † | One creator |
| GET | /users | JWT | `getUsers` | List all users (legacy debug endpoint) |
| GET | /users/:id | JWT | `getUser` | Get a user by id |
| PUT | /users | JWT + zod `USER_UPDATE_SCHEMA` | `updateUser` | Update own profile (legacy) |

### 5.3 Follow and circle (social graph)

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| POST | /users/:userId/follow | JWT | `FollowController.follow` | Follow a user |
| DELETE | /users/:userId/unfollow | JWT | `FollowController.unfollow` | Unfollow |
| GET | /users/followers | JWT | `FollowController.getFollowers` | My followers |
| GET | /users/following | JWT | `FollowController.getFollowing` | Users I follow |
| POST | /circle/add/:userId | JWT | `CircleController.addToCircle` | Add a user to my circle |
| DELETE | /circle/remove/:userId | JWT | `CircleController.removeFromCircle` | Remove from my circle |
| GET | /circle/my-circle | JWT | `getMyCircle` | My circle list |
| GET | /circle/status/:userId | JWT | `checkCircleStatus` | Is the user in my circle? |
| GET | /circle/count | JWT | `getCircleCount` | Circle count |
| GET | /circle/who-added-me | JWT | `getWhoAddedMe` | Who has me in their circle |

### 5.4 WeO core (`src/modules/weo/weo.route.ts`, `weo.discovery.route.ts`)

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /weos/discovery-snapshot | JWT | `WeoDiscoveryController.snapshot` | Discovery hero figures |
| GET | /weos/interests | JWT | `WeoDiscoveryController.interests` | Browse by interest (which format clears where) |
| POST | /weos | JWT + zod `CREATE_WEO_SCHEMA` (discriminated on `weoType`) | `WeoController.create` | Create any WeO kind |
| POST | /weos/requested | JWT + zod `REQUESTED_OFFER_ZOD_SCHEMA` | `createRequested` | Create a regular WeO fulfilling an RFQ |
| GET | /weos | JWT + zodQuery `LIST_WEO_QUERY_SCHEMA` | `list` | Cross-kind list (filters in the note below) |
| GET | /weos/search | JWT | `search` | Cross-kind text search |
| GET | /weos/top-creators | JWT | `topCreators` | Top creators by WeO count |
| GET | /weos/categories | **none** | `byCategories` | WeOs grouped by category |
| GET | /weos/creators | JWT | `creators` | Paginated creators |
| GET | /weos/creators/:id | JWT | `creatorById` | One creator's WeOs |
| GET | /weos/:id | JWT + zodParam | `getById` | Get a WeO (any kind) |
| GET | /weos/:id/version-history | JWT | `versionHistory` | Version history (regular only) |
| PUT | /weos/:id | JWT + zodParam + zod `UPDATE_WEO_SCHEMA` | `update` | Partial cross-kind update (`weoType` is required in the body) |
| DELETE | /weos/:id | JWT | `delete` | Delete a WeO (regular only) |

`GET /weos` filters: `weoType`, `page`, `limit`, `search`, `categoryId`, `creatorId`, `status`, `sort` (`recent | trending | ending_soon`), `feed=following`, `minPrice`, `maxPrice`.

### 5.5 Collect, likes, views, ratings, resell, draw, rehearsals, installments and negotiation

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| POST | /weos/:id/collect | JWT + zodParam | `CollectController.collect` | Collect / buy / back / buy tickets (any kind, unified) |
| GET | /weos/:id/collect/quote | JWT + zod | `CollectQuoteController.quote` | What pressing Confirm would do |
| GET | /weos/:id/collectors | JWT + zod | `collectorsOfWeo` | Collectors of a WeO |
| GET | /me/collections | JWT + zodQuery | `myCollections` | My collections (cross-kind) |
| GET | /me/collections/snapshot | JWT + zodQuery | `CollectionsSnapshotController.getSnapshot` | Holdings over a rolling window |
| GET | /me/collections/:collectionId | JWT + zodParam | `myCollectionDetail` | One of my collections |
| POST | /weos/:id/like | JWT + zodParam | `WeoLikeController.like` | Like (idempotent) |
| DELETE | /weos/:id/like | JWT + zodParam | `unlike` | Unlike |
| GET | /weos/:id/likers | JWT + zod | `likersOfWeo` | Paginated likers |
| GET | /me/liked-weos | JWT + zodQuery | `likedWeosByMe` | WeOs I liked |
| GET | /me/liked-creators | JWT + zodQuery | `likedCreatorsByMe` | Creators whose WeOs I liked |
| GET | /me/recently-viewed | JWT + zodQuery | `WeoViewController.recentlyViewed` † | Recently viewed WeOs |
| POST | /weos/:id/rating | JWT + zod | `WeoRatingController.submit` | Post-collect rating (collector only, once) |
| GET | /weos/:id/ratings | JWT + zod | `listForWeo` | Ratings for a WeO |
| GET | /me/ratings/:weoId | JWT + zodParam | `getMine` | My rating for a WeO, or null |
| POST | /weos/:id/resell | JWT + zod | `WeoResellController.resell` | Put a collected WeO back on the market |
| POST | /weos/:id/draw | JWT + zodParam | `DrawController.draw` | Trigger the lottery draw (owner only) |
| POST | /weos/:id/rehearsals | JWT + zod `SETTLE_REHEARSAL_SCHEMA` | `WeoRehearsalController.settle` | Settle a "World Studio" rehearsal to the ledger |
| GET | /weos/:id/rehearsals | JWT + zodQuery | `listForWeo` | A WeO's rehearsal history |
| GET | /me/rehearsals | JWT + zodQuery | `listMine` | Everything I settled |
| POST | /installments/pay | JWT + zod `PAY_INSTALLMENT_SCHEMA` | `WeoInstallmentController.pay` | Pay one or the remaining installments |
| POST | /negotiations | JWT + zod `NEGOTIATION_ATTEMPT_SCHEMA` | `NegotiationController.attempt` | Negotiation attempt on an offer |

### 5.6 Kind-specific: crowdfund and lottery

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /crowdfunds | JWT + zodQuery | `CrowdfundController.list` | List / discover campaigns |
| GET | /crowdfunds/:id | JWT + zodParam | `getById` | One campaign |
| PUT | /crowdfunds/:id | JWT + zod | `update` | [DEPRECATED] Update while untouched |
| POST | /crowdfunds/:id/postpone | JWT + zod | `postpone` | Extend the deadline |
| PUT | /lotteries/:id | JWT + zod | `LotteryController.update` | [DEPRECATED] Update while no tickets are sold |

Swagger still documents `POST /crowdfunds/{id}/back`, `GET /crowdfunds/{id}/backers` and `POST /lotteries/{id}/buy`. **None of these exist in code**; buying and backing are now `POST /weos/:id/collect`.

### 5.7 My listings and drafts

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /me/listings | JWT + zodQuery | `WeoListingController.myListings` | My listed WeOs |
| GET | /me/listings/history | JWT | `listingHistory` | Archived, completed and drawn WeOs |
| GET | /me/listings/snapshot | JWT + zodQuery | `ListingsSnapshotController.getSnapshot` | Storefront over a rolling window |
| GET | /me/listings/:id | JWT + zodParam | `myListingDetails` | Owner-only listing detail |
| GET | /me/drafts | JWT | `WeoDraftController.list` | My drafts |
| POST | /me/drafts | JWT + zod `SAVE_DRAFT_SCHEMA` | `create` | Start a draft |
| GET | /me/drafts/:id | JWT + zodParam | `get` | Read a draft |
| PUT | /me/drafts/:id | JWT + zod | `update` | Autosave a draft |
| DELETE | /me/drafts/:id | JWT + zodParam | `remove` | Discard a draft |

### 5.8 Requests (RFQ, "request-weos")

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /request-weos/my-requests | JWT | `RequestWeoController.getMyRequestOffers` | My RFQs |
| GET | /request-weos/creators/:creatorId | JWT | `getRequestedOffersByCreator` | RFQs by a creator |
| POST | /request-weos | JWT + zod | `create` | Create an RFQ |
| GET | /request-weos | JWT | `list` | List RFQs |
| POST | /request-weos/:id/accept | JWT + zod | `accept` | Seller accepts by creating a regular WeO |
| GET | /request-weos/:id/accepted-weos | JWT + zodParam | `getAcceptedWeosForMyRequest` | WeOs created for my RFQ |
| GET | /request-weos/:id | JWT | `getById` | One RFQ |

### 5.9 Wallet and transactions

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /wallet | JWT | `WalletController.getWallet` | My wallet |
| GET | /wallet/overview | JWT | `WalletViewController.getView` | The whole O-Wallet screen in one read |
| POST | /wallet/transfer | JWT + zod `WALLET_TRANSFER_SCHEMA` | `transfer` | Send earned Os to another passport |
| POST | /wallet/topup | JWT + zod `WALLET_ACTION_SCHEMA` | `topUp` | Top up (calls the upstream O-wallet IdP) |
| POST | /wallet/withdraw | JWT + zod | `withdraw` | Withdraw |
| GET | /wallet/o_balance | JWT | `getOWalletBalance` | Upstream O-wallet balance |
| GET | /owallet/overview | JWT | `OwalletOverviewController.getOverview` | O-currency overview (me and the platform) |
| GET | /transaction-logs | JWT | `getMyTransactionLogs` | My transaction log |

### 5.10 Community Hub

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /community/circles | JWT + zodQuery | `CommunityCircleController.list` | Joined and suggested circles |
| GET | /community/circles/:id | JWT + zodParam | `getById` | One circle |
| GET | /community/circles/:id/members | JWT | `getMembers` | Circle members |
| GET | /community/circles/:id/weos | JWT | `getAttachedWeos` | WeOs attached to the circle's threads |
| POST | /community/circles/:id/join | JWT | `join` | Join |
| DELETE | /community/circles/:id/leave | JWT | `leave` | Leave (soft) |
| PATCH | /community/circles/:id/notification | JWT + zod | `setNotification` | Notification preference (`off`, `weekly`, `all`) |
| GET | /community/discussions | JWT + zodQuery | `CommunityThreadController.listDiscussions` | Global discussions feed |
| POST | /community/threads | JWT + zod | `createThread` | New thread in a circle |
| GET | /community/threads/:id | JWT + zodParam | `getThread` | Thread with answers, replies and the caller's votes |
| GET | /community/threads/:id/related | JWT | `getRelatedThreads` | Related threads |
| POST | /community/threads/:id/answers | JWT + zod | `createAnswer` | Answer a thread |
| POST | /community/answers/:id/vote | JWT + zod | `voteOnAnswer` | Upvote, downvote or remove vote |
| POST | /community/answers/:id/replies | JWT + zod | `replyToAnswer` | Reply to an answer (one level only) |
| POST | /community/answers/:id/accept | JWT | `acceptAnswer` | Toggle accepted answer (thread author) |
| POST | /community/push | JWT + zod | `CommunityPushController.push` | Push a WeO to the Hub (creator only) |
| GET | /community/stories | JWT + zodQuery | `CommunityStoryController.list` | Published curated stories |
| GET | /community/my-weos | JWT + zodQuery | `CommunityMyWeosController.list` | My WeOs inside the Hub |
| GET | /community/snapshot/pulse | JWT + zodQuery | `CommunitySnapshotController.getPulse` | Window totals and trends |
| GET | /community/snapshot/circles | JWT + zodQuery | `getTopCircles` | Top circles |
| GET | /community/snapshot/contributors | JWT + zodQuery | `getContributors` | Top contributors |
| GET | /community/snapshot/me | JWT + zodQuery | `getMe` | My community standing |
| GET | /community/snapshot | JWT + zodQuery | inline handler | Deprecated; use `/snapshot/pulse` (sets a `Deprecation` header) |
| GET | /community/search | JWT + zodQuery | `CommunitySearchController.search` | Hub search |

### 5.11 Search, feed, notifications, activity, reports, feedback, misc

| Method | Path | Auth | Controller | Purpose |
|---|---|---|---|---|
| GET | /search | JWT + zodQuery | `GlobalSearchController.search` | Global search: WeOs, circles, creators |
| GET | /feed | JWT + zodQuery | `FeedController.page` | Four-kind editorial feed (WeOs, questions, requests, stories) |
| GET | /notifications | JWT | `getNotifications` | My notifications |
| GET | /notifications/unread-count | JWT | `getUnreadCount` | Unread count |
| GET | /notifications/category-counts | JWT | `getCategoryUnreadCounts` | Unread count per category |
| POST | /notifications/fcm-token | JWT | `saveFCMToken` | Register an FCM token |
| PATCH | /notifications/:id/read | JWT | `markAsRead` | Mark one as read |
| PATCH | /notifications/read-all | JWT | `markAllAsRead` | Mark all as read |
| DELETE | /notifications/:id | JWT | `deleteNotification` | Delete one |
| DELETE | /notifications/read | JWT | `deleteAllRead` | **Broken:** shadowed by `/:id` |
| GET | /activity/me | JWT | `ActivityController.getMyActivitySummary` | Activity counts and ISR |
| GET | /activity/me/history | JWT | `getMyActivityHistory` | Activity log |
| GET | /activity/leaderboard | JWT | `getLeaderboard` | ISR leaderboard |
| GET | /activity/user/:userId | JWT | `getUserActivitySummary` | Another user's summary |
| GET | /activity/user/:userId/score | JWT | `getUserScore` | Another user's ISR |
| GET/POST/PUT | /admin/activity/config[s], /config/:id, /config/:id/activate, /recalculate, /stats, /config/:id/weights, /weights | JWT + `authorizeRoles('admin')` | `ActivityController.*` | Activity weight config (admin role on the frontend surface) |
| POST | /report | JWT + zod | `ReportController.createReport` | Report a WeO, thread, answer, reply or user |
| GET | /reports/me | JWT | `getMyReports` | My reports |
| POST | /feedbacks | JWT + zod | `FeedbackController.create` | Submit feedback |
| GET | /feedbacks/my | JWT + zodQuery | `getMyFeedbacks` | My feedback |
| GET | /feedbacks/:id | JWT | `getById` | One feedback |
| GET | /feedbacks | JWT + zodQuery | `getAll` | All feedback ("admin-ish", no role check) |
| GET | /feedbacks/stats/summary | JWT | `getStats` | Stats ("admin-ish"). Registered after `/feedbacks/:id`; unlike the notifications case the paths differ in length, so it isn't shadowed. |
| PATCH | /feedbacks/:id/status | JWT + zod | `updateStatus` | Set status ("admin-ish") |
| DELETE | /feedbacks/:id | JWT | `delete` | Delete ("admin-ish") |
| GET | /categories | JWT | `getAllCategories` | All categories (returns raw docs, not the envelope) |
| POST/PUT/DELETE | /categories, /categories/:id | JWT | `create/update/deleteCategory` | Legacy category CRUD (no role check) |
| GET | /categories/:categoryId/subcategories | JWT | `getSubcategoriesByCategoryId` | Subcategories |
| POST/PUT/DELETE | /subcategories, /subcategories/:id | JWT | `create/update/deleteSubcategory` | Legacy subcategory CRUD |
| POST | /invitations/validate | none | `validateInvitation` | Validate an invite code |
| POST | /email-subscription/subscribe | none + zod | `EmailSubscriptionController.subscribe` | Newsletter subscribe |
| POST | /email-subscription/unsubscribe | none + zod | `unsubscribe` | Newsletter unsubscribe |
| GET | /email-subscription/check/:email | none | `checkSubscription` | Is the email subscribed? |
| GET | /email-subscription/count | none | `getCount` | Subscriber count |
| POST/GET/GET/PATCH/DELETE | /me/api-keys, /me/api-keys/:id | JWT + zod | `SelfApiKeyController.issue/list/detail/revoke/remove` † | Self-service MCP API keys. PATCH revokes. |

### 5.12 Admin surface (`/api/admin/*`, all behind `authenticateAdmin`)

Endpoints marked with an asterisk (*) also need a `requirePermission(...)` RBAC permission.

| Area | Endpoints |
|---|---|
| Identity | `GET /auth/me`, `POST /auth/logout-all` |
| Users* | `GET /users/stats`, `/users/export`, `/users`, `/users/:id`, `/users/:id/sessions`, `POST /users/:id/revoke-sessions`, `GET /users/:id/community`, `/users/:userId/activity-logs`, `/users/:userId/weos`, `/users/:userId/offers` (deprecated), `PATCH /users/:id/role`, `DELETE /users/:id`, `PATCH /users/:id/restore`, `/users/:id/status` |
| WeOs* | `GET /weos/stats`, `/weos`, `/weos/export`, `/weos/import/template`, `POST /weos/import` (25 MB CSV body), `GET /weos/:id`, `/weos/:id/customers`, `PATCH /weos/:id/{status,activate,deactivate,archive,restore,block,unblock}`, `DELETE /weos/:id` |
| Offers (legacy, sends deprecation headers) | `GET /offers/stats`, `/offers`, `/offers/:id`, `/offers/:id/customers`, `PATCH /offers/:id/{status,archive,restore}`, `DELETE /offers/:id` |
| Categories | `GET/POST /categories`, `GET/PUT/DELETE /categories/:id`, `GET/POST /categories/:id/subcategories`, `PUT/DELETE /categories/:id/subcategories/:subId` |
| Community | `POST /community/circles`, `PATCH/DELETE /community/circles/:id`, `GET /community/threads`, `GET/DELETE /community/threads/:id`, `PATCH /community/threads/:id/restore`, `DELETE /community/answers/:id` + `/restore`, `DELETE /community/replies/:id` + `/restore`, `POST /community/stories`, `PATCH /community/stories/:id{,/publish,/unpublish}`, `DELETE /community/stories/:id` |
| Moderation | `GET /reports/stats`, `/reports`, `GET/PUT/DELETE /reports/:id`; `GET /feedbacks/stats`, `/feedbacks`, `/feedbacks/:id`, `PATCH /feedbacks/:id/status`; `GET /request-weos`, `/request-weos/:id`, `PATCH /request-weos/:id/{block,unblock}`, `DELETE /request-weos/:id`; `GET /ratings`, `DELETE /ratings/:id`, `POST /ratings/recompute-denorms/:weoId` |
| Finance | `GET /wallets`, `/wallets/:userId`, `POST /wallets/:userId/{credit,debit}`, `PATCH /wallets/:userId/{isr,freeze,unfreeze}`; `GET /transaction-logs`; `GET /installments/stats`, `/installments`, `PATCH /installments/:id/waive`; `GET /resells`, `/resells/lineage/:rootOfferId` |
| Analytics and audit | `GET /dashboard/overview`, `/dashboard/users`, `/dashboard/users/export`; `GET /activity-logs`, `/activity-logs/stats`; `GET /weo-likes/stats`, `/weo-likes`; `GET /weo-views/stats`; `GET /follows`, `/follows/stats/:userId`, `POST /follows/purge/:userId` |
| System | `GET /system-config`, `PATCH /system-config`, `GET /system-config/history`; `GET /invitations`; `GET /email-subscriptions`, `/email-subscriptions/export`, `POST /email-subscriptions/:id/unsubscribe`; `POST /notifications/broadcast`, `GET /notifications`, `/notifications/users/:userId`, `DELETE /notifications/:id`; MCP keys: `POST/GET /mcp/api-keys`, `GET/PATCH/DELETE /mcp/api-keys/:id` |

**Admin auth (public, `/api/auth`):** `POST /admin/login` (`{email, password}`, authLimiter), `POST /admin/refresh-token` (`{refreshToken}`), `POST /admin/logout`.

### 5.13 Other public surfaces
- **`/api/weo-website/*`** (none, 25 routes): partnership (+ `/onboarding`, `/:id`), careers (+ `/:id`), investor, inquiry, contact, report, waitlist (+ `check/:email`, `count`), custom-integration, invite-request (+ `check/:email`, `count`), contact-module, careers-module (+ `check/:email`, `/:id`). These validate with in-handler `parse` and return **400** with `"Validation error: …"`.
- **`/api/chatbot`** (public): `POST /ask` (`{question, sessionId?}` → envelope `data: {answer, sessionId, degraded}` — `degraded` since redesign M02) and `POST /ask/stream` (SSE; sends `event: session` first, then tokens). Both use `zodValidate`.
- **`/api/mcp`**: `POST /` with `apiKeyAuth([])` → `handleMcpRequest`, Streamable HTTP JSON-RPC. Tools: `create_weo`, `validate_weo`, `search_weo`, `get_weo_details`, `list_categories`, `upload_media`, `upload_media_batch`.
- **`GET /health`**: raw `{status, uptime, timestamp}`.

---

## 6. Swagger / OpenAPI

**How it's built**
- The spec is hand-authored YAML; there are no swagger-jsdoc comments.
- The base is `docs/swagger/openapi.base.yaml`, which holds info, servers (`http://localhost:3002/api`, `https://api.weo.ai/api`) and tags.
- Components live in `docs/swagger/components/{securitySchemes.yaml, schemas/*.yaml, parameters/common.yaml, responses/common.yaml}`, with the envelope in `schemas/_envelope.yaml`.
- Paths live in `docs/swagger/modules/<module>.<surface>.yaml` (about 70 files).
- The builder is `src/docs/swagger/index.ts`. It deep-merges base, then components, then modules (filtered by `SWAGGER_MODULES`) and throws on duplicate path+method. All refs are internal `#/components/...`.

**Where to view it**
- `GET /api/docs` (Swagger UI) and `GET /api/docs.json`.
- It's enabled unless `NODE_ENV=production`, or by setting `SWAGGER_ENABLED=true`.
- In dev the spec rebuilds on every request.
- CLI: `npm run docs:build` or `npm run docs:lint`.

**Conventions** (`docs/swagger/README.md`)
- Every operation needs a unique camelCase `operationId`, plus `tags`, `summary`, `description`, `security` and `parameters`, each with an `example`.
- Include a 200 response plus 401/403/404/422/500.
- Security is `userBearer` for frontend, `adminBearer` for admin and `[]` for public.
- YAML descriptions containing a colon must be quoted.

**Verbatim example** (`docs/swagger/modules/weo-like.yaml`)
```yaml
paths:
  /frontend/weos/{id}/like:
    post:
      operationId: likeWeo
      tags: [Likes]
      summary: Like a WeO (any kind — unified)
      description: |
        Idempotent — re-liking is a 200 no-op (the unique
        `(userId, weoId)` index on `weolikes` swallows the dup-key).

        Atomic flow in a Mongo session:
          1. Insert WeoLikeModel row.
          2. `$inc favoritesCount` on the WeO doc (the unified
             likes counter; replaces the undocumented `likeCount`).

        **Replaces:** `POST /api/frontend/offers/:offerId/like` (the
        legacy route is commented out in `offer.route.ts`).

        Side effects (fire-and-forget): "X liked your WeO"
        notification to the creator + `WEO_LIKE` activity log.
      security:
        - userBearer: []
      parameters:
        - name: id
          in: path
          required: true
          description: Target WeO id (any kind).
          schema: { $ref: '#/components/schemas/ObjectId' }
      responses:
        '200':
          description: Liked (or already liked — idempotent no-op).
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/BaseResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          liked: { type: boolean, example: true }
        '400':
          description: Caller is the creator (can't like own WeO) OR invalid WeO id.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '404':
          description: WeO not found.
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorResponse' }
        '500': { $ref: '#/components/responses/ServerError' }
```

**Mismatches between the swagger spec and the code**
1. **A YAML bug in `docs/swagger/modules/weo.yaml`:** `put` and `delete` are nested under `/frontend/weos/{id}/version-history`. In code they are `PUT /weos/:id` and `DELETE /weos/:id`.
2. **Documented but not in code:** `/frontend/otp`, `/frontend/login/verify`, `/crowdfunds/{id}/back`, `/crowdfunds/{id}/backers`, `/lotteries/{id}/buy`.
3. **In code but not documented:** `/auth/logout`, `/creators`, `/creators/:id`, `/me/recently-viewed`, `/me/api-keys*`, `/chatbot/ask/stream`, all admin `/weos/export`, `/weos/import*`, `/users/:id/sessions`, `/revoke-sessions`, `/users/:id/community`, `/users/:id/role`, admin thread list/get, answer and reply delete/restore, story publish/unpublish, and admin `/auth/me` and `/auth/logout-all`.
4. `weo.draft` and `weo.rehearsal` don't set per-operation `security` (they rely on the default).

---

## 7. Mongoose models

Every model below gets `timestamps` (`createdAt`/`updatedAt`) unless noted.

### WeO family: one collection `offers`, parent `Weo` in `src/shared/schema/weo.base.schema.ts`
Options: `discriminatorKey: 'weoType'`, `strict: false`.

**Base fields**
- `userId` (ObjectId→User, required), `creatorName` (required), `title` (required), `description` (required)
- `slug`: auto-generated and unique across the collection via a `pre('validate')` hook
- `categoryId` (→Category, required), `categoryName` (required), `subCategory`, `tags[]`
- `media[{type, url, thumbnail?}]`
- `currency` enum `USD|O`, default `O`
- `isResellable`
- `status` enum WeoStatus, default `active`
- Counters: `viewsCount`, `favoritesCount`, `circleCount`, `participantsCount`, `activeNow`, `activeNowPrev`, `activeNowPrevAt`
- `publicId`: auto-minted `WEO-XXXXXX` "passport", unique and sparse
- `points[]`, `rarityNote`, `pushedToHubAt`
- `avgWeoRating`, `avgExperienceRating` (0–5), `reviewsCount`
- Virtual `user`
- One text index (`WeoTextIndex`) with weights: title 10, slug 5, tags 4, categoryName 3, creatorName 2, description 1

**WeoStatus values:** inactive, active, requested, resold, sold_out, funded, deadline_passed, drawing, drawn, delivering, completed, rejected, archived, blocked, disputed.

**Offer** (`weoType: 'regular'`, `src/modules/weo/regular/offer.model.ts`)
- `type`: OfferType `normal|requested|resold`
- `price{amount (required), priceSplit (required), negotiableUpTo}`
- `quantity{amount (required), negotiableUpTo, unitName}`
- `customerLimit`, `totalWeoInCirculation`, `soldCount`, `duration` (required), `availabilityTill`, `noOfInstallments` (default 1)
- `currentVersion`, `versions[]` (snapshots of title, description, category, price, media, changeSummary)
- `requestedId` (→RequestOffer), `resoldId` (→ResellOffer), `parentOfferId`, `rootOfferId`
- `lineage[{ownerId, offerId, soldAt, soldFor}]`
- `isArchived`
- Unique index on `(title, userId, resoldId, parentOfferId)`

**Crowdfund** (`weoType: 'crowdfund'`)
- `goal{amount (required, min 1), fiatEquivalent, currency}`
- `contribution{minimum (required, default 1), maximum}`
- `editionSize`, `deadline` (required), `duration`
- `deadlineExtensions[{from, to, at, reason}]`
- `milestones[{title, description, targetType amount|date, targetValue, proofRequirement text|media|link, order, status pending|in_progress|proof_submitted|verified}]`
- `useOfFunds[{label, allocation}]`
- `isScheduled`, `scheduledDate`, `raised`, `percentFunded`

**Lottery** (`weoType: 'lottery'`)
- `ticket{price, totalTickets, bundles[] default [1], perUserLimit default -1}`
- `prizes[{rank, title, description, valueType o|item, value, quantity}]` (at least one)
- `winnerCount`
- `draw{drawAt (required), mechanism 'provably_fair_rng', proofOfDraw, seedCommitment}`
- `transferability` `non_transferable|transferable`
- `eligibility{minAge, allowedRegions, blockedRegions}`
- `poolRules`, `isScheduled`, `scheduledDate`, `ticketsSold`, `currentOdds`, `winningTickets[]`, `drawSeed`, `drawProofRef`, `disputeWindowEndsAt`, `reward`
- Virtual `ticketsLeft`

**DrawProof** (`drawproofs`)
- `lotteryId` (unique), `drawnAt`, `drawnBy`, `algorithm 'random_v1'`, `seed`, `entryCount`, `participantCount`
- `awards[{ticketId, prizeRank, prizeTitle, prizeQuantity, collectionId, userId}]`

### Collections / orders: `weocollections`, parent `WeoCollection`, `discriminatorKey: 'collectionType'`
**Base:** `userId` (buyer), `sellerId`, `weoId` (→Weo), `amount`, `currency`, `status`, `isResold`.

- **RegularCollection:**
  - `status` `collected|delivered|cancelled|in_progress|rejected`
  - `quantity`, `oPriceTotal`, `perInstallmentAmount`, `totalInstallments`, `remainingInstallments`, `nextInstallmentDate`, `lastInstallmentId` (→OfferInstallment)
  - `paidAmount`, `isFullyPaid`, `autoPay`, `negotiationResult` (Mixed), `previousOwnerId`
- **CrowdfundCollection:** `status 'confirmed'`, `anonymous`, `message` (max 500)
- **LotteryCollection:** `status active|won|lost`, `ticketIds[]` (non-empty), `bundle`, `transferable`

### Other WeO-adjacent models
- **WeoInstallment** (model name `OfferInstallment`): `userId`, `sellerId`, `offerCollectionId` (→RegularCollection), `amount`, `oAmountCollected`.
- **WeoResell** (`ResellOffer`, collection `resellOffers`): `sourceOfferId`, `resoldOfferId`, `rootOfferId`, `collectedId`, `sellerId`, `previousOwnerId`, `amount`, `quantity`, `tags`, `chainDepth`.
- **RequestWeo** (`RequestOffer`, collection `requestoffers`; an RFQ):
  - `title` (lowercased), `description`, `userId`, `creatorName`, `categoryId`, `categoryName`
  - `price{min, max}`, `tags`, `deadline`, `viewsCount`
  - `status active|inactive|closed`, `updateCount`
- **WeoDraft** (`weo_drafts`): `userId`, `weoType|null`, `format`, `title`, `coverUrl`, `payload` (Mixed), `ready` (0–1).
- **WeoRehearsal:**
  - `userId`, `weoId`, `receiptId` (unique)
  - `world{id, name, fidelity 1–5}`, `context`, `contextRate`, `season`, `rivals` (0–1), `cohorts[]`
  - `terms{price, edition, days, bundle}`
  - `result{through, collectors, settled, firstHours, soldOut, verdict}`
- **WeoRating** (`weoratings`): `userId`, `weoId`, `collectionId`, `weoRating` 1–5, `experienceRating` 1–5, `note` (≤500).
- **WeoLike** (`weolikes`): `userId`, `weoId` (unique pair).
- **WeoViewHistory:** `userId`, `weoId`, `viewCount`, `lastViewedAt`.
- **NegotiationAttempt:** `userId`, `offerId`, `noOfAttempts`.

### Users, auth and social
- **User** (`src/modules/user/user.model.ts`). Note that `_id` is supplied externally and equals the IdP user id.
  - Identity: `oWalletId` (required, unique), `googleId`, `fullName`, `bio`, `emailAddress` (required, unique), `creatorName`
  - Credentials: `isPasswordSet`, `password` (`select:false`, bcrypt-hashed in `pre('save')`)
  - Profile: `profileImage`, `fcmTokens[]`, `phoneNumber{countryCode, number}`, `address`, `tags`, `interests[]` (→Category), `invitationCode`
  - `role`: `user|vender|admin|super_admin|moderator|finance|support`
  - Counters: `followersCount`, `followingCount`, `circleCount`, `weoCount`, `collectCount`, `referralCount`
  - `language`, `tier` (`not applicable|participant|player|prime`), `isr` (default 100), `weoFormats[]`
  - `publicProfile{collections, activity, invites, contact anyone|circles|off}`
  - `uiPreferences{theme light|dark, currency, navMode bar|split, railOpen, navDock float|top, motion full|calm, myaHidden, dockPosition{r,b}, weoView cards|carousel|orbit|list, snapshotBoard collected|creators|circles|campaigns|remixes, density roomy|compact, media rich|quiet, valueDisplay os|both, mutedFormats[], mutedKinds[]}`
  - `notificationEnabled`, `notificationPreferences{weo, weo-request, collection, payment, resell, wallet, general, system}`
  - Status: `isDeleted`, `status active|suspended|banned`, `statusReason`, `statusUpdatedBy`, `statusUpdatedAt`
- **Session:** `userId`, `jti` (unique), `tokenHash`, `audience user|admin`, `userAgent`, `ip`, `expiresAt`, `revokedAt`.
- **OWalletCredential:** `userId` (unique), `refreshTokenCipher`, `refreshTokenIv`, `refreshTokenAuthTag` (AES-256-GCM), `refreshTokenIssuedAt`, `refreshTokenExpiresAt`, `scope`.
- **Follow:** `followerId`, `followingId`, `isInCircle`, `circleAddedAt`. The "circle" is a flag on the follow edge.
- **Invitation:** `sourceName`, `invitationCode` (unique, lowercase), `expiration`, `referral`, `referrerId`, `used`.
- **ApiKey** (MCP): `keyHash` (unique), `keyPrefix`, `name`, `userId`, `scopes[weo:read|weo:write]`, `status active|revoked`, `lastUsedAt`, `expiresAt`.
- **McpIdempotencyRecord** (`mcp_idempotency_records`).

### Wallet and ledger
- **Wallet:**
  - `user` (unique), `oBalance` (≥0), `isr` (default 100), `burnRate`, `lastTopup`, `lastWithdrawal`
  - `totalEarns`, `totalSpent`, `totalCompleted/Incomplete/FailedTransactions`
  - `isFrozen`
- **TransactionLogs:**
  - `sellerId` (required), `buyerUserId`, `offerId`, `description`, `amount`, `oAmount`, `oRate`, `atUserIsrRate`, `atNetworkIsrRate`
  - `status pending|success|failed`, `type` (WeoActivityType), `requestId`, `failureReason`
- **OConfig** (tokenomics config): `usdAgainstO` 99, `oAgainstUsd`, `freeAttempt`, `initialAttemptORate`, `offerInstallation`, `burnRate`, `normalizeFactor`, `weightOfEarnO`, `weightOfSpendO`, `burnIsrImpactFactor`, `baseBurnRate`, `maxIsrBonusPercentage`, `networkActivityFactorWeight`, `networkActivityMultiplierBase`, `isActive`.

### Community Hub
- **CommunityCircle:**
  - `slug`, `name`, `axis` (`By WeO Type|By Category|General · Q&A|Platform · Support`), `axisLabel`, `description`, `coverColor`, `coverImage`, `tags`
  - `weoTypeKey`, `categoryId`, `isGeneral`, `isPlatform`
  - Counters: `memberCount`, `threadCount`, `weoCount`, `activeNow`, `resolvedRate7d`, `newWeosThisWeek`
  - `isOpen`, `isDeleted`, `avgFundTime`
- **CommunityMembership:** `userId`, `circleId`, `isJoined`, `notification off|weekly|all`, `joinedAt`, `leftAt`.
- **CommunityThread:**
  - `circleId`, `authorId`, `title`, `body`, `tags`, `status open|resolved`, `attachedWeoId`
  - Counters: `answerCount`, `replyCount`, `reactionCount`, `viewCount`, `voteScore`
  - `isPinned`, `acceptedAnswerId`, `isDeleted`
- **CommunityAnswer:** `threadId`, `authorId`, `body`, `voteScore`, `isAccepted`, `reactionCount`, `replyCount`, `isDeleted`.
- **CommunityReply:** `answerId`, `threadId`, `authorId`, `body`, `mention`, `isDeleted`.
- **CommunityVote:** `userId`, `answerId`, `threadId`, `value` ±1.
- **CommunityStory:** `weoId`, `threadId`, `title`, `cover`, `blurb`, `description`, `category`, `type` (WeoType), `duration`, `fundedStatus` (`Fully backed|Closed|Sold out`), `backerCount`, `isPublished`, `isDeleted`.

### Notifications, activity, moderation and misc
- **Notification:**
  - `title`, `message`, `type info|success|warning|error`
  - `category`: weo, weo-request, collection, payment, resell, wallet, general, community, system
  - `priority low|medium|high`, `recipient`, `sender`
  - `relatedEntity{entityType, entityId}`, `image`, `actionUrl`, `sendPush`, `read`, `readAt`
- **ActivityLog:** `userId`, `activityType` (WeoActivityType), `entityId`, `entityType`, `metadata`, `weight`, `points`.
- **Activity:** `userId`, `type`, `count`.
- **WeoActivity:** about 30 per-activity weights plus `name`, `description`, `isActive`. This is the ISR weight config.
- **Report:**
  - `targetType weo|thread|answer|reply|user`, plus `weoId`, `threadId`, `answerId`, `replyId`, `reportedUserId`
  - `reportCount`, `reports[{reportBy, reportType spam|inappropriate_content|misleading|fraud|copyright_violation|harassment|other, description, createdAt}]`
  - `status pending|resolved|dismissed`, `resolutionAction none|block_weo|delete_content|suspend_user|ban_user`
  - `adminNotes`, `resolvedAt`, `resolvedBy`
- **Feedback:** `userId`, `userEmail`, `feedbackType bug_report|feature_request|general`, `feedback`, `rating` 1–5, `status pending|reviewed|resolved`.
- **Category:** `name`, `slug` (unique), `image`, `imageDark`, `subcategories[{name, image, units[]}]`.
- **EmailSubscription:** `email` (unique), `isSubscribed`, `unsubscribedAt`.
- **weo-website models** (`src/weo-website/models/`): careers application, careers module, contact form, contact module, custom integration, general inquiry, investor inquiry, invite request, partnership application, report, waitlist.

**Not present as models:** no stories-as-feed-posts beyond CommunityStory, no stewards (they were removed per `COMMUNITY_HUB_PLAN`), no separate settings collection (settings live in `user.uiPreferences` and `publicProfile`), and no separate "passport" collection (`publicId` sits on the WeO, and the user passport is a computed view in `user/passport/`).

**Enum source:** `src/shared/config/enum.ts`. It includes `WEO_FORMATS = ['Bid','Pool','Hunt','Drop','Listing']`, the full `WeoActivityType` list, and `ReportType`, `ReportStatus`, `CircleAxis` and the `Ui*` enums.

---

## 8. Auth

**End users** (`src/shared/middlewares/auth.middleware.ts` `authenticate`, `src/shared/utils/jwt.ts`)
- **Login** is OAuth2 authorization code + PKCE against the external IdP `AUTH_SERVER`.
  1. The FE posts `{code, codeVerifier, redirectUri}` to `POST /api/frontend/auth/verify`.
  2. The backend calls `AUTH_SERVER/api/oauth/token` with `O_CLIENT_ID` and `O_CLIENT_SECRET`, upserts the user (the user `_id` equals the IdP user id), and stores the IdP refresh token encrypted in `OWalletCredential` for wallet calls.
  3. It then mints **first-party HS256 tokens**: access `{sub, role, typ:'access'}` signed with `JWT_SECRET`, default 15 minutes; refresh `{sub, typ:'refresh', jti}` signed with `REFRESH_TOKEN_SECRET`, default 30 days, persisted as a `Session`.
- **Refresh and logout:** `POST /auth/new_access_token` and `POST /auth/logout`, both with body `{refresh_token}`.
- **Bearer only:** tokens go in `Authorization: Bearer <token>`. No auth cookies are used; `express-session` is mounted but passport is commented out.
- **What `authenticate` does:**
  - Loads the user and returns 401 or 403 for a missing, deleted, suspended or banned account, using envelope bodies with `data.code` `ACCOUNT_DELETED`, `ACCOUNT_BANNED` or `ACCOUNT_SUSPENDED`.
  - Sets `req.user = { id, role }`.
  - Some failure paths return **plain text** (`"No token"`, `"Invalid token"`, `"Not an access token"`, `"Internal server error"`).
- **Roles:** `authorizeRoles(...roles)` returns raw `{message:'Forbidden: insufficient role'}` with 403.
- **Drift:** CLAUDE.md and the readme say RS256/jwks-rsa and `req.user.userId`. That is wrong: it is HS256 and `req.user.id`. jwks-rsa is not used by `authenticate`.
- **There is no OTP or password login for end users**, even though swagger documents OTP.

**Admins** (`src/shared/middlewares/admin.auth.middleware.ts`, `src/shared/utils/admin.jwt.ts`)
- `POST /api/auth/admin/login` takes `{email, password}` (password ≥8) and checks it against bcrypt.
- Tokens are signed with `ADMIN_JWT_SECRET` / `ADMIN_REFRESH_SECRET` and an audience claim.
- `authenticateAdmin` requires a staff role: `super_admin`, `admin`, `moderator`, `finance` or `support`.
- RBAC lives in `src/shared/config/rbac.ts`: `Permission` values are `users:read`, `content:moderate` and so on, `ROLE_PERMISSIONS` maps roles to them, and `requirePermission(...)` enforces them.

**Other auth**
- **Sockets:** `socketAuthMiddleware` verifies `socket.handshake.auth.token` with `JWT_SECRET`.
- **MCP:** `apiKeyAuth` accepts `Authorization: Bearer wko_…` or `X-API-Key`, with scopes and a limit of 60 per minute per key.

**Getting a token for local testing**
- **Admin:** set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, run `npm run seed:admin` (creates or updates a `role:'admin'` user), then `POST /api/auth/admin/login`.
- **End user:** no local login path exists without a working AUTH_SERVER. The practical approach is to mint a token with the repo's own helper against an existing user doc, for example:
  ```bash
  npx ts-node -e "import {signAccessToken} from './src/shared/utils/jwt'; console.log(signAccessToken({_id:'<userId>', role:'user'}))"
  ```
  The user must exist, because `authenticate` looks it up. The seeded user "Mya" (`npm run seed:mya`, `_id 69808052344eb80305da8e6d`, `mya@weo.ai`) works for this.

**Seed scripts** (`src/scripts/`)
- `seed.all.ts`: config, categories and so on; `--force` makes it destructive.
- `seed.config.ts` (OConfig), `seed.categories.ts`, `upload.category.marks.ts` (S3).
- `seed.mya-user.ts` (Mya is a platform user; the code auto-circles new users to Mya).
- `seed.mya-circle.ts` (makes every user follow and circle Mya).
- `seed.admin.ts`.
- `seed.community.ts` (starter Community-Hub circles; needs categories first).

---

## 9. Validation (Zod ^3.25)

**Middleware** (`src/shared/middlewares/zod.validate.ts`)
- `zodValidate(schema)` validates the body and replaces `req.body`.
- `zodQueryValidate(schema)` validates the query and redefines `req.query` as an own property. This is an Express 5 workaround: raw keys are merged with the parsed values, and the parsed values win.
- `zodParamValidate(schema)` validates params with `Object.assign`.
- On a `ZodError` all three return **422** `"Validation error"` with `errors: [{field, message}]`.

**Where schemas live**
- Schemas are named `SCREAMING_SNAKE_SCHEMA` in `<module>.validate.ts`.
- Some legacy shared schemas live in `src/shared/middlewares/validate/*.validate.ts`.
- Shared helpers are in `src/modules/weo/weo.shared.validate.ts`: `objectId(label)`, `mediaItem`, and the `sharedWeoFields` spread.

**Verbatim example** (`src/modules/weo/weo.validate.ts` and `weo.shared.validate.ts`)
```ts
export const CREATE_WEO_SCHEMA = z.discriminatedUnion('weoType', [
    CREATE_REGULAR_WEO_SCHEMA,
    CREATE_CROWDFUND_WEO_SCHEMA,
    CREATE_LOTTERY_WEO_SCHEMA,
]);

export const objectId = (label: string) =>
    z
        .string({ required_error: `${label} is required` })
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: `${label} must be a valid ObjectId`,
        });

export const mediaItem = z.object({
    type: z.enum(['image', 'video'], { ... }),
    url: z.string({ required_error: 'Media URL is required' }).url('Media URL must be a valid URL'),
    thumbnail: z.string().url().optional(),
});
// sharedWeoFields: title, description (min 1), categoryId: objectId, categoryName?, subCategory?,
// tags default [], media: z.array(mediaItem).min(1, 'At least one media item is required'),
// currency default 'O', isResellable default false, creatorName?
```
The regular kind adds `price{amount, priceSplit, negotiableUpTo}`, `quantity{amount, negotiableUpTo, unitName}`, `customerLimit ≥1`, `totalWeoInCirculation ≥1`, `duration`, `availabilityTill` (ISO datetime), `noOfInstallments` and `requestedId`, and uses `.passthrough()`. `UPDATE_*` is `.partial()` with `weoType` required, plus a rule that at least one other field is present.

**Frontend implication:** WeO creation requires at least one media item with a public `url`. There is **no HTTP media-upload endpoint** for the frontend. `MediaService` (S3) is used only by the MCP `upload_media` tools and scripts.

---

## 10. Response envelope and error formats

`src/shared/utils/responseHandler.ts`:
```ts
static success(res, data, message, statusCode = 200) → { success: true, message, data }
static error(res, message, statusCode = 500, error?, errors?) →
   { success: false, message, data: null, errors, error: error?.message || error || message }
```
The snake_case transform is commented out, so responses are camelCase.

**Success example**
```json
{ "success": true, "message": "Liked", "data": { "liked": true } }
```

**Validation failure** (422)
```json
{ "success": false, "message": "Validation error", "data": null, "error": "Validation error",
  "errors": [ { "field": "media", "message": "At least one media item is required" } ] }
```

**Global errorHandler** (`src/shared/middlewares/error.middleware.ts`), used when controllers call `next(err)`
```json
{ "success": false, "message": "<msg>", "data": <err.data ?? null>, "error": "<msg>", "errors": null }
```
It maps Mongoose `ValidationError` to 400, duplicate key (11000) to 400 `"<field> already exists"`, and JWT errors to 401. Services throw `createError(message, status, data)`.

**Non-envelope shapes that still exist**
- `authenticate` returns plain-text 401/403/500 bodies for no, invalid or wrong-type tokens.
- `authorizeRoles` returns `{message}` with 403.
- Rate limiters return `{message:'Too many requests…'}` with 429.
- `/health` returns raw JSON.
- weo-website form validation returns 400.
- Frontend category endpoints return raw documents.

`docs/swagger/README.md` also still describes the older errorHandler shape (`{message, data}`), which is now fixed.

**Pagination convention:** `{ items/rows…, pagination: { total, page, limit, totalPages } }`. The swagger `Pagination` schema has `limit` max 100.

---

## 11. Tests
- **Location:** 57 `*.test.ts` files co-located in `__tests__/` folders under modules, plus `src/mcp/__tests__` (contract snapshot test), `src/shared/config/__tests__` and `src/shared/middlewares/__tests__`.
- **Largest groups:** `weo/` (projection, format, discovery, feed, admin), `weo/collect/core` (regular, crowdfund, lottery collect cores, wallet settlement), community (circle, counters, threads, snapshot, story, push, my-weos), wallet view, passport, listings, rating, rehearsal, draft, resell, view, notification, report, request-weo accept, negotiation, o-wallet-token (crypto and service), media, and MCP api-key and rate-limiter.
- **Type:** these are **unit tests with `jest.mock`** of models and mongoose sessions; 43 of 57 files mock. No test connects to a real Mongo, `mongodb-memory-server` is not installed, and supertest is imported by none. Only `notification.controller.test.ts` exercises a controller, via `@jest-mock/express`. This contradicts CLAUDE.md §11 and the readme's "157 tests"; the suite is now much larger.
- **How to run:** `npm test`, `npm run test:watch`, `npm run test:coverage`.
- **`--listTests` result:** `npx jest --listTests` failed in the sandbox VM with `Preset ts-jest not found relative to rootDir`, even though `node_modules/ts-jest/jest-preset.js` resolves via Node. This is likely a VM or mount quirk, not a repo problem. It should run normally on the Mac.

---

## 12. CI
There is one workflow, `.github/workflows/deploy.yml` ("Node.js CI").
- **Trigger:** push to `main`.
- **Runner:** self-hosted, Node 22.x.
- **Steps:**
  1. Copy the repo to `/home/ubuntu/projects/weo-3.0`.
  2. `npm ci --legacy-peer-deps`.
  3. Write `.env` from GitHub secrets. Several names are stale: `REFRESH_JWT_SECRATE`, and `REFRESH_TOKEN_SECRET`, `ADMIN_*` and `OAUTH_TOKEN_ENCRYPTION_KEY` are missing, so production boot would fail `requireEnv`. The env validation step's grep pattern expects leading spaces.
  4. `npm run build`.
  5. `npm test || true`, so **test failures never fail the build**.
  6. Restart with PM2 as `weo-verse`.
- There is **no lint, typecheck-only, docs:lint or PR-check workflow**, and no husky or git hooks.

---

## 13. Other notable systems
- **Socket.io** (`src/shared/config/socket.ts`, `src/shared/sockets/events.ts`):
  - Namespaces are `/open` and `/authenticated`; the latter uses JWT via `handshake.auth.token`.
  - Only demo events exist (`public-event`/`private-event` and their responses).
  - No service emits real-time events; `getIO()` is never called. Real-time features would need new work.
- **Push notifications:** Firebase Admin (`src/shared/config/firebase.ts`), with FCM tokens registered via `POST /notifications/fcm-token`.
- **Email:** Nodemailer (`src/shared/services/email.service.ts`, `email.config.ts`).
- **Files / S3:**
  - `src/modules/media/media.service.ts` uses `@aws-sdk/client-s3` and the `S3_MEDIA_BUCKET` bucket.
  - Limits: 5 MB per file, up to 10 files, 25 MB per batch, and a content-type allowlist.
  - It returns public URLs (no presigning).
  - It is exposed only through the MCP tools, not through a REST endpoint.
- **Cron** (`src/jobs/`, all started at import in `src/index.ts`):

  | Job | Schedule |
  |---|---|
  | Mongo backup | daily 00:30 |
  | Community counters | daily 01:00 |
  | Crowdfund deadline transitions | every 5 min |
  | Installment job | daily 00:00 |
  | Installment notifications | daily 09:00 |
  | Lottery draw transitions | every 5 min |
  | WeO `activeNow` counters | hourly at :30 |

- **AI:**
  - `src/modules/ai/` is a LangChain 1.x LCEL RAG chatbot using OpenAI and FAISS. The index is `vector_store/faiss.index` built from PDFs, with in-memory session history keyed by `sessionId`.
  - It's exposed at `/api/chatbot/ask` and `/ask/stream` (SSE).
  - The MCP server (`src/mcp/`) exposes WeO tools to external LLM clients through the same services, with idempotency records and per-key rate limiting.
  - **"Mya" is not an AI endpoint on the backend.** Mya is a seeded platform user account (`mya@weo.ai`) that new users are auto-circled with, plus a FE UI flag `uiPreferences.myaHidden`. There is no Mya assistant API.
- **Rate limits:**
  - **Global limit of 70 requests per minute per IP on all routes.** Chatty frontend dev sessions can hit 429 from this.
  - `authLimiter`: 15 per 15 minutes.
  - `otpLimiter` is defined but unused.
- **Security headers:** helmet with CSP off; COOP `same-origin-allow-popups`; CORP `cross-origin`; `trust proxy 1`.
- **Migrations:** `scripts/migrations/2026-06-22-unify-weo-collections.ts`, `2026-09-02-backfill-weo-passports.ts` and `diagnose-offers.ts`, plus `src/scripts/migrate-*.ts`.
- **Security audit:** `docs/check_security.txt` rates the codebase 4/10 ("High Risk"). Code-level concerns seen in this pass:
  - Frontend category CRUD and the "admin-ish" feedback endpoints have no role checks.
  - `GET /users` lists all users.
  - `GET /weos/categories` is unauthenticated.

---

## 14. Documentation drift to fix when writing dev docs

| Where | What it says | What the code does |
|---|---|---|
| CLAUDE.md §2/§6, readme | JWT RS256 via jwks-rsa; `req.user = {userId, role}` | HS256 first-party JWT (`JWT_SECRET`); `req.user = {id, role}` |
| readme | LangChain ^0.3 pinned | 1.x (CLAUDE.md is right) |
| CLAUDE.md §2 | Nodemailer 7.0.4 | ^9.0.1 |
| CLAUDE.md §8 | "don't use `AnyZodObject`" | `zod.validate.ts` imports it |
| CLAUDE.md §11, readme | 157 tests; integration tests hit real Mongo | 57 mock-based unit-test files; no DB or supertest tests |
| readme | Kind-specific crowdfund back/backers/cancel and lottery buy routes | Don't exist; use `/weos/:id/collect` |
| Swagger | OTP login, crowdfund back/backers, lottery buy | Don't exist |
| Swagger `weo.yaml` | PUT/DELETE under `/version-history` | They are on `/weos/{id}` |
| `.env.example` | (omits `MONGO_URI`, `SESSION_SECRET`, `O_CLIENT_*`, Firebase and media vars) | All are required or read by code |
| `docs/ARCHITECTURE.md`, `MIGRATION_GUIDE.md`, `QUICK_START.md`, `IMPLEMENTATION_CHECKLIST.md`, `README_REFACTORING.md` | `src/shared/errors/*` error classes | That directory doesn't exist |
| Code bugs noted in the swagger README | — | `DELETE /notifications/read` is shadowed by `/:id`. The swagger README also flags `GET /resell/:offerId`, but that route no longer exists. |
