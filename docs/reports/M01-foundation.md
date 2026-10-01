# Test report — M01 Foundation

| | |
|---|---|
| Date | 2026-10-01 |
| Frontend | branch `feat/m01-foundation` @ `d0b44bb` + fixes (final commit in §7) |
| Backend | branch `redesign/m01-foundation` @ `04bced6` |
| Environment (automated) | Linux workspace · Node 22.22 · Chromium (Playwright 1.56) for screenshots · no MongoDB |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · design served by the same Vite server at `/design/` (dev-only middleware) · backend **not running** during this pass |
| Result | ⚠️ pass with open issues — every automated and in-browser check passes; the live IdP sign-in round trip and the dev token against a running backend move to the start of M02 (see §6) |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | 0 errors |
| backend | `npm run lint` | ✅ (no regression) | 546 errors / 1068 warnings — identical to base `redesign/m00-setup`; 0 in new files |
| backend | `npm test` | ✅ | With the real `.env` (Cowork VM on the Mac): 58/58 suites, 837/837 tests, 6 new. The two Firebase-dependent suites that could not load in the cloud workspace pass. A full parallel run under the VM's CPU limit timed out 4 suites; all pass re-run with `-w 2` |
| backend | `npm run docs:lint` | ✅ | valid; unused-component warnings unchanged vs base |
| backend | wire-shape diff | n/a | no controller/service/projection touched |
| frontend | `npm run typecheck` | ✅ | strict, `noUncheckedIndexedAccess` |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (design behaviour, D-016 → M12) |
| frontend | `npm test` | ✅ | 53 / 53 (5 files) — +1 regression test for M01-B5 |
| frontend | `npm run build` | ✅ | JS 383 kB (123 kB gzip), CSS 25 kB; `/dev/ds` excluded from production |

### What the frontend tests cover

- **API client (10):** envelope unwrap + bearer; raw JSON passthrough (`/frontend/categories`); empty query params dropped; 422 → field errors; 403 account code; plain-text 429; plain-text 401 → refresh → retry with new token; concurrent 401s share one refresh; failed refresh clears the session and fires the expiry handler; `auth:false` calls never send a token or refresh.
- **Auth (6):** S256 challenge = base64url(SHA-256) with no padding; authorize URL parameters + persisted verifier/state/return path; state mismatch rejected before any network call; IdP `error` surfaced; code exchange stores first-party tokens and consumes the verifier; logout clears tokens even when the call fails.
- **Routing (19):** anonymous → `/login?next=…` preserving path+query; `/` → `/create` (design opens on Create); 14 routes render their planned screen with the right label/module; route colour written to `--focus-tint`; signed-in users bounced from `/login` to `next`.
- **Design system (8):** gallery renders every ported component with **zero React warnings**; Button hover fill/weight; Toggle, Tabs, Chip-remove (no bubbling), WeOCard engage; ISR and O-Power stage bands.
- **Formatting (9):** `compact`, `osFmt`, `oStr`, O↔USD peg, `relTime` buckets.

## 2. API checks (live, dev token)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| OAuth authorize URL built by the app | `https://wallet.ocono.me/oauth/authorize` with `response_type, client_id, redirect_uri, scope, state, code_challenge, code_challenge_method` | exactly that; `redirect_uri=http://localhost:5173/callback`, client id from the backend `.env` | ✅ |
| Opening the authorize URL in Chrome | IdP sign-in page | Chrome navigated to `wallet.ocono.me/oauth/authorize?…`; the extension has no permission to read that domain, so the page itself wasn't inspected | ⚠️ confirm by eye |
| `POST /frontend/auth/verify` · `new_access_token` · `logout` live | 200 envelopes | backend not running in this pass | ⏭ M02 |
| `npm run dev:token` / dev token on `/users/me/nav-summary` | 200 | token minted into `.env.local` (12 h, Mya); not exercised against a running backend | ⏭ M02 |
| `/api/docs` shows `logoutUser`, no OTP ops | | verified in the built spec (`docs:lint`); UI not opened | ✅ (spec) |

## 3. Browser — design-system parity (Chrome on the Mac)

Method: the design page `/design/create.html` (its own React 18 + compiled DS bundle) and the app (React 19 + ported DS) each rendered the **same 64 component cases with the same props**; the resulting DOM was compared.

