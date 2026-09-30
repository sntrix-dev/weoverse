# Test report — MNN <Module name>

| | |
|---|---|
| Date | YYYY-MM-DD |
| Frontend | branch `feat/mNN-<slug>` @ `<sha>` |
| Backend | branch `redesign/mNN-<slug>` @ `<sha>` |
| Environment | macOS · Chrome <ver> + Claude in Chrome · Node <ver> · MongoDB <ver> · seed: <scripts run> |
| Result | ✅ pass / ⚠️ pass with open issues / ❌ fail |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | | |
| backend | `npm run lint` | | |
| backend | `npm test` | | N passed / N total (new: N) |
| backend | `npm run docs:lint` | | |
| backend | wire-shape diff (touched endpoints) | | additive only? |
| frontend | `npm run typecheck` | | |
| frontend | `npm run lint` | | |
| frontend | `npm test` | | N passed / N total |
| frontend | `npm run build` | | bundle size |

## 2. API checks (live, dev token)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|

## 3. Browser — visual parity

| Screen | 1440 light | 1440 dark | 390 light | 390 dark | Differences |
|---|---|---|---|---|---|

## 4. Browser — interactions

| # | Scenario (from spec acceptance criteria) | Steps | Expected | Actual | ✅/❌ |
|---|---|---|---|---|---|

Console errors: none / list. Failed requests: none / list.

## 5. Bugs

| ID | Sev | Where | Description / steps | Fix | Commit | Status |
|---|---|---|---|---|---|---|
| MNN-B1 | High/Med/Low | | | | | fixed / deferred → Mxx |

## 6. Open issues & follow-ups

-

## 7. Sign-off

- [ ] All High/Medium fixed and re-tested
- [ ] Docs updated (spec, plan, API map, decisions, changelog)
- [ ] Commits pushed (backend + frontend)
