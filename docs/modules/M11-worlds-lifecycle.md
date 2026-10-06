# M11 — Worlds & WeO lifecycle

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ⏳ in progress | `feat/m11-worlds-lifecycle` (from `develop`) | `redesign/m11-worlds-lifecycle` (from `redesign/m10-notifications-company`) | `reports/M11-worlds-lifecycle.md` |

## Scope

| Part | Design source | What it becomes |
|---|---|---|
| World Studio — rehearse a draft (Where · Who is there · Terms · Forecast · Share; Keep the terms) and simulate a live WeO (worlds, fidelity, market context, terms, provisional result, sweep, projection, settle to the ledger) | `world.jsx` `WorldStudio`, `SimProjection`, `ChainStep`, `WorldStage` | `features/worlds`: a lazy full-screen studio opened from anywhere (`openWorld` in the flow store) |
| The simulation | `world.jsx` `simulate`, `sweep`, `lifecycle`, `COHORTS`, `SEASONS`, `SCENARIO_NOTE` | `features/worlds/model/sim.ts` — pure, unit-tested; market contexts and clear rates from `/weos/interests`, comparables from the live floor |
| The walkable world | `src/world/world3d.js`, `world3d-env.js`, `css/ds/tokens/world.css` | `<weo-world>` ported to TS on `three`, a lazy chunk; the flat stage stands in if WebGL is missing |
| The lifecycle: Draft → Rehearsed → Reacting (12) → Reacted → Pledging (20) → Live | `v3-spine.jsx` `V3`, `nextAct` | server-backed on drafts (`vetting`), replacing the M05 two-stage stub (D-037) |
| In flight (Next-O, stage ring, the next step) | `community.jsx` `NextO`, `InFlightGrid`, `HubScreen` | the hub's In flight with every stage, and the next-step bar |
| Reacting and pledging on someone else's WeO | — (the design fills the ring on a timer) | a vetting sheet: say what you'd pay and why, or pledge; opened from the Circle page, a notification, or the link |
| Section intros and the walkthrough | `v3-spine.jsx` `V3Arrival`, `V3Walk`; `arrival.jsx` | the first-visit curtain per section and the walkthrough, remembered on the account (`uiPreferences.seen`) |
| Rehearse / worlds entry points | creator panel, Mya, request panel, Create's "Rehearse it", the hero's Rehearse dock, the O nav's Worlds jump, the flow bar's world util (D-024, D-033, D-054, D-064) | wired to the studio |
| `RehearsalTour`, `WeoFlowGate`, `FlowPlanSheet` | `rehearsal-tour.jsx` (not loaded by the design), `world.jsx` | not built (D-087) |

## API map

| Block | Endpoint | Status |
|---|---|---|
| settle a live WeO's rehearsal | `POST /frontend/weos/:id/rehearsals` | OK (exists) |
| rehearsal history | `GET /frontend/weos/:id/rehearsals`, `GET /frontend/me/rehearsals` | OK |
| market contexts, clear rates, the live floor | `GET /frontend/weos/interests`, `GET /frontend/weos?status=active` | OK |
| keep a draft's rehearsed terms | `POST /frontend/me/drafts/:id/rehearsal` | **BE new** |
| open to reactions / open pledges | `POST /frontend/me/drafts/:id/open-reactions`, `/open-pledges` | **BE new** |
| in flight | `GET /frontend/me/drafts` (+ `vetting`) | BE additive |
| a WeO in vetting, the list for a circle | `GET /frontend/vetting/:id`, `GET /frontend/vetting?circleId=` | **BE new** |
| react, pledge, withdraw a pledge | `POST /frontend/vetting/:id/reactions`, `POST/DELETE /frontend/vetting/:id/pledges` | **BE new** |
| intros seen | `PATCH /frontend/users/me/preferences` (`seen`) | BE additive |

## Decisions (to `decisions.md`)

- D-086 A pledge is a promise: who, at what price — nothing is held from their wallet, and the screens say so. At twenty the WeO posts itself (the create body saved when it opened to reactions, validated again), marked validated, and every pledger is told it is open to collect first. (Surya)
- D-087 The World Studio is free for everyone, the sweep included; no Pro gate, no plan sheet. "Hand to WeO Flow" is not built (there is no operator desk), nor the rehearsal tour. (Surya)
- D-088 Section intros and the walkthrough show once per account, kept with the preferences (`seen`); the hero's mark replays a section's intro, and Settings → Your data → "Reset the guided tours" brings them all back. (Surya)
- D-089 A WeO in vetting is a draft, not a WeO: it never reaches the floor, search or a storefront; only its vetting card is readable by others, and only while it is reacting or pledging.
- D-090 Where others react and pledge (the design only fills the ring on a timer): a vetting sheet — what you would pay, a note, or a pledge at its price — opened from the Circle page ("Waiting on this circle"), the notification, or your own In flight.
- D-091 Opening to reactions notifies the audience chosen in the studio's Share step: the members of a Circle, your followers, or named people (by handle). Only on that step's explicit confirm.
- D-092 Flagging and "Refine with the community" on a live WeO are not built (no steward review or live notes yet).
- D-094 The flow simulation runs on any live WeO; only your own settle to your ledger. Contexts are the network's categories (`/weos/interests`); with none yet the model runs neutral and says so.
- D-095 The first-visit splash, the v2 signature pass and "orientation" are not built; the v3 curtain and walkthrough are.
- D-093 The simulation is a model and says so ("Projected", "Modelled crowd"); its market contexts and clear rates are the network's real ones, its comparables are the live floor. The commit review drops the design's "2% WeO Flow fee" line (no fee is charged, M06).

## Gaps

| Need | Status |
|---|---|
| Lifecycle on drafts (stage, rehearsal, audience, create body) | BE new |
| Reactions and pledges (promise) | BE new |
| Auto-post at twenty pledges, validated mark | BE new |
| Intros seen | BE additive |
| Holding Os against a pledge | not built (Surya: promise only) |

## Acceptance criteria

- The studio opens lazily (no three.js in the first bundle), runs the simulation, keeps a draft's terms (stage Rehearsed) and settles a live WeO's rehearsal to the ledger.
- A draft moves Draft → Rehearsed → Reacting → Reacted → Pledging → Live with real reactions and pledges (tested by code; live needs other members — Surya's go-ahead).
- In flight shows every stage with its next step; "Post it now" stays one tap away.
- Intros show once per account and replay from the hero's mark and Settings.
- 1440×900 and 390×844, light and dark, network 2xx, zero console errors.
