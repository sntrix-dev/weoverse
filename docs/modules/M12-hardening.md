# M12 — Hardening & release

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m12-hardening` | `redesign/m12-hardening` | `reports/M12-hardening.md` |

## Scope

- Full regression: every acceptance criterion from M01–M11 re-run in the browser.
- Parity sweep: all 19 design pages vs app at 1440/390, light/dark.
- Accessibility: keyboard paths, focus traps in sheets, labels, contrast in both themes, reduced motion.
- Performance: route chunk sizes, three.js lazy, video preload, request counts per screen (rate limit), React Profiler hot spots.
- Error handling: offline, 401/403 account states (`ACCOUNT_BANNED` etc.), 429, 5xx — each screen.
- Security: no secrets in the public repo, token handling, XSS on user-generated text (threads, bios).
- Backend: close deferred Low bugs; open a PR for the `redesign/*` chain into `phase1/v3` if the user asks.
- Docs: final pass so every doc matches the shipped code.
