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

## Live pass fixes (2026-10-22, after the Netlify deploy)

| Found on the live site | Fix |
|---|---|
| Suggestions only for whole words ("st", "sto" → nothing; "crowd" → 4) | Backend: WeOs, circles and requests top up a short `$text` result with a word-start title/name match (`wordStart`, `topUp`), text hits first, score 0, no repeats. The mark prefers a word start. |
| WeO rows said "WeO · category" | Backend adds `format` and `priceOs` to `SearchWeoHit` (un-migrated docs read as regular); the row says "Drop · O 2,400" as v4 does (category when unpriced). |
| Phone: the passport pill and bell cut off; the section switch squashed with "every section" | The bar folds at ≤ 760px (D-104); `useMedia`, `useNavMode`. "Every section" needs ≥ 1081px. |
| Passport ID printed as a 24-character id | `# WEO-XXXXXX` (D-105). |
| Phone: Mya's orb sat on Log out | The orb steps aside while the sheet is open (≤ 760px). |

Not checkable on the live backend (api.ocono.me): circles (none there) and requests in search (needs `redesign/d01-shell` deployed).

## Verify

typecheck ✅ · lint ✅ · vitest 38 files / 290 tests ✅ · build ✅ · backend tsc ✅, lint ✅, jest 87 suites / 1,134 tests ✅, docs:lint ✅ · browser: v4 design vs build at 1440 and 390, light and dark (review page); live Netlify pass 2026-10-22; phone fold at 390 / 700 / 761 / 900 / 1440.
