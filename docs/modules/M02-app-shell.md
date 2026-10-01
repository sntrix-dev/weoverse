# M02 — App shell

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ 2026-10-01 | `feat/m02-app-shell` | `redesign/m02-app-shell` | `reports/M02-app-shell.md` |

## Carried over from M01

- ✅ refresh/logout client paths and dev token on nav-summary verified live. ✅ IdP sign-in round trip completed 2026-10-01 (after D-029).
- Original item: run the live auth checks at the start of this module's browser pass: IdP sign-in → `/callback` → `POST /frontend/auth/verify`; refresh via `new_access_token`; logout; the `.env.local` dev token on `GET /frontend/users/me/nav-summary`.

## Scope

The chrome around every page (design `src/app.jsx`, `chrome.jsx`, `shell.jsx`, `screens-footer.jsx`, `screens-more.jsx`, `screens-circle.jsx`, `arrival.jsx` AckRipple, `v3-spine.jsx` V3NextBar).

| Part | Design source | App file | Notes |
|---|---|---|---|
| `RootLayout` | `app.jsx` effects + render tail | `src/app/RootLayout.tsx`, `useApplyPrefs.ts` | `html[data-theme|data-motion|data-nav]`, `--shell-left`; scroll restoration; Toasts / AckRipple / ExternalGate on every route (logout toast lands on `/login`) |
| `AppLayout` | `app.jsx` render order | `src/app/AppLayout.tsx` | bar or split nav → screen → footer → QuickJump → MyaDock → IdSheet; `--focus-tint` on `#root` + `<html>`; first top-level `<section>` gets `data-lead`; `--foot-lift` |
| `TopBar` | `chrome.jsx TopBar` | `components/shell/TopBar.tsx` | shrinks after 40 px scroll; badge, SectionSwitch, search, NavDockNode, MakeNode, split toggle, MyaNode, bell, WalletMenu |
| `SplitShell` | `shell.jsx` | `components/shell/SplitShell.tsx` | LeftPanel (246 / 62 px, living O clip when thin) + SupportCluster |
| `SectionSwitch` + `NavPill` + Next pill | `chrome.jsx` | `components/shell/SectionSwitch.tsx` | one pill or every section (`navSections` pref) |
| Bar nodes | `chrome.jsx` WeOverseBadge, MakeNode, MyaNode, Tip | `components/shell/Nodes.tsx`, `Tip.tsx` | |
| `SearchField` | TopBar search / `SupportSearch` | `components/shell/SearchField.tsx` | Enter → `/discover?q=` |
| `QuickJump` | `chrome.jsx` (DS `RingNav`) | `components/shell/QuickJump.tsx` | auto-parks below 720 px height |
| `NavDockNode`, `NavParkFlight`, `FanDisc` | `chrome.jsx` | `components/shell/NavDock.tsx` | park → flight → "Keep it here / Bring it back" |
| `WalletMenu` + `IdSheet` + `CopyBtn` | `WalletMenu`, `WeOverseIdSheet`, `CopyBtn` | `components/shell/WalletMenu.tsx`, `IdSheet.tsx`, `CopyBtn.tsx` | real logout |
| `MyaDock` + `useDockPlace` | `chrome.jsx MyaDock` | `components/shell/MyaDock.tsx`, `useDockPlace.ts` | draggable; `dockPosition` pref saved on drop |
| `SettingsBody` | `screens-footer.jsx` | `components/shell/SettingsBody.tsx` | theme, wordmark home, Mya in the corner, WeO Local, Os / tier |
| `Footer` | `screens-footer.jsx WeoFooter` | `components/shell/Footer.tsx` | sitemap → routes; newsletter → API; socials → ExternalGate |
| `FlowBar`, `FlowFoot` | `v3-spine.jsx V3NextBar`, `V3FlowFoot` | `components/shell/FlowBar.tsx` | rendered by pages; planned pages for Discover/Collect/Community/Exchange/Create already carry theirs |
| `PathBar` | `screens-circle.jsx` | `components/shell/PathBar.tsx` | used from M05 |
| `Toasts`, `AckRipple`, `ExternalGate`, `Sheet`, `OsRun` | `screens-more.jsx`, `arrival.jsx`, `section-hero.jsx` | `components/feedback/*`, `components/text/OsRun.tsx` | store-driven |
| Stores | `app.jsx` state | `src/stores/prefs.ts`, `ui.ts`, `mya.ts` | see `01-architecture.md` §State |
| Hooks | `app.jump/goHome/search`, `SECTION_OF` | `src/app/useJump.ts`, `useShellRoute.ts` | |

