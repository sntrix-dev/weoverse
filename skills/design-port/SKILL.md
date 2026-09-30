---
name: design-port
description: Convert a component or page from the WeOverse v3 HTML design prototype (JSX globals + DS bundle) into this React/TypeScript app with exact visual parity. Use whenever porting UI from `redesign/project/WeOverse v3 - HTML`.
---

# Design port

Full rules: `docs/02-design-port-guide.md`. Inventory: `docs/reference/design-inventory.md`.

Design folder (read-only): `../redesign/project/WeOverse v3 - HTML/` relative to this repo (on the Mac: `~/Documents/projects/weoverse/redesign/project/WeOverse v3 - HTML/`).

## Steps

1. **Locate the source**
   - Page: `src/pages/<file>.jsx` (route→file map in `js/pages.js`; hub=`community.jsx`, listed=`exchange.jsx`, collected=`collect.jsx`, manage=`circles.jsx`).
   - Shared: find the export: `grep -n "^function <Name>\|^const <Name>\|window.<Name>" src/components/*.jsx`.
   - DS: `grep -n "^// components/" js/ds/_ds_bundle.js` then read that section (compiled `React.createElement`, readable).
   - Note every helper/const it depends on and every `app.*` call and `HUB/WV/FEED/TPL/WEO.*` read.
2. **Decide placement**: `design-system/` (DS bundle), `components/<group>/` (used by ≥2 features), or `features/<f>/components/`. Check it isn't already ported (`grep -rn "export function <Name>" src/`).
3. **Write the TSX**
   - Named export, typed props (`interface <Name>Props`), unions for tone/variant/format.
   - Same element tree and order, same copy.
   - Static inline styles → `<Name>.module.css`; dynamic values → CSS custom properties (`style={{'--tone': tone} as React.CSSProperties}`).
   - Only `var(--token)` values. Global `weo-*` classes stay global.
   - Replace `app.*` with hooks (router, feature mutations, `useUiStore`), data globals with props (view models).
   - Keep the design name; add `// design: <file> <Name>` above the component.
4. **Motion & states**: port keyframes/transitions; honour `html[data-motion="calm"]` and `prefers-reduced-motion`; add hover/focus/disabled/loading and empty/error states using DS `Skeleton`/`EmptyState`/`Alert`.
5. **Test**: RTL test for render + key interactions; add it to `/dev/ds` (components) with fixture props.
6. **Parity check**: open the design page (`http://localhost:8000/<file>.html`) and the app side by side at 1440×900 and 390×844, light and dark (see `browser-test` skill). Fix differences before moving on.

## Do not port
`tweaks-panel.jsx`, `rehearsal-tour.jsx`, `js/boot.js` resource fallbacks (`RES`, `__fixRes`), `order.json`, unused exports (`WeoShowcase`, `HeroPortal`, `MyaPrompts`, `MyaGuide`, `WeoTimer`, `StatStrip`, `CFORMAT_CLIP`, `Mantra`, `EdgeArc`, `PortalJumpSheet`), fake timers, session/local storage state, `window.claude.complete`.

## Checklist before done
- [ ] Same structure/copy/tokens as design
- [ ] No `any`, no raw hex, no data fetching in DS/shared components
- [ ] Light + dark, 1440 + 390 checked
- [ ] Test written; `npm run typecheck && npm run lint && npm test` green
