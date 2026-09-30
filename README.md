# WeOverse — v2 redesign app

React + Vite + TypeScript implementation of the **WeOverse v3** design, backed by the **weo-3.0** API.

> Status: planning complete (M00). The app is scaffolded in M01 — see [`docs/03-module-plan.md`](docs/03-module-plan.md).

## Docs

Everything lives in [`docs/`](docs/README.md): architecture, design-port guide, module plan and specs, per-module workflow, API integration, testing strategy, git rules, conventions, decisions and test reports.

## Quick start (from M01 on)

```bash
cp .env.example .env.local   # fill values locally — never commit them (public repo)
npm install
npm run dev                  # http://localhost:5173 (backend on :3002)
```

| Script | |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run api:types` | regenerate API types from the backend Swagger |
