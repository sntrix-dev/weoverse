// design: requests.jsx RequestCard / RequestRecord / RequestPanel
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { Clamp } from '@/components/text/Clamp';
import { SectionMark } from '@/components/layout/SectionMark';
import { Avatar, Button, ICO, OMark, Orb, svg } from '@/design-system';
import { useOPeg } from '@/features/create/api/create';
import { osFmt, oStr } from '@/lib/format';
import { useBriefOffers } from '../api/requests';
import type { BriefModel } from '../model/briefs';

/* A request IS a WeO waiting to be made, so it takes the WeO card grammar — image first, a
   format badge, the budget at rest with the flow mark — and the same view options every other
   group of WeOs has. */
const TONE = '#3A95F2';

const onEnter = (go: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter') go();
};

/** "who asked · where it is asked" — the place is the brief's category circle (D-065). */
const whereOf = (r: BriefModel) => r.circle?.name ?? r.category;
const closesLine = (r: BriefModel) => (r.open ? `closes ${r.closes}` : 'closed');

export function RequestCard({ r, onOpen }: { r: BriefModel; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  const img = r.circle?.img;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${r.title} — open the brief`}
      onClick={onOpen}
      onKeyDown={onEnter(onOpen)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        cursor: 'pointer',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'var(--surface)',
        boxShadow: hov
          ? `var(--shadow-card), inset 0 0 0 1px color-mix(in srgb, ${TONE} 44%, transparent)`
          : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'transform .24s var(--ease-portal), box-shadow .28s',
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'block',
          height: 118,
          background: 'var(--surface-2)',
          overflow: 'hidden',
        }}
      >
        {img ? (
          <img
            src={img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hov ? 'scale(1.05)' : 'none',
              transition: 'transform .6s var(--ease-portal)',
            }}
          />
        ) : (
          <span
            style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: TONE }}
          >
            {svg(ICO.requests, 46, 'currentColor', 1.5)}
          </span>
        )}
        <span
          style={{
            position: 'absolute',
            left: 11,
            top: 11,
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: hov ? '#fff' : 'var(--text)',
            background: hov
              ? `color-mix(in srgb, ${TONE} 82%, #000)`
              : 'color-mix(in srgb, var(--surface) 82%, transparent)',
            backdropFilter: 'blur(8px)',
            transition: 'background .28s, color .28s',
          }}
        >
          {r.mine ? 'Your request' : 'Request'}
        </span>
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            borderRadius: 999,
            padding: '3px 9px',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-dim)',
            background: 'color-mix(in srgb, var(--surface) 84%, transparent)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {closesLine(r)}
        </span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '12px 15px 14px' }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-.022em',
            lineHeight: 1.2,
            color: hov ? 'var(--text)' : 'var(--text-dim)',
            transition: 'color .24s',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {r.title}
        </span>
        {/* the brief itself fills the width the card now has, instead of empty card */}
        {r.brief && (
          <span
            style={{
              fontSize: 11.5,
              lineHeight: 1.5,
              color: 'var(--text-faint)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {r.brief}
          </span>
        )}
        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, marginTop: 1 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 5,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={12} /> {osFmt(r.budget)}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            Budget
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11.5,
              fontWeight: 500,
              color: hov ? TONE : 'var(--text-faint)',
              fontVariantNumeric: 'tabular-nums',
              transition: 'color .24s',
            }}
          >
            {r.offers} offer{r.offers === 1 ? '' : 's'}
          </span>
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
          {r.by.name} · {whereOf(r)}
        </span>
      </span>
    </div>
  );
}

