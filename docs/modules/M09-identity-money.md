# M09 — Identity & money

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ done 2026-10-05 | `feat/m09-identity-money` (from `develop`) | `redesign/m09-identity-money` (from `redesign/m08-people-requests`) | `reports/M09-identity-money.md` |

## Screens

| Path | Design | Blocks, in design order |
|---|---|---|
| `/passport` (`#standing`, `#tier`, `#graph`) | `passport.jsx` `PassportScreen` | PathBar · SectionHero (eyebrow "Your passport · isr-1.0.0", name; handle · # passport id · joined; Your public page button + passport-settings gear; feature `PassportBalance` (available, in flight, Top up → O-Wallet, O-Wallet); stats ISR / Tier · advantage (→ TierLadderSheet) / Circles joined; priorities; directory; foot `OProfileHub` — orbit of your WeOs, nodes What moved it / Your tier / Improve / Your graph, rim utility Edit profile) · **01 Standing** (trace + moves, or "not tracked yet"; what it never counts + appeal; ValueLadder) · **02 Your tier** (ladder rows with how you reach / lose each, the example on a WeO at its ask, the outside price) · **03 Your graph** (Circled by, You back, Vouched). Sheets: IsrImprove, EditProfile, TierLadder, PassportSettings, PublicProfile |
| `/wallet` | `wallet.jsx` `WalletScreen` | PathBar (hub path) · lead (SectionMark O-Wallet · your passport, h1, Your public page) · panel `OProfileHub` (views Your wallet = `OWalletPanel` (M05) / Your passport) + `MoneyRows` · **02 Four buckets** (ValueLadder, StatGrid, the reason nothing is held) · **03 Where this passport works** (ecosystem cards, what it carries, what it never does) · **04 What an O is worth** (the peg, O Power "not measured yet", activity) · **05 Apps and plans** (price list, no buttons) · **06 The record** (ledger) |
| `/settings` (`#account` … `#danger`) | `settings.jsx` `SettingsScreen` | h1 + sticky scroll-spy nav · Account · Sign-in & security · Privacy · Notifications (7 × 3 matrix, digest, quiet hours) · Wallet & payments · Appearance · Connected apps · Your data · Help & legal · Deactivate or delete |

## API map

| Block | Endpoint | Status |
|---|---|---|
| passport hero, standing, tier, orbit, public switches | `GET /frontend/users/me/passport` | OK (+ `inputs[].do`, `.cap`, BE) |
| graph | `GET /frontend/users/me/graph` | OK |
| edit profile (name, handle, bio, photo) | `PATCH /frontend/users/me/profile` (+ `avatarUrl`, BE) · photo via `POST /frontend/media` | OK + additive |
| public page switches, who can reach you | `PATCH /frontend/users/me/public-profile` | OK |
| balance, buckets, ecosystem, apps, ledger, standing | `GET /frontend/wallet/overview` | OK (peg fixed to the settlement peg, BE) |
| Move Os | `POST /frontend/wallet/transfer` | OK (M05) |
| settings (account, notifications, time zone, receipts, account request) | `GET/PATCH /frontend/users/me/settings` | **BE new** |
| deactivate / delete | `POST/DELETE /frontend/users/me/account-request` | **BE new** (a request a person confirms — Surya) |
| download your data | `GET /frontend/users/me/export` | **BE new** |
| appearance | `PATCH /frontend/users/me/preferences` | OK (M02) |
| sign out | `POST /frontend/auth/logout` | OK |
| email, phone, password | O-Wallet account page (`manageUrl` from settings) | link out (Surya) |

## Decisions (to `decisions.md`)

- D-070 Deactivate / delete are requests a person confirms (stored on the account, cancellable); nothing is hidden or removed automatically yet. The confirm step is typing the word, not a password (sign-in is O-Wallet's). (Surya)
- D-071 Email, phone, password and sign-in alerts belong to O-Wallet: shown from the account, "Change" opens the O-Wallet account page through the external gate. No code-verify flow here. (Surya)
- D-072 Apps and plans, Connected apps: the backend's price list (your advantage applied), marked live / at launch, no Start / Connect buttons. (Surya)
- D-073 Standing and tier are always public (backend policy, and the design's own public-profile sheet): no "Show my ISR / tier" switches. No "Show when I'm online" (no presence) and no "Let search engines find my page" (no public web page).
- D-074 ISR moves and the 7-day trace are `null` (no ISR ledger): the standing card says "not tracked yet"; no ISR alerts or weekly standing email (nothing to send). Improve shows the published inputs, what each asks and its cap — no "now" counts.
- D-075 Notification choices save and apply now for In app and Push (and quiet hours, in your time zone); Email, the digest and receipts are saved for when email delivery ships (G-6x) and say so.
- D-076 No "Where you are" (fully digital, D-006); no language picker (the app is English only); no identity check (G-26); no passport QR / card download; the passport link is your record in the app.
- D-077 O Power is "not measured yet" (backend `power: null`); the rate dials show the fixed peg and your own activity instead of invented network rates.
- D-078 Reset tours / clear search history wait for M11 intros / stored searches; Help is Ask Mya; About and Legal open the company pages (M10). No support / report rows (no channel).
- D-079 Approximate value stays US dollars at the peg — no FX rates to convert with.

## Gaps

| Need | Status |
|---|---|
| Settings store (notification channels, digest, quiet hours, time zone, receipts) | BE new |
| Account request (deactivate / delete) | BE new |
| Data export | BE new |
| Profile photo | BE additive (`avatarUrl` on profile patch) |
| Wallet peg said 100 Os = $1; settlement uses 99 | BE fix |
| Email delivery (receipts, digest, email channel) | open |
| ISR ledger (moves, trace, alerts) | open (backend note) |
| Identity check (G-26), wallet buckets (G-25/G-51), plans billing (Q-4) | open |

## Acceptance criteria

- Passport, wallet and settings at parity with live numbers; money figures match the backend exactly.
- Edit profile (incl. photo) and the public switches persist and show on your creator sheet.
- Every settings control persists and reloads; In-app / Push choices change what you receive.
- Move Os end to end (balance changes, ledger row appears) — with Surya's go-ahead (it moves real test Os).
- Deactivate / delete requests are recorded and can be cancelled; export downloads a file.
- 1440×900 and 390×844, light and dark, network 2xx, zero console errors.
