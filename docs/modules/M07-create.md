# M07 — Create

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| ✅ done 2026-10-05 | `feat/m07-create` | `redesign/m07-create` (from `redesign/m06-collect-exchange`) | `reports/M07-create.md` |

The largest page (`create.jsx`, ~1,400 lines). Split into feature components; no file over ~300 lines.

## Screens (`/create`, `?draft=:id`, `?edit=:id`)

| Step | Design | Blocks, in design order |
|---|---|---|
| 1 · Hero | `create.jsx` `CreateHero` | PathBar (WeOverse › Create) · glass frame · `Headline` (MAKE_MANTRAS rotating) · the O: `MakeDonut` + `MakeWell` (logo loop, edge clips under the pointer — voice / Enter jumps to the section; centre starts a blank WeO) · 8 format orbs on the ring (Sell, Pool, Bid, Request live; Hunt, Drop, Gift, Subscription "soon" → Notify me) · docks: Carry on (your drafts `OrbSlider` / Blank WeO), Templates (shelf strip + "All as cards" → `TemplateSheet`) | Asked for (open requests count → Requests), Track it (→ Exchange). FlowFoot back Community, next Templates |
| 2 · Composer | `CreateScreen` step 2 | card frame: format icon + "02 — Create" + `V3ModRing` (done/total) · three columns: left `ModWell`s (Category, Media, Tags, …), centre `PortalStage` Orb ↔ `WeOCard` ("See it as the card"), category line, `InlineText` title + description, `CardAssist` (draft with Mya), `InlineNum` terms per format, fork card **Preflight** (+ "Vet it first" hidden until M11), "Still needed", template drawer row; right `ModWell`s (terms) with collapse toggle · FlowBar step 2 of 3 |
| 3 · Preflight | step 3 | SectionHead "03 — Preflight / What goes live" · checklist (title & description + every module) · "How collectors see it" `WeOCard` · "What you receive" · **Post it** · FlowBar step 3 of 3 |
| Post | `screens-flows.jsx` `PostSheet` | where it goes: the whole network · a Circle (your joined + suggested) · one person (an open ask) → `SuccessMoment` → Exchange / circle / requests |
| 4 · Posted | `posted` | PathBar … › Posted · PortalStage orb · "{name} is live" · circle sentence · Push to a Circle · See it in Exchange · Create another |

Sheets: `TemplateSheet` (carousel of templates as WeO cards, fills, filmstrip), `TemplateDrawer` (bottom strip inside the composer).

## Formats → backend (D-051)

| Design | Endpoint | Shape |
|---|---|---|
| Listing ("Sell") | `POST /frontend/weos` `weoType: regular` | `price {amount: Os ÷ peg, priceSplit: 0, negotiableUpTo: %}` (0 unless "accept offers"), `quantity {amount, unitName}`, `customerLimit = totalWeoInCirculation = circulation`, `duration`, `availabilityTill`, `isResellable` |
| Bid | same, `negotiableUpTo` = the lowest offer you take, as % below the opening figure | a negotiable regular WeO reads as a Bid everywhere |
| Pool | `weoType: crowdfund` | `goal.amount`, `contribution.minimum` (Os), `deadline`, `duration` |
| Bid reserve | `price.negotiableUpTo` | reserve held = the floor % under the opening bid (default 20); none = 90 (D-056) |
| Request | `POST /frontend/request-weos` | `price {min, max}` (Os), `deadline` (epoch ms), category id + name |
| Hunt, Drop, Gift, Subscription | — | "coming soon" in the design (CRE-12): on the ring, never open a composer |

Prices are entered in Os; a regular WeO stores US dollars, so the composer converts with the backend's peg (`GET /frontend/config/o`), never a hard-coded rate (D-005).

## API map

