# Test report — M05 Community

| | |
|---|---|
| Date | 2026-10-01 |
| Frontend | branch `feat/m05-community` |
| Backend | branch `redesign/m05-community` @ `ad352b7` |
| Environment (automated) | Linux workspace · Node 22 · jsdom (Vitest) · backend suite in the Cowork VM with the real `.env` |
| Environment (browser pass) | macOS · Chrome + Claude in Chrome · frontend `npm run dev` :5173 · backend `redesign/m05-community` :3002 · Surya's O-Wallet session, then the dev user |
| Result | ✅ pass — live discussion, answer, vote, accept, reply, follow/unfollow and mute/unmute; no Os moved (Move Os tested with mocks only) |

## 1. Automated checks

| Repo | Check | Result | Notes |
|---|---|---|---|
| backend | `npx tsc --noEmit` | ✅ | |
| backend | lint | ✅ | no new errors (rule-by-rule diff against `redesign/m04-discover`) |
| backend | jest | ✅ | 64 suites / 933 tests (+15: contributors fields, `contributorMakes`, collect-through, WeO faces, real authors, my-weos filter, follow statuses) |
| backend | `npm run docs:lint` | ✅ | 37 warnings = base |
| frontend | `npm run typecheck` | ✅ | |
| frontend | `npm run lint` | ✅ | 0 errors; 26 warnings, all in `src/design-system/` (D-016) |
| frontend | `npm test` | ✅ | 156 / 156 (18 files) — +17 |
| frontend | `npm run build` | ✅ | community pages, sheets and the wallet panel load as their own chunks |

### What the new frontend tests cover

- **Models (7):** person fallbacks; thread rows (replies, resolved, top answer, WeO face); thread page sorting and "mine"; circle win rate / trending tags; steward rates; stories with and without a thread; in flight (drafts first, closed WeOs out).
- **Screens (13):** the hub (in flight, circles, questions, stewards, stories, wallet, draft → composer); Move Os POST; circle page (figures, tag filter, members, WeOs), leave, start a discussion with an attached WeO, push vs ask on someone else's / your own WeO; thread (scores, vote toggle, reply, answer, accept by the asker, report, a failed vote rolls back); manage (mute); stewards (figures, format tab, follow); stories (a story without a thread opens its WeO).

## 2. API checks (live)

| Endpoint | Expected | Actual | ✅/❌ |
|---|---|---|---|
| `GET /community/snapshot/contributors` | new fields | `bio, weoCount, focus, circleCount, isFollowing` present (focus "Technology & Digital") | ✅ |
| `GET /community/my-weos` | your WeOs | 6 (was always 0) | ✅ |
| `GET /community/discussions` | WeO face | row with an attached WeO carries `attachedWeoFace` | ✅ |
| `POST /community/threads` | 201, row with author + circle | thread created in Selling, attached "Weo bid 21" | ✅ |
| `POST …/answers`, `/vote`, `/accept`, `/replies` | persisted | score 1, Accepted, thread Resolved, 1 reply | ✅ |
| `POST/DELETE /users/:id/follow\|unfollow` | round trip | ✓ Following → Follow | ✅ |
| `PATCH /community/circles/:id/notification` | off → all | Muted → Unmuted | ✅ |

## 3. Browser — parity

| Part | Light | Dark | 390 | Notes |
|---|---|---|---|---|
| Hub hero, in flight (cards), rows, circle record → orbit | ✅ | ✅ | ✅ | design shows the M11 intro chip and "Refine with the community" — M11 |
| Circle page header, snapshot cards, discussions, trending tags | ✅ | ✅ | ✅ | no "Stewarded by" (D-036), no "Rehearse this context" (M11) |
| Thread page | ✅ | ✅ | ✅ | |
| Manage, stewards, stories | ✅ | ✅ | ✅ | stewards' tab row scrolls at 390 (design clips it) |
| Compose, push, report sheets | ✅ | — | — | |

## 4. Browser — interactions

| # | Scenario | Expected | Actual | ✅/❌ |
|---|---|---|---|---|
| 1 | Start a discussion in Selling, attach a WeO | lands on the circle, thread listed, collect-through appears | ✅ | ✅ |
| 2 | Answer, upvote, accept (as the asker), reply | persists; thread Resolved | ✅ | ✅ |
| 3 | Follow / unfollow a steward | toggles, persists | ✅ | ✅ |
| 4 | Mute / unmute a circle | toast, persists | ✅ | ✅ |
| 5 | Ask about someone else's WeO from its page | push sheet aimed at its circle | first aimed at General (bug M05-B1) → fixed | ✅ |
| 6 | Console | no errors | 0 | ✅ |

## 5. Bugs

| ID | Sev | Where | Description | Fix | Status |
|---|---|---|---|---|---|
| M05-B1 | Medium | push sheet | a WeO whose format has no circle (a Drop) went to the general circle, not the circle it sits in | fall back to the WeO's own circles (design order) | fixed |
| M05-B2 | Low | stewards | five format tabs widened the page at 390 | the row scrolls sideways | fixed |
| M05-B3 | Low | backend | thread authors read ISR 100; my-weos empty; follow refusals 500 | backend fixes (log #5, #7, #8) | fixed |

## 6. Open issues & follow-ups

- **Session across tabs (M12):** opening four app iframes at once made several refreshes race and signed the user out. Needs a single-flight refresh shared across tabs (BroadcastChannel / lock).
- Backend gaps opened: G-42 vote race 500, G-43 view counted per read, G-44 attached `circleCount` always 0, G-45 report response leak, G-46 user endpoints leak contact data, G-47 circle `weoCount` vs posted WeOs.
- No stories in the dev data — the Stories page and lens were checked with their empty state live and the full layout in tests.
- Test content left in the dev database: one thread "[M05 test] How do I price a first Listing?" in Selling with one answer and one reply.

## 7. Sign-off

- [x] All High/Medium fixed and re-tested
- [x] Docs updated (spec, plan, decisions D-036…D-042, design-port guide, API map, changelog, backend log, gaps)
- [x] Commits pushed (backend `redesign/m05-community`; frontend `feat/m05-community` → `master`, tag `m05-done`)
