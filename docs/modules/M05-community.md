# M05 — Community

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ done 2026-10-01 | `feat/m05-community` | `redesign/m05-community` (from `redesign/m04-discover`) | `reports/M05-community.md` |

Q-2 is resolved (user, 2026-10-01): **Stewards are the backend's top contributors** (`GET /community/snapshot/contributors`). No new role, no steward badge on circles or answers (D-036).

## Screens

| Path | Design | Blocks, in design order |
|---|---|---|
| `/community` | `community.jsx` `HubScreen` | PathBar · SectionHero "Community" (stats In flight / With your circle / Live; directory In flight · Circles · Community & wallet) · **In flight**: IconSegs Cards/Rail/List → `InFlightGrid` of `NextO` (StageRing + verb) + "New WeO" slot · Rows **Your circles** (`CircleGrid`: `CircleRecord`, opens to `CircleOrbit`; Manage) / **Circles you can join** · Rows **Community** (`LensSegs` Questions/Stewards/Stories; Questions → Tabs All/Open/Resolved/Mine → `ThreadRow`s; Stewards → `StewardGrid` ×4; Stories → `StoryGrid` of `PreviewCard`) / **Wallet** (`OWalletPanel`) · FlowBar for the first in-flight WeO with a verb, else FlowFoot → Exchange |
| `/community/circles/:circleId` | `circle.jsx` `CircleScreen` | PathBar (+ best type) · header card (CircleOi, axis, CircleChip, name, Clamp description, membership sentence, stat pills members/WeOs/discussions/desire/win rate; Join · Start a discussion · Rehearse this context) · `CircleSnapshot` (Discussions/Members/WeOs cards = tabs) · tab body: discussions list + Trending tags · members grid · WeOs grid (`WeoTile`, engage = push for your own) |
| `/community/threads/:threadId` | `thread.jsx` `ThreadScreen` | PathBar (circle › Thread) · question card (Avatar, name + ISR pill, posted time + circle, Open/Resolved, title, body, tags, Report) · "N answers" · `AnswerCard`s by score (vote ±, accept, Reply composer, replies) · answer composer · sidebar Attached WeO (`WeoTile`, Rehearse) + Thread stats |
| `/community/circles` | `circles.jsx` `ManageScreen` | PathBar · SectionMark · H1 · Your Circles rows (CircleOi, counts, CircleChip, mute/unmute OButton, Leave) · Open Circles cards (Join) |
| `/community/stewards` | `stewards.jsx` `StewardsScreen` | PathBar · SectionMark · H1 · four stat tiles · Tabs All/Pool/Hunt/Digital arts/Digital assets · `StewardGrid` |
| `/community/stories` | `stories.jsx` `StoriesScreen` | PathBar · lead story · 02 The arc · 03 More · CTA (Enter a world · Create a WeO) |

Modals (`screens-more.jsx`): `ComposeModal` (2 steps: question/detail/prompts → attach a WeO + pick a Circle), `PushModal` (2 steps: question/context → review), `ReportModal` (four reasons). Hosted over any page by `CommunityHost` (lazy), driven by `stores/flow.ts`.

## Components

| Component | File |
|---|---|
| `PreviewCard`, `ThreadRow`, `LensSegs`, `StoryGrid` | `features/community/components/Hub.tsx` |
| `CircleOrbit`, `CircleGrid` | `features/community/components/CircleGrid.tsx` |
| `NextO`, `InFlightGrid` | `features/community/components/InFlight.tsx` |
| `StewardGrid` | `features/community/components/StewardGrid.tsx` |
| `CircleSnapshot` | `features/community/components/CircleSnapshot.tsx` |
| `AnswerCard` | `features/community/components/AnswerCard.tsx` |
| `ComposeModal`, `PushModal`, `ReportModal`, `CommunityHost` | `features/community/components/modals/*` |
| `OWalletPanel`, `MockOsSheet`, `MoveOsSheet` (moved forward from M09, D-038) | `components/wallet/OWalletPanel.tsx` |

## API map

