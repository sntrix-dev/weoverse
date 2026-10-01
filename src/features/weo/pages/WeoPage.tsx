import { useMemo, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router';
import { routes } from '@/app/routes';
import { SectionHero } from '@/components/hero/SectionHero';
import { RailHead } from '@/components/layout/Rail';
import { Scene } from '@/components/layout/Scene';
import { PathBar } from '@/components/shell/PathBar';
import { WeoPriceAtRest } from '@/components/weo/WeoBits';
import { WeoActions } from '@/components/weo/WeoCards';
import { weoCardProps } from '@/components/weo/weoCardProps';
import { Avatar, Button, Chip, EmptyState, ICO, OMark, Progress, svg, WeOCard } from '@/design-system';
import { cardModel, type WeoFormat } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { openCollect } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useWeo } from '../api/weos';
import { WeoPriceFeature } from '../components/WeoPriceFeature';
import { useWeoHandlers } from '../useWeoHandlers';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const PROGRESS_TONE: Partial<Record<WeoFormat, string>> = {
  Hunt: 'var(--o-gold)',
  Drop: 'var(--o-violet)',
  Pool: 'var(--o-green)',
};

/** design: weo.jsx WeoScreen — the WeO's own page: the card, its price at rest, its terms, and the act. */
export function WeoPage() {
  const { weoId = '' } = useParams();
  const navigate = useNavigate();
  const h = useWeoHandlers();
  const q = useWeo(weoId);
  const w = useMemo(() => (q.data ? cardModel(q.data) : null), [q.data]);

  if (!w) {
    return (
      <main style={page}>
        {q.isError ? (
          <EmptyState
            title="This WeO isn’t on the floor"
            description="It may have been removed, or the link is wrong."
            action={
              <Button tone="blue" onClick={() => void navigate(routes.discover())}>
                Back to Discover
              </Button>
            }
          />
        ) : (
          <div aria-busy="true" style={{ minHeight: '60vh' }} />
        )}
      </main>
    );
  }

  const tone = w.hex;
  const collect = () => (w.live ? openCollect(w.id) : toast(`${w.name} has closed`));
  const ask = () => h.onPush?.(w);
  const row = (k: string, v: string, i: number) => (
    <div
      key={k}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 14,
        padding: '12px 16px',
        fontSize: 12.5,
        borderTop: i ? '1px solid var(--border)' : 'none',
      }}
    >
      <span style={{ color: 'var(--text-faint)', flex: '0 0 auto' }}>{k}</span>
      <span style={{ textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>{v}</span>
    </div>
  );
  const resale = !w.resellable
    ? 'not resellable'
    : w.resalePct != null
      ? `${w.resalePct}% to the creator`
      : 'Resellable';
  const progressTone = PROGRESS_TONE[w.type];

  return (
    <main style={page}>
      <PathBar
        onHub={() => void navigate(routes.hub())}
        items={[
          { label: 'WeOverse', onClick: () => void navigate(routes.hub()) },
          { label: 'Discover', onClick: () => void navigate(routes.discover()) },
          { label: w.category, onClick: () => void navigate(routes.discover()) },
          { label: w.name },
        ]}
      />

      <SectionHero
        id="weo"
        tone={tone}
        icon={ICO.spark}
        eyebrow={w.weoId ? `${w.type} · # ${w.weoId}` : w.type}
        title={w.name}
        lede={w.points[0] || 'One WeO, its terms at rest and its passport attached.'}
        feature={<WeoPriceFeature w={w} tone={tone} onAsk={ask} />}
        stats={[
          { value: String(w.collectors), label: 'Collectors' },
          { value: w.edition || '—', label: 'Edition' },
          { value: w.timer || (w.live ? 'Open' : 'Closed'), label: w.live ? 'Closes in' : 'State' },
        ]}
        priorities={[
          {
            label: w.live ? w.cta : 'Closed',
            note: w.live ? 'Review, then a receipt' : 'This one has closed',
            onClick: collect,
          },
          { label: 'Ask its Circle', note: w.circles[0]?.name ?? 'Post it as a thread', onClick: ask },
        ]}
        directory={[
          { id: 'weo-card', label: 'The card' },
          { id: 'weo-terms', label: 'Terms', count: w.terms.length },
          ...w.circles.map((c) => ({
            label: c.name,
            note: 'Its Circle',
            onClick: () => void navigate(routes.circle(c.id)),
          })),
          {
            label: w.creator.handle,
            note: 'The creator',
            onClick: () => void navigate(routes.creators(w.creator.id)),
          },
        ]}
      />

      <Scene id="weo-card" style={{ display: 'block', marginTop: 34 }}>
        <div
          className="weo-snap-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(280px,340px)',
            gap: 'clamp(18px,2.4vw,32px)',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              borderRadius: 30,
              padding: 'clamp(18px,2.4vw,28px)',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
            }}
          >
            <WeOCard w={272} {...weoCardProps(w, h)} />
            <WeoPriceAtRest os={w.os} label={w.priceLabel} />
            <WeoActions w={w} h={h} show />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              id="weo-terms"
              style={{
                borderRadius: 26,
                overflow: 'hidden',
                background: 'var(--surface)',
                boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
              }}
            >
              <div style={{ padding: '14px 16px 4px' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text-faint)',
                  }}
                >
                  Key terms
                </span>
              </div>
              {w.terms.map((t, i) => row(t.k, t.v, i))}
              {!w.terms.some((t) => t.k === 'Resale') && row('Resale', resale, 1)}
              {w.weoId && row('Passport', `# ${w.weoId}`, 1)}
            </div>

            {/* the act this page exists for, right under the terms it commits to */}
            <div id="weo-collect" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Button
                variant="primary"
                selected
                tone={tone}
                style={{ width: '100%' }}
                dot={w.live}
                onClick={collect}
                disabled={!w.live}
              >
                {w.live ? (
                  <>
                    {w.cta} · <OMark size={12} /> {osFmt(w.os)}
                  </>
                ) : (
                  'Closed'
                )}
              </Button>
              <span style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-faint)' }}>
                {w.live ? 'Review first, then a receipt' : 'This one has closed'}
              </span>
            </div>

            {progressTone && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  borderRadius: 22,
                  padding: 16,
                  background: 'var(--surface)',
                  boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    color: 'var(--text-dim)',
                  }}
                >
                  <span>{w.rarity}</span>
                  <b style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{w.fundPct}%</b>
                </span>
                <Progress value={w.fundPct} variant="linear" tone={progressTone} />
              </div>
            )}

            <button
              type="button"
              onClick={() => void navigate(routes.creators(w.creator.id))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderRadius: 22,
                padding: 14,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
                background: 'var(--surface)',
                boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
              }}
            >
              <Avatar src={w.creator.avatarUrl ?? undefined} isr={w.creator.isr} size={42} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                  {w.creator.handle}
                </span>
                <span
                  style={{ display: 'block', fontSize: 11.5, fontWeight: 400, color: 'var(--text-faint)' }}
                >
                  ISR {w.creator.isr} · {w.creator.tradeCount} trades
                </span>
              </span>
              {svg(<polyline points="9 6 15 12 9 18" />, 15, 'var(--text-faint)', 2)}
            </button>

            {w.circles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {w.circles.map((c) => (
                  <Chip
                    key={c.id}
                    role="link"
                    tabIndex={0}
                    tone="var(--o-violet)"
                    onClick={() => void navigate(routes.circle(c.id))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void navigate(routes.circle(c.id));
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {c.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </div>
      </Scene>

      {w.points.length > 0 && (
        <Scene style={{ display: 'block', marginTop: 40 }}>
          <RailHead tone={tone} title="What you actually get" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))',
              gap: 12,
            }}
          >
            {w.points.map((p, i) => (
              <div
                key={p}
                style={{
                  display: 'flex',
                  gap: 11,
                  borderRadius: 22,
                  padding: 16,
                  background: 'var(--surface)',
                  boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 24,
                    height: 24,
                    flex: '0 0 auto',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    background: 'var(--surface-2)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>{p}</p>
              </div>
            ))}
          </div>
        </Scene>
      )}
    </main>
  );
}
