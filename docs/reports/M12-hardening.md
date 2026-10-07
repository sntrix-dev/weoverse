# Test report — M12 Hardening & release

| | |
|---|---|
| Date | 2026-10-07 |
| Frontend | branch `feat/m12-hardening` (merged into `develop`, tag `m12-done`) |
| Backend | branch `redesign/m12-hardening` @ `d6e5eac` · PR into `phase1/v3` (not merged) |
| Environment | macOS · Chrome + Claude in Chrome · local MongoDB · seeded Mya (dev token) |
| Result | ⚠️ pass with open issues (§6) |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint (changed lines, new files) | ✅ | no errors on changed lines |
| backend | jest | ✅ | 82 suites / 1,113 tests (Cowork VM) + my-weos suite 8/8 after the last change |
| backend | `npm run docs:lint` | ✅ | valid, 40 warnings (unchanged) |
| backend | wire-shape diff | ✅ | additive, except G-58 (`offers` trimmed for non-requesters — approved) |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors, 26 warnings (pre-existing a11y/ref warnings) |
| frontend | `npm test` | ✅ | 269 / 269 (36 files) |
| frontend | `npm run build` | ✅ | entry 105 kB gz · shared vendor 67 kB gz · socket.io-client lazy 12 kB gz · three.js lazy 142 kB gz |

## 2. API checks (live, dev token)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| socket.io `/authenticated` with the access token | connects | connected | ✅ |
| socket.io `/authenticated` with a forged token | refused | "Authentication error: Invalid token" | ✅ |
| socket CORS from `:5173` | allowed | allowed | ✅ |
| `GET /weos` | `weoverse.validated` present | `null` on non-vetted WeOs | ✅ |
| `GET /community/my-weos` | `validated` on each card | shape OK (Mya has none live) | ✅ |
| `GET /request-weos/:id` (not yours) | only your offers | no local brief with offers — covered by unit tests | — |
| `/admin/users/account-requests`, `/:id/account-request` | list, confirm, reject | not run live (no staff session; credentials are never entered) — unit tests | — |

## 3. Browser — visual parity

| Screen | 1440 light | 1440 dark | 390 | Differences |
|---|---|---|---|---|
| Account gate (paused / deactivated / deleted) | ✅ | ✅ | not re-run (Chrome window would not resize; the card reuses the External gate's verified layout) | no design source (D-097) |
| Offline / back online toasts | ✅ | — | — | — |
| Regression sweep: Community, Discover, WeO page, Collect, Exchange, Create, Creators, Requests, Passport, Wallet, Settings, Notifications, Company, Circles | ✅ renders | — | — | none new |

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Intro curtain opens | focus moves into it; Tab stays inside | focus on "Enter Community"; 3× Tab stayed in the dialog | ✅ |
| 2 | Account refused (`ACCOUNT_SUSPENDED` + reason) | gate with reason, Sign out focused | as expected | ✅ |
| 3 | "Deactivated at your request" | deactivation copy, no reason row | as expected | ✅ |
| 4 | `ACCOUNT_DELETED`, dark | gate in dark theme | as expected | ✅ |
| 5 | Browser goes offline / online | toasts; reads paused, refreshed on return | as expected (screen refetched on each return) | ✅ |
| 6 | New notification lights the bell live | dot without reload | socket connects; emit path covered by unit tests — not triggered live (no safe way to make the local backend notify Mya) | ⚠️ |

Console errors: none across the sweep. Failed requests: none.

## 5. Bugs

| ID | Sev | Where | Description / steps | Fix | Commit | Status |
|---|---|---|---|---|---|---|
| M12-B1 | High | `api/client.ts` | A token refresh that cannot reach the backend (backend restarting, connection drop) signed every tab out. Seen live: switching the backend branch restarted it and both tabs landed on /login. | Only a refused refresh ends the session; an unreachable one keeps it for the next try | `37d92be` | fixed |
| M12-B2 | Low | `notifications.test.tsx` | Fixture rows "1 hour ago" fell on yesterday just after local midnight, failing the day-grouping test | Fixture keeps rows on their calendar day | `bbe10c6` | fixed |

## 6. Open issues & follow-ups

- Confirm the live bell once with a real notification (e.g. reject a test account's delete request from the admin dashboard, or follow the account from another).
- Staff UI for account requests lives in the admin dashboard (not in this repo): it needs the two new admin endpoints.
- 390 px parity for the new gate not re-captured (window resize had no effect in this session).
- A deactivated account has no in-app way to ask to be reactivated (staff set it active).

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, API map, decisions, changelog)
- [x] Commits pushed (backend + frontend)

## 8. Clean-up pass (2026-10-07)

Surya asked for both projects to be tested and every issue fixed.

| Check | Before | After |
|---|---|---|
| `npm run lint` | 0 errors, 26 warnings | **0 / 0** |
| `npm test` | 269 pass, 4 jsdom "Not implemented: getContext" logs | 269 pass, no stderr noise |
| `npm run build` | "(!) Some chunks are larger than 500 kB" | no warnings — the only such chunk is the lazy three.js `world3d`; the limit is 600 kB with the reason in `vite.config.ts` |
| `prettier --check src` | 46 files off-format | all formatted |

Fixes behind the lint warnings:
- **O portal** (`OPortal`, dev gallery): reachable by keyboard — Tab to it, arrows lean to an edge, Enter / Space jumps, Escape rests; the arrival ripple is set while rendering instead of in an effect; the gaze listener uses an effect event (subscribed once).
- **Portal jump**: `onDone` through an effect event (a parent re-render no longer restarts the jump).
- **Ring nav**: the visible fan and the scrim are presentational — the menubar's arrow keys and the screen-reader menu already carry them.
- **WeO card**: the front face flips with Enter / Space and is tabbable; the logo orb (Enter resells, Shift+Enter creates), the orb toggle and the engage orb are keyboard buttons — the engage orb is named with the WeO ("Collect Sunrise Loop") so a grid is not a column of identical "Collect"s; the creator row's hover detail is presentational; the spatial card reads its drag phase from state, not a ref, while rendering.
