import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { CardFlow, type CardFlowSpec } from '@/components/flow/CardFlow';
import type { DialRange } from '@/components/flow/FlowParts';
import { Button, Spinner } from '@/design-system';
import { FORMATS, formatHex, type WeoFormat } from '@/lib/cardModel';
import { osFmt, oStr } from '@/lib/format';
import { closeFlow, type RelistTarget } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useResell, useResellQuote } from '../api/holdings';

const asFormat = (f: string): WeoFormat =>
  (FORMATS as readonly string[]).includes(f) ? (f as WeoFormat) : 'Listing';

function Scrim({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Relist"
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
      {children}
    </div>
  );
}

/**
 * design: screens-flows.jsx RelistSheet — you own it; relisting is the same portal, your ask
 * instead of theirs. Every figure comes from the resell quote: what you paid, the WeO's value,
 * the dial and what would stop it (D-046). Nothing is withheld on a resale, so there are no fee lines.
 */
export function RelistSheet({ target }: { target: RelistTarget }) {
  const navigate = useNavigate();
  const quote = useResellQuote(target.weoId, target.collectionId);
  const resell = useResell(target.weoId);
  const [dial, setDial] = useState<number | null>(null);
  const [listed, setListed] = useState<{ id: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = quote.data;
  if (!q) {
    return (
      <Scrim>
        {quote.isError ? (
          <div style={{ borderRadius: 24, padding: 22, background: 'var(--surface)', color: 'var(--text)', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px' }}>This WeO could not be opened.</p>
            <Button size="sm" variant="ghost" tone="violet" onClick={closeFlow}>
              Close
            </Button>
          </div>
        ) : (
          <Spinner tone="#22C55E" />
        )}
      </Scrim>
    );
  }

  const format = asFormat(q.format ?? target.format);
  const tone = formatHex(format);
  const name = q.title || target.name;
  const img = q.img ?? target.img;
  const V: DialRange = {
    label: 'Your ask',
    pre: 'O',
    min: q.dial.min,
    max: q.dial.max,
    lo: q.dial.lo,
    hi: q.dial.hi,
    step: q.dial.step,
  };
  const value = dial ?? q.dial.start;

  const notices = q.blockers.length ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {q.blockers.map((b) => (
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

  const spec: CardFlowSpec = {
    tone,
    toneName: 'green',
    title: name,
    sub: `Yours · ${format}`,
    img,
    cta: 'Relist it',
    priceLabel: 'Your ask',
    commitLabel: 'Your ask · you receive',
    front: (advance) => (
      <div style={{ width: 300, borderRadius: 26, padding: 18, background: 'var(--surface-2)', boxShadow: 'var(--nm-inset)' }}>
        <span
          style={{
            display: 'block',
            width: 128,
            height: 128,
            margin: '0 auto',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: 'var(--nm-hero)',
            background: img ? undefined : tone,
          }}
        >
          {img && <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </span>
        <h4 style={{ margin: '14px 0 0', fontSize: 15, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.25, color: 'var(--text)' }}>
          {name}
        </h4>
        <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
          {q.paidOs != null
            ? `You paid ${oStr(q.paidOs)} · worth ${oStr(q.valueOs)} today. The passport and its terms travel with it.`
            : 'Yours to relist. The passport and its terms travel with it.'}
        </p>
        <div style={{ marginTop: 14 }}>
          <Button size="sm" variant="primary" tone="green" onClick={advance} dot>
            Relist it
          </Button>
        </div>
      </div>
    ),
    dial: {
      V,
      value,
      onValue: setDial,
      note: 'Colour is how likely this ask clears at today’s depth. Nobody sees it but you.',
    },
    amount: value,
    net: value,
    fees: [],
    feeTotal: 0,
    rate: q.usdAgainstO > 0 ? 1 / q.usdAgainstO : undefined,
    commit: {
      what: `${name} · relist`,
      to: 'The floor · whoever collects it',
      when: 'Listed the moment you confirm',
      next: 'It appears on the floor in its format, with your ask at rest.',
      recover: 'A re-listing stays on the floor until someone collects it.',
      notices,
      blocked: !q.resellable,
    },
    error,
    confirm: async () => {
      setError(null);
      try {
        const r = await resell.mutateAsync({
          title: q.title || target.name,
          description: q.description || q.title || target.name,
          amountOs: value,
          quantity: q.quantity,
          tags: q.tags,
          ...(q.collectionId ? { collectionId: q.collectionId } : {}),
        });
        setListed({ id: r.resold._id, amount: value });
        return true;
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'That did not go through. Nothing was listed — try again.');
        void quote.refetch();
        return false;
      }
    },
    moment: { verb: 'Posted', dest: 'Exchange', destTone: '#F7C62B' },
    done: listed
      ? {
          title: 'Listed',
          body: `On the floor at O ${osFmt(listed.amount)}. It stays there until someone collects it; the passport travels with it.`,
          amountOs: listed.amount,
          lines: [
            { label: 'WeO', value: name },
            { label: 'Format', value: format },
            { label: 'Your ask', value: oStr(listed.amount) },
            { label: 'Passport', value: `# ${listed.id}`, mono: true },
          ],
          id: listed.id,
          onDone: () => {
            closeFlow();
            toast(`${name} is on the floor`);
          },
          cta: {
            label: 'See it in Exchange',
            tone: 'gold',
            go: () => {
              closeFlow();
              void navigate(routes.listed());
            },
          },
        }
      : null,
    onClose: closeFlow,
  };

  return <CardFlow spec={spec} />;
}
