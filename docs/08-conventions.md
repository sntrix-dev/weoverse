# 08 — Code conventions

## Naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase `.tsx` + same-name `.module.css` | `WeoTile.tsx`, `WeoTile.module.css` |
| Page | `<Name>Page.tsx` in `features/<f>/pages/` | `DiscoverPage.tsx` |
| Hook | `useX.ts` | `useWeoList.ts` |
| Query hooks | `use<Entity><Verb>` | `useWeoDetail`, `useCircleJoin` |
| Adapter | `to<ViewModel>` in `model/` | `toCardModel(dto)` |
| Store | `use<Name>Store` | `useUiStore` |
| Types | `PascalCase`, props `XProps`, DTOs from `api/generated` | `WeoCardDto` alias |
| CSS module classes | camelCase | `.stallTile`, `.isActive` |
| Constants | `SCREAMING_SNAKE` | `MARKET_NAV` |
| Design name kept | when a design component has a name, keep it | `SectionHero`, `OProfileHub`, `V3NextBar` → `FlowBar` only if renamed in `decisions.md` |

## Components

- Function components, named exports, one component per file (tiny private helpers may share).
- Props typed with interfaces; no `any`; unions for tones/formats/variants.
- No data fetching inside `design-system/` or `components/` — they receive props. Pages and feature containers fetch.
- Accessibility: buttons are `<button>`, icons get `aria-label`, sheets trap focus and close on Esc, respect `prefers-reduced-motion`.
- Keep files under ~250 lines; split sub-components into the same folder when larger.

## Imports

- Path alias `@/` → `src/`. Order: react/libs → `@/` absolute → relative → styles.
- Public entry points: `@/design-system`, `@/components/<group>`; don't deep-import across features.

## Styling

- Tokens only (`var(--…)`); no raw hex/px outside tokens except 0/1px hairlines already used by the design.
- Dynamic values via CSS custom properties.
- Global classes only for things `app.css` defines globally (`weo-rail`, `weo-scroll-hide`, keyframes, `html[data-*]` rules).

## Data

- Components get view models, never DTOs.
- All server data through TanStack Query; no `useEffect` fetches.
- Optimistic mutations roll back on error and show a toast in the design's toast style.

## Comments & docs

- Comment *why*, not *what*. Reference the design file when a choice mirrors it: `// design: src/pages/discover.jsx FeedCover rotates every 9s`.
- Any deviation from the design goes in `docs/decisions.md` with the reason.