| Block | Endpoint | Status |
|---|---|---|
| your / suggested circles | `GET /frontend/community/circles?filter=all` | OK |
| circle header + discussions + trending tags | `GET /frontend/community/circles/:id` | BE additive: `collectThrough7d`; fix `threads[].circleName` |
| members tab, member rim | `GET …/circles/:id/members?limit` | OK |
| WeOs tab | `GET …/circles/:id/weos` | OK |
| join / leave / mute | `POST …/:id/join`, `DELETE …/:id/leave`, `PATCH …/:id/notification {off\|all}` | OK |
| questions feed | `GET /frontend/community/discussions?filter=all\|open\|resolved\|mine&limit` | OK |
| thread | `GET /frontend/community/threads/:id` | fix: `author.isr` was always 100 |
| new discussion | `POST /frontend/community/threads {question, detail?, circleId, attachedWeoId?, tags[]}` | fix: response now carries `author` + `circleName` |
| answer / vote / reply / accept | `POST …/threads/:id/answers`, `POST /frontend/community/answers/:id/vote {value}`, `…/replies {body}`, `…/accept` | OK (accept is thread-author only) |
| stories | `GET /frontend/community/stories?limit` | OK |
| stewards | `GET /frontend/community/snapshot/contributors?window=all&metric=helpful&limit` | BE additive: `bio`, `weoCount`, `focus`, `circleCount`, `isFollowing`; deleted accounts dropped |
| stewards "Resolved · 7d" | `GET /frontend/community/snapshot/pulse?window=7d` | OK |
| follow | `POST /frontend/users/:id/follow`, `DELETE /frontend/users/:id/unfollow` | fix: 400/404/409 instead of 500 |
| push a WeO | `POST /frontend/community/push {weoId, question, description?, circleId}` | fix: response carries `author` + `circleName` |
| report | `POST /frontend/report {threadId\|answerId, reportType, description?}` | OK (response leak logged, G-45) |
| in flight | `GET /frontend/me/drafts`, `GET /frontend/community/my-weos` | fix: my-weos filtered a non-existent `isDeleted` path → always empty |
| wallet row | `GET /frontend/wallet/overview`, `POST /frontend/wallet/transfer {toUserId, amount}` | OK |

## Decisions (see `decisions.md`)

- D-036 Stewards = top contributors (all-time, helpful). The grid keeps the design's "Steward · N Circles" chip; circles lose "Stewarded by", answers lose the Steward badge.
- D-037 In flight until M11 = your drafts (stage Draft, verb Rehearse → Create) + your live WeOs (stage Live, verb Move with the market → Exchange). "With your circle" is 0 until reactions/pledges exist.
- D-038 `OWalletPanel` moves from M09 to M05 (the hub's Wallet row). Move Os posts a real transfer.
- D-039 Circle figures: desire = `resolvedRate7d`×100 (as M04), win rate = `collectThrough7d`, "here now" = `activeNow`, rim = first six members.
- D-040 Push / Ask opens the push sheet on any WeO: yours posts via `/community/push`, anyone else's is a question with the WeO attached.
- D-041 Report reasons: Spam or scam → `spam`, Harassment or hate → `harassment`, Off-topic or misleading → `misleading`, Something else → `other`.
- D-042 "Accept answer" shows only to the thread's author; everyone else sees "Accepted" on the accepted answer.

## Gaps / questions

| Need | Status |
|---|---|
| Thread vote race returns 500; GET thread bumps `viewCount` on every read | logged G-42, G-43 |
| Attached WeO `circleCount` always 0 | G-44 (FE reads the full WeO instead) |
| Report response returns other reporters and admin notes | G-45 |
| `GET /users/:id` and `GET /users` leak email/phone/address | G-46 |
| Several tabs refreshing the session at once signed the user out (browser pass) | M12 (single-flight refresh across tabs) |
| A circle's `weoCount` counts more than the WeOs pushed into it (`/weos` can be empty while the count is 18) | G-47 |
| Stories have no detail page; a story without `threadId` opens its WeO | design gap |
| Rehearse this context / Enter a world | M11 (hidden until then, D-027) |

## Acceptance criteria

- Join / leave / mute persist and the counts move.
- A new discussion appears in its circle and the questions feed; answer, vote (±, remove), reply and accept work and persist.
- Pushing your own WeO to a circle creates its thread; a report submits.
- All six screens at parity (1440×900, 390×844, light and dark), network 2xx, zero console errors.
