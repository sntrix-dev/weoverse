---
name: browser-test
description: Browser-test a WeOverse module in the user's Chrome via Claude in Chrome — visual parity against the design pages, interactions against the live backend, network/console checks — and write the module test report. Use at workflow step 8–9 of every module.
---

# Browser test

Strategy: `docs/06-testing-strategy.md`. Report template: `docs/reports/_TEMPLATE.md`.

## 1. Stack (runs on the user's Mac)

The Linux workspace can't reach the Mac's localhost, so the servers run on the Mac. Ask the user to start them (or, with permission, use computer use to open Terminal):

| Service | Command (Mac) | URL |
|---|---|---|
| MongoDB | `brew services start mongodb-community` | `localhost:27017` |
| Backend | `cd ~/Documents/projects/weoverse/weo-3.0 && git switch redesign/mNN-<slug> && npm run dev` | `http://localhost:3002/api/docs` |
| Frontend | `cd ~/Documents/projects/weoverse/v2-redesign-app && git switch feat/mNN-<slug> && npm run dev` | `http://localhost:5173` |
| Design | `cd ~/Documents/projects/weoverse/redesign/project/"WeOverse v3 - HTML" && npm run serve` | `http://localhost:8000` |

Dev token: `npm run dev:token` in `weo-3.0` → put in `.env.local` as `VITE_DEV_ACCESS_TOKEN` (or log in through the IdP).

## 2. Chrome session

1. Invoke the `claude-in-chrome` skill, load the core tools in one ToolSearch call (+ `read_console_messages`, `read_network_requests`, `gif_creator`, `resize_window`).
2. `tabs_context_mcp`, then create two new tabs: design page and app page.

## 3. Per screen in scope

1. **Parity** — `resize_window` 1440×900: screenshot design tab and app tab; compare structure, spacing, type, colour, copy, icons, motion. Repeat at 390×844. Toggle dark (`data-theme="dark"` / app setting) and repeat. Log each difference as a bug (Medium unless trivial).
2. **Interactions** — run every acceptance criterion from the module spec; reload to confirm persistence.
3. **Network** — `read_network_requests`: expected endpoints, 2xx, no request storms, no third-party placeholder hosts.
4. **Console** — `read_console_messages` with pattern `error|warn|Warning`: must be empty.
5. **States** — empty account, error (stop backend briefly), slow network.
6. Key flows → `gif_creator` recording with a descriptive name (e.g. `m04_collect_regular.gif`).

Avoid clicking things that raise native `alert/confirm` dialogs. If the extension stops responding after 2–3 tries, stop and ask the user.

## 4. Report

Fill `docs/reports/MNN-<slug>.md` (automated checks, API checks, parity table, interaction table, bugs with severity, open issues). Fix High/Medium, re-test only the affected rows, update statuses and commits in the bug table.
