import { create } from 'zustand';

/**
 * design `app.openCollect(w)` / `app.closeFlow()` — the one flow sheet open over any page.
 * Holds only the WeO's id: the sheet reads the WeO and its quote from the API.
 */
interface FlowState {
  collect: string | null;
}

export const useFlow = create<FlowState>(() => ({ collect: null }));

export const openCollect = (weoId: string) => useFlow.setState({ collect: weoId });
export const closeFlow = () => useFlow.setState({ collect: null });
