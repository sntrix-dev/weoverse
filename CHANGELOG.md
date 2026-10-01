# Changelog

All notable changes per module. Newest first.

## M02 — App shell (2026-10-01)

- Top bar (shrinks on scroll), split nav (left panel + support cluster), section switch with Next pill and an every-section option.
- Floating O nav (RingNav) with park/float flight, parked fan in the bar, auto-park below 720 px height.
- Passport dropdown from real nav-summary data (balance, tier, ISR, WeO ID copy, counts) with real log out.
- Mya dock: draggable orb, Ask Mya (backend chatbot, FAQ fallback) and Settings tabs.
- Footer with sitemap, newsletter (email-subscription API) and the external-link gate; flow bar; PathBar; toasts, ack ripple, sheet.
- Preferences saved to the backend (theme, layout, wordmark home, Mya, dock position, flow bar).
- Backend (`redesign/m02-app-shell`): complete `uiPreferences` on every read, `home/navSections/flowBar/flowBarTools`, chatbot `degraded`, Swagger fixes.

## M01 — Foundation (2026-10-01)

- Vite 8 + React 19 + TypeScript strict scaffold; ESLint, Prettier, Vitest + RTL + MSW (53 tests).
- Design tokens and global CSS verbatim; design assets in `public/`.
- 28 design-system components converted from the design's DS bundle and typed — DOM-identical to the design (64/64 cases).
- API client (envelope, field errors, single-flight refresh), OAuth2 + PKCE sign-in, dev token, every design route registered.
- Dev server serves the design reference at `/design/`.
- Backend (`redesign/m01-foundation`): `npm run dev:token`, `.env.example`, auth Swagger fixes.

## M00 — Setup & docs (2026-09-30)

- Development docs (`docs/`), module specs M01–M12, test report template, decisions log.
- Design and backend inventories (`docs/reference/`).
- Project skills (`skills/`) and `CLAUDE.md`.
