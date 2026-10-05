// design: screens-flows.jsx OfferSheet / RequestFront — answer a brief with one you hold
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { CardFlow, type CardFlowSpec } from '@/components/flow/CardFlow';
import { Avatar, Button, ICO, Orb, Spinner, svg } from '@/design-system';
import { useMyWeos } from '@/features/community/api/community';
import { useCategories, useOPeg } from '@/features/create/api/create';
import { buildPayload } from '@/features/create/model/composer';
import { formFromWeo } from '@/features/create/model/edit';
import { useWeo } from '@/features/weo/api/weos';
import { oStr } from '@/lib/format';
import { closeFlow } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useBrief, useOfferOnBrief } from '../api/requests';
import { briefModel, offerRange, type BriefModel } from '../model/briefs';

const GREEN = '#22C55E';

function Scrim({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Make an offer"
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

interface HeldWeo {
  id: string;
  title: string;
  cover: string;
}

/** design RequestFront — the brief, who asked, and (ours) which of your WeOs you are offering. */
function RequestFront({
  r,
  held,
  pick,
  onPick,
  onOffer,
  onMake,
}: {
  r: BriefModel;
  held: HeldWeo[];
  pick: string | null;
  onPick: (id: string) => void;
  onOffer: () => void;
  onMake: () => void;
}) {
  return (
    <div
      style={{
        width: 300,
        maxWidth: '100%',
        borderRadius: 26,
        padding: 18,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto',
          width: 92,
          height: 92,
        }}
      >
        <Orb size={92} fill={GREEN} matcap ring ringColor={GREEN} breathe />
        <span aria-hidden="true" style={{ position: 'absolute', color: '#fff', opacity: 0.92 }}>
          {svg(ICO.requests, 34, 'currentColor', 1.6)}
        </span>
      </span>
      <h4
        style={{
          margin: '14px 0 0',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-.02em',
          lineHeight: 1.25,
          color: 'var(--text)',
        }}
      >
        {r.title}
      </h4>
      {r.brief && (
        <p
          style={{
            margin: '8px 0 0',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--text-dim)',
          }}
        >
          {r.brief}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
        }}
      >
        <Avatar src={r.by.avatar} size={26} />
        <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{r.by.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--o-green)' }}>
          {r.offers} offer{r.offers === 1 ? '' : 's'}
        </span>
      </div>
      {/* which one you hold — the offer is made from it (D-061) */}
      <p
        style={{
          margin: '14px 0 7px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        Offer one you hold
      </p>
      {held.length ? (
        <div
          role="radiogroup"
          aria-label="Which WeO"
          style={{ display: 'grid', gap: 6, maxHeight: 168, overflowY: 'auto' }}
        >
          {held.map((w) => {
            const on = w.id === pick;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={on}
                key={w.id}
                onClick={() => onPick(w.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  font: 'inherit',
                  borderRadius: 14,
                  padding: '6px 9px',
                  background: on ? `color-mix(in srgb, ${GREEN} 12%, var(--surface))` : 'var(--surface)',
                  boxShadow: on ? `inset 0 0 0 1px ${GREEN}` : 'inset 0 0 0 1px var(--border)',
                }}
              >
                <span
                  style={{
                    flex: '0 0 auto',
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    background: w.cover ? `url('${w.cover}') center/cover` : 'var(--surface-2)',
                  }}
                />
                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                    fontSize: 12,
                    fontWeight: on ? 700 : 600,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w.title}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-dim)' }}>
          You hold no live Listing to offer. Make one for this brief instead.
        </p>
      )}
      <div style={{ marginTop: 14 }}>
        {held.length ? (
          <Button size="sm" variant="primary" tone="green" onClick={onOffer} disabled={!pick} dot>
            Make an offer
          </Button>
        ) : (
          <Button size="sm" variant="primary" tone="blue" onClick={onMake} dot>
            Make a WeO for this
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * design: screens-flows.jsx OfferSheet — the card flow, your figure on the dial. The offer is a
 * WeO made for them from one you hold, at your figure (the backend's accept endpoint, D-061).
 * Settlement takes nothing, so there are no fee lines; the copy says what the backend does.
 */
export function OfferSheet({ requestId }: { requestId: string }) {
  const navigate = useNavigate();
  const brief = useBrief(requestId);
  const mine = useMyWeos();
  const peg = useOPeg().data;
  const cats = useCategories().data;
  const offer = useOfferOnBrief(requestId);
  const [now] = useState(() => Date.now());
  const held = useMemo<HeldWeo[]>(
    () =>
      (mine.data?.items ?? [])
        .filter((w) => w.weoType === 'regular' && w.status === 'active')
        .map((w) => ({ id: w.id, title: w.title, cover: w.cover })),
    [mine.data],
  );
  const [pickId, setPick] = useState<string | null>(null);
  const pick = pickId ?? held[0]?.id ?? null;
  const picked = useWeo(pick ?? undefined).data;
  const [dial, setDial] = useState<number | null>(null);
  const [sent, setSent] = useState<{ id: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!brief.data) {
    return (
      <Scrim>
        {brief.isError ? (
          <div
            style={{
              borderRadius: 24,
              padding: 22,
              background: 'var(--surface)',
              color: 'var(--text)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 12px' }}>This brief could not be opened.</p>
            <Button size="sm" variant="ghost" tone="violet" onClick={closeFlow}>
              Close
            </Button>
          </div>
        ) : (
          <Spinner tone={GREEN} />
        )}
      </Scrim>
    );
  }

  const r = briefModel(brief.data, now);
  const range = offerRange(r.budget);
  const value = dial ?? range.start;
  const heldName = held.find((w) => w.id === pick)?.title ?? '';
  const ready = !!picked && !!cats && !!peg;

  const spec: CardFlowSpec = {
    tone: GREEN,
    toneName: 'green',
    title: r.title,
    sub: `Request · ${r.open ? `closes ${r.closes}` : 'closed'}`,
    cta: 'Make an offer',
    priceLabel: 'Their budget',
    front: (advance) => (
      <RequestFront
        r={r}
        held={held}
        pick={pick}
        onPick={setPick}
        onOffer={advance}
        onMake={() => {
          closeFlow();
          void navigate(`${routes.create()}?forRequest=${encodeURIComponent(r.id)}`);
        }}
      />
    ),
    dial: {
      V: {
        label: 'Your offer',
        pre: 'O',
        min: range.min,
        max: range.max,
        lo: range.lo,
        hi: range.hi,
        step: range.step,
      },
      value,
      onValue: setDial,
      note: 'Offer what you would make it for. They see every offer side by side and collect the one they want.',
    },
    terms: heldName ? [{ label: 'Made from', value: heldName }] : undefined,
    amount: value,
    net: value,
    fees: [],
    feeTotal: 0,
    rate: peg && peg.usdAgainstO > 0 ? 1 / peg.usdAgainstO : undefined,
    commitLabel: 'Your offer · you receive',
    commit: {
      what: r.title,
      to: r.by.name,
      when: `They decide before it closes · ${r.closes}`,
      next: `${heldName || 'Your WeO'} is offered to them alone at this figure — nobody else sees it.`,
      recover: 'Pause it from Exchange any time before they collect it.',
      blocked: !r.open || !held.length,
    },
    error,
    confirm: async () => {
      setError(null);
      if (!ready || !picked || !cats || !peg) {
        setError('Still reading your WeO — try again in a moment.');
        return false;
      }
      try {
        const form = { ...formFromWeo(picked, cats), price: value, circ: 1 };
        const built = buildPayload(form, { usdAgainstO: peg.usdAgainstO, requestedId: r.id });
        const body = { ...built.body } as Record<string, unknown>;
        delete body.weoType;
        delete body.type;
        delete body.requestedId;
        const res = await offer.mutateAsync(body);
        setSent({ id: res._id, amount: value });
        return true;
      } catch (e) {
        setError(
          e instanceof ApiError ? e.message : 'That did not go through. Nothing was offered — try again.',
        );
        return false;
      }
    },
    moment: { verb: 'Offer made', dest: `With ${r.by.name}`, destTone: GREEN },
    done: sent
      ? {
          title: 'Offer sent',
          body: `${r.by.name} sees every offer side by side and collects the one they want — you will hear when they do.`,
          amountOs: sent.amount,
          lines: [
            { label: 'Request', value: r.title },
            { label: 'To', value: r.by.name },
            { label: 'Your offer', value: oStr(sent.amount) },
            ...(r.circle ? [{ label: 'Circle', value: r.circle.name }] : []),
          ],
          id: sent.id,
          onDone: () => {
            closeFlow();
            toast(`Offer sent to ${r.by.name}`);
          },
          cta: {
            label: 'See your offers',
            tone: 'blue',
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
