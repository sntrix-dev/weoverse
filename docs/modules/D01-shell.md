# D1 — Shell & system (WeOverse v4 design update)

| Branch | Base | Backend | Design source |
|---|---|---|---|
| `feat/d01-shell` | `develop` @ 248df07 | `redesign/d01-shell` (from `redesign/m12-hardening`) | v4 export `WeOverse v4/uploads/WeOverse v3 - HTML 2` |

Change list and sign-off: the "WeOverse v4 — design changes to port" doc (D1 section). Merges into `develop` and `v2/dev` only after the designer signs off.

## What changed

| Area | v4 design | Build |
|---|---|---|
| Tokens | light `--bg-a/--bg-b` `#e8e8ea`; `--nm-raised` / `--nm-sm` lose the white highlight; v8 keyframes `weo-orb-arrive`, `weo-echo` | `design-system/tokens/{colors,effects}.css` (dark unchanged, as in v4) |
| Page width | `#root` 60px side padding at every width, footer bleeds out | `--root-pad: clamp(0px, 6vw - 26px, 60px)`: 60 at 1440, 0 on phones (D-102); footer bleeds by the same amount |
| Top bar | no Next pill; section pill 44px, ≥170px, icons 24px; Make 32px, hidden on Create; no Mya or nav-dock buttons; search hidden on Create; every icon 24px | `TopBar`, `SectionSwitch`, `Nodes`. The parked O nav still shows while parked (D-101) |
| Search | live suggestions: WeOs 4, Requests 4, Circles 3, Creators 3; match marked; ↑/↓, Enter; "See all results" | `SearchSuggest` over `GET /frontend/search` (now with `requests`, backend D1), debounced, 2-character minimum, combobox/listbox a11y |
| ID sheet | one column, 400px: who + settings, ID, balance with O-Wallet + 2×2 buckets, 4 stat tiles, passport, O Power + Log out | `IdSheet` |
| Leave a circle | "Leave {name}?" Stay / Leave circle; joining stays instant | `ConfirmDialog` (`askConfirm`), used by `useCommunityActions().toggleJoin` |
| PathBar | back + the section only; frosted page grey | `PathBar`; the grey follows the theme (`--bg-a` at 88%) |
| Pipeline copy | Rehearse it · Ask for reactions · Get Review · View WeO · Post now, new "get" lines | `InFlight`, flow bar, Exchange intro line |
| Small | neutral Intro chip; compose starters above the detail box, hint removed; "Preview it" beside Done | `SectionHero`, `Compose`, passport public-profile sheet |

Not in D1 (they belong to the module that uses them): `ViewBar noView` (D2), `statsInline` (D9), `StewardGrid query` and `Rows go` (D4), the "Get Review" notes flow on live WeOs (D4/D6).

## Backend

`GET /frontend/search` gains a `requests` list (open, not past deadline, `mine` marks your own) and `kind=requests`. Additive. Tests `search/__tests__/search.service.test.ts`; Swagger `SearchRequestHit`.

## Verify

typecheck ✅ · lint ✅ · vitest 37 files / 286 tests ✅ · build ✅ · backend tsc ✅, jest (search) ✅, docs:lint ✅ · browser: v4 design vs build at 1440 and 390, light and dark (review page).
