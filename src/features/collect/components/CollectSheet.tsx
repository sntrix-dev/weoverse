import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { CardFlow, type CardFlowSpec } from '@/components/flow/CardFlow';
import type { DialRange } from '@/components/flow/FlowParts';
import { weoCardProps } from '@/components/weo/weoCardProps';
import { Button, Chip, Spinner, WeOCard, type ToneInput } from '@/design-system';
import { cardModel, type WeoCardModel, type WeoFormat } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { useWeo } from '@/features/weo/api/weos';
import { closeFlow } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useCollect, useCollectQuote, type CollectionDto, type CollectQuote } from '../api/collect';

const TONE_NAME: Record<WeoFormat, ToneInput> = {
  Bid: 'blue',
  Hunt: 'gold',
  Drop: 'violet',
  Pool: 'green',
  Listing: 'green',
};

/** The dial for this quote. Only a Bid and a Pool move; a set price and a hunt's entry are at rest. */
function dialFor(q: CollectQuote): DialRange {
  const { min, max, step, fixed } = q.bounds;
  if (fixed)
    return {
      label: q.amountLabel,
      pre: 'O',
      fixed: true,
      min: q.amount,
      max: q.amount,
      lo: q.amount,
      hi: q.amount,
    };
  // design: the colour present is how likely the offer holds. A pledge always holds; a bid
  // under the ask meets the creator's private floor, so the warmth climbs toward the ask.
  const pledge = q.format === 'Pool';
  return {
    label: q.amountLabel,
    pre: 'O',
    min,
    max,
    step,
    lo: pledge ? min : Math.round(max * 0.75),
    hi: pledge ? min : Math.round(max * 0.95),
  };
}

