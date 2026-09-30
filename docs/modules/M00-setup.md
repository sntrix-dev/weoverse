# M00 — Setup & docs

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ done 2026-09-30 | `master` | `redesign/m00-setup` (from `phase1/v3` @ d8fe909) | — (docs only) |

## Done

- Inventoried the design prototype and the backend → `reference/design-inventory.md`, `reference/backend-inventory.md`.
- Wrote docs 00–08, decisions log, module specs M01–M12, report template.
- Project skills in `skills/`: `module-delivery`, `design-port`, `api-integration`, `browser-test`. Backend skills in `weo-3.0/skills/`: `backend-endpoint`, `backend-verify`.
- `CLAUDE.md` created here; `weo-3.0/CLAUDE.md` corrected for drift (auth is HS256 + `req.user.id`, tests are mock-based unit tests, Nodemailer ^9, frontend repo path) and extended with §16 Redesign workflow; `weo-3.0/docs/redesign/` added (README, api-gaps, module log template).
- Backend: uncommitted `phase1/v3` edits discarded per user (recoverable stash), branch `redesign/m00-setup` created.
- Frontend repo initialised, remote `sntrix-dev/weoverse`.

## Open questions carried forward

See `decisions.md` Q-1 … Q-5.
