# Changelog

All notable changes per module. Newest first.

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