const entries = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`;

/** What happens after Confirm, in the backend's own terms (settlement is immediate — no holds). */
function copyFor(f: WeoFormat) {
  if (f === 'Pool')
    return {
      next: 'Your pledge joins the pool the moment you confirm.',
      verb: 'Pledged',
      title: 'Pledged',
    };
  if (f === 'Hunt')
    return {
      next: 'Your entries are numbered the moment you confirm; the draw decides the prizes.',
      verb: 'Entered',
      title: 'Entered',
    };
  return {
    next: 'It is in your collection the moment you confirm, with its passport.',
    verb: 'Collected',
    title: 'Collected',
  };
}

function doneBody(w: WeoCardModel, amount: number, c: CollectionDto): ReactNode {
  if (w.type === 'Pool') return `You are in the pool at O ${osFmt(amount)}.`;
  if (w.type === 'Hunt') {
    const d = c.data as { ticketCount?: number; ticketIds?: string[] };
    const n = d.ticketCount ?? 0;
    return `${entries(n)} in the draw${d.ticketIds?.length ? ` · ${d.ticketIds.join(', ')}` : ''}.`;
  }
  return 'Yours — it is in your collection now, passport intact.';
}

/** design: screens-flows.jsx CollectSheet, priced and submitted through the collect quote. */
export function CollectSheet({ weoId }: { weoId: string }) {
  const navigate = useNavigate();
  const weo = useWeo(weoId);
  const w = useMemo(() => (weo.data ? cardModel(weo.data) : null), [weo.data]);

  const [dial, setDial] = useState<number | null>(null);
  const [asked, setAsked] = useState<number | undefined>(undefined);
  const [bundle, setBundle] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (dial == null) return;
    const t = setTimeout(() => setAsked(dial), 250);
    return () => clearTimeout(t);
  }, [dial]);

  const quote = useCollectQuote(weoId, asked, bundle);
  const collect = useCollect(weoId);
  const [result, setResult] = useState<CollectionDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = quote.data;
  if (!w || !q) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Collect"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(10,16,32,.46)',
          backdropFilter: 'blur(7px)',
        }}
      >
        {weo.isError || quote.isError ? (
          <div
            style={{
              borderRadius: 24,
              padding: 22,
              background: 'var(--surface)',
              color: 'var(--text)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 12px' }}>This WeO could not be opened.</p>
            <Button size="sm" variant="ghost" tone="violet" onClick={closeFlow}>
              Close
            </Button>
          </div>
        ) : (
          <Spinner tone="#D946EF" />
        )}
      </div>
    );
  }

  const f = w.type;
  const tone = w.hex;
  const copy = copyFor(f);
  const V = dialFor(q);
  const value = V.fixed ? q.amount : (dial ?? q.amount);
  const rate = w.priceOs > 0 ? w.priceUsd / w.priceOs : undefined;
  const short = q.wallet.sufficient ? null : Math.max(0, q.amount - q.wallet.oBalance);
  const otherBlockers = q.blockers.filter((b) => b.code !== 'insufficient_balance');
  const nego = q.negotiation;
  const bidding = f === 'Bid' && q.amount < q.ask;

  const terms: { label: string; value: ReactNode }[] = w.terms.map((t) => ({ label: t.k, value: t.v }));
  if (nego) {
    terms.push({
      label: 'Attempts',
      value:
        nego.attemptsLeft > 0
          ? `A bid under the ask is a negotiation. ${nego.attemptsLeft} of ${nego.freeAttempts} free attempts left.`
          : `A bid under the ask is a negotiation. The next attempt costs O ${osFmt(nego.nextAttemptCost)}.`,
    });
  }

  const dealExtra =
    q.bundles && q.bundles.length > 1 ? (
      <div
        role="group"
        aria-label="Entries"
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7 }}
      >
        {q.bundles.map((b) => (
          <Chip
            key={b}
            selected={q.bundle === b}
            tone={tone}
            onClick={() => setBundle(b)}
            style={{ cursor: 'pointer' }}
          >
            {entries(b)}
          </Chip>
        ))}
      </div>
    ) : bidding && nego ? (
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-dim)', textAlign: 'center' }}>
        {nego.nextAttemptCost > 0
          ? `This attempt costs O ${osFmt(nego.nextAttemptCost)}.`
          : 'This attempt is free.'}
      </p>
    ) : null;

  const notices =
    otherBlockers.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {otherBlockers.map((b) => (
          <p
            key={b.code}
            style={{
              margin: 0,
              padding: '10px 14px',
              borderRadius: 16,
              fontSize: 12.5,
              color: 'var(--text)',
              background: 'color-mix(in srgb, var(--o-gold) 10%, var(--surface))',
              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--o-gold) 45%, transparent)',
            }}
          >
            {b.message}
          </p>
        ))}
      </div>
    ) : null;

  const done: CardFlowSpec['done'] = result
    ? {
        title: copy.title,
        body: doneBody(w, result.amount, result),
        amountOs: result.amount,
        lines: [
          { label: 'WeO', value: w.name },
          { label: 'Format', value: w.type },
          { label: 'Creator', value: w.creator.handle },
          ...(w.weoId ? [{ label: 'Passport', value: `# ${w.weoId}`, mono: true }] : []),
        ],
        id: result._id,
        onDone: () => {
          closeFlow();
          toast(
            f === 'Pool'
              ? 'Pledge recorded'
              : f === 'Hunt'
                ? 'Entries recorded'
                : `${w.name} is yours · passport intact`,
          );
        },
        cta: {
          label: 'See it in Collect',
          tone: 'violet',
          go: () => {
            closeFlow();
            void navigate(routes.collected());
          },
        },
      }
    : null;

  const spec: CardFlowSpec = {
    tone,
    toneName: TONE_NAME[f],
    title: w.name,
    sub: `${w.type} · ${w.category}`,
    img: w.img,
    cta: w.cta,
    priceLabel: w.priceLabel,
    front: (advance) => (
      <WeOCard
        w={300}
        {...weoCardProps(w, { onOpen: () => undefined })}
        engageLabel={w.cta}
        onEngage={advance}
        onResell={undefined}
        onCreate={undefined}
      />
    ),
    dial: {
      V,
      value,
      onValue: setDial,
      note: V.fixed
        ? f === 'Hunt'
          ? 'Entries are sold at a set price — choose how many.'
          : 'A set price is not a negotiation — this is the ask, at rest.'
        : f === 'Pool'
          ? 'Pledge anything from the minimum up. The creator’s numbers stay theirs.'
          : 'How much of the format colour is present is how likely the offer holds. The seller’s floor stays theirs.',
    },
    deal: dealExtra,
    terms,
    amount: q.amount,
    net: q.net,
    fees: q.fees,
    feeTotal: q.feeTotal,
    rate,
    commit: {
      what: `${w.name} · ${w.type}`,
      to: `${w.creator.handle} · ISR ${w.creator.isr}`,
      when: 'On confirmation',
      next: copy.next,
      recover: 'Settles on confirmation. If something is wrong, support has this receipt.',
      notices,
      blocked: !q.collectable,
      shortBy: short,
      available: q.wallet.oBalance,
      onTopUp: () => {
        closeFlow();
        void navigate(routes.wallet());
      },
    },
    error,
    confirm: async () => {
      setError(null);
      try {
        setResult(await collect.mutateAsync(q.payload));
        return true;
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'That did not go through. Nothing moved — try again.');
        void quote.refetch();
        return false;
      }
    },
    moment: { verb: copy.verb, dest: 'Your collection', destTone: '#D946EF' },
    done,
    onClose: closeFlow,
  };

  return <CardFlow spec={spec} />;
}
