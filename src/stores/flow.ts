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
}

const closed = { collect: null, relist: null, compose: null, push: null, report: null };

export const useFlow = create<FlowState>(() => ({ ...closed }));

export const openCollect = (weoId: string) => useFlow.setState({ ...closed, collect: weoId });
/** design `app.openRelist(h)` */
export const openRelist = (target: RelistTarget) => useFlow.setState({ ...closed, relist: target });
export const openCompose = (circleId: string | null = null) => useFlow.setState({ ...closed, compose: { circleId } });
export const openPush = (weo: PushTarget, circleId: string | null = null) =>
  useFlow.setState({ ...closed, push: { weo, circleId } });
/** design `app.openPush(w)` from any WeO surface */
export const askAbout = (w: WeoCardModel, circleId: string | null = null) => openPush(pushTargetOf(w), circleId);
export const openReport = (target: ReportTarget) => useFlow.setState({ ...closed, report: target });
export const closeFlow = () => useFlow.setState({ ...closed });
