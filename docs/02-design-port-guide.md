# 02 — Design port guide

How to turn a screen or component from `WeOverse v3 - HTML` into app code **without changing how it looks or behaves**. The skill `skills/design-port/SKILL.md` is the step-by-step version of this doc.

## 1. Read the right files

| What | Where in the design folder | Notes |
|---|---|---|
| A page | `src/pages/<file>.jsx` | Holds the Screen + everything only that page uses. File names differ from routes: `community.jsx` = hub, `exchange.jsx` = listed, `collect.jsx` = collected, `circles.jsx` = manage. |
| Shared UI | `src/components/*.jsx` | See `reference/design-inventory.md` §D for the export → file map. |
| DS components | `js/ds/_ds_bundle.js` | Compiled but readable. Each component is preceded by `// components/<group>/<Name>.jsx`. Find with `grep -n "^// components/" js/ds/_ds_bundle.js`. |
| Tokens | `css/ds/tokens/*.css` | Already copied verbatim to `src/design-system/tokens/`. |
| Global CSS | `css/app.css` | Class families `weo-*`; ported to `src/styles/global.css`. |
| Mock data | `src/data/*.js` | Shows the **shape the UI expects**. Never import it — map it to API data via adapters. |
| Runtime | `js/pages.js`, `src/app.jsx` | Navigation + the `app` object API each screen calls. |

Do **not** read the compiled `js/components|pages` output — `src/` is the source. `rehearsal-tour.jsx`, `tweaks-panel.jsx`, `src/components/order.json` and `js/boot.js` resource fallbacks are not ported.

## 2. Mechanical translation rules

| Design idiom | App idiom |
|---|---|
| Classic script, top-level `function Foo()` shared implicitly | ES module `export function Foo()`; explicit imports |
| `window.Foo = Foo` / `Object.assign(window, {...})` | named export from the file; re-export in the folder `index.ts` |
| `const { Button, Orb } = DSC` | `import { Button, Orb } from '@/design-system'` |
| `React.createElement(...)` in the DS bundle | JSX/TSX |
| `app` prop drilled into every screen | hooks: `useNavigate`/`useJump`, feature query/mutation hooks, `useUi()`, `usePrefs()` |
| `app.go('weo', id)` | `navigate(routes.weo(id))` |
| `app.toggleJoin(id)`, `app.vote(...)`, … | mutation hooks with optimistic updates |
| `HUB.*`, `WV.*`, `FEED.*`, `TPL.*`, `WEO.*` reads | query hooks returning view models built by adapters |
| `sessionStorage`/`localStorage` state | server state, or `stores/prefs.ts` for UI prefs (see `01-architecture.md` §State) |
| inline `style={{…}}` static values | CSS Module class |
| inline style with computed tone/percent | CSS custom property: `style={{ '--tone': tone } as CSSProperties}` |
| `className="weo-rail"` etc. from `app.css` | keep the global class (already in `global.css`) or move into a module if used by one component only |
| hard-coded copy | keep it exactly; copy is part of the design |
| `RES(url)` / b-cdn / unsplash URLs | real media URLs from the API; static brand assets from `public/` |
| `window.claude.complete` | backend AI endpoint (gap, see M07) |
| `props` without types | `interface FooProps` — narrow unions for `tone`, `variant`, `format` |

TypeScript: no `any`. Unions for enums the design uses:
`type Tone = 'blue'|'violet'|'green'|'gold'|'danger'`, `type WeoFormat = 'Listing'|'Bid'|'Pool'|'Hunt'|'Drop'`, `type Section = 'discover'|'collect'|'create'|'earn'|'hub'`.

## 3. Fidelity rules (non-negotiable)

1. **Same DOM order and structure** of visible blocks as the design Screen, top to bottom.
2. **Same copy**, including eyebrows (`01 of 04 / Discover`), button labels, empty-state text. Numbers come from the API.
3. **Same tokens** — colours, radii, shadows, spacing, type scale, easing/durations. No new hex values in components; use `var(--…)`.
4. **Same responsive behaviour** — reproduce the design's breakpoints (640/820/860/900/960/1024/1080/1180/1240/1280/1320) where the component uses them.
5. **Same motion** — keyframes and durations from `effects.css`/`app.css`; respect `data-motion="calm"` and `prefers-reduced-motion`.
6. **Same interaction states** — hover, active, focus ring (`--focus-ring`), disabled, selected, loading.
7. **Same light and dark** — check both themes.
8. When the design and the backend disagree (field missing, different unit), keep the design's UI and log the gap in the module doc + `docs/decisions.md`; never silently invent data. Show a skeleton/empty state until the gap is closed.

States the design does not draw but a real app needs (loading, error, empty, unauthorised) use the DS `Skeleton`, `EmptyState`, `Alert` and `Spinner` in the design's visual language.

## 4. Order of work inside a module

1. DS primitives the module needs that are not ported yet (design-system first).
2. Shared composites (`components/`), then feature-only components, then the page.
3. Wire data last: adapter + query hook; start from fixtures shaped like the backend DTO (MSW), swap to live API.
4. Visual parity check against the design page served locally (see `06-testing-strategy.md`).

## 5. Known design bugs to fix while porting (from the design audit)

| # | Issue | Fix in the app |
|---|---|---|
| 1 | `requests` never reads `?id`; notification links to `req-1` while ids are `rq-*` | `/requests/:requestId` opens that request's panel |
| 2 | `passport?id=isr` ignored | `/passport#isr` scrolls to Standing |
| 3 | Holdings/listings pass their own ids to `openWeo`, falling back to `WEOS[0]` | use `weoId` from collections/listings DTOs |
| 4 | Community "Mine" filter uses `authorId === 'mem-1'` | compare with the signed-in user id |
| 5 | O peg: `weo-model` ×99 vs `wv-data` 100 Os = $1 | ✅ M03: the backend states the card price (`weoverse.priceOs` / `priceUsd`, from `usdAgainstO`); the frontend never applies a peg |
| 6 | Contact setting `'off'` vs `'none'` | backend enum `anyone|circles|off` |
| 7 | Tracking page uses `followed` instead of `tracked` | real tracking API (M08) |
| 8 | `HUB.CIRCLE_META` referenced but never defined | derive from circles API |
| 9 | location copy (profile "Where you are", Calendar "events you're going to") | drop; product is fully digital |
| 10 | `NoteBody` reads a numeric `width` as px, so the hero lede (`width={56}`) renders 56 px wide — one word per line | ✅ M03: a number is a width in `ch` (56ch), the measure the copy was written for |
| 11 | `Progress` gets `tone="gold" / "green" / "violet"` on the WeO page, which the DS paints as CSS named colours | ✅ M04: `var(--o-gold)` / `var(--o-green)` / `var(--o-violet)` |
| 12 | `weo-model` `shortLeft` prints "closed" for a WeO with no close time at all | ✅ M04: no clock reads "open" |
| 13 | A Pool with no edition size reads "Left 0 of 0"; the WeO page repeats a Listing's Resale row | ✅ M04: "Funded n%"; Resale row only when the terms lack it |
