import { create } from 'zustand';
import { askChatbot } from '@/features/shell/api/chatbot';
import { exactFaq, matchFaq, MYA_NO_ANSWER } from '@/features/shell/model/myaFaq';
import { openDock } from './ui';

/**
 * Mya's conversation (design `app.jsx` mya{thinking, feed, draft} + askMya/sendMya).
 * Kept in memory for the visit; the chatbot keeps its own history by `sessionId`.
 *
 * Answer order (D-022): an exact FAQ question (a starter tap) answers from the FAQ, as the
 * design does; anything else goes to the backend chatbot; when the chatbot is down or
 * answers `degraded`, the FAQ matcher answers; otherwise the design's "I don't have that one".
 */
export interface MyaMessage {
  me: boolean;
  text: string;
}

interface MyaState {
  thinking: boolean;
  feed: MyaMessage[];
  draft: string;
  sessionId: string | null;
}

/** design: the canned answer lands after a beat, so the reading state is seen */
export const MYA_BEAT_MS = 1150;

export const useMya = create<MyaState>(() => ({ thinking: false, feed: [], draft: '', sessionId: null }));

const set = useMya.setState;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const setMyaDraft = (draft: string) => set({ draft });

async function answerFor(q: string): Promise<string> {
  const faq = exactFaq(q);
  if (faq) {
    await wait(MYA_BEAT_MS);
    return faq.a;
  }
  try {
    const res = await askChatbot(q, useMya.getState().sessionId);
    set({ sessionId: res.sessionId });
    if (!res.degraded && res.answer.trim()) return res.answer;
  } catch {
    /* fall through to the FAQ */
  }
  return matchFaq(q)?.a ?? MYA_NO_ANSWER;
}

/** design `app.askMya({q})` */
export async function askMya(q: string) {
  const question = q.trim();
  if (!question) return;
  openDock('mya');
  set((s) => ({ thinking: true, draft: '', feed: [...s.feed, { me: true, text: question }] }));
  const text = await answerFor(question);
  set((s) => ({ thinking: false, feed: [...s.feed, { me: false, text }] }));
}

/** design `app.sendMya()` — sends the draft */
export const sendMya = () => askMya(useMya.getState().draft);

/** test helper */
export const resetMya = () => set({ thinking: false, feed: [], draft: '', sessionId: null });
