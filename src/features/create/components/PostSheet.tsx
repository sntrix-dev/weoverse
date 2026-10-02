// design: screens-flows.jsx PostSheet — posting asks WHERE first: the whole network, a Circle, or one
// person (an open ask), then the success moment names the move.
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SuccessMoment } from '@/components/flow/FlowParts';
import { Avatar, Button, ICO, OButton, OMark, O_SECTION_ICONS, Orb, svg } from '@/design-system';
import { osFmt } from '@/lib/format';

export type PostDest = 'network' | 'circle' | 'direct';

export interface PostCircle {
  id: string;
  name: string;
  img: string | null;
  joined: boolean;
}

export interface PostAsk {
  id: string;
  title: string;
  who: string;
  avatar: string | null;
  budget: number;
  closes: string;
}

interface DestDef {
  k: PostDest;
  tone: string;
  label: string;
  note: string;
  icon: ReactNode;
}

const DEST: DestDef[] = [
  {
    k: 'network',
    tone: '#F7C62B',
    label: 'The whole network',
    note: 'On the floor in Exchange · anyone can collect it',
    icon: O_SECTION_ICONS.left,
  },
  {
    k: 'circle',
    tone: '#D946EF',
    label: 'A Circle',
    note: 'Posted into one community first · its members see it before the floor',
    icon: ICO.hub,
  },
  {
    k: 'direct',
    tone: '#3A95F2',
    label: 'One person',
    note: 'Sent directly, in answer to their ask · nobody else sees it',
    icon: ICO.requests,
  },
];