Not in M02 (→ M11): section arrival curtains, walkthrough, the flow bar's "?" (intro replay) and every "Enter a world" control; Worlds is left out of the O nav's jump list until then.

Not ported at all: the Tweaks panel (designer tool), the "Mobile" view switch (no mobile build), `PortalJumpSheet` (not rendered by the design app).

## API map

| Block | Endpoint | Fields used |
|---|---|---|
| Passport pill, ID sheet, footer identity, bell | `GET /frontend/users/me/nav-summary` (poll 60 s) | `identity.{name,handle,avatarUrl,weoId,isr,joinedAt}`, `wallet.{available,tier,tierLabel,tierRank}`, `counts.{collected,created,circles,campaigns}`, `notifications.unread`, `uiPreferences` |
| Preferences | hydrate from nav-summary; `PATCH /frontend/users/me/preferences` (batched 400 ms) | theme, navMode, railOpen, navDock, motion, myaHidden, dockPosition, home, navSections, flowBar, flowBarTools (+ the rest kept for later modules) |
| Mya | `POST /chatbot/ask` `{question, sessionId?}` (public) | `answer`, `sessionId`, `degraded` |
| Newsletter | `POST /frontend/email-subscription/subscribe` `{email}` (public) | 201; 400 "already subscribed" treated as done |
| Log out | `POST /frontend/auth/logout` `{refresh_token}` | always 200 |

## Backend work (`redesign/m02-app-shell`)

- `uiPreferences` gains `home` (`hub|discover|create`), `navSections` (`one|all`), `flowBar` (`full|min`), `flowBarTools` (bool) — additive.
- Every read (nav-summary, GET/PATCH preferences) returns the complete set (`withPreferenceDefaults`) — closes G-04.
- `POST /chatbot/ask` adds `data.degraded` — the FAQ fallback can tell a placeholder from an answer (G-28).
- Swagger: new keys; chatbot rewritten to the envelope it really returns + `/ask/stream`.
- Log: `weo-3.0/docs/redesign/modules/M02-app-shell.md`.

## Gaps (shown as absent, never faked)

| # | Design shows | Backend | Handling |
|---|---|---|---|
| G-23 | Tier with an advantage % ("Tier 2 · 10%") and Member/Contributor/Steward names | `participant/player/prime`, L1–L3, no % | "Tier 2 · Player"; settings row "Player · Tier 2" (Q-6) |
| G-24 | O Power on the ID sheet | none | the O Power label is left out; the Settings utility stays |
| G-25 | Four wallet buckets | only `available` | "Show buckets" lists Available only (the design's own `!= null` filter) |
| G-26 | "Verified" on the credential | none | hidden |
| — | Bell dot always on | `notifications.unread` | dot only when unread > 0 |

## Decisions

D-021 prefs store + first-paint cache · D-022 Mya answer order and no mock market script · D-023 dock resting position · D-024 Worlds hidden until M11 · D-025 external links open for real · D-026 shell CSS Modules (see `decisions.md`).

## Acceptance criteria

- Shell matches design on every placeholder page in bar and split modes, light/dark, 1440/390.
- Preferences persist to the backend and survive reload/another browser.
- Mya answers via backend; falls back to FAQ when the chatbot errors or is degraded.
- Logout clears tokens and query cache and lands on `/login`.
