import { http } from 'msw';
import { askMya, useMya } from '@/stores/mya';
import { useUi } from '@/stores/ui';
import { fail, ok, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { matchFaq, MYA_NO_ANSWER, MYA_STARTERS } from '../model/myaFaq';

const last = () => useMya.getState().feed.at(-1)?.text;

describe('Mya', () => {
  it('offers three starters about WeO itself (no mock market stats)', () => {
    expect(MYA_STARTERS.map((s) => s.q)).toEqual([
      'What is a WeO?',
      'How do I post a WeO?',
      'Where should I start?',
    ]);
  });

  it('answers a starter from the FAQ without calling the chatbot', async () => {
    const hit = vi.fn();
    server.use(http.post(url('/chatbot/ask'), () => (hit(), ok({}))));
    await askMya('What is a WeO?');
    expect(hit).not.toHaveBeenCalled();
    expect(last()).toMatch(/Wealth Exchange Offer/);
    expect(useUi.getState().dock).toEqual({ open: true, tab: 'mya' });
  });

  it('asks the backend chatbot and keeps the session for follow-ups', async () => {
    const seen: unknown[] = [];
    server.use(
      http.post(url('/chatbot/ask'), async ({ request }) => {
        seen.push(await request.json());
        return ok({ answer: 'From the knowledge base.', sessionId: 'sess-1', degraded: false });
      }),
    );
    await askMya('tell me about circles');
    await askMya('and stewards?');
    expect(last()).toBe('From the knowledge base.');
    expect(seen).toEqual([
      { question: 'tell me about circles' },
      { question: 'and stewards?', sessionId: 'sess-1' },
    ]);
    expect(useMya.getState().feed.filter((m) => m.me)).toHaveLength(2);
    expect(useMya.getState().thinking).toBe(false);
  });

  it('falls back to the FAQ when the chatbot is degraded or down', async () => {
    server.use(
      http.post(url('/chatbot/ask'), () =>
        ok({ answer: 'The chatbot is not yet initialised.', sessionId: 's', degraded: true }),
      ),
    );
    await askMya('how much does it cost to use');
    expect(last()).toBe(matchFaq('how much does it cost to use')?.a);

    server.use(http.post(url('/chatbot/ask'), () => fail(500, 'down')));
    await askMya('qqq zzz');
    expect(last()).toBe(MYA_NO_ANSWER);
  });
});