| Result | Cases |
|---|---|
| Byte-identical HTML | 58 |
| Identical after normalising attribute order / style-declaration order (React 19 writes `<img src>` after other attributes; one OPower span lists the same declarations in another order) | 6 — `orbLogo`, `avatarImg`, `avatarIsr`, `opowerPanel`, `oportal`, `weocard` |
| Different | **0** (after fixing M01-B5) |

Covered: Button ×6, OButton ×3, OMark ×2, Orb ×5, Avatar ×3 + group, Badge ×3, Chip ×2, ISRRing ×3, StatGrid, OPower ×4, ValueLadder ×2, FeeDisclosure, CommitReview, FlowReceipt, Alert ×4, Progress ×3, Spinner, Skeleton ×3, Tooltip, Toggle ×2, Input ×2, EmptyState, Tabs, Card ×3, OPortal, RingNav, WeOCard ×3 (card, selected, orb).

## 3b. Browser — screens

| Screen | 1440 light | 1440 dark | 390 light | 390 dark | Notes |
|---|---|---|---|---|---|
| `/login` | ✅ | ✅ | ✅ | ✅ | Linux Chromium screenshots; design has no login screen (D-017) |
| `/dev/ds` gallery | ✅ | ✅ | ✅ | ✅ | |
| Planned routes (`/create`, `/discover`, `/wallet` …) | ✅ | — | — | — | Chrome on the Mac: placeholder + the route's colour wash (`--focus-tint` green/blue/gold) |

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Open `/discover` signed out | `/login?next=%2Fdiscover` | covered by router tests (memory router); in Chrome the dev token keeps the session signed in | ✅ (test) |
| 2 | Start sign-in | IdP authorize page | URL correct, Chrome lands on wallet.ocono.me | ✅ / ⚠️ page not inspected |
| 3 | Complete IdP sign-in → `/callback` → `/discover` | tokens stored | needs the backend running | ⏭ M02 |
| 4 | Dev token path | app opens signed in | `/login` → redirected to `/create` with the `.env.local` token | ✅ |
| 5 | Every route | placeholder, correct label + wash | ✅ (`/create`, `/discover`, `/wallet` in Chrome; all 14 in tests) | ✅ |
| 6 | DS parity | identical rendering | 64/64 (§3) | ✅ |
| 7 | Console | no errors | 0 after M01-B4 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Commit | Status |
|---|---|---|---|---|---|---|
| M01-B1 | Low | `/dev/ds` | React Router warned "No HydrateFallback" on a cold load of the lazy gallery route | `HydrateFallback: () => null` on the route | d0b44bb | fixed |
| M01-B2 | Low | `/login` | Alert copy inherited the card's centred text | `textAlign: left` on alerts | d0b44bb | fixed |
| M01-B3 | Low | DS `FeeDisclosure` | design mapped fee rows without React keys (console warning) | keyed Fragment | d0b44bb | fixed |
| M01-B4 | Medium | global CSS | the design's `@view-transition{navigation:auto}` (meant for its one-file-per-page build) raised `InvalidStateError: Transition was aborted` on every reload of the SPA | at-rule removed with a note; in-app transitions come with the M02 shell | see §7 | fixed |
| M01-B5 | Medium | DS `OPortal`, `RingNav` | the bundle converter wrote `aria-label="… \u2014 …"`; JSX attribute strings don't process escapes, so screen readers read a literal `\u2014` | real em dash in both; converter now keeps non-ASCII attribute text as an expression; regression test | see §7 | fixed |

## 6. Open issues & follow-ups

- **Live auth round trip** (IdP sign-in → `/callback` → `POST /frontend/auth/verify`, refresh, logout) and the **dev token against `/frontend/users/me/nav-summary`**: run at the start of M02, whose shell needs the backend anyway. The client paths are covered by MSW tests.
- Confirm by eye that `https://wallet.ocono.me/oauth/authorize` shows the O-Wallet sign-in (the Chrome extension can't read that domain).
- 26 design-system a11y/hook warnings → M12.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested (B4, B5 re-run in Chrome: parity 64/64, console clean)
- [x] Docs updated (spec, plan, API map, decisions, changelog)
- [x] Commits pushed (backend `redesign/m01-foundation`, frontend `feat/m01-foundation` → `master`, tag `m01-done`)