| Block | Endpoint | Status |
|---|---|---|
| categories | `GET /frontend/categories` | OK |
| post | `POST /frontend/weos`, `POST /frontend/request-weos` | OK (body mapping D-051) |
| post to a circle / answer an ask | then `POST /frontend/community/push`; `POST /frontend/weos/requested {requestedId}` | OK |
| peg | `GET /frontend/config/o` | BE new |
| media | `POST /frontend/media` (raw body, image ≤ 10 MB, video ≤ 100 MB) | BE new (reuses `MediaService`) |
| draft with Mya | `POST /frontend/ai/describe {title, format, category?}` → three lines | BE new (LangChain chat model, rate-limited) |
| templates | `GET /frontend/templates` | BE new (D-050) |
| drafts | `GET/POST /frontend/me/drafts`, `PUT/DELETE /me/drafts/:id` (debounced autosave) | OK |
| edit | `GET /frontend/me/listings/:id` → `PUT /frontend/weos/:id` | OK |
| asked-for count | `GET /frontend/request-weos?limit=1` (total) | OK |
| push after posting | `POST /frontend/community/push` (push sheet) | OK |

## Decisions (see `decisions.md`)

- D-050 Templates are served by the backend; premium shows locked until plans/billing (M09).
- D-051 Format mapping above; prices in Os converted with the backend peg.
- D-052 The backend requires a description, so the composer asks for "a line" alongside a name, a category and a figure before preflight.
- D-053 A format pick starts with no media (the design seeds a stock image — that would post a design asset as the WeO's picture); the orb shows the format colour until you upload.
- D-054 "Vet it first", "Ask a Circle", "Rehearse" and the hero's Rehearse dock wait for M11 (D-027). "Notify me" on soon formats is remembered on this device only.
- D-055 Fees: the preflight shows what settlement takes (nothing today), not the design's 2 % Flow fee.
- D-056 Post sheet: network = create; a Circle = create then push (title as the question); one person = create with `requestedId` (Listing / Bid). A Request posts straight to the asks board. Bid reserve = the floor. `?edit=` saves in place.
- D-057 A Request has no Media module (the request endpoint stores none).
- D-058 A regular WeO stores the format its creator chose (`format`); the card reads the backend's `format`, so a 60-copy Listing is a Listing and a Listing that takes offers stays a Listing. Editing a WeO that reads as a Drop keeps it a Drop.

## Components

| Component | File |
|---|---|
| `CreatePage` (seed: blank / `?draft=` / `?edit=`) → `CreateFlow` (steps, posting) | `features/create/pages/CreatePage.tsx`, `components/CreateFlow.tsx` |
| `CreateHero`, `HeroDocks`, `FormatOrb`, `FormatReadout` | `components/CreateHero.tsx`, `HeroDocks.tsx`, `HeroRing.tsx` |
| `Headline`, `MakeDonut`, `MakeWell`, `useLook`, `edgeAt` | `components/MakeO.tsx` |
| `FloatMod`, `OrbSlider` | `components/Docks.tsx` |
| `TemplateSheet`, `TemplateDrawer`, `TemplateShelf` | `components/TemplateSheet.tsx`, `TemplateTiles.tsx` |
| `Composer`, `ModRail`, `ModWell`, `buildModules` | `components/Composer.tsx`, `ModRail.tsx`, `ModWell.tsx`, `modules.tsx` |
| `MediaUploader`, `AiDraft`, `CardAssist` | `components/MediaUploader.tsx`, `AiDraft.tsx` |
| `Preflight`, `PostSheet`, `Posted` | `components/Preflight.tsx`, `PostSheet.tsx`, `Posted.tsx` |
| `InlineText`, `InlineNum`, `Stepper`, `ModRing` | `components/bits.tsx` |
| form, payload, media rules, drafts | `model/composer.ts`; card preview + circles `model/card.ts`; edit `model/edit.ts`; formats `model/formats.ts` |

## Gaps / questions

| Need | Status |
|---|---|
| Media upload | BE done (M07) |
| AI draft | BE done (M07) |
| Templates | BE done (M07) |
| O peg for the client | BE done (M07) |
| Media on a Request | the request endpoint stores none (D-057) |
| Post into a circle without a question | the push needs one; the title stands in (D-056) |
| Unlock a premium template (plan / Os) | M09 (Q-4) |
| Hunt / Drop / Gift / Subscription creation | design says "coming soon" |

## Acceptance criteria

- Post a Listing, a Bid, a Pool and a Request end to end; each appears in Exchange (and Discover for WeOs).
- Drafts autosave, show under "Carry on" and resume; edit an existing WeO.
- Media uploads to S3 and renders on the card.
- Templates prefill the composer; premium ones show locked.
- Hero, composer (each format), preflight, post sheet and posted at parity (1440×900, 390×844, light and dark), network 2xx, zero console errors.
