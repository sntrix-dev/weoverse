import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { Avatar, ICO, Orb, svg } from '@/design-system';
import { relTime } from '@/lib/time';
import type { StoryModel, ThreadModel } from '../model/community';

export { useHubPath } from '@/components/shell/useHubPath';

/** design: section-hero.jsx PreviewCard — image first, one line of summary, the rest on ask. */
export function PreviewCard({
  img,
  title,
  summary,
  meta,
  tone,
  onClick,
  tall,
}: {
  img: string | null;
  title: string;
  summary?: string;
  meta?: ReactNode;
  tone?: string;
  onClick: () => void;
  tall?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const t = tone || 'var(--o-violet)';
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
        padding: 0,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        font: 'inherit',
        borderRadius: 24,
        overflow: 'hidden',
        background: 'var(--surface)',
        boxShadow: hov
          ? 'var(--shadow-card), inset 0 0 0 1px var(--glass-brd)'
          : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'transform .24s var(--ease-portal), box-shadow .24s',
      }}
    >
      <span style={{ display: 'block', height: tall ? 168 : 124, background: 'var(--surface-2)', overflow: 'hidden' }}>
        {img && (
          <img
            src={img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hov ? 'scale(1.04)' : 'none',
              transition: 'transform .6s var(--ease-portal)',
            }}
          />
        )}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '13px 15px 15px' }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-.018em',
            color: 'var(--text)',
            lineHeight: 1.22,
            textWrap: 'pretty',
          }}
        >
          {title}
        </span>
        {summary && (
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: 12,
              fontWeight: 400,
              lineHeight: 1.55,
              color: 'var(--text-dim)',
            }}
          >
            {summary}
          </span>
        )}
        {meta && (
          <span
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10,
              marginTop: 2,
              fontSize: 11.5,
              fontWeight: 500,
              color: hov ? t : 'var(--text-dim)',
              transition: 'color .24s',
            }}
          >
            {meta}
          </span>
        )}
      </span>
    </button>
  );
}

/** design: screens-hub.jsx ThreadRow — one question in the feed. */
export function ThreadRow({ t, onOpen }: { t: ThreadModel; onOpen: () => void }) {
  const [hov, setHov] = useState(false);
  const p = t.author;
  const weo = t.weo;
  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        padding: '14px 14px',
        borderRadius: 18,
        background: hov ? 'var(--surface-2)' : 'transparent',
        transition: 'background .22s',
        font: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Avatar src={p.avatar} isr={p.isr} size={28} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>· {t.createdAt ? relTime(t.createdAt) : 'just now'}</span>
        {t.tags[0] && (
          <span
            style={{
              marginLeft: 'auto',
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'var(--o-violet)',
              background: 'color-mix(in srgb, var(--o-violet) 12%, var(--surface))',
              border: '1px solid color-mix(in srgb, var(--o-violet) 34%, transparent)',
            }}
          >
            {t.tags[0]}
          </span>
        )}
      </div>
      <h4 style={{ margin: '9px 0 0', fontSize: 15, fontWeight: 600, letterSpacing: '-.01em', color: 'var(--text)' }}>
        {t.title}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 9, fontSize: 11.5, color: 'var(--text-dim)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {svg(ICO.hub, 14)}
          <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{t.replies}</span>
        </span>
        <span style={{ fontWeight: 700, color: t.resolved ? 'var(--o-green)' : 'var(--o-violet)' }}>
          {t.resolved ? 'Resolved' : 'Open'}
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t.views} views</span>
        {weo && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: weo.img ? `url('${weo.img}') center/cover` : 'var(--surface-3)',
              }}
            />
            {weo.name}
          </span>
        )}
      </div>
    </button>
  );
}