export function RequestRecord({ r, onOpen }: { r: BriefModel; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${r.title} — open the brief`}
      onClick={onOpen}
      onKeyDown={onEnter(onOpen)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        cursor: 'pointer',
        borderRadius: 26,
        padding: 16,
        background: hov ? `color-mix(in srgb, ${TONE} 5%, var(--surface))` : 'var(--surface)',
        boxShadow: `var(--nm-raised), inset 0 0 0 1px ${hov ? `color-mix(in srgb, ${TONE} 32%, transparent)` : 'var(--border)'}`,
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'transform .3s var(--ease-portal), background .3s, box-shadow .3s',
      }}
    >
      <span style={{ position: 'relative', flex: '0 0 auto', display: 'grid', placeItems: 'center' }}>
        <Orb size={64} fill={TONE} matcap ring ringColor={TONE} breathe={hov} />
        <span aria-hidden="true" style={{ position: 'absolute', color: '#fff', opacity: 0.92 }}>
          {svg(ICO.requests, 26, 'currentColor', 1.7)}
        </span>
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-.015em',
            lineHeight: 1.25,
            color: 'var(--text)',
          }}
        >
          {r.title}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>
          {r.by.name} · {whereOf(r)} · {closesLine(r)}
        </p>
      </div>
      <div style={{ flex: '0 0 auto', display: 'flex', gap: 18, alignItems: 'flex-end' }}>
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {r.offers}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>offers</span>
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <OMark size={13} />
          {osFmt(r.budget)}
        </span>
      </div>
    </div>
  );
}

const cell = (v: ReactNode, k: string) => (
  <div
    key={k}
    style={{
      borderRadius: 16,
      padding: '11px 13px',
      background: 'var(--surface-2)',
      boxShadow: 'var(--nm-inset)',
    }}
  >
    <span
      style={{
        display: 'block',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {v}
    </span>
    <span
      style={{
        display: 'block',
        marginTop: 2,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: 'var(--text-faint)',
      }}
    >
      {k}
    </span>
  </div>
);

/** Your brief: the offers made in answer, each one collectable (`accepted-weos`). */
function OffersIn({ r, onCollect }: { r: BriefModel; onCollect: (weoId: string) => void }) {
  const q = useBriefOffers(r.id, r.mine);
  const peg = useOPeg().data?.usdAgainstO ?? 0;
  const offers = q.data?.offers ?? [];
  if (!offers.length)
    return (
      <p style={{ margin: '18px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>
        {q.isLoading ? 'Reading the offers…' : 'No offers yet — they arrive here, side by side.'}
      </p>
    );
  return (
    <div
      style={{
        display: 'grid',
        gap: 1,
        marginTop: 18,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--border)',
      }}
    >
      {offers.map((o) => {
        const img = o.media?.find((m) => m.type !== 'video')?.url ?? null;
        const os = peg > 0 ? Math.round(Number(o.price?.amount ?? 0) * peg) : null;
        return (
          <div
            key={o._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--surface)',
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: 40,
                height: 40,
                borderRadius: 12,
                overflow: 'hidden',
                background: img ? `url('${img}') center/cover` : 'var(--surface-2)',
              }}
            />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {o.title}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-faint)' }}>
                {o.creatorName}
              </span>
            </span>
            {os != null && (
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {oStr(os)}
              </span>
            )}
            <Button size="sm" variant="primary" tone="green" onClick={() => onCollect(o._id)}>
              Collect
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export interface RequestPanelHandlers {
  onOffer: (r: BriefModel) => void;
  onAsk: (r: BriefModel) => void;
  onMake: (r: BriefModel) => void;
  onCloseBrief: (r: BriefModel) => void;
  onCollect: (weoId: string) => void;
  onCollapse: () => void;
}

export function RequestPanel({
  r,
  h,
  closing,
}: {
  r: BriefModel;
  h: RequestPanelHandlers;
  closing?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const circleName = r.circle?.name ?? r.category;
  return (
    <div
      id={`rq-${r.id}`}
      style={{
        gridColumn: '1/-1',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'clamp(18px,3vw,34px)',
        borderRadius: 30,
        padding: 'clamp(18px,2.4vw,28px)',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-hero), inset 0 0 0 1px var(--border)',
        animation: 'weo-cardin .45s var(--ease-portal) both',
      }}
    >
      <div style={{ flex: '1 1 360px', minWidth: 0 }}>
        <SectionMark icon={ICO.requests} label={`Request · ${circleName}`} rule={false} />
        <h3
          style={{
            margin: '10px 0 0',
            fontSize: 'clamp(20px,2.3vw,26px)',
            fontWeight: 700,
            letterSpacing: '-.03em',
            lineHeight: 1.12,
            color: 'var(--text)',
          }}
        >
          {r.title}
        </h3>
        {r.brief && (
          <div style={{ marginTop: 10, maxWidth: '52ch' }}>
            <Clamp
              lines={3}
              tone="var(--o-blue)"
              style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-dim)' }}
            >
              {r.brief}
            </Clamp>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <Avatar src={r.by.avatar ?? undefined} size={30} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Posted by <b style={{ color: 'var(--text)' }}>{r.mine ? 'you' : r.by.name}</b>
          </span>
          <span style={{ marginLeft: 14, fontSize: 12, color: 'var(--text-dim)' }}>
            {r.category} · {closesLine(r)}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
            gap: 10,
            marginTop: 18,
          }}
        >
          {cell(
            r.budgetMin && r.budgetMin !== r.budget
              ? `${oStr(r.budgetMin)}–${osFmt(r.budget)}`
              : oStr(r.budget),
            'budget',
          )}
          {cell(String(r.offers), 'offers in')}
          {cell(r.open ? r.closes : 'Closed', 'left to offer')}
        </div>
        {r.mine ? (
          <OffersIn r={r} onCollect={h.onCollect} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
            {r.offerers.length > 0 && (
              <span style={{ display: 'flex' }}>
                {r.offerers.map((p, i) => (
                  <span key={p.id} title={p.name} style={{ marginLeft: i ? -9 : 0 }}>
                    <Avatar src={p.avatar ?? undefined} size={28} />
                  </span>
                ))}
              </span>
            )}
            <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
              {r.offered
                ? 'You have offered · anyone can'
                : r.offerers.length
                  ? 'already offered · anyone can'
                  : 'No offers yet · anyone can'}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
          {r.mine ? (
            r.open &&
            (confirm ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  tone="gold"
                  disabled={closing}
                  onClick={() => h.onCloseBrief(r)}
                >
                  {closing ? 'Closing…' : 'Yes, stop taking offers'}
                </Button>
                <Button size="sm" variant="ghost" tone="blue" onClick={() => setConfirm(false)}>
                  Keep it open
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" tone="gold" onClick={() => setConfirm(true)}>
                Close this brief
              </Button>
            ))
          ) : (
            <Button size="sm" variant="primary" tone="green" disabled={!r.open} onClick={() => h.onOffer(r)}>
              Offer one you hold
            </Button>
          )}
          <Button size="sm" variant="ghost" tone="violet" onClick={() => h.onAsk(r)}>
            Ask in {circleName}
          </Button>
          {/* "Rehearse it" arrives with worlds (M11, D-064) */}
          <Button size="sm" variant="ghost" tone="blue" onClick={h.onCollapse}>
            Close
          </Button>
        </div>
      </div>
      {/* the orb IS the answer: tap it and the composer opens seeded with this brief */}
      {!r.mine && r.open && (
        <div
          style={{ flex: '0 0 auto', width: 260, maxWidth: '100%', display: 'grid', placeItems: 'center' }}
        >
          <button
            type="button"
            onClick={() => h.onMake(r)}
            title="Make a WeO for this brief"
            aria-label={`Make a WeO for this brief — ${r.title}`}
            className="weo-req-orb"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <Orb size={190} fill={TONE} matcap ring ringColor={TONE} breathe />
              <span aria-hidden="true" style={{ position: 'absolute', color: '#fff', opacity: 0.92 }}>
                {svg(ICO.requests, 62, 'currentColor', 1.4)}
              </span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                borderRadius: 999,
                padding: '8px 15px',
                fontSize: 12.5,
                fontWeight: 700,
                color: '#fff',
                background: 'var(--o-blue)',
                boxShadow: '0 10px 22px -10px color-mix(in srgb, var(--o-green) 85%, transparent)',
              }}
            >
              Make a WeO for this
              {svg(<polyline points="9 6 15 12 9 18" />, 14, 'currentColor', 2.4)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
