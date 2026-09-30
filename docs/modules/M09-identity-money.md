# M09 — Identity & money

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m09-identity-money` | `redesign/m09-identity-money` | `reports/M09-identity-money.md` |

## Screens

| Path | Design | Blocks |
|---|---|---|
| `/passport` (`#isr`, `#tier`, `#graph`) | `passport.jsx` | SectionHero (name; handle · #weoId · joined; PublicPageButton, settings gear; `PassportBalance`; stats ISR/Tier/Circles; foot `OProfileHub` with What moved it / Your tier / Improve / Your graph + Edit profile) · **01 Standing** (Spark, moves, never-counts/appeal, ValueLadder) · **02 Your tier** (ladder + advantage example) · **03 Your graph** (Circled by / You back / Vouched). Sheets: IsrImprove, EditProfile, TierLadder, PassportSettings, PublicProfile |
| `/wallet` | `wallet.jsx` | lead + `OProfileHub` (Your wallet / Your passport) + MoneyRows · **02 Four buckets** (ValueLadder, StatGrid) · **03 Ecosystem** · **04 Rates** (RateDial ×2, activity) · **05 Apps and plans** · **06 The record** (ledger). `OWalletPanel`: Move Os (`MoveOsSheet`), How Os work |
| `/settings` (`#account` … `#danger`) | `settings.jsx` | sticky scroll-spy nav · Account · Sign-in & security · Privacy · Notifications (7×3 grid, digest, quiet hours) · Wallet & payments · Appearance · Connected apps · Your data · Help & legal · Deactivate/delete |

Drop per D-006: profile "Where you are", Calendar "events you're going to".

## API map

| Block | Endpoint |
|---|---|
| passport | `GET /frontend/users/me/passport`, `GET /users/me/tier` |
| graph | `GET /frontend/users/me/graph` |
| standing history | `GET /frontend/activity/me`, `/me/history` |
| edit profile | `PATCH /frontend/users/me/profile` |
| public profile / contact | `PATCH /frontend/users/me/public-profile` (`contact: anyone|circles|off`) |
| wallet screen | `GET /frontend/wallet/overview`, `GET /frontend/owallet/overview` |
| move Os | `POST /frontend/wallet/transfer` |
| top up / withdraw | `POST /frontend/wallet/topup`, `/withdraw` (upstream O-wallet) |
| ledger | `GET /frontend/transaction-logs` |
| appearance | `PATCH /frontend/users/me/preferences` |

## Gaps

| Need | Proposal |
|---|---|
| Notification channel matrix (sales, bids, circles, mentions, mya, news, security × app/email/push) + digest + quiet hours | extend `User.notificationPreferences` additively (new sub-doc `channels`, `digest`, `quiet{from,to}`), `GET/PATCH /frontend/users/me/notification-preferences` |
| Privacy toggles (showIsr, showTier, showOnline, searchIndex, isrAlerts, weeklyStanding) | additive fields under `publicProfile` or `privacy` |
| Apps & plans / Simulation Pro (Q-4) | display-only first |
| Email/phone change + verify, password, sessions | owned by the IdP (`AUTH_SERVER`) — link out; sign out all sessions via logout |
| Download my data / delete account | confirm scope with user; soft-delete exists (`isDeleted`) |

## Acceptance criteria

- Passport/wallet/settings at parity with live numbers; money figures match backend exactly.
- Transfer Os end to end (balance changes both sides, ledger row appears).
- Every settings control persists and reloads.
