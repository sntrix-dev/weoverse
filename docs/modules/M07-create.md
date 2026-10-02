# M07 — Create

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m07-create` | `redesign/m07-create` | `reports/M07-create.md` |

The largest page (`create.jsx`, ~1,400 lines). Split into feature components; no file over ~250 lines.

## Screens (`/create`, `/create?edit=:id`, `/create?draft=:id`, `/create?forRequest=:id`)

1. **Hero** (`CreateHero`): rotating `Headline` (MAKE_MANTRAS), O donut with edge videos (`MAKE_EDGES`) jumping to discover/collect/create/exchange, 8 format orbs (Listing "Sell", Pool, Bid, Request, and "soon": Hunt, Drop, Gift, Subscription — "notify me"), docks: Carry on (drafts `OrbSlider` / Blank WeO), Templates (shelf + TemplateSheet), Rehearse, Asked for (request count), Track it. FlowFoot.
2. **Composer**: header (format icon, "02 — Create", `V3ModRing`), left/right `ModWell` rails (collapsible, pinnable), centre `PortalStage` Orb ↔ `WeOCard` flip, category, inline title/description, `CardAssist` (AI draft), `InlineNum` terms per format, fork card Preflight vs Vet it first, template drawer, "Still needed". FlowBar 2/3.
   - Modules: Category · Media (cover + ≤2 images or 1 video; image 10 MB, video 100 MB) · Tags · Pool (goal, min pledge, deadline) · Hunt (entry price, entries, draw date, rules) · Bid (opening bid, closes in, reserve) · Request (budget range, closes in) · Listing/Drop (price, negotiable %, quantity+unit, circulation, duration, resellable 2%).
3. **Preflight**: checklist, card preview, "What you receive" (price − 2 % Flow fee), Post it / Ask a Circle / Rehearse it. FlowBar 3/3.
4. **Posted**: PortalStage + Push to a Circle / Rehearse / See it in Exchange / Create another.

`PostSheet` (network / circle / direct → `SuccessMoment`).

## Format → backend mapping

| Design format | `weoType` | Key fields |
|---|---|---|
| Listing | regular | price{amount, priceSplit, negotiableUpTo}, quantity{amount, unitName}, totalWeoInCirculation, duration, availabilityTill |
| Bid | regular (negotiable) | price.negotiableUpTo > 0 (reserve), close time |
| Drop | regular (limited) | totalWeoInCirculation 1..100 |
| Pool | crowdfund | goal.amount, contribution.minimum, deadline |
| Hunt | lottery | ticket{price, totalTickets}, prizes[], draw.drawAt |
| Request | request-weo (RFQ) | price{min,max}, deadline |

## API map

| Block | Endpoint |
|---|---|
| post | `POST /frontend/weos` (discriminated on `weoType`) / RFQ `POST /frontend/request-weos` |
| edit | `GET /frontend/me/listings/:id` → `PUT /frontend/weos/:id` |
| drafts + autosave | `GET/POST /frontend/me/drafts`, `PUT /me/drafts/:id` (debounced), `DELETE` |
| categories | `GET /frontend/categories` (raw, no envelope) |
| for a request | `GET /frontend/request-weos/:id` → `POST /frontend/weos/requested` |
| push to circle | `POST /frontend/community/push` |
| asked-for count | `GET /frontend/request-weos` |

## Gaps

| Need | Proposal |
|---|---|
| Media upload (create requires ≥1 media URL) | `POST /frontend/media` multipart (reuse `MediaService`, S3, limits from env) → `{url, type, thumbnail?}`. New module `media` frontend route + swagger + tests. |
| AI draft (`CardAssist`, was `window.claude.complete`) | `POST /frontend/ai/draft-weo {format, title?, notes?}` using the existing LangChain/OpenAI setup, rate-limited |
| Templates catalogue + Pro unlock (Q-3) | backend catalogue `GET /frontend/templates` (D-050); unlock with plans/billing (M09) — premium shows locked until then |
| "Notify me" for soon formats | small additive endpoint or skip |

## Acceptance criteria

- Create and post each available format end to end; appears in Exchange and Discover.
- Drafts autosave and resume; edit an existing WeO.
- Media uploads to S3 and renders on the card.
- Page at parity for hero, composer (each format), preflight, posted.