export function PostSheet({
  it,
  tone,
  circles,
  asks,
  direct,
  onPost,
  onDone,
  onClose,
}: {
  it: { name: string; img: string | null; os: number };
  tone: string;
  circles: PostCircle[];
  asks: PostAsk[];
  /** answering an ask is a regular WeO only */
  direct: boolean;
  /** does the posting; rejects when it did not go through (the sheet stays open) */
  onPost: (dest: PostDest, circleId: string | null, askId: string | null) => Promise<void>;
  onDone: (dest: PostDest, circleId: string | null, askId: string | null) => void;
  onClose: () => void;
}) {
  const [dest, setDest] = useState<PostDest>('network');
  const [circlePick, setCircle] = useState<string | null>(null);
  const [askPick, setAsk] = useState<string | null>(null);
  // the first of each is chosen until you choose (the lists can arrive after the sheet opens)
  const circle = circlePick ?? circles[0]?.id ?? null;
  const ask = askPick ?? asks[0]?.id ?? null;
  const [busy, setBusy] = useState(false);
  const [moment, setMoment] = useState(false);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = prev;
    };
  }, [onClose, busy]);
  const dests = DEST.filter((d) => d.k !== 'direct' || direct);
  const cur = DEST.find((d) => d.k === dest)!;
  const c = circles.find((x) => x.id === circle);
  const rq = asks.find((x) => x.id === ask);
  const destLabel =
    dest === 'network'
      ? 'Exchange'
      : dest === 'circle'
        ? c
          ? c.name
          : 'A Circle'
        : rq
          ? `${rq.who} · answers their ask`
          : 'One person';
  const verb = dest === 'direct' ? 'Sent' : 'Posted';
  const ready = dest === 'network' || (dest === 'circle' && !!c) || (dest === 'direct' && !!rq);
  const cid = dest === 'circle' ? (c?.id ?? null) : null;
  const aid = dest === 'direct' ? (rq?.id ?? null) : null;
  const go = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onPost(dest, cid, aid);
      setMoment(true);
    } catch {
      setBusy(false);
    }
  };
  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background: 'rgba(10,16,32,.46)',
        backdropFilter: 'blur(7px)',
        WebkitBackdropFilter: 'blur(7px)',
        overflowY: 'auto',
      }}
    >
      {moment && (
        <SuccessMoment
          tone={cur.tone}
          verb={verb}
          name={it.name}
          img={it.img}
          dest={destLabel}
          destTone={cur.tone}
          onDone={() => onDone(dest, cid, aid)}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Post · where does it go?"
        style={{
          width: 'min(520px,100%)',
          borderRadius: 32,
          padding: 22,
          background: 'var(--surface)',
          boxShadow: 'var(--nm-hero), inset 0 0 0 1px var(--border)',
          animation: 'weo-cardin .46s var(--ease-portal) both',
          margin: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Orb
            size={44}
            fill={it.img ? 'image' : tone}
            src={it.img}
            ring
            ringColor={tone}
            matcap
            breathe
            style={{ flex: '0 0 auto' }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              Post · where does it go?
            </p>
            <h3
              style={{
                margin: '2px 0 0',
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '-.025em',
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {it.name}
            </h3>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={12} />
            {osFmt(it.os || 0)}
          </span>
          <OButton variant="ghost" size={32} aria-label="Close" onClick={onClose} disabled={busy}>
            {svg(<path d="M18 6L6 18M6 6l12 12" />, 15, 'currentColor', 1.8)}
          </OButton>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${dests.length}, minmax(0,1fr))`,
            gap: 10,
            marginTop: 18,
          }}
        >
          {dests.map((d) => {
            const on = dest === d.k;
            return (
              <button
                type="button"
                key={d.k}
                onClick={() => setDest(d.k)}
                aria-pressed={on}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 10,
                  minHeight: 118,
                  padding: '14px 14px 12px',
                  border: 'none',
                  borderRadius: 22,
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                  background: on ? `color-mix(in srgb, ${d.tone} 10%, var(--surface))` : 'var(--surface)',
                  boxShadow: on
                    ? `var(--nm-raised), inset 0 0 0 2px ${d.tone}`
                    : 'var(--nm-sm), inset 0 0 0 1px var(--border)',
                  transition: 'box-shadow .24s, background .24s',
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    color: on ? '#fff' : d.tone,
                    background: on ? d.tone : `color-mix(in srgb, ${d.tone} 12%, transparent)`,
                    transition: 'background .24s, color .24s',
                  }}
                >
                  {svg(d.icon, 16, 'currentColor', 1.8)}
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    letterSpacing: '-.015em',
                    color: 'var(--text)',
                    textWrap: 'balance',
                  }}
                >
                  {d.label}
                </span>
                <span
                  style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--text-dim)', textWrap: 'pretty' }}
                >
                  {d.note}
                </span>
              </button>
            );
          })}
        </div>
        {dest === 'circle' && (
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              animation: 'weo-cardin .3s var(--ease-portal) both',
            }}
          >
            {circles.length === 0 && (
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>No Circle to post into yet.</span>
            )}
            {circles.map((x) => {
              const on = circle === x.id;
              return (
                <button
                  type="button"
                  key={x.id}
                  onClick={() => setCircle(x.id)}
                  aria-pressed={on}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    minHeight: 40,
                    padding: '0 14px 0 6px',
                    border: 'none',
                    borderRadius: 999,
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 12.5,
                    fontWeight: on ? 700 : 600,
                    color: on ? '#fff' : 'var(--text)',
                    background: on ? '#D946EF' : 'var(--surface-2)',
                    boxShadow: on ? '0 10px 22px -10px #D946EF' : 'var(--nm-inset)',
                  }}
                >
                  <Orb size={28} fill={x.img ? 'image' : '#D946EF'} src={x.img} matcap />
                  {x.name}
                  {!x.joined && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        opacity: 0.75,
                      }}
                    >
                      joins you
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {dest === 'direct' && (
          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gap: 8,
              animation: 'weo-cardin .3s var(--ease-portal) both',
            }}
          >
            {asks.length === 0 && (
              <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                No open asks to answer right now.
              </span>
            )}
            {asks.map((r) => {
              const on = ask === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setAsk(r.id)}
                  aria-pressed={on}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: 18,
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                    background: on ? 'color-mix(in srgb, #3A95F2 9%, var(--surface))' : 'var(--surface-2)',
                    boxShadow: on ? 'inset 0 0 0 1.5px #3A95F2' : 'var(--nm-inset)',
                  }}
                >
                  <Avatar src={r.avatar ?? undefined} initials={r.who.slice(0, 2).toUpperCase()} size={34} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '-.01em',
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.title}
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-dim)' }}>
                      {r.who} · budget <OMark size={9} /> {osFmt(r.budget)} · closes {r.closes}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: 'block',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              Goes to
            </span>
            <span
              style={{
                display: 'block',
                marginTop: 3,
                fontSize: 13.5,
                fontWeight: 700,
                color: cur.tone,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {destLabel}
            </span>
          </span>
          <Button variant="ghost" tone="blue" size="sm" onClick={onClose} disabled={busy}>
            Not yet
          </Button>
          <Button
            variant="primary"
            tone={dest === 'network' ? 'gold' : dest === 'circle' ? 'violet' : 'blue'}
            disabled={!ready || busy}
            onClick={() => void go()}
            dot
          >
            {busy && !moment ? 'Posting…' : verb === 'Sent' ? 'Send it' : 'Post it'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
