# M11 — Worlds & WeO lifecycle

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m11-worlds` | `redesign/m11-worlds` | `reports/M11-worlds.md` |

## Scope

| Part | Design source | Notes |
|---|---|---|
| `WorldStudio` modal (where, who, terms, forecast, share; CommitReview; settle) | `world.jsx` | Pro-gated (`plans.sim`) |
| Simulation (`simulate`, `sweep`, `lifecycle`, COHORTS, SEASONS) | `world.jsx` | pure functions → `features/worlds/model/sim.ts`, unit-tested |
| `<weo-world>` three.js element (themes, fidelity, markers, walk/orbit) | `src/world/world3d.js`, `world3d-env.js` | three `0.184.0`, lazy chunk, wrapped in a React component |
| `WeoFlowGate`, `FlowPlanSheet` | `world.jsx` | plan upsell |
| V3 lifecycle: draft → rehearsed → reacting (12) → reacted → pledging (20) → live | `v3-spine.jsx` `window.V3` | server-backed; replaces the 2.6 s fake timer |
| In-flight grid on Community (`NextO`, `StageRing`) | `community.jsx` | from M05 stub → real stages |
| FlowBar world/Mya utilities | `v3-spine.jsx` | enable |
| Section arrivals + walkthrough (`V3Arrival`, `SectionArrival` v2, `V3Walk`, `orient`) | `v3-spine.jsx`, `arrival.jsx` | "seen" state per user (prefs) |
| `RehearsalTour` | `rehearsal-tour.jsx` | not loaded by the design — skip unless asked |

## API map

| Block | Endpoint |
|---|---|
| settle rehearsal | `POST /frontend/weos/:id/rehearsals` |
| rehearsal history | `GET /frontend/weos/:id/rehearsals`, `GET /frontend/me/rehearsals` |
| draft rehearsal before posting | drafts (`/me/drafts`) carry rehearsal result until posted |

## Gaps

| Need | Proposal |
|---|---|
| Community reactions & pledges on a pre-live WeO (thresholds 12 / 20) | new module `weo-lifecycle`: stage on draft/WeO, `POST /frontend/weos/:id/react`, `POST /frontend/weos/:id/pledge`, `GET /frontend/me/in-flight`; notification side effects |
| Walkthrough/intro seen flags | additive `uiPreferences.seen{...}` |

## Acceptance criteria

- World opens lazily (no three.js in the initial bundle), runs a simulation, settles a rehearsal that persists.
- A draft moves through all lifecycle stages with real reactions/pledges from a second account.
- Arrival curtain and walkthrough show once per user and can be replayed.
