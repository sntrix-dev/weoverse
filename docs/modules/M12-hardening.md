# M12 — Hardening & release

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| in progress | `feat/m12-hardening` (from `develop`) | `redesign/m12-hardening` (from `redesign/m11-worlds-lifecycle`) | `reports/M12-hardening.md` |

Scope chosen by Surya (2026-10-06): close G-75 (validated mark), G-71 (real-time bell), G-58 (private offers on a brief), G-66 (account requests); make the rate limit env-configurable; harden the app (account states, 429, offline, focus, user text in styles); full regression; release as one PR from `redesign/m12-hardening` into `phase1/v3` (opened, not merged).

## Scope

| Part | What it becomes |
|---|---|
| Validated mark (G-75) | In flight says "Live · validated" and "Validated mark · ahead on the floor" for a WeO that posted itself at twenty pledges (design `v3-spine.jsx` `nextAct`). The design shows the mark nowhere else, so cards and the WeO page carry no badge. |
| Live bell (G-71) | `api/live.ts`: one socket.io connection on `/authenticated` with the access token, lazy-loaded; `notification:new` refreshes the bell's dot and the notifications list; a refreshed token is used on the next reconnect; sign-out closes it. The 60 s poll stays as the fallback. |
| Private offers (G-58) | Backend only: `GET /request-weos/:id` returns every offer to the requester, only your own to anyone else. The app already read offers only on your own brief (`accepted-weos`) and counts from `acceptedCount`. |
| Account requests (G-66) | Backend: staff list open deactivate / delete requests and confirm or reject them. App: a rejection arrives as a notification that opens Settings → Deactivate or delete; a confirmed request ends in the account gate below. |
| Account states | `api/accountState.ts` + `AccountGate`: a 403 `ACCOUNT_SUSPENDED` / `ACCOUNT_BANNED` / `ACCOUNT_DELETED` (from any read or the token refresh) is said once, over every screen, with the reason staff gave; "Deactivated at your request" reads as a deactivation; the one action is Sign out. |
| 429 | Reads back off (two retries) then a single toast at most every 20 s; mutations keep their own messages. Backend limit from `RATE_LIMIT_PER_MIN` (default 70). |
| Offline | TanStack pauses reads; a toast says you are offline and, on the way back, "Back online" and the screen refreshes. |
| Focus | `useModalFocus`: every `aria-modal` sheet, gate and curtain takes focus when it opens, keeps Tab inside, and hands focus back when it closes. Reduced motion was already global (`global.css`). |
| User text in styles | `lib/cssUrl.ts`: every user-supplied image address used in a CSS `url()` is quoted and limited to http(s), data:image, blob and same-site paths. React escapes all other user text; there is no `dangerouslySetInnerHTML`. |
| Performance | socket.io-client in its own lazy chunk (12 kB gz); three.js stays lazy (`world3d`, 142 kB gz); entry 105 kB gz. |

## API map

| Block | Endpoint | Status |
|---|---|---|
| In flight — validated | `GET /frontend/community/my-weos` (`validated`) | BE additive |
| WeO views — validated | `weoverse.validated` on every WeO view | BE additive (not shown: no design surface) |
| live bell | socket.io `/authenticated`, event `notification:new` | BE new |
| brief detail offers | `GET /frontend/request-weos/:id` (`offers` trimmed) | BE behaviour (approved) |
| account requests (staff) | `GET /admin/users/account-requests`, `POST /admin/users/:id/account-request` | BE new (admin) |
| a rejected request | `GET /frontend/notifications` (`target.kind: settings`) | BE additive |

## Decisions (to `decisions.md`)

- D-095 The validated mark shows where the design puts it — In flight, on the live WeO's next step — and nowhere else; the API carries it on every WeO view for later.
- D-096 The bell is live over the socket; the nav summary's 60 s poll stays as the fallback.
- D-097 A suspended, banned or deleted account is said once, over everything, with the reason and Sign out; no screen handles it on its own.
- D-098 Confirming a deactivate request suspends the account (reversible by staff); confirming a delete request is the existing soft delete (restorable). Both close every session. A rejection notifies the person with the note. (Surya chose G-66; the shape is Claude's.)

## Acceptance

- [ ] Every M01–M11 acceptance criterion re-run in the browser at 1440 and 390, light and dark (regression).
- [ ] A new notification lights the bell without a reload.
- [ ] A validated WeO reads "Live · validated" in In flight.
- [ ] A suspended account shows the gate with the reason; Sign out ends the session.
- [ ] Offline / back online toasts; 429 toast at most every 20 s.
- [ ] Tab stays inside an open sheet and focus returns on close.
- [ ] Zero console errors; network 2xx except the deliberate cases.
