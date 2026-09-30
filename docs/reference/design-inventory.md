# Design inventory — WeOverse v3 HTML (snapshot 2026-09-30)

> Catalogue of the design prototype at `redesign/project/WeOverse v3 - HTML/` (source of truth: `src/`, `css/`, `js/pages.js`). Use it to find which component/data a screen uses before porting. Section G and "Fix before or during the port" feed docs/03-module-plan.md.

**Project:** `../redesign/project/WeOverse v3 - HTML/` (relative to `v2-redesign-app`)

**How it runs:**
- `tools/build.js` compiles `src/components/*.jsx` → `js/components`, `src/pages/*.jsx` → `js/pages`, `src/app.jsx` → `js/app.js`, and bundles `src/world/*` (with three.js) → `js/world3d.bundle.js`.
- It also turns `src/page.html` into one HTML file per page listed in `js/pages.js`.
- There are no imports. Everything is a classic script, so any top-level function or const is shared across files. Most files also add their exports to `window` explicitly.
- Nearly all styling is inline `style={{…}}` objects that use CSS variables. Only a few class names exist.
- Every page loads all shared components. It also loads the data files `weo-model.js`, `data.js`, `mya-faq.js` and `template-data.js` before the components, and `data-more`, `passport-data`, `plans-data`, `feed-data` and `wv-data` after `pages.js`. Then it loads its own `js/pages/<file>.js` and finally `js/app.js`.
- `rehearsal-tour.jsx` is **not loaded** by `page.html`. `src/components/order.json` is out of date: it lists `screens-weo`, `screens-account` and `feed-cover`, which don't exist.

---

## A. Global shell

### `src/app.jsx`: the App root
- **Constants:**
  - `SECTION_OF` maps route → section key: collected→collect, listed/creators→earn, and so on.
  - `JUMP_TONE` / `JUMP_LABEL` give each of the 19 routes its colour and name for the arrival screen.
  - `TWEAK_DEFAULTS`: weoTypes, weoView, snapshotBoard, typeColorCircles, motion.
  - `BOOT = WVPages.boot()`.
- **Hooks:**
  - `useSess(key, init, revive)` keeps state in sessionStorage under `wv.s.<key>`.
  - `useSessTweaks` does the same under `wv.s.tweaks`.
- **`App` state:**
  - **Kept for the tab (sessionStorage):** board, feedFilter, stewardFilter, joined{circleId:bool}, notif{circleId:'all'|'weekly'|'off'}, followed{personId}, creatorId, tracked, pubProfile{collections, activity, contact, invites}, votes, scores, accepted, resolved, replies, extraAnswers, mya{open, thinking, feed[], draft}, navDock, dock{open, tab}, query.
  - **Kept in the browser (localStorage):** plans `wv.plans`, theme `wv.theme`, currency `wv.currency`, myaHidden, navMode `wv.navMode` (bar|split), home `wv.home`, railOpen.
  - **In memory only:** route, circleTab, compose, push, report, idSheet, world{open, seed}, toasts, flow{kind, …}, jump/ack animations, and others.
- **The `app` object** is one prop passed to every screen, with about 80 fields and methods:
  - **Navigation:** `go(name, id)` loads a real page through `WVPages.go`. `goQuiet` does the same without the arrival animation. `jump(key)` maps nav keys: hub, collect→collected, earn→listed, discover, create, creators, requests, passport, worlds→openWorld, mya→toggleMya; anything else shows a toast. Also `goHome`, `search(q)` (sets the query and goes to Discover), `openWeo(id)` → `go('weo', id)`, `openIsr` → `passport?id=isr`.
  - **Request → create:** `makeForRequest(r)` calls `go('create', {seed:{kind:'Listing', title, desc, cat, price, priceMax, media, forRequest}})`. The object id travels in sessionStorage.
  - **Social:** toggleJoin, toggleMute, toggleFollow, toggleTrack, inviteToCircle, contactPerson, setPubPerm, openCreator/closeCreator, pickLeader.
  - **Threads:** vote(answer, ±1), accept(answer, thread), toggleReply/postReply, setAnswerText/postAnswer.
  - **Modals:** openCompose/setCompose/composeNext (2-step discussion that then goes to the Circle); openPush/pushNext (WeO → Circle thread); openReport/submitReport.
  - **Flows:** openPost(it), openCollect(w), openOffer(r), openRelist(h), closeFlow.
  - **World:** openWorld(seed)/closeWorld. The seed is `{draft, onSettle}`, `{weoId}`, `{context}` or null.
  - **Mya:** openDock(tab), toggleMya, askMya({q,a}) (fakes a 1.15s delay), sendMya (uses `myaAnswer`, a keyword matcher, with `HUB.MYA_SCRIPT` as fallback).
  - **Other:** ID sheet open/close, `togglePlan`, theme, currency, navMode, railOpen, setMyaHidden, toast, ack.
- **Side effects:**
  - Sets `data-theme`, `data-nav` and `data-motion` on `<html>`, plus the CSS variables `--shell-left`, `--focus-tint` (route colour) and `--foot-lift`.
  - Marks the first `<section>` with `data-lead`.
  - Sets `V3.onEvent`, which shows a toast and ack when a WeO goes live or gets its reactions.
