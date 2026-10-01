# M02 — App shell

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m02-app-shell` | `redesign/m02-app-shell` | `reports/M02-app-shell.md` |

## Carried over from M01

- Run the live auth checks at the start of this module's browser pass: IdP sign-in → `/callback` → `POST /frontend/auth/verify`; refresh via `new_access_token`; logout; the `.env.local` dev token on `GET /frontend/users/me/nav-summary`.

## Scope

The chrome around every page (design `src/app.jsx`, `chrome.jsx`, `shell.jsx`, `screens-footer.jsx`, `screens-more.jsx`, `screens-circle.jsx`, `arrival.jsx` AckRipple).

| Part | Design source | Notes |
|---|---|---|
| `AppLayout` | `app.jsx` render order | Sets `html[data-theme|data-nav|data-motion]`, `--shell-left`, `--focus-tint` (route colour), `data-lead` on first section |
| `TopBar` | `chrome.jsx TopBar` | shrink-on-scroll pill: badge, SectionSwitch, search, NavDockNode, MakeNode, split toggle, MyaNode, bell, WalletMenu |
| `SplitShell` | `shell.jsx` | LeftPanel (246/62 px) + SupportCluster; `navMode: bar|split` |
| `SectionSwitch` + Next pill | `chrome.jsx` | MARKET items + "Show every section in the bar" |
| `QuickJump` | `chrome.jsx` (DS `RingNav`) | auto-park below 720 px height |
| `NavDockNode`, `NavParkFlight`, `FanDisc` | `chrome.jsx` | parked-nav behaviour |
| `WalletMenu` + `IdSheet` | `WeOverseIdSheet` | balance, tier, ISR ring, #weoId copy, counts, O Power, Settings / passport / Log out (real logout) |
| `MyaDock` | `chrome.jsx MyaDock` | draggable orb (`dockPosition` pref), tabs Ask Mya / Settings; chat answers from backend chatbot, FAQ matcher (`mya-faq.js`) as offline fallback |
| `Footer` + `SettingsBody` | `screens-footer.jsx` | sitemap routes, newsletter (`/frontend/email-subscription/subscribe`), theme/wordmark home/Mya toggle/currency |
| `PathBar` | `screens-circle.jsx` | sticky breadcrumb, back |
| `Toasts`, `AckRipple`, `ExternalGate`, `Sheet` | `screens-more.jsx`, `arrival.jsx` | store-driven |
| `FlowBar` (`V3NextBar`/`V3FlowFoot`) | `v3-spine.jsx` | shell only; world actions hidden until M11 |
| Search | `app.search(q)` | routes to `/discover?q=` |

Not in M02: section arrival curtains and walkthrough (`V3Arrival`, `V3Walk`) → M11.

## API map

| Block | Endpoint | Fields used |
|---|---|---|
| Wallet menu, ID sheet, counts | `GET /frontend/users/me/nav-summary` | name, handle, avatar, weoId/publicId, isr, tier, balances, counts, `uiPreferences` |
| Preferences | `GET/PATCH /frontend/users/me/preferences` | theme, currency, navMode, railOpen, navDock, motion, myaHidden, dockPosition, weoView, snapshotBoard, density, media, valueDisplay, mutedFormats, mutedKinds |
| Bell | `GET /frontend/notifications/unread-count` | count |
| Mya | `POST /chatbot/ask` (`{question, sessionId?}`) or `/ask/stream` (SSE) | answer, sessionId |
| Newsletter | `POST /frontend/email-subscription/subscribe` | |

## Backend work

- Verify `nav-summary` carries everything the ID sheet shows (Collected / Created / Circles / Campaigns counts, O Power, four buckets). Add missing fields additively.
- `uiPreferences` defaults: the discarded `phase1/v3` edit (`withPreferenceDefaults`) solved "missing keys on old docs". Re-implement if the audit shows keys missing (stash has the reference).
- `wordmark home` (`wv.home`) is not a backend pref — add `home` to `uiPreferences` if kept (additive, enum of route keys).

## Acceptance criteria

- Shell matches design on every placeholder page in bar and split modes, light/dark, 1440/390.
- Preferences persist to the backend and survive reload/another browser.
- Mya answers via backend; falls back to FAQ when the chatbot errors.
- Logout clears tokens and query cache and lands on `/login`.