export type HubLens = 'questions' | 'stewards' | 'stories';
const HUB_LENSES: { value: HubLens; label: string }[] = [
  { value: 'questions', label: 'Questions' },
  { value: 'stewards', label: 'Stewards' },
  { value: 'stories', label: 'Stories' },
];
export const LENS_ICONS: Record<HubLens, ReactNode> = {
  questions: <path d="M20.5 11.5a8 8 0 0 1-8 8 8 8 0 0 1-3.6-.85L3.5 20.5l1.85-5.4A8 8 0 0 1 12.5 3.5a8 8 0 0 1 8 8z" />,
  stewards: <path d="M12 3.4l2.6 5.6 6.1.6-4.6 4.1 1.4 6-5.5-3.2-5.5 3.2 1.4-6L3.3 9.6l6.1-.6z" />,
  stories: (
    <>
      <path d="M4 19.2A2.4 2.4 0 0 1 6.4 17H20" />
      <path d="M6.4 3H20v19H6.4A2.4 2.4 0 0 1 4 19.6V5.4A2.4 2.4 0 0 1 6.4 3z" />
    </>
  ),
};

/** design: screens-hub.jsx LensSegs — three icon segments that name themselves when on or approached. */
export function LensSegs({ value, onChange }: { value: HubLens; onChange: (v: HubLens) => void }) {
  const [hov, setHov] = useState<HubLens | null>(null);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        padding: 4,
        borderRadius: 999,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      {HUB_LENSES.map((it) => {
        const on = value === it.value;
        const hot = hov === it.value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            onMouseEnter={() => setHov(it.value)}
            onMouseLeave={() => setHov(null)}
            aria-label={it.label}
            aria-pressed={on}
            title={it.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: on || hot ? 7 : 0,
              height: 36,
              padding: on || hot ? '0 14px' : '0 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              font: 'inherit',
              fontSize: 12.5,
              fontWeight: on ? 700 : 500,
              color: on ? '#fff' : hot ? 'var(--o-violet)' : 'var(--text-faint)',
              background: on
                ? 'var(--o-violet)'
                : hot
                  ? 'color-mix(in srgb, var(--o-violet) 9%, transparent)'
                  : 'transparent',
              transition: 'background .26s, color .24s, gap .32s var(--ease-portal), padding .32s var(--ease-portal)',
            }}
          >
            {svg(LENS_ICONS[it.value], 17, 'currentColor', 1.7)}
            <span
              style={{
                maxWidth: on || hot ? 90 : 0,
                opacity: on || hot ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-width .34s var(--ease-portal), opacity .22s',
              }}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** design: screens-more.jsx StoryGrid — each story as a PreviewCard, into the thread it came from. */
export function StoryGrid({ list, onOpen }: { list: StoryModel[]; onOpen: (s: StoryModel) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(264px,1fr))', gap: 16 }}>
      {list.map((s, i) => (
        <div key={s.id} style={{ animation: `weo-cardin .44s var(--ease-settle) ${i * 0.06}s both` }}>
          <PreviewCard
            tall
            img={s.img}
            tone={s.tone}
            title={s.title}
            summary={s.blurb}
            onClick={() => onOpen(s)}
            meta={
              <>
                <span style={{ color: s.tone }}>{s.type}</span>
                <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>
                  {s.author} · {s.duration}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    color: 'var(--text-faint)',
                    fontWeight: 400,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.collectors} collectors
                </span>
              </>
            }
          />
        </div>
      ))}
    </div>
  );
}

/** A story opens the thread it happened in, else its WeO (a story with no thread: design gap). */
export function useOpenStory() {
  const navigate = useNavigate();
  return (s: StoryModel) => void navigate(s.threadId ? routes.thread(s.threadId) : routes.weo(s.weoId));
}

/** A small orb for a WeO face (used by the circle snapshot and stories). */
export function FaceOrb({ img, size, ring }: { img: string | null; size: number; ring?: string }) {
  return <Orb size={size} fill={img ? 'image' : (ring ?? 'var(--o-violet)')} src={img ?? undefined} ring={!!ring} ringColor={ring} matcap />;
}