- **Render order:**
  1. `Shell` (split nav) or `TopBar`
  2. The page's Screen, found with `window[WVPages.screenOf(route)]`
  3. `WeoFooter`, `QuickJump`, `MyaDock`, `SectionArrival` (really `V3Arrival`), `AckRipple`
  4. Conditional: `CreatorSheet`, `WeOverseIdSheet`, `WorldStudio`, `ComposeModal`, `PushModal`, `ReportModal`, `PostSheet`, `CollectSheet`, `OfferSheet`, `RelistSheet`
  5. `ExternalGate`, `Toasts`, `TweaksPanel` (a design-tool harness; don't port it)

### `js/pages.js`: page map and session carry (hand-written)
- **`PAGES` (route → file → screen):**

  | Route | File | Screen |
  |---|---|---|
  | hub | community | HubScreen |
  | discover | discover | DiscoverScreen |
  | create | create | CreateScreen |
  | collected | collect | CollectedScreen |
  | listed | exchange | ListedScreen |
  | creators | creators | CreatorsScreen |
  | requests | requests | RequestsScreen |
  | passport | passport | PassportScreen |
  | circle | circle | CircleScreen |
  | thread | thread | ThreadScreen |
  | weo | weo | WeoScreen |
  | wallet | wallet | WalletScreen |
  | notifications | notifications | NotificationsScreen |
  | tracking | tracking | TrackingScreen |
  | company | company | CompanyScreen |
  | stewards | stewards | StewardsScreen |
  | manage | circles | ManageScreen |
  | stories | stories | StoriesScreen |
  | settings | settings | SettingsScreen |

- **`go(name, id, {quiet})`:**
  - Builds `<file>.html?id=…` when the id is a string or number. An object id (the create seed) goes only through sessionStorage.
  - Saves `wv.nav = {name, id, quiet, carry[]}`. `carry` holds the toasts and acks raised in the last 400ms.
  - Saves globals, then sets `location.href` after 40ms.
- **Globals carried in `wv.g`:** `__weoSeen`, `__weoIntroShown`, `__wv3mem` (walkthrough and intro memory), and `v3Items` (WeOs in flight). They are saved on `pagehide`.
- **API:** `boot()` returns `{route:{name,id}, quiet}`. `replay(api)` re-shows the carried toasts and acks. Also `carry`, `file`, `save` and `screenOf`.
- **`index.html`** redirects to `create.html`.

### `js/boot.js`
- Sets `window.V3 = {}`.
- `__resMap` maps asset paths to resource ids, and `__resPhoto` maps Unsplash photo ids to u01–u13.
- `window.RES(url)` resolves to the inlined resource if one exists.
- Forces every `<video>` to be muted, except those with `data-voice="1"`.
- `__fixRes` patches `setAttribute` and the src setters so b-cdn, qrserver, dicebear and Unsplash URLs fall back to inlined copies. This is an offline safety net. **Drop it in the Vite port.**

### `src/components/chrome.jsx`
- **Aliases and constants:**
  - `window.DSC = window.WeODesignSystem_edbb0f` (the design-system namespace).
  - `ICO`: hub, world, search, bell, bellOff, spark, chat, send, close, dock, ring, creators, requests, passport.
  - `svg(children, size, stroke, sw)` is the icon helper.
- **`MARKET` (the nav items, in order):**

  | key | label | long label | colour | icon |
  |---|---|---|---|---|
  | create | Create | "Make your offer. Make it live." | #22C55E | `O_SECTION_ICONS.bottom` |
  | hub | Community | "Circles and threads" | #D946EF | |
  | earn | Exchange | "Move with the market" | #F7C62B | `.left` |
  | requests | Ask | "Ask · Offer" | #3A95F2 | |
  | discover | Discover | "Find what's happening now" | #3A95F2 | `.top` |
  | collect | Collect | "Get it. Use it. Resell it. Remix it." | #D946EF | `.right` |
  | passport | You | "You and your standing" | #3A95F2 | |

- **`JUMP`** = MARKET without hub, plus `{worlds, "Worlds", #3A95F2}` and `{mya, "Mya", #D946EF}`.
- **Components:**
  - `Tip`: tooltip rendered in a portal.
  - `SectionSwitch`: one pill naming the current section, with a dropdown of all MARKET items and a "Show every section in the bar" toggle (`wv3.navmode`). Beside it is a "Next" pill that follows the order discover → collect → hub → earn.
  - `NavPill`: one icon pill in the full nav bar.
  - `WeOverseMark` / `WeOverseBadge`: the drawn wordmark; clicking it calls `goHome`.
  - `MakeNode`: the "+" button to create a WeO.
  - `MyaNode`: the Mya chat icon in the top bar, with a breathing dot.
  - `TopBar`: fixed pill header that shrinks on scroll. Left to right: badge, SectionSwitch, expanding search, NavDockNode, MakeNode, split-nav toggle, MyaNode, notifications bell, WalletMenu.
  - `WalletMenu`: shows available Os, a tier dot and the avatar, and opens `WeOverseIdSheet`.
  - `useDockPlace`: makes the dock draggable and remembers its position (`wv.myaPos`).
  - `MyaDock`: floating orb (looping video) that opens a panel with tabs **Ask Mya | Settings**:
    - Chat: feed, "thinking" dots, starter prompts from `MYA_STARTERS()`, `V3WalkControl`, and an input form.
    - The settings tab renders `SettingsBody`.
  - `FanDisc` / `FAN_CONIC`: the parked-nav disc.
  - `NavDockNode`: parks the O nav in the top bar and shows its fan menu or a confirmation.
  - `NavParkFlight`: animates the orb moving between the floating dock and the top bar.
  - `CopyBtn`: copy-to-clipboard button.
  - `WeOverseIdSheet`: the ID dropdown.
    - Balance card: available Os, tier chip, and the four buckets on demand.
    - Credential: ISR ring and avatar, name/handle/joined, "ISR STRONG", `#weoId` with copy, a Collected/Created/Circles/Campaigns table, and O Power.
    - Actions: Settings, "Open your passport", "Log out" (toast only).
  - `QuickJump`: the floating `DSC.RingNav` at the bottom centre, scaled to 0.76, with up to 7 fan items. It has rim buttons for worlds, Mya and park. Below 720px of window height it parks itself automatically.
  - `PortalJumpSheet`: unused.
  - `useNote` / `NoteDot` / `NoteBody`: a "why" disclosure pattern.

### `src/components/shell.jsx` (split-nav mode)
- `SICO` icons: panel, bar, collapse, expand.
- `ModeToggle`: switches between bar and split nav.
- `LeftPanel`: fixed left rail with MARKET items, 246px wide or 62px as icons only. Collapsed, the logo is the looping logo video.
- `SupportSearch`: the search field.
- `SupportCluster`: floating top-right group with mode toggle, search, NavDockNode, MakeNode, MyaNode, bell and WalletMenu.
- `Shell` = LeftPanel + SupportCluster.

### `src/components/section-hero.jsx`
- **Helpers:** `useHeroOpen(id)` (`wv.hero.<id>`), `glideToId`, `Clamp` (2-line clamp with More/Less), `HeroStat` (figure + label + delta; renders the Os mark), `PLACE_ICONS`/`placeIcon`, `DirChip` (directory rail chip), `TAB_ICONS`/`withTabIcons` (adds icons to DS Tabs), `useCurrentPlace` (scroll-spy).
- **Logo and portal:** `O_LOGO_CLIP` = `https://weosite.b-cdn.net/WEO_Logo.webm`. Also `oLogoStill`, `O_EDGE_ROUTE` {top:discover, right:collect, bottom:create, left:earn}, `O_EDGES`, and `HeroPortalToggle` (`DSC.OPortal`).
- **`PriorityRow`:** a numbered priority link.
- **`SectionHero`:** the standard page hero. Props: app, id, tone, icon, eyebrow, title, sub, lede, stats[], feature, priorities[], directory[], filters, filterSummary, actions, art, portal, bleed, bleedArt, foot, fill.
  - Rows: head, stats rail, directory rail, `ViewBar`, then an expandable reveal of priorities and a foot panel.
- **Other:** `OAvatarOrb` (avatar in ISR ring), `OsRun` / `OsText` (replace "O 1,200" text with the O mark), `WeoPriceAtRest({os, label, advPct})` (price plus tier price).

### `src/components/v3-spine.jsx`: WeO lifecycle store, onboarding and flow bar
- **`window.V3` store:**
  - STAGES: draft, rehearsed, reacting, reacted, pledging, live. RING has 5 segments. `NEED_REACT = 12`, `THRESHOLD = 20`.
  - Methods: all, get, set, add(f, terms), subscribe, nextAct(it, app), flag, react, TONE.
  - It is seeded from `HUB.LISTINGS` that aren't closed, and a 2.6s timer fakes community reactions and pledges.
  - `nextAct` returns `{stage, index, tone, ring, fill, waiting, verb, note, get, act, alt, count, of, unit}`. It opens the world, advances the stage, or posts.
- **`useV3()`:** subscribe hook.
- **`StageRing`:** 5-segment progress ring.
- **`V3_SECTIONS`:** discover, collected, create, hub, listed, each with n/title/tone/clip/line/why/edge.
- **`V3Arrival`** (exported as `window.SectionArrival`):
  - First visit to a section shows a full-screen curtain in the section colour, with its clip, "0N of 04", title, the O button and a CTA. Create and hub also show the 5 spine steps around the O.
  - Later visits hand off to the v2 arrival pass. The curtain can be replayed with a `wv3:intro` event, and a watchdog clears it if it gets stuck.
- **`V3Walk`:** coach marks with Mya's avatar, per route. `CHROME_STEPS` covers the chrome; `V3_WALK` covers create, hub, discover, listed and collected.
- **`walkStore`** (`wv3.walk.off`) and **`orient`**: `data-weo-fresh` hides the chrome until the first action.
- **`V3WalkControl`:** walkthrough toggle and replay, shown in the Mya dock.
- **`V3_FLOW`:** discover → collected → hub → listed.
- **`V3NextBar`:** the fixed bottom "flow bar". It has a back button, help, utilities (world, Mya, park nav), step text, a secondary and a primary action, and a minimise control (`wv3.flowbar`, `wv3.flowbar.left`). When the O nav floats, it splits into two capsules around it.
- **`V3FlowFoot`:** the flow bar with the next section as its action.

### `src/components/arrival.jsx`
- `ARRIVALS` (per-route title/tone/line/4 verbs with icons), `ARR_EDGE`, `INTRO_LINES`, `IntroLine`, `INTRO_VERBS`, `IntroVerb`, and the clip constants.
- **`SectionArrival`** (the v2 version):
  - The very first landing shows the WeOverse splash with `clip-intro.mp4`.
  - A section's first visit shows the name, objective and verbs orbiting the O (about 3.4s).
  - Later visits show a wordless colour "portal iris" (under 1s).
  - It controls `window.__weoArriving` and fires `weo:arrived`.
- **`AckRipple({ack})`:** confirmation ripple with a check and label (1.25s).

### Other shell files
- **`src/components/rehearsal-tour.jsx`** (not loaded): `RehearsalTour`, `TourReplay`, `TOUR_KEY`, `TOUR_MIX`, `tourSeen`. It's a guided tour inside the rehearsal world.
- **`src/components/tweaks-panel.jsx`:** `useTweaks`, `TweaksPanel` and `TweakSection/Row/Slider/Toggle/Radio/Select/Text/Number/Color/Button`. It's the design-tool edit-mode harness and posts `__edit_mode_*` messages to the parent frame. **Skip it.**
- **`src/components/view-prefs.jsx`:**
  - `VIEW_DEFAULTS` `{density:'roomy', media:'rich', motion:'full', value:'os', mutedFormats:[], mutedKinds:[]}` in localStorage `weo.view.prefs`.
  - `readPrefs`, `applyPrefs` (sets `html[data-weo-density|media|motion|value]`), `writePrefs`, `useViewPrefs`, `PrefRow`, `PrefSeg`, `ViewPanel`, `ViewBar`.
- **`src/components/snapshot.jsx`:**
  - `BOARD_TABS`, `LeaderFace`, `Podium` (top 3), `BOARD_SECTION`.
  - `SnapshotChart({pulse, keys, value, onChange})`: 7-day pulse tabs with sparklines.
  - `LeaderPreview`.
  - `SnapshotPanel({boards, pulse, board, onBoard, eyebrow, rail, onPick})`: podium and leaderboard with a side rail.
- **`src/components/marks.jsx`:** `MARK_VERSE`, `MARK_WEO`, `MARK_O` (vector outlines), `DrawnMark`, `WeOverseLettering`, `WeOLettering`, `WeODrawnO`.
- **`src/components/world.jsx`: the rehearsal studio.**
  - Constants and functions: `SCENARIO_NOTE`, `sweep(cfg)` (Pro price ladder), `lifecycle(cfg, base)` (what happens after collect: remix/resale/reflow/modify), `COHORTS` (locals, circle, collectors, gifters, visitors, resellers, each with reach/intent/sens/pref), `SEASONS`, `COHORT_DEFAULTS`, and `simulate(cfg)`. `simulate` returns `{through, collectors, settled, firstHours, lift, demand, soldOut, cohortRows, lead, reach, best, bestRate, matched, verdict}`.
  - `WORLD_BLOCKS`, `WorldBox`, and `WorldStage` (2D).
  - `WorldStage3D`: hosts `<weo-world>` (three.js) and calls `setScene`/`runSim`.
  - `SimProjection`, `ChainStep`.
  - **`WorldStudio`:** a modal with modules where, who, terms, forecast, share. It picks a world, fidelity, WeO or draft, price, edition, days, bundle, cohorts, season and rivals. It runs the simulation, shows a provisional result, then `CommitReview` and settle. For a draft it calls `seed.onSettle({price, edition, days, kind, circleId, resale, audience, people, world, through, forecast})`. It is Pro-gated by `app.plans.sim`.
  - `WEOFLOW_TIERS` / `WeoFlowGate`: access-code gate for WeO Flow.
  - `FlowPlanSheet`: the simulation Pro plan upsell.
- **`src/world/world3d.js` and `world3d-env.js`:** `class WeoWorld extends HTMLElement`, registered as `<weo-world>`.
  - API: `setScene({theme, fidelity, markers, cohorts, subjectId})`, `runSim({through, subjectId})`, `select`, `resetView`, `setMode('walk'|'orbit')`.
  - Events: `weo-select`, `weo-hover`, `weo-converted`.
  - Themes: daylight, dusk, night, studio, winter. Scene types: plaza, street, field, room.
  - It sets `WEO_WORLD_READY`.

### Other overlays
- `Toasts` and `ExternalGate` (the "leaving the WeOverse" gate) are in `screens-more`.
- `PathBar({items, right})` is the sticky breadcrumb pill with a back button (`screens-circle.jsx`). It's used on all 19 pages.

---

## B. Design tokens and CSS

**Fonts:** none are loaded. `fonts.css` contains only comments. The whole system uses Helvetica Neue from the device: `--font-sans: 'Helvetica Neue', Helvetica, 'Segoe UI', Arial, sans-serif`. `--font-mono` and `--font-data` point to the same family.

**`css/ds/tokens/colors.css`** (light is `:root`, dark is `[data-theme="dark"]`):
- Section colours:
  - `--o-blue #3A95F2`: Discover / top edge
  - `--o-blue-deep #2F80E8`
  - `--o-violet #D946EF`: Collect / right edge
  - `--o-green #22C55E`: Create / bottom edge
  - `--o-gold #F7C62B`: Exchange / value / left edge
  - `--o-gold-ink #F7B21F`
- ISR ramp: `--isr-starter #FF5A2C`, `--isr-building #F7B21F`, `--isr-healthy #22C55E`, `--isr-strong #17C3D6`, `--isr-peak #2F6FF0`.
- Status: `--status-success/warning/error/info`.
- Ink: `--ink-900 #181e2e`, `--ink-600 #5a6478`, `--ink-400 #97a1b6`. Dark: `#eaeef8 / #9aa5bd / #5f6982`.
- Surfaces: `--bg-a`, `--bg-b`, `--atmo`, `--surface #fff`, `--surface-2 #f3f4f6`, `--surface-3 #e8eaee`. Dark: `#000`, `#14161b`, `#191c22`, `#23262e`.
- Aliases: `--text`, `--text-dim`, `--text-faint`, `--text-inverse`, `--border`, `--hair`, `--glass`, `--glass-brd`, `--torus-a/b/c`.

**`typography.css`:**
- Weights: `--fw-light` 300 … `--fw-bold` 700.
- Type scale:

  | Style | Size | Line height / tracking |
  |---|---|---|
  | display | clamp(38px, 6.4vw, 74px) | lh .98, ls -.035em |
  | h2 | clamp(30px, 4.6vw, 50px) | |
  | headline | 22px | |
  | title | 20px | |
  | body | 16px | lh 1.55 |
  | body-sm | 13.5px | |
  | label | 11px | ls .14em |
  | overline | 12.5px | ls .2em |
  | mono (data) | 13px | `--type-data-ls` |

**`spacing.css`:**
- Spacing `--space-1…20` (4px base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80).
- Radii: `--radius-well 13`, `sm 14`, `md 18`, `lg 22`, `xl 26`, `2xl 30`, `pill 999`, `full 50%`.
- Strokes: `--stroke-hair 1`, `--stroke 1.6`, `--stroke-thick 2`.
- Controls: `--control-sm/md/lg 36/44/52`. Icons: `--icon-sm/md/lg/xl 16/20/24/32`.
- Widths: `--container-max 1180px`, `--content-max 660px`.
- Z-index: `--z-base/sticky/overlay/modal/toast/tooltip` = 0, 100, 400, 500, 700, 800.
- The real code uses its own z-index values (300–99999), not these.

**`effects.css`:**
- Soft neumorphic shadows, light and dark: `--nm-raised`, `--nm-sm`, `--nm-inset`, `--nm-hero`, `--nm-hero-inset`.
- `--shadow-card`, `--shadow-pop`, `--blur-glass 20px`, `--blur-soft 14px`, `--focus-ring`.
- Durations: `--dur-instant 120`, `fast 280`, `normal 450`, `slow 720`.
- Easings: `--ease-portal cubic-bezier(.22,1,.36,1)`, `--ease-standard`, `--ease-out`, `--ease-settle cubic-bezier(.16,1,.3,1)`. Also `--stagger-list 70ms`.
- Keyframes: weo-breathe, weo-breathe-sm, weo-spin, weo-ripple, weo-ring-burst, weo-float, weo-pop, weo-cardin, weo-row-in, weo-dot, weo-shimmer, weo-orbit, weo-orbit-rev, weo-ping, weo-emerge, weo-recede, weo-portal-wipe(-out), weo-node-pop, weo-spoke.

**`governance.css`:**
- `--zone-high #22C55E`, `--zone-guided #3A95F2`, `--zone-low #FF5A2C`, plus `-soft` variants.
- Money buckets: `--val-available #22C55E`, `--val-protected #3A95F2`, `--val-pending #F7B21F`, `--val-locked #97a1b6`.
- `--expr-canon/adapt/risk` = 70/20/10. `--fan-max-items: 7`.

**`world.css`:**
- `--world-fid-1…5-poly`: 1.2k, 6k, 24k, 90k, 400k.
- `--world-draw-near/far` 40/240, `--world-marker-min 44px`, `--world-marker-max 30vh`, `--world-shadow`, `--world-fog-near/far`.
- Daylight theme: `--world-sky, sky-2, ground, ground-2, built, built-2, foliage, water, fog, key, fill, ink`.
- Other themes via `[data-world="dusk|night|studio|winter"]`.

**`styles.css`** only `@import`s the token files.

**`css/app.css`:**
- **Global:** reset, scrollbars, `#atmo` and `#dots` background layers, and a `body::before` tint keyed to the route (`--focus-tint`). `[data-lead]::before` adds a glow; `--page-w: min(1560px, 100%)`.
- **Class families:**
  - Layout: `.weo-scroll-hide`, `.weo-rail` (horizontal scroll-snap, `--rail-w`)
  - World studio: `.weo-world-grid`, `.weo-sim-panel`, `.weo-sim-card`, `.weo-sim-ctrl`
  - Grids and create: `.weo-snap-grid`, `.weo-create-strip`, `.weo-create-shelf`, `.weo-tpl-stage`, `.weo-prof-grid`, `.weo-make-grid`, `.weo-modrail`, `.weo-modwell`, `.weo-modpin`, `.weo-fork`
  - Nav and feed: `.weo-nav`, `.weo-search`, `.orbit-ring`, `.weo-edit-grid` (column-count brick feed), `.weo-wordmark`, `.weo-cover-line(s)`
  - Profile and prompts: `.weo-req-orb`, `.weo-ohub`, `.weo-mya-prompt`
  - Panels: `.weo-menu` (opaque menus), `.weo-quiet` (desaturated until hover)
  - Hero: `.weo-hero`, `.weo-hero-bloom`, `.weo-hero-art`, `.weo-hero-foot`, `.weo-osonly`, `.weo-reveal`, `.weo-portal-tube`, `.weo-portal-aperture`
  - Directory and view: `.weo-dir-row`, `.weo-viewbar`
  - Flow bar: `.weo-flowbar`, `-wrap`, `-left`, `-right`, `-min`, `-text`, `-back`, `-back-label`, `-min-label`, `-util`, `-notch`
  - Misc: `.weo-viewswitch`, `.weo-req-miss`, `.weo-shake`, `.weo-settings-grid`, `.weo-settings-nav`
- **`<html>` data attributes it reacts to:** data-theme, data-nav (bar|split), data-motion, data-weo-intro, data-weo-flow, data-weo-fresh, data-weo-density, data-weo-media, data-weo-motion, data-weo-value.
- **Extra keyframes:** weo-reveal, weo-slide-up, weo-portal-tube, weo-portal-bloom, weoArr*, weo-orb-settle, weo-fadein, weo-dockin, weo3-pulse(-hi), weo-shake.
- **Other:** `@view-transition{navigation:auto}` and responsive breakpoints at 640, 820, 860, 900, 960, 1024, 1080, 1180, 1240, 1280 and 1320.

---

## Design-system bundle (`js/ds/_ds_bundle.js`)

- Namespace `window.WeODesignSystem_edbb0f`, aliased as `window.DSC`.
- **Exposed components and their props:**

  | Group | Component | Props |
  |---|---|---|
  | Core | Button | variant, tone, size, dot, selected, disabled, leading, trailing |
  | Core | OButton | variant, tone, size, active, disabled, aria-label |
  | Core | OMark | size, color, spin, tilt |
  | Core | O_VORTEX_PATH | constant |
  | Core | OPortal | size, sections, logoSrc, logoVideoSrc, onNavigate, onCenter, onStateChange, onEvent, arrivalKey, showCaption |
  | Core | O_SECTION_ICONS | constant |
  | Core | Orb | size, fill ('image' or colour), src, logoSrc, ring, ringColor, tint, matcap, label, breathe, highlight |
  | Data | Avatar | src, initials, size, isr, tone |
  | Data | AvatarGroup | extra, size |
  | Data | Badge | variant, tone, dot |
  | Data | Chip | selected, tone, dot, onRemove, disabled |
  | Data | ISRRing | value, size, showStage, showValue, label |
  | Data | ISR_STAGES | constant |
  | Data | StatGrid | items, tone, columns, well |
  | Exchange | CommitReview | title, what, amountOs, currency, rate, power, when, to, next, recover, recommended, confirmLabel, onConfirm, onEdit, onCancel, busy |
  | Exchange | ConversionDisplay | |
  | Exchange | FeeDisclosure | subtotal, fees, currency, rate |
  | Exchange | FlowReceipt | title, status, amountOs, currency, rate, power, lines, id, timestamp, onSupport, onDone |
  | Exchange | OPower | power, format, os, size, label, note |
  | Exchange | O_POWER_STAGES | constant |
  | Exchange | TopUpSheet | |
  | Exchange | ValueLadder | balances, currency, rate, compact |
  | Exchange | WithdrawSheet | |
  | Feedback | Alert | status |
  | Feedback | EmptyState | title, description, action |
  | Feedback | Progress | value, variant, tone, size, indeterminate, showValue |
  | Feedback | Skeleton | |
  | Feedback | Spinner | |
  | Feedback | Toast | |
  | Feedback | Tooltip | label, side |
  | Forms | Checkbox | |
  | Forms | Input | label, error, tone, prefix, suffix |
  | Forms | Radio | |
  | Forms | Select | |
  | Forms | Slider | |
  | Forms | Toggle | checked, onChange, tone |
  | Media | OWindow | |
  | Motion | PortalJump | play, color, variant, label, nodes, duration, onDone |
  | Navigation | RingNav | items, active, onSelect, onHome, homeLabel, variant |
  | Navigation | Tabs | tabs, value, onChange, tone |
  | Surfaces | Card | elevation, padding, radius |
  | Surfaces | WeOCard | name, typeLabel, id, tone, fill, src, rarity, edition, timer, creator, terms, points, watchers, likes, activeNow, collectorCount, trend, collected, qrData, passport, backTitle, backFacts, engageLabel, onEngage, onResell, onCreate, w, format, active, selected |
  | Surfaces | PassportIcon | |

- **Not exposed** in the namespace: `buysLike`, `isrStage`, `oPowerStage`.
- **Never used by `src/`:** TopUpSheet, WithdrawSheet, ConversionDisplay, Skeleton, Toast, Checkbox, Radio, Select, Slider, OWindow, O_VORTEX_PATH, ISR_STAGES, O_POWER_STAGES.
- **Why it's 4MB:** it also bundles the design system's own sample apps (`window.WeOApp`, `WeOData`, `WeOParts`, `World3D`, `WorldStandalone`, `LensNudge`, plus two tweaks panels) and 21 images embedded as base64 (9 JPEG, 12 PNG). `src/` uses none of the sample apps.

---

## C. Pages

Almost every screen is wrapped in a `maxWidth:'var(--page-w)'` container with 190px of bottom padding. All pages use `PathBar`.

### 1. create (`CreateScreen`, 1391 lines)
- **Sub-components:** useTheme, MAKE_EDGES, edgeAt, Headline, OrbSlider, FloatMod, MakeDonut, useLook, MakeWell, MOD_ICO, CFORMAT_ICO, CREATE_CATS (Community, Creating, Digital arts, Digital assets, Wellness, Sports & fandom), circleLine, Stepper, draftCardProps, InlineText, InlineNum, TemplateSheet, TemplateDrawer, CreateHero, AiDraft, CardAssist, MEDIA_MAX=3 / MEDIA_LIMIT (image 10MB, video 100MB), MediaUploader, V3ModRing.
- **Step 1, CreateHero:**
  - `Headline` rotates through MAKE_MANTRAS.
  - The O: a donut with a media well that plays edge videos on hover (`MAKE_EDGES` clips). The edges jump to discover/collect/create/earn.
  - 8 format orbs sit on the ring from `CREATE_TEMPLATES`: Listing("Sell"), Pool, Bid, Hunt(soon), Drop(soon), Request, Gift(soon), Subscription(soon). A "soon" format offers "notify me" (`wv.notifySoon`).
  - Docks appear after you engage the O. Left: **Carry on** (Draft listings as an OrbSlider, or "Blank WeO") and **Templates** (count, shelf strip, "All as cards" → TemplateSheet). Right: **Rehearse** (openWorld), **Asked for** (request count → requests), **Track it** (→ listed).
  - `V3FlowFoot`: back to Community, next Templates.
- **Step 2, composer:**
  - Header: format icon, "02 — Create", and V3ModRing showing how many modules are done.
  - Three columns: left and right `ModWell` module rails (collapsible to icons, pinnable).
  - Centre: `PortalStage` with the Orb, or a flip to `DSC.WeOCard`. Below it: a category button, inline title, inline description, CardAssist (the AI draft), `InlineNum` editable terms (EDIT_TERMS per format), and a fork card: **Preflight** vs **Vet it first**. A "Start from a template" drawer (hidden for Request) and a "Still needed" hint.
  - `V3NextBar` step 2/3: primary Preflight, secondary Vet it first.
- **Modules:**
  - All formats: Category, Media (uploader: cover image plus up to 2 images or 1 video, stored as object URLs), Tags (presets plus custom).
  - Pool: goal, min pledge, deadline.
  - Hunt: entry price, entries, draw date, rules.
  - Bid: opening bid, closes in, reserve.
  - Request: budget range, closes in.
  - Listing and Drop: ask or mint price (Listing is negotiable with % off), quantity + unit, circulation, duration, resellable (2%).
- **Step 3, Preflight:**
  - Checklist of modules plus Rehearsal status.
  - The WeOCard "how collectors see it".
  - "What you receive": price − 2% Flow fee.
  - Buttons: Post it, Ask a Circle, Rehearse it. `V3NextBar` step 3/3.
- **Posted state:** PortalStage, and buttons Push to a Circle, Rehearse, See it in Exchange, Create another.
- **Shared components used:** PathBar, Scene, SectionHead, SuccessMoment, PortalStage, ModWell, CREATE_* constants, circlesFor/typeCircle/catCircle, OsRun, WeoPriceAtRest, StageRing, V3NextBar, V3FlowFoot, MAKE_MANTRAS.
- **DS components:** Button, Chip, Orb, OMark, Toggle, WeOCard, O_SECTION_ICONS.
- **Data read:** HUB.LISTINGS (drafts), HUB.REQUESTS, HUB.WEOS (sample images), HUB.CIRCLES, HUB.PRICE_LABEL, HUB.oStr/osFmt, TPL.*, WV.MY_TIER.
- **Draft state `f`:** {kind, cat, title, desc, media, gallery[], tags[], tagDraft, price, priceMax, qty, unit, circ, days, resell, goal, minPledge, reserve, negotiable, negotiateOff, forRequest}.
- **Actions:**
  - pick format, use template, open a draft.
  - `post()`: `V3.add(f)` then `app.openPost(it)`, which is PostSheet: destination network/circle/direct, then SuccessMoment, then navigate.
  - `rehearse()`: `app.openWorld({draft, onSettle})`, then `V3.add` and go to hub.
  - `askCircle()`: `V3.set` the stage to reacting.
  - AiDraft calls **`window.claude.complete`**, a helper provided by the design tool. It needs a backend AI endpoint.
- **URL:** the id is an object `{seed}`, carried only in the session (from requests → makeForRequest).

### 2. discover (`DiscoverScreen`, 667 lines)
- **Sub-components:** VIEW (muted formats/kinds filter), FeedCover (magazine cover, rotates every 9s), coverLine, hoursLeft, feedWeight, URGENCY, FeedCard, FeedRow, FEED_VIEWS (editorial/cards/list), FeedBoard, Rail, StageDeck, StageWeo, CreatorStall, InterestTile, FloorGrid.
- **Sections, top to bottom:**
  1. SectionHero "01 of 04 / Discover". Stats: On the floor, In motion (Os), From creators you circle. Directory has 9 places. Filters: Tabs All/Closing/Moving. Foot: StageDeck (orb picker and StageWeo poster with Collect / Rehearse it / Ask about it).
  2. **Your feed** (Fold → FeedBoard): FeedCover, kind chips (FEED_KINDS), editorial/cards/list views.
  3. **Closing soonest** (WeoView of stall tiles; views rail/cards/orbit/list).
  4. **Moving now**.
  5. **Creators you circle** (followed; empty state).
  6. **Who is trading** (Rail of CreatorStall).
  7. **Circles behind the floor** (Rail of CircleRecord).
  8. **Browse by interest** (InterestTile → toast).
  9. **The whole floor** (FloorGrid: search query, lenses all/ending/moving/open, StallTile grid, empty state with Ask Mya / Post a request).
  10. V3FlowFoot.
- **Shared components:** SectionHero, Scene, Fold, RailHead, StallTile, WeoView/useWeoView/RAIL_VIEW, IconSegs, CircleRecord, PersonOi, Spark, withTabIcons, OsRun, WeOverseLettering, useViewPrefs/readPrefs, FEED_KINDS.
- **DS components:** Orb, OMark, Chip, Avatar, AvatarGroup, Button, OButton, Tabs, O_SECTION_ICONS.
- **Data read:** HUB.WEOS (live, timer, activeNow, os, creatorId, type, category, points, terms, img), HUB.CIRCLES, HUB.CONTEXTS, HUB.CTA, HUB.person, FEED.ITEMS/KIND, WV.CREATORS, app.followed, app.query.
- **Actions:** lens, collapsing folds, view switches (localStorage `wv.view.feed.board` and `disc3.*`), openCollect, openWeo, openWorld, openPush, openCreator, setQuery('').
- **URL:** none. The search query arrives through the session.

### 3. collect (`CollectedScreen`, 129 lines)
- **Sub-components:** KIND_TONE, ROW_ICO, HoldingRow (hover actions Resell/Track/Circle), NeedsYou.
- **Sections, top to bottom:**
  1. SectionHero "02 of 04 / Collect". Stats from COL_STATS. Directory: Needs you, Your WeOs, Snapshot & wallet. Foot: SnapshotChart(COL_PULSE).
  2. **Needs you**: redeem (ack) or "Something is wrong" (ExternalGate dispute); "would fetch more" (Resell/Keep); Backed (Read the report → circle); Bid held (Open it).
  3. **WeOs you hold**: Tabs All + 5 formats, HoldingRow grid.
  4. Rows: Snapshot · 7d (SnapshotPanel COL_BOARDS with ValueLadder rail) and Wallet (OWalletPanel).
  5. V3FlowFoot (next Create).
- **Shared components:** SectionHero, Scene, SectionHead, Rows, SnapshotChart, SnapshotPanel, OWalletPanel, Pip, OsRun, withTabIcons.
- **DS components:** Orb, OMark, OButton, Button, Tabs, ValueLadder.
- **Data read:** HUB.HOLDINGS, COL_STATS, COL_PULSE, COL_BOARDS, WALLET, FORMATS, person, CIRCLES.
- **Actions:** openRelist, redeem (local), open a dispute, go to circle, openWeo.
- **URL:** none.

### 4. exchange (`ListedScreen`, 204 lines)
- **Sub-components:** SnapshotRail, STATE_TONE, ListingRow (⋯ menu: Edit, Inactivate/Activate (local pause), Push to hub, Rehearse; preflight bar on drafts), CircleCreatorsOrbit.
- **Sections, top to bottom:**
  1. SectionHero "04 of 04 / Exchange". Stats LST_STATS. Action "New WeO". Foot SnapshotChart(LST_PULSE).
  2. **WeOs you flow**: Tabs All/Live/Draft/Closed. Freshly posted V3 items appear first.
  3. Rows: Snapshot · 7d (LST_BOARDS with a "Needs attention" rail from ATTENTION) and Creators in your circles (orbit).
  4. V3FlowFoot.
- **Shared components:** SectionHero, Scene, SectionHead, Rows, SnapshotChart, SnapshotPanel, Pip, PersonOi, StandChip, useV3, withTabIcons, CREATE_SOON.
- **DS components:** Orb, OMark, Button, Tabs, O_SECTION_ICONS.
- **Data read:** HUB.LISTINGS, LST_STATS, LST_PULSE, LST_BOARDS, ATTENTION, CIRCLES, WV.CREATORS, WV.ME_STANDING, WV.MY_TIER, app.joined/followed, V3 items.
- **Actions:** pause, edit (→ create), push to circle, rehearse, openCreator, toggleFollow.
- **URL:** none.

### 5. community (`HubScreen`, 305 lines)
- **Sub-components:** PreviewCard, CircleOrbit (expanded circle: Enter/Join/Close), CircleGrid, ThreadRow, HUB_LENSES/LENS_ICONS/LensSegs (Questions/Stewards/Stories), StoryGrid, NextO, FLIGHT_VIEWS/useFlightView (`wv3.view.flight`), InFlightGrid, V3_WORD.
- **Sections, top to bottom:**
  1. SectionHero "Community". Stats In flight / With your circle / Live.
  2. **In flight**: IconSegs cards/rail/list. InFlightGrid of NextO (StageRing, verb button, alt "Post it", "Share") and a "New WeO" slot.
  3. Rows: **Your circles** (CircleGrid plus Manage) and **Circles you can join**.
  4. Rows: **Community** (LensSegs. Questions: Tabs All/Open/Resolved/Mine → ThreadRows. Stewards: StewardGrid limited to 4. Stories: StoryGrid) and **Wallet** (OWalletPanel).
  5. V3NextBar for the first in-flight item that needs you, otherwise V3FlowFoot → Exchange.
- **Shared components:** PathBar/hubPath, SectionHero, Scene, Rows, IconSegs, CircleRecord, CircleChip, StewardGrid, OWalletPanel, StageRing, useV3, V3NextBar, V3FlowFoot, withTabIcons.
- **DS components:** Orb, Avatar, Button, Tabs.
- **Data read:** V3.all(), HUB.CIRCLES (rim, stewardId, img, toneHex, active, axis, description), HUB.THREADS, HUB.STORIES, HUB.WEOS, HUB.person, app.joined, app.feedFilter.
- **Actions:** V3 nextAct (rehearse / open reactions / open pledges / post), toggleJoin, filter, navigate.
- **URL:** `?id=circles` scrolls to and opens "Your circles".

### 6. creators (`CreatorsScreen`, 197 lines)
- **Sub-components:** MyaRecord, MyaPanelProfile (video, does/never, Ask Mya), CreatorRecord, CreatorPanel (their WeOs orbit the creator: Collect a WeO, Circle them, Rehearse a pairing), CreatorGrid, CREATOR_BOARDS (standing/settled/reach/consistency), CREATOR_PULSE.
- **Sections, top to bottom:**
  1. SectionHero "Who is trading, and how well". 4 stats, priorities, directory. Foot: SnapshotPanel (opens CreatorSheet).
  2. **Creators, by standing**: CreatorGrid.
  3. **WeOs from creators you follow**: WeoView.
- **Shared components:** SectionHero, Scene, SectionHead, SnapshotPanel, WeoView, PersonOi, Spark, StandChip.
- **DS components:** Button, Orb, OMark.
- **Data read:** WV.CREATORS, WV.MYA, HUB.WEOS, HUB.PEOPLE, HUB.MYA_SCRIPT, app.followed.
- **Actions:** openCreator, toggleFollow, openCollect, openWorld, askMya.
- **URL:** `?id=<creatorId|mya>` pre-opens that creator's panel.

### 7. requests (`RequestsScreen`, 174 lines)
- **Sub-components:** RequestCard, RequestRecord, RequestPanel (Offer one you hold → OfferSheet; Ask in a circle → compose; Rehearse; the orb "Make a WeO for this" → makeForRequest), REQ_VIEWS (cards/list).
- **Sections, top to bottom:**
  1. SectionHero "Someone wants it made". Stats Open briefs / Offers in / WeOs that could answer / Circles asking. Priorities include "Post a request" (openCompose). Foot: the **Open briefs** list with a view toggle and an expanding panel.
  2. **WeOs that could answer**: WeoList of HUB.WEOS.
- **Shared components:** SectionHero, Scene, SectionHead, SectionMark, Clamp, IconSegs, useWeoView, WeoList.
- **DS components:** Orb, Avatar, Button, OMark.
- **Data read:** FEED.REQUESTS {id, title, byId, budget, circleId, where, offers, closes, brief}, HUB.circle(img), HUB.person, HUB.PEOPLE.
- **URL:** **none is read**, even though other pages link to `requests?id=`.

### 8. passport (`PassportScreen`, 530 lines)
- **Sub-components:** ISR_MOVES, IsrImproveSheet, EditProfileSheet (name, handle, where, bio; localStorage `wv.profile`), TierLadderSheet, PassportSettingsSheet (shares localStorage `wv.settings`: showIsr, showTier, showOnline, searchIndex, isrAlerts, weeklyStanding, idVerified, plus pubProfile perms; ID and link copy; QR/card as toasts; links to `settings?id=security|privacy|danger`), PassportBalance.
- **Sections, top to bottom:**
  1. SectionHero:
     - Title = display name; sub = handle, #weoId, where, joined.
     - Actions: PublicPageButton and a settings gear. Feature: PassportBalance.
     - Stats: ISR (+delta), Tier (opens TierLadderSheet), Circles joined (→ `hub?id=circles`). Priorities and directory.
     - Foot: `OProfileHub`. The avatar sits in the ISR ring with 6 WeO orbs around it. Its side panels are What moved it, Your tier, Improve (opens IsrImproveSheet) and Your graph. Its extra button is Edit profile.
  2. **01 Standing**: Spark trace, moves, a "never counts / appeal" panel, ValueLadder.
  3. **02 Your tier**: TIERS ladder and an advantage example (O 2,400 vs. a regular user).
  4. **03 Your graph**: Circled by, You back, Vouched (→ `creators?id`).
- **Shared components:** SectionHero, Scene, SectionHead, Sheet, OProfileHub, PublicPageButton, PublicProfileSheet, Spark, CopyBtn, glideToId.
- **DS components:** ISRRing, ValueLadder, Button, Avatar, Chip, OMark, Orb, Toggle.
- **Data read:** WV.ME_STANDING, ISR_POLICY, TIERS, MY_TIER, GRAPH, advantage, OUTSIDE, cur; HUB.ME, WALLET, WEOS, CIRCLES, LISTINGS; app.joined, app.pubProfile.
- **URL:** none. `?id=isr` is linked from other pages but ignored.

### 9. circle (`CircleScreen`, 188 lines)
- **Sub-components:** CircleSnapshot (3 cards that double as tabs: Discussions, Members, WeOs).
- **Sections, top to bottom:**
  1. Header card: CircleOi, axis, chip, name, Clamp description, a membership line (winRate, resolved), stat pills (members, WeOs, discussions, desire, win rate), steward. Buttons: Join, Start a discussion, Rehearse this context.
  2. CircleSnapshot.
  3. The tab body:
     - discussions: thread cards (pinned, top answer, vote count) and trending tag chips.
     - members: HUB.PEOPLE grid (→ `creators?id`).
     - weos: WeoTile grid (engage → openPush). V3 items posted to this circle appear first.
- **Shared components:** PathBar/hubPath, Clamp, CircleOi, CircleChip, WeoTile, useV3.
- **DS components:** Button, Avatar, Chip, Orb, OMark.
- **Data read:** HUB.circle(id), THREADS by circleId, WEOS by circleIds, PEOPLE, person(stewardId); `app.circleTab` (memory only).
- **URL:** `?id=<circleId>`, falling back to the first circle.

### 10. thread (`ThreadScreen`, 139 lines)
- **Sub-components:** AnswerCard (up/down vote, score, Steward badge, Accept answer, Reply composer, replies list).
- **Sections, top to bottom:**
  1. Question card: author and ISR, relative time, circle, Open/Resolved, title, body, tag chips, Report.
  2. "N answers", sorted by score.
  3. Answer composer ("Answering as …").
  4. Sidebar: Attached WeO (WeoTile plus Rehearse) and thread stats (replies, reactions, views).
- **Shared components:** PathBar/hubPath, WeoTile.
- **DS components:** Avatar, Button, Chip.
- **Data read:** HUB.THREADS (full answers and replies tree), circle, person, weo.
- **State from `app`:** votes, scores, accepted, resolved, replies, replyOpen/replyText, answerText, extraAnswers.
- **URL:** `?id=<threadId>`.

### 11. weo (`WeoScreen`, 149 lines)
- **Sub-components:** WeoPriceFeature (price, Rehearse, Ask).
- **Sections, top to bottom:**
  1. SectionHero: eyebrow "type · #weoId", title, lede = points[0], feature. Stats: collectors, edition, "closes in" or state. Priorities: CTA collect, Ask its Circle, Rehearse. Directory: card, terms, circles, creator.
  2. Card section: `DSC.WeOCard` + WeoPriceAtRest (tier price) + WeoActions. Side column: Key terms (+Resale 2%, Passport), the main CTA (openCollect, or disabled "Closed"), Progress (fundPct), a creator button, circle chips.
  3. **What you actually get**: points.
- **Shared components:** SectionHero, Scene, RailHead, weoCardProps, WeoActions, WeoPriceAtRest.
- **DS components:** WeOCard, Button, Chip, Avatar, OMark, Progress.
- **Data read:** HUB.weo(id), which is the cardModel output; person; circle.
- **URL:** `?id=<weoId>`, falling back to `WEOS[0]`.

### 12. wallet (`WalletScreen`, 277 lines)
- **Sub-components:** MoneyRows ("Yours" total; O Power → `passport?id=isr`), RateDial, EcosystemCard.
- **Sections, top to bottom:**
  1. Lead: "O-Wallet · your passport", H1, PublicPageButton. A Card holding OProfileHub, whose views are Your wallet (the OWalletPanel view) and Your passport (side panels: standing, passport ID, where it works, what an O is worth). MoneyRows below.
  2. **02 Four buckets**: ValueLadder and StatGrid (network total, spendable, peg, tier).
  3. **03 Ecosystem**: EcosystemCard ×4, PASSPORT_CARRIES, PASSPORT_NEVER as Alerts.
  4. **04 Rates**: RateDial ×2, StatGrid of WALLET_ACTIVITY, and buttons for openIsr and tracking.
  5. **05 Apps and plans**: APPS with plan Start/Stop (togglePlan). The price shown is after the tier advantage.
  6. **06 The record**: WALLET_LEDGER.
- **OWalletPanel functions:** Move Os (MoveOsSheet: choose a recipient creator and an amount no larger than available) and How Os work (MockOsSheet).
- **Shared components:** PathBar, Scene, SectionHead, SectionMark, OProfileHub, OWalletPanel, PublicPageButton, PublicProfileSheet, glideToId.
- **DS components:** Card, Chip, Badge, OMark, Button, ValueLadder, StatGrid, Alert, Tooltip, ISRRing, OPower, PassportIcon.
- **Data read:** HUB.WALLET, HOLDINGS, ME, ECOSYSTEM, PASSPORT_CARRIES, PASSPORT_NEVER, WALLET_RATES, WALLET_ACTIVITY, APPS, WALLET_LEDGER; WV.MY_TIER, ME_STANDING; app.plans.
- **URL:** none.

### 13. notifications (`NotificationsScreen`, 75 lines)
- **Sub-components:** TONE_STATUS.
- **Sections, top to bottom:**
  1. Lead: H1 "N waiting on you". Buttons: Unread only, Mark all read, Settings (→ `settings?id=notifications`). Category chips with counts from NOTIF_CATS.
  2. Groups by day (Card rows with a colour bar, orb or O mark, title, body, time, unread badge).
  3. EmptyState when nothing matches.
- **DS components:** Card, Chip, Badge, Orb, OMark, Button, EmptyState.
- **Data read:** HUB.NOTIFS {id, cat, tone, day, at, title, body, img, go, unread}.
- **Actions:** mark read (local only), then navigate to `n.go`. A `go` of 'collect' opens CollectSheet instead.
- **URL:** none.

### 14. tracking (`TrackingScreen`, 77 lines)
- **Sub-components:** TrackedCreatorRow (Open record, Track toggle).
- **Sections:** lead with H1, Tabs "WeOs N" / "Creators N" and a search Input. The WeOs tab shows WeoView (stall tiles) plus TRACK_NOTES cards. The Creators tab shows a list or EmptyState.
- **Shared components:** SectionHead, SectionMark, WeoView, RAIL_VIEW.
- **DS components:** Tabs, Input, Card, EmptyState, Button, Avatar.
- **Data read:** HUB.TRACKED_WEOS, TRACK_NOTES, TRACKED_CREATORS.
- **Actions:** it uses `app.followed/toggleFollow`, not `app.tracked`.
- **URL:** none.

### 15. company (`CompanyScreen`, 60 lines)
- **Sections:** lead with "WeO Global", H1 = document lead, and doc chips. Body paragraphs, facts StatGrid, roles list ("Ask about it" toast), and buttons Back / Ask Mya.
- **DS components:** Chip, Card, StatGrid, Button.
- **Data read:** HUB.COMPANY.
- **URL:** `?id=about|careers|privacy|terms|cookies`.

### 16. stewards (`StewardsScreen`, 31 lines)
- **Sections:** SectionMark, H1, 4 summary stats (STEWARD_SUMMARY), Tabs (All/Pool/Hunt/Digital arts/Digital assets → `app.stewardFilter`), StewardGrid (Follow).
- **DS components:** Tabs.
- **URL:** none.

### 17. circles (`ManageScreen`, 55 lines)
- **Sections:** H1. **Your Circles** rows (CircleOi, counts, chip, mute/unmute via `app.notif`, Leave). **Open Circles** grid (Join).
- **DS components:** OButton, Button.
- **Actions:** toggleMute, toggleJoin.
- **URL:** none.

### 18. stories (`StoriesScreen`, 89 lines)
- **Sub-components:** STORY_ARC (Rehearsed/Listed/Settled).
- **Sections:**
  1. Lead story card (Orb, type·duration, title, blurb, author chip, status → thread).
  2. **02 The arc**.
  3. **03 More** (the other stories → thread).
  4. CTA (Enter a world / Create a WeO).
- **DS components:** Orb, Chip, Button.
- **Data read:** HUB.STORIES.
- **URL:** none.

### 19. settings (`SettingsScreen`, 319 lines)
- **Sub-components:** SET_KEY `wv.settings`, SET_DEFAULTS, useSettings, SET_SECTIONS, SetCard, SetRow, SetSeg, SetSelect, setField, SetLabel, Verified, pwScore, PasswordSheet, EditSheet (with a 6-digit verify-code step), DangerSheet (password + type "DELETE").
- **SET_DEFAULTS:**
  - Profile: name, handle, email, emailVerified, phone, phoneVerified, language, timezone.
  - Security: loginAlerts, pwChanged.
  - showIsr.
  - Notifications: `notify` with keys sales, bids, circles, mentions, mya, news, security, each `{app, email, push}`. Also digest, quiet, quietFrom, quietTo.
  - receipts, reduceMotion, and connected {local, flow, stories, calendar}.
- **Layout:** H1 and a sticky section nav (scroll-spy), then these cards:
  1. Account: profile, name, username, email, phone, WeO ID, language, timezone.
  2. Sign-in & security.
  3. Privacy: pubProfile toggles and showIsr.
  4. Notifications: a 7×3 checkbox grid, digest, quiet hours.
  5. Wallet & payments: balance, currency, receipts.
  6. Appearance: theme, wordmark home, nav mode, Mya in the corner, reduce motion.
  7. Connected apps: WeO Local, WeO Flow, WeO Stories, Calendar.
  8. Your data: download, clear search history, reset tours.
  9. Help & legal.
  10. Deactivate or delete: sign out, deactivate, delete.
- **DS components:** Button, Toggle, OMark.
- **Data read:** HUB.ME, WALLET; WV.CURRENCIES; app.pubProfile, theme, home, navMode, myaHidden, currency.
- **URL:** `?id=<section>` scrolls to that section.

---

## D. Shared components in `screens-*`, `feed-view`, `make-media`, `v3-screens`

| File | Exports | Used by |
|---|---|---|
| screens-hub | `SectionMark`, `SectionHead` | many pages (see C) |
| screens-hub | `IconSegs`, `VIEW_ICONS` | community, discover, requests |
| screens-hub | `CIRCLE_ICONS`, `CircleChip` | circle, circles, community |
| screens-hub | `CircleOi` | circle, circles |
| screens-hub | `CircleRecord` | community, discover |
| screens-hub | `WeoActions` | weo |
| screens-hub | `WeoTile` | circle, thread, world |
| screens-hub | `weoCardProps` | weo, flows |
| screens-hub | `MyWeoCard`, `WeoCarousel`, `WeoOrbitView`, `WeoList`, `useWeoView`, `WeoView`, `RAIL_VIEW` | WeoView: creators, discover, tracking. WeoList: requests |
| screens-hub | `OProfileStage`, `OProfileHub`, `useHubOrder`, `HubNode` | passport, wallet |
| screens-hub | `OWalletPanel`, `MockOsSheet`, `MoveOsSheet` | collect, community, wallet |
| screens-hub | `wvGlide`, `useDepth`, `Scene` | Scene: 14 pages |
| screens-hub | `WeoShowcase`, `HeroPortal` | unused |
| screens-flows | `SuccessMoment` | create, PostSheet |
| screens-flows | `PostSheet` | app (from create and V3 "Post it") |
| screens-flows | `CardFlow`, `StageRail`, `FLOW_STEPS`, `Dial`, `PortalStage` | CollectSheet/RelistSheet/OfferSheet (via app). PortalStage: create |
| screens-flows | `oddsWord`, `likeOf`, `warmTone`, `snapTo` | helpers |
| screens-flows | `CollectSheet`, `RelistSheet`, `OfferSheet`, `RequestFront` | app flows |
| screens-flows | `MyaPrompts`, `MyaGuide` | unused |
| screens-network | `Spark` | creators, discover, passport |
| screens-network | `PersonOi` | creators, discover, exchange |
| screens-network | `StandChip` | creators, exchange |
| screens-network | `CreatorSheet` | app, opened from any face or name |
| screens-network | `PublicProfileSheet`, `PublicPageButton` | passport, wallet |
| screens-network | `PROFILE_DEFAULTS`, `PROFILE_PERMS`, `CONTACT_NOTE`, `ISR_RAMP`/`isrTone`/`isrStage`, `ActionTile` | internal |
| screens-more | `StewardGrid` | community, stewards |
| screens-more | `Sheet` | passport, settings, hub sheets |
| screens-more | `wellInput`, `ComposeModal`, `PushModal`, `ReportModal`, `ExternalGate`, `Toasts` | app |
| screens-footer | `FOOT_SECTIONS`, `SOCIALS`, `WeoFooter` | app, all pages. Footer: sitemap (Marketplace/Community/Your space/Company; `company:<doc>` routes), newsletter, passport link, status |
| screens-footer | `SettingsBody` | the Mya dock's Settings tab: theme, wordmark home, Mya toggle, currency converter |
| screens-discover | `RailHead`, `Fold` | discover, weo |
| screens-discover | `StallTile` | discover (also via WeoView tile="stall": tracking) |
| screens-discover | `WeoTimer` | unused |
| screens-create | `CREATE_SOON`, `CREATE_TEMPLATES`, `CREATE_TONE`, `CREATE_MEDIA`, `typeCircle`, `catCircle`, `circlesFor`, `ModWell` | create, exchange, world, flows, v3-spine |
| screens-circle | `PathBar` | all pages |
| screens-holdings | `Pip` | collect, exchange |
| screens-holdings | `StatStrip` | unused |
| feed-view | `FEED_KINDS` | discover, view-prefs |
| make-media | `MAKE_MANTRAS` | create |
| make-media | `CFORMAT_CLIP`, `Mantra`, `EdgeArc` | unused |
| v3-screens | `hubPath` | 13 pages |
| v3-screens | `Rows` (tile grid that opens full-width below) | collect, community, exchange |

---

## E. Data layer (`src/data/*`)

### `weo-model.js` → `window.WEO` (the port contract; the file says "No screen may read a raw WeO field")
- **Exports:** NOW (2026-07-28T12:00Z), toOs (USD×**99**), toUsd, osFmt, TONE, CTA, PRICE_LABEL, FORMATS ['Bid', 'Pool', 'Hunt', 'Drop', 'Listing'], formatOf, ITEMS, SPECIMENS, MISSING, CONTRACT, cardModel, priceOf, progressOf, endsAt, hhmmss, shortLeft, cards(ctx).
- **`formatOf`:**

  | API data | Display format |
  |---|---|
  | weoType 'crowdfund' | Pool |
  | weoType 'lottery' | Hunt |
  | regular + isNegotiable | Bid |
  | regular + isLimitedDrop | Drop |
  | any other regular | Listing |

- **Base fields (all kinds):** _id, weoType, title, slug, description, categoryName, status ('active'|'sold_out'), currency 'O', isResellable, media[{url, type}], favoritesCount, isLiked, viewsCount, participantsCount, avgWeoRating, avgExperienceRating, reviewsCount, isNegotiable, createdAt, updatedAt.
  - creator: {_id, handle, avatarUrl, isr, tier, bio, followersCount, tradeCount, joinedSince}
  - weoverse: {publicId, editionSize, minPledgeUsd, activeNow, trendPct, isCollected, circleIds[], points[], rarityNote}
- **crowdfund:** goal{amount, currency}, raised, percentFunded, deadline, daysLeft, isAlmostFunded, isClosingSoon.
- **lottery:** ticket{price, totalTickets, bundles[], perUserLimit}, ticketsSold, ticketsLeft, percentSold, currentOdds, prizes[{rank, title, description, valueType, value, quantity}], topPrize, draw{drawAt, mechanism}, daysLeft, isAlmostSoldOut.
- **regular:** type 'normal', price{amount, priceSplit}, quantity{amount, unitName}, soldCount, totalWeoInCirculation, inventoryLeft, isLimitedDrop, isAlmostGone, duration, availabilityTill, paymentType, noOfInstallments, parentOfferId, rootOfferId, lineage[].
- **Fixtures:** weo-block (crowdfund), weo-gear (lottery), weo-mug and weo-loop (regular). The specimen spec-bid is not in ITEMS.
- **`MISSING`** is the backend checklist: weoverse.publicId, editionSize, minPledgeUsd, isCollected, circleIds, activeNow, trendPct, points, rarityNote. Each entry names its endpoint.
- **`cardModel(w, ctx)`** returns: id, weoId, name, title, slug, type, format, context, tone, cta, actions (discover: collect/watch/ask; collected: resell/transfer/passport; listed: edit/pause/share; create: preview/publish), os, priceOs, priceUsd, priceLabel, priceSource, category, img, media, creatorId, creator, isr, edition, rarity, fundPct, left, total, timer, endsIn, live, urgent, collectors, watchers, likes, liked, activeNow, trend, circleIds, collected, resellable, terms[{k, v}], points.
- This lines up directly with the backend's WeO unified schema: `weoType` regular/crowdfund/lottery, and Offer `type` 'normal'.

### `data.js` → `window.HUB`
- **Helpers:** IMG, NOW, TONE (+Remix), HEX, FORMATS, CTA, PRICE_LABEL, compact, osFmt, relTime, oStr, ready(listing), person(id), rim(n), circle(id), weo(id).
- **ME:** name, handle, weoId, avatar, isr, joined, os, power, collected, created, circles, campaigns, verified.
- **PEOPLE** (10): id, name, handle, avatar, isr, steward?, bio?, circles[]?, weos, answers, accept?, category?, followed?, os?, lift?
- **CIRCLES** (8): id, name, axis ('By WeO type'|'By category'|'General · Q&A'), joined, notif, open?, desire, waitlist, members, weos, threads, active, resolved, tags[], description, stewardId, rim[{avatar, name, live}], bestType, winRate. Added after load: icon, img, tone, toneHex.
- **WEOS** = `WEO.cards('discover')`.
- **BOARDS:** keys collected, creators, circles, campaigns, remixes. Each is {label, metric, rows[{id, name, sub, value, delta, tone, img|avatar|initial, isr?, creatorId?}]}.
- **PULSE:** {label, tone, headline, note, delta, series[7]}.
- **CONTEXTS:** [{context, type, rate, tone}].
- **WORLDS:** [{id, name, theme, purpose, fidelity}]. **FIDELITY:** [{level, name, purpose, tris}].
- **THREADS:** id, circleId, title, body, authorId, createdAt, status, tags[], weoId, replies, reactions, views, votes, pinned, pick, snippet.
  - answers: [{id, authorId, steward?, body, createdAt, votes, vote, pick, replies[{id, authorId, body, createdAt, mention}]}]
- **STORIES:** id, threadId, title, img, author, type, duration, blurb, category, status, collectors, tone.
- **HOLDINGS:** id, name, format, img, kind ('Collected'|'Backed'|'Entries'|'Bid held'), paid, current, resellable, since, note, creatorId, circleId.
- **LISTINGS:** id, name, format, img, state ('Live'|'Draft'|'Closed'), ask, views, saves, collects, through, since, left (string), circleId, resellable?, offers?, preflight[[label, 0|1]].
- **WALLET:** {available, protected, pending, locked}.
- **Derived:**
  - COL_STATS / LST_STATS: [{v, k, note, tone?}]
  - ATTENTION: [{l, why, act, tone, urgency}]
  - COL_BOARDS: movers, formats, creators, pending
  - COL_PULSE
  - LST_BOARDS: performing, views, earning, ready
  - LST_PULSE
- **STEWARD_SUMMARY:** {stewards, avgIsr, resolved7d, stories}. **MYA_SCRIPT:** [{q, a}].

### `data-more.js` (merged into HUB)
- **NOTIF_CATS:** all, weo, request, collection, payment, resell, wallet, general.
- **NOTIFS:** {id, cat, tone (info|success|warning|error), day, at, title, body, img?, go:[route, id?], unread?}.
- **Tracking:** TRACKED_WEOS [ids], TRACK_NOTES {weoId: note}, TRACKED_CREATORS [{id, note}].
- **Wallet:**
  - WALLET_ACTIVITY: [{k, v}]
  - WALLET_RATES: [{label, pct, value, note, up}]
  - WALLET_APPS: [{k, note, os, tone}] (unused)
  - WALLET_LEDGER: [{id, dir (in|out), what, when, os, state}]
- **COMPANY:** [{k, label, lead, body[], facts?[[k, v]], roles?[[role, where, note]]}].

### `passport-data.js`
- ECOSYSTEM: [{k, edge, tone, state (live|launch), grants, os}]
- PASSPORT_CARRIES: [[k, v]]
- PASSPORT_NEVER: [string]

### `plans-data.js`
- APPS: [{k, n, tone, here?, line, free, plans[{k, n, l, os, note?}]}]. The apps are verse, flow and local.
- SIM_FREE: {scenarios, runs, note}
- SIM_PRO: [[k, v]]
- SIM_PLAN: APPS[0].plans[0], key 'sim', 320 Os.

### `template-data.js` → `window.TPL`
- FREE (6) and PRO (4). Each template: {key, name, line, kind, ty ('Product'|'Service'|'Service-Sub'), sector, cat, os, qty, img, tier?}.
- TIERS {1: 'Maker', 2: 'Pro'}, UNLOCK {1: 900, 2: 2400}.
- Functions: all, tier, owned, locked, find(q).

### `feed-data.js` → `window.FEED` (also sets `HUB.REQUESTS`)
- KIND: weo, question, request, story, each {label, color, hex}.
- REQUESTS: [{id, title, byId, budget, circleId, where, offers, closes, brief}].
- ITEMS: {id, kind, weight 1–4, title, img?, tone, byName, byAvatar?, blurb, readout, sub, timer?, fill?, live?, metrics[[v, k]]}, plus one reference field: weo, thread, request or story.
- ACTIVITY: unused. byId.

### `wv-data.js` → `window.WV`
- ISR_POLICY: {version 'isr-1.0.0', inputs[{k, w}], excludes[], appeal}.
- CREATORS: {id, name, handle, avatar, isr, bio, settled, collectors, circlesLed, weeksLive, format, tone, trace[7], accept, answers, weos, followed}, with `creator(id)`.
- ME_STANDING: {isr, trace, delta, moves[{k, n, v, up, soft?}]}.
- GRAPH: {circledBy[], backs[], vouched[{id, name, note}]}.
- SECTIONS, VIEWS, LANES: unused.
- MYA: {id, name, handle, role, faces{id, idle, reading, answered, chip}, reel, clips{chat, intro}, bio, does[{k, v}], never[]}.
- TIERS: [{key, n, label, adv (0.04/0.10/0.16), isr (0/78/88), need, holds, tone}].
- Functions: tierOf(isr, accepted), MY_TIER, advantage(os) → {tier, pct, off, pay}, OUTSIDE.
- CURRENCIES: [{code, sym, per, label}] for USD, EUR, GBP, INR, JPY, BRL. Also cur, fx(os, code), toOs(amount, code), which use **100 Os = $1**.

### `mya-faq.js`
- `window.MYA_FAQ`: 48 {q, a} pairs.
- `window.myaAnswer(q)`: keyword and stem matcher over MYA_SCRIPT + FAQ.
- `window.MYA_STARTERS()`.

### Runtime entity (not in `data/`)
- The V3 item in `v3-spine`: {id, name, format, img, os, circleId, stage, reactions, pledges, flagged, notes[], world?, validated?, refining?, refined?, postedTo?{kind: network|circle|direct, label, tone}}.

---

## F. External and live dependencies

- **images.unsplash.com**: 13 portrait and product photos (u01–u13) used by HUB, WEO, TPL and feed. TPL PRO adds a few more photo ids that have no inlined copy.
- **weosite.b-cdn.net/WEO_Logo.webm**: the O logo clip used by the hero portal and split nav. A local copy exists at `assets/media/WEO_Logo.webm`.
- **weoverse.b-cdn.net/{creator_hub_weoverse, weoverse_tools, weoverse_learning, weoverse_events}.mp4**: the "local" alternatives in `MAKE_EDGES` on the create page.
- **api.qrserver.com** (WeOCard QR from `qrData`) and **api.dicebear.com/9.x/notionists** (avatar seeds): only inside the DS bundle. `weo.one/w/` is also referenced there.
- **Local assets:**
  - `assets/media/`: Creation/Collections/Discover/ListingsWeO.mp4 (section arrival clips and create edges), WEO_Logo.webm, plaza-mural.png (3D world).
  - `assets/mya/`: mya-face/orb/desk/answer/chip.png and clip-intro.mp4 (the dock video and splash).
  - Also orb-market.png, orb-coffee.png, weo-wellness/nutrition/fitness.jpg, weo-logo-light.png, weoverse-logo-dark.png and o-flow-mark.svg.
  - **Unused:** mya/clip-a…h.mp4, IntroWeO.mp4, WebsiteIntroWeO.mp4 (9MB each), mya-juggling/whiletyping/afterresult.gif, mya-bust.png.
- **three.js 0.184.0** is bundled into `js/world3d.bundle.js` from `src/world/`. It's only used by `<weo-world>` inside `WorldStage3D` in `WorldStudio`, which any page can open through `app.openWorld`. The Rehearse buttons that open it are on discover, weo, create, exchange, creators, circle, thread, requests, stories and the flow bar. It's loaded on every page, so lazy-load it in the port.
- **`window.claude.complete`**: the create page's "Draft with Mya" feature. It's provided by the design tool and needs replacing with your backend AI/RAG module.
- **Vendored React 18.3.1** (production UMD).

---

## G. Size ranking and build plan

**Page source (lines):**

| Page | Lines | Page | Lines |
|---|---|---|---|
| create | 1391 | circle | 188 |
| discover | 667 | requests | 174 |
| passport | 530 | weo | 149 |
| settings | 319 | thread | 139 |
| community | 305 | collect | 129 |
| wallet | 277 | stories | 89 |
| exchange | 204 | tracking | 77 |
| creators | 197 | notifications | 75 |
| | | company | 60 |
| | | circles | 55 |
| | | stewards | 31 |

- Pages total about 4,865 lines.
- Shared code is about 6,300 lines: world 1036, screens-hub 813, chrome 704, tweaks 553 (skip), flows 520, section-hero 488, v3-spine 445, app 351, network 323, arrival 272, footer 209, snapshot 207, more 192, view-prefs 187, others under 120 each.

**Recommended modules, in build order:**

0. **Foundation.**
   - Turn the tokens into CSS variables, and theme via `data-theme`.
   - Rebuild or port the ~28 DS components that are actually used: Button, OButton, OMark, Orb, Avatar(Group), Chip, Badge, Tabs, Toggle, Input, Card, ISRRing, OPower, ValueLadder, StatGrid, WeOCard, RingNav, OPortal, PortalJump, CommitReview, FeeDisclosure, FlowReceipt, EmptyState, Alert, Tooltip, Progress, Spinner, PassportIcon.
   - Also marks.jsx and the ICO/svg set.
   - Port `weo-model.js` as `utils/cardModel.ts` plus the unit helpers. Fix the ×99 vs ×100 peg first.
1. **App shell and state.**
   - Router with 19 routes and `:id` params.
   - Split the `app` god-object into contexts or stores: navigation/UI, session social (joined, followed, votes), flows/modals, Mya, preferences.
   - TopBar, split Shell, SectionSwitch, QuickJump/RingNav, WalletMenu + WeOverseIdSheet, MyaDock (FAQ matcher now, AI later), WeoFooter + SettingsBody, Toasts, AckRipple, ExternalGate, PathBar, and the flow bar (V3NextBar/V3FlowFoot).
   - Needs `/me` and the wallet summary early.
2. **Shared WeO and list primitives.** SectionHero (+ViewBar/view-prefs), Scene, Rows, SectionHead/Mark, IconSegs, WeoTile/weoCardProps, WeoView (cards/rail/carousel/orbit/list), StallTile/RailHead/Fold/Rail, SnapshotChart/SnapshotPanel, CircleRecord/Oi/Chip, PersonOi/Spark/StandChip, Pip, OWalletPanel.
3. **Discover + WeO detail + Collect flow** (discover, weo, CardFlow/CollectSheet).
   - First real API wiring: list WeOs, get one, search, feed.
   - This checks cardModel against the backend's unified `offers` collection.
4. **Community** (community, circle, thread, circles, stewards, stories), plus Compose/Push/Report modals.
   - APIs: circles and membership/mute, threads, answers, votes, accept, replies, stories, stewards.
   - Community's In-flight grid depends on the V3 store (module 9). Stub it or port the store here.
5. **Holdings and listings** (collect, exchange), plus RelistSheet and NeedsYou (redeem/dispute).
   - APIs: orders/holdings, my offers (drafts, pause), resell, snapshot boards.
6. **Create** (composer steps 1–3, templates, media upload, PostSheet with network/circle/direct, preflight fees).
   - Depends on modules 2 and 4.
   - APIs: create or draft a WeO (unified schema), media upload, templates, and an AI description endpoint.
7. **People and requests** (creators, requests, tracking), plus CreatorSheet, OfferSheet and makeForRequest.
   - APIs: creators and follows, requests and offers, a tracking watchlist.
8. **Identity and money** (passport, wallet, settings), plus PublicProfileSheet, tier/ISR sheets and MoveOsSheet.
   - APIs: profile, ISR and its history, tiers, wallet buckets, ledger, plans, settings and notification preferences.
9. **Notifications + company** (small).
   - APIs: notifications with read state, plus Socket.io for the bell. Company pages can stay static content.
10. **Rehearsal and lifecycle** (lazy-loaded): WorldStudio + `<weo-world>` three.js, the simulate/sweep logic, the V3 lifecycle (rehearse → 12 reactions → 20 pledges → live) with reactions and pledges on the backend, the Flow/Pro gates, and onboarding intros and walkthroughs (V3Arrival/V3Walk/orient).

**Dependencies between modules:**
- Everything depends on 0 and 1. Module 2 is needed by 3–9.
- Create (6) uses community circles (4) through `circlesFor`, PostSheet and WorldStudio.
- Collect/Exchange (5) reuse CardFlow from 3.
- Passport and Wallet (8) share OProfileHub and PublicProfileSheet.
- The flow bar (1) calls into worlds (10). Stub it until then.

---

## Fix before or during the port

**Links that point to the wrong place:**
1. `requests` never reads `?id`. Worse, the notification `n2` links to `req-1`, but request ids are `rq-1…rq-3`.
2. `passport?id=isr` is linked from other pages but ignored.

**Wrong-WeO fallbacks:**
3. Holding ids (h1–h8) and listing ids (l1–l6), plus new `v3-*` items, are passed to `openWeo`. `HUB.weo` then silently falls back to `WEOS[0]`. The backend needs `holding.weoId` and `listing.weoId`.
4. Community's "Mine" filter uses `authorId === 'mem-1'`, which isn't the signed-in user.

**Data shape issues:**
5. **Units disagree:** `weo-model` uses USD×99 while WV and the copy say 100 Os = $1.
6. `CONTACT_NOTE` and `PublicProfileSheet` use `'off'` where `PassportSettingsSheet` uses `'none'` for the same contact setting.
7. Tracking uses `followed` rather than `tracked`.
8. `HUB.CIRCLE_META` is referenced in PostSheet but never exported.

**Product-rule conflicts:**
9. The README says "no location features", yet the data has `where` fields (Lisbon/Berlin), the profile has "Where you are", and Settings has a "Calendar … events you're going to" app.

**Prototype-only code to drop:**
10. Everything is client-side mock: votes, joins, redeem, plans and settings live in session or local storage, and the V3 store fakes community progress on a 2.6s timer.
11. The resource fallback code in `boot.js` and `TweaksPanel` exist only for the prototype environment.
