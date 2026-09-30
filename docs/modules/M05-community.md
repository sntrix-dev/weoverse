# M05 — Community

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m05-community` | `redesign/m05-community` | `reports/M05-community.md` |

## Screens

| Path | Design | Blocks |
|---|---|---|
| `/community` | `community.jsx` `HubScreen` | SectionHero (In flight / With your circle / Live) · **In flight** (IconSegs cards/rail/list; `NextO` items — until M11 these are the user's drafts + recent posts) · Rows **Your circles** (+ Manage) / **Circles you can join** · Rows **Community** (LensSegs Questions/Stewards/Stories; Questions Tabs All/Open/Resolved/Mine) / **Wallet** (`OWalletPanel`) · FlowBar/FlowFoot |
| `/community/circles/:circleId` | `circle.jsx` `CircleScreen` | header card (axis, name, description, membership line, stat pills, steward, Join / Start a discussion / Rehearse this context) · `CircleSnapshot` tabs Discussions / Members / WeOs |
| `/community/threads/:threadId` | `thread.jsx` `ThreadScreen` | question card (author+ISR, time, circle, Open/Resolved, tags, Report) · answers sorted by score (`AnswerCard`: vote, steward badge, accept, reply composer, replies) · answer composer · sidebar attached WeO + stats |
| `/community/circles` | `circles.jsx` `ManageScreen` | Your Circles (mute/unmute, Leave) · Open Circles (Join) |
| `/community/stewards` | `stewards.jsx` | summary stats, Tabs All/Pool/Hunt/Digital arts/Digital assets, `StewardGrid` (Follow) |
| `/community/stories` | `stories.jsx` | lead story, The arc, More, CTA |

Modals (from `screens-more.jsx`): `ComposeModal` (2-step new discussion → circle), `PushModal` (WeO → circle thread), `ReportModal`.

## API map

| Block | Endpoint |
|---|---|
| circles joined/suggested | `GET /frontend/community/circles` |
| circle | `GET /frontend/community/circles/:id`, `/members`, `/weos` |
| join / leave / mute | `POST …/:id/join`, `DELETE …/:id/leave`, `PATCH …/:id/notification {off|weekly|all}` |
| questions feed | `GET /frontend/community/discussions` (filters open/resolved/mine) |
| thread | `GET /frontend/community/threads/:id`, `/related` |
| new thread | `POST /frontend/community/threads` |
| answer / vote / reply / accept | `POST /frontend/community/threads/:id/answers`, `POST /community/answers/:id/vote`, `/replies`, `/accept` |
| stories | `GET /frontend/community/stories` |
| hero stats, contributors, my standing | `GET /frontend/community/snapshot/pulse`, `/contributors`, `/me` |
| push WeO | `POST /frontend/community/push` |
| report | `POST /frontend/report` |
| hub search | `GET /frontend/community/search` |

## Gaps / questions

| Need | Status |
|---|---|
| Stewards page + steward badge (Q-2) | backend removed stewards; decide mapping |
| Thread `resolved` toggle for author | check `status` update path; `accept` may cover it |
| Circle "desire", "win rate", "waitlist", `rim` (live members) | compare with `CommunityCircle` counters (`activeNow`, `resolvedRate7d`, `newWeosThisWeek`) |
| "Mine" questions filter | needs `authorId=me` filter on discussions |

## Acceptance criteria

- Join/leave/mute persist; counts update.
- Create thread → appears in circle and feed; answer, vote (±, remove), reply, accept work and persist.
- Push a WeO to a circle creates the thread; report submits.
- All six screens at parity.
