# Test report — M09 Identity & money

| | |
|---|---|
| Date | 2026-10-05 |
| Frontend | branch `feat/m09-identity-money` |
| Backend | branch `redesign/m09-identity-money` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · backend `redesign/m09-identity-money` :3002 · Surya's O-Wallet session · design reference at `/design/` |
| Result | ⚠️ pass with open items — passport, wallet and settings checked live in light, dark and at 390; every settings control and the public switches persisted and were put back; a deactivation request was recorded and cancelled. Move Os was not run live (it moves real test Os; covered in M05). |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint | ✅ | no new errors on changed lines; new files clean |
| backend | jest | ✅ | settings (7), notification delivery (+2), passport (+2), wallet peg — device run in four groups |
| backend | `npm run docs:lint` | ✅ | `user.settings.yaml` new; passport, user passport and wallet view updated |
| backend | wire-shape diff | ✅ | new: settings, account request, export; additive: `inputs[].do/.cap`, `avatarUrl` on the profile patch; the wallet `peg` now carries the settlement figure (99) instead of the policy file's round 100 (a fix — the field shapes are unchanged) |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (D-016) |
| frontend | `npm test` | ✅ | 226 / 226 (28 files) — +11 |
| frontend | `npm run build` | ✅ | Passport, the passport sheets, Wallet and Settings load as their own chunks |

### What the new frontend tests cover

- **Passport (5):** the ladder lines (how a rung is reached, ISR there but answers missing) and the issue date; the page with no invented week ("Not tracked yet"), the ladder, the example price and the graph; editing the profile, a taken handle (409) shown in the sheet, and the saved name in the hero; a public switch that persists; your data downloaded as a file.
- **Wallet (2):** the settlement peg and never a round 100, O Power not measured, why nothing is held, the ecosystem, a price list with the advantage and no Start, the record; an empty record.
- **Settings (4):** the account and the O-Wallet gate for email (no language picker, no ISR switch); notification choices, security email locked, quiet hours and the digest; delete only after the word is typed, the request recorded and cancelled; appearance writing the shell preferences.
- **Router:** `/passport`, `/wallet`, `/settings` are their screens.

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /users/me/passport` | identity, standing (moves null), tier ladder, orbit, totals | 200 — ISR 100, Member (accepted answers short of Contributor), 7 WeOs | ✅ |
| `GET /users/me/graph` | circled by, you back | 200 — 0 / 3 | ✅ |
| `PATCH /users/me/profile` | the passport back | 200 — bio saved, then cleared | ✅ |
| `PATCH /users/me/public-profile` | saved | 200 — "Show what you hold" on, then off again | ✅ |
| `GET /users/me/export` | one file's worth | 200 — profile, settings, 7 WeOs, collected, 3 transactions, following, circles, threads | ✅ |
| `GET/PATCH /users/me/settings` | saved and read back | 200 — circle push off + quiet hours on, read back, then restored | ✅ |
| `POST/DELETE /users/me/account-request` | recorded, cancelled | 200 / 200 — "Deactivation requested", then null | ✅ |
| `GET /wallet/overview` | peg 99, power null, apps, ledger | 200 | ✅ |
| `POST /wallet/transfer` | balance and record move | not run (real test Os; M05 covers it) | ⚠️ |

## 3. Browser — parity

| Part | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Passport (hero, hub, standing, tier, graph) | ✅ | ✅ | ✅ | compared with `/design/passport.html`; at 390 after M09-B3 |
| Passport sheets (improve, edit, tier, public, settings) | ✅ | — | — | |
| O-Wallet (hub, money rows, buckets, ecosystem, rates, apps, record) | ✅ | ✅ | ✅ | compared with `/design/wallet.html`; no horizontal overflow |
| Settings (rail, every card, the request sheet) | ✅ | ✅ | ✅ | compared with `/design/settings.html`; the rail becomes a row on a phone |

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Passport settings → a public switch | persists, the public page follows | ✅ (then restored) | ✅ |
| 2 | Edit profile → bio → Save | saved, sheet closes | ✅ (then cleared) | ✅ |
| 3 | Hub → Improve | the inputs, what each asks, its cap, what it never counts | ✅ | ✅ |
| 4 | Tier stat → ladder sheet; Escape | opens; closes | ✅ after M09-B1 | ✅ |
| 5 | `/passport#tier` | lands on the tier section | ✅ | ✅ |
| 6 | Settings rail → Notifications | glides to the section | ✅ after M09-B2 | ✅ |
| 7 | Notification box, quiet hours | saved, read back | ✅ (then restored) | ✅ |
| 8 | Email → Change | the O-Wallet gate with the account URL | ✅ (not opened) | ✅ |
| 9 | Deactivate → type the word → request → cancel | recorded, then gone | ✅ | ✅ |
| 10 | Console | no errors | 0 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Status |
|---|---|---|---|---|---|
| M09-B1 | Low | tier ladder, public page sheets | Escape did not close the two hand-built sheets | they close on Escape like `Sheet` | fixed |
| M09-B2 | Medium | settings rail | a section jump stopped after ~150px (the native smooth scroll is cut short in the app) | jumps use the app's glide | fixed |
| M09-B3 | Medium | section hero (shared) | at 390 a short feature card (the passport balance) squeezed the control column to 2px; the public page button and the gear sat off-screen | the column keeps a 260px floor, so the feature wraps to its own line like the design | fixed |
| M09-B4 | Low | O-Wallet money rows | "Not measured yet O Power" read backwards | "O Power · not measured yet" | fixed |
| M09-B5 | Low | settings quiet hours | 12-hour times clipped in a 112px field | 124px | fixed |

## 6. Open issues & follow-ups

- Move Os was not run live — it moves real test Os. Covered by M05's tests and pass; run it with Surya's go-ahead.
- The passport id is the account id (backend); a short public id would read better (backend note).
- ISR ledger (moves, trace, alerts), email delivery (receipts, digest, the email column), O Power and FX for other currencies are open gaps (G-60…G-66).
- The top bar marks Community on `/wallet` (the route sits under the hub path, as in M02) — unchanged.
- Test data: all settings, switches and the profile were put back; no account request is left.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, decisions D-070…D-079, API map, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m09-identity-money`; frontend `feat/m09-identity-money` → `develop`, tag `m09-done` — never `master`, D-069)
