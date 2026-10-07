import { create } from 'zustand';
import type { WeoCardModel } from '@/lib/cardModel';

/** What the push sheet shows of the WeO (its card model's fields). */
export interface PushTarget {
  id: string;
  name: string;
  img: string | null;
  type: string;
  category: string;
  hex: string;
  /** a creator pushes their own WeO; anyone else asks about it (D-040) */
  creatorId: string;
  /** the circles the WeO already sits in */
  circleIds: string[];
}

export const pushTargetOf = (w: WeoCardModel): PushTarget => ({
  id: w.id,
  name: w.name,
  img: w.img,
  type: w.type,
  category: w.category,
  hex: w.hex,
  creatorId: w.creatorId,
  circleIds: w.circleIds,
});

export interface ReportTarget {
  /** what the sheet says is being reported */
  label: string;
  threadId?: string;
  answerId?: string;
}

/**
 * design `app.openCollect(w)` / `app.openCompose()` / `app.openPush(w)` / `app.openReport(label)`
 * — the one flow sheet open over any page. Holds only ids and labels: the sheets read the rest.
 */
/** The holding the relist sheet puts back on the floor. */
export interface RelistTarget {
  weoId: string;
  collectionId: string;
  name: string;
  img: string | null;
  format: string;
}

interface FlowState {
  collect: string | null;
  relist: RelistTarget | null;
  /** the compose sheet, optionally pre-pointed at a circle */
  compose: { circleId: string | null } | null;
  /** push a WeO of yours; `circleId` when opened from inside a circle */
  push: { weo: PushTarget; circleId: string | null } | null;
  report: ReportTarget | null;
  /** answer a brief with one of your WeOs (M08) — the request id */
  offer: string | null;
  /** the creator sheet, over any page and over the flows (design `app.openCreator`) */
  creator: string | null;
}

const closed = { collect: null, relist: null, compose: null, push: null, report: null, offer: null };

export const useFlow = create<FlowState>(() => ({ ...closed, creator: null }));

export const openCollect = (weoId: string) => useFlow.setState({ ...closed, collect: weoId });
/** design `app.openRelist(h)` */
export const openRelist = (target: RelistTarget) => useFlow.setState({ ...closed, relist: target });
export const openCompose = (circleId: string | null = null) =>
  useFlow.setState({ ...closed, compose: { circleId } });
export const openPush = (weo: PushTarget, circleId: string | null = null) =>
  useFlow.setState({ ...closed, push: { weo, circleId } });
/** design `app.openPush(w)` from any WeO surface */
export const askAbout = (w: WeoCardModel, circleId: string | null = null) =>
  openPush(pushTargetOf(w), circleId);
export const openReport = (target: ReportTarget) => useFlow.setState({ ...closed, report: target });
export const closeFlow = () => useFlow.setState({ ...closed });
/** design `app.openOffer(r)` */
export const openOffer = (requestId: string) => useFlow.setState({ ...closed, offer: requestId });
/** design `app.openCreator(id)` — one creator surface, reachable from any face or name */
export const openCreator = (creatorId: string) => useFlow.setState({ creator: creatorId });
export const closeCreator = () => useFlow.setState({ creator: null });

/* ---------- M11: worlds and vetting ---------- */

/** design `app.openWorld({ draft, worldId, weoId })` — the studio over any page. */
export interface WorldSeed {
  /** rehearse a draft of yours (keeps its terms, stage Rehearsed) */
  draftId?: string;
  /** simulate a live WeO (settles to your ledger when it is yours) */
  weoId?: string;
  /** the world to open in */
  worldId?: string;
}

interface WorldState {
  world: WorldSeed | null;
  /** the vetting sheet: a WeO in vetting, by its draft id (D-090) */
  vet: string | null;
}
export const useWorld = create<WorldState>(() => ({ world: null, vet: null }));
export const openWorld = (seed: WorldSeed = {}) => useWorld.setState({ world: seed });
export const closeWorld = () => useWorld.setState({ world: null });
export const openVet = (id: string) => useWorld.setState({ vet: id });
export const closeVet = () => useWorld.setState({ vet: null });
