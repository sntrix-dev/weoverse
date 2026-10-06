# Test report — M11 Worlds & lifecycle

| | |
|---|---|
| Date | 2026-10-06 |
| Frontend | branch `feat/m11-worlds-lifecycle` |
| Backend | branch `redesign/m11-worlds-lifecycle` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend :5173 · backend `redesign/m11-worlds-lifecycle` :3002 · Surya's session |
| Result | ✅ pass after two fixes (below). Rehearse → keep → open to reactions ran live on a test draft opened to a Circle with no members, so nobody was told (Surya's choice); reacting and pledging are tested by code only. The test draft was deleted afterwards; one settled rehearsal receipt stays on "Weo bid 21". |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint | ✅ | new files clean, no `any` in the service or controller; no new errors on changed lines |
| backend | jest | ✅ | 80 suites / 1,096 tests in the Cowork VM (+1 suite, +12 tests: the vetting service) |
| backend | `npm run docs:lint` | ✅ | valid; 40 warnings (the preferences examples now carry `seen`) |
| backend | wire-shape diff | ✅ | additive: draft `vetting`, preferences `seen`, notification target `vetting`; new `/me/drafts/:id/rehearsal`, `/open-reactions`, `/open-pledges`, `/vetting…` |
| frontend | typecheck | ✅ | |
| frontend | lint | ✅ | 0 errors; warnings only in `src/design-system/` (D-016) |
| frontend | tests | ✅ | 258 / 258 (33 files, +22). One run of five saw a timing flake in the full suite; it passed on rerun. |
| frontend | build | ✅ | `three` lives only in the `world3d` chunk (574 kB, loaded when a world opens); the studio is its own 56 kB chunk |

New tests: the simulation model (9), the lifecycle — every stage's verb, open-to-reactions confirm and body, unfinished drafts to the composer, open pledges, the vetting sheet from a notification (react) and pledging, what waits on a Circle, the studio's draft chain and keep body, the flow simulation with the sweep and no plan / fee (9) — and intros (4: curtain once, replay, walkthrough, reset).

## 2. Browser pass

| Check | Result |
|---|---|
| Community intro curtain (first visit), the spine ring, Enter; walkthrough anchored to In flight | ✅ after fix 1 |
| Create and Exchange curtains with their clips | ✅ after fix 2 (the clip did not autoplay) |
| Draft → Rehearse → Where · Who · Terms → run → forecast → Share (Platform · Support) → review (≈ $12.12, the 99 peg) → Keep → In flight "Open to reactions" | ✅ after fix 3 |
| Open to reactions: unfinished draft → "Finish it first"; complete → review naming the audience → opened, "nobody to tell yet" → "0 of 12 reactions" | ✅ |
| Vetting sheet as owner | ✅ |
| Flow simulation of a live WeO of yours: 3D night market, crowd, run, projection, sweep, Settle → Confirm → receipt (`POST /weos/:id/rehearsals` 200) | ✅ |
| 390 × 844: hub, the studio stacks (stage, under test, controls) | ✅ |
| Dark | ✅ |
| Console errors | none |

## 3. Bugs found and fixed

| # | Severity | What | Fix |
|---|---|---|---|
| 1 | High | The intro curtain rendered blank: it was portalled to `body`, which the global intro rule hides | portal into `#root` |
| 2 | Medium | Intro clips did not play (React does not reflect `muted`) | set `muted` and play on mount |
| 3 | High | Keeping a draft's terms answered 500: Mongo cannot set `vetting.stage` inside a `null` subdoc | backend sets the whole `vetting` subdoc on rehearse; test asserts it |
| 4 | Low | The keep review priced Os at 100 = $1 | passes the settlement peg |

## 4. Open

- The validated mark is stored on the WeO (`validation`) but no card shows it yet (G-75).
- Holding Os against a pledge — not built (D-086).
- Splash, signature pass and orientation not built (D-095); rehearsal tour, WeO Flow hand-off, flagging not built (D-087, D-092).
