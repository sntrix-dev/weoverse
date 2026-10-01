import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import { OMark, svg } from '@/design-system';
import { glideToId } from '@/lib/glide';
import { PLACE_ICONS, TAB_ICONS } from './icons';

export interface HeroStatItem {
  label: string;
  value: ReactNode;
  /** the figure is Os — draw the flow mark */
  os?: boolean;
  delta?: string;
  deltaNote?: string;
  title?: string;
  onClick?: () => void;
}

/**
 * design: section-hero.jsx HeroStat — the figure carries the meaning; the label is small and
 * beneath it. An Os figure ALWAYS carries the O flow mark — never a typed "O".
 */
export function HeroStat({ s, tone }: { s: HeroStatItem; tone: string }) {
  const [hov, setHov] = useState(false);
  const raw = String(s.value ?? '');
  const os = s.os || /^O\s/.test(raw) || /^\+\s?O\s/.test(raw);
  const sign = os ? (raw.match(/^[+−-]/) || [''])[0] : '';
  const fig = os ? raw.replace(/^[+−-]\s*/, '').replace(/^O\s*/, '') : typeof s.value === 'string' || typeof s.value === 'number' ? raw : s.value;
  const Tag: ElementType = s.onClick ? 'button' : 'span';
  return (
    <Tag
      {...(s.onClick ? { type: 'button' } : {})}
      onClick={s.onClick}
      title={s.title}
      aria-label={s.onClick ? `${s.label} — open` : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        minWidth: 0,
        padding: '7px 13px',
        borderRadius: 15,
        border: 'none',
        font: 'inherit',
        textAlign: 'left',
        cursor: s.onClick ? 'pointer' : 'default',
        background: 'var(--surface)',
        boxShadow:
          s.onClick && hov
            ? `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${tone} 40%, transparent)`
            : 'var(--nm-sm)',
        transition: 'box-shadow .22s',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <b
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 5,
            fontSize: 'clamp(17px,1.8vw,21px)',
            fontWeight: 700,
            letterSpacing: '-.035em',
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {sign}
          {os && <OMark size="0.66em" />}
          {fig}
        </b>
        {s.delta &&
          (() => {
            /* a change reads by its direction: green up, red down; hover says over what period */
            const d = String(s.delta).trim();
            const down = /^[-−↓]/.test(d);
            const up = /^[+↑]/.test(d);
            const c = up ? 'var(--o-green)' : down ? 'var(--status-error, #FF5A2C)' : tone;
            const when = s.deltaNote || 'Last 7 days';
            return (
              <span
                title={when}
                aria-label={`${d} · ${when}`}
                style={{ fontSize: 11.5, fontWeight: 600, color: c, whiteSpace: 'nowrap', cursor: 'help' }}
              >
                {d}
              </span>
            );
          })()}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: s.onClick && hov ? tone : 'var(--text-faint)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color .2s',
        }}
      >
        {s.label}
        {s.onClick && svg(<path d="M9 6l6 6-6 6" />, 10, 'currentColor', 2.4)}
      </span>
    </Tag>
  );
}

export interface DirectoryPlace {
  /** element id on the page the chip glides to */
  id?: string;
  label: string;
  note?: string;
  count?: number | string | null;
  icon?: ReactNode;
  onClick?: () => void;
}

/** design: section-hero.jsx placeIcon */
export const placeIcon = (d: DirectoryPlace): ReactNode => {
  if (d.icon) return d.icon;
  const hay = `${d.id || ''} ${d.label || ''}`.toLowerCase();
  const hit = PLACE_ICONS.find(([re]) => re.test(hay));
  return hit ? hit[1] : null;
};

/**
 * design: section-hero.jsx DirChip — the rail never moves. The place you are IN carries its
 * name, and so does any place with no glyph; everything else is a fixed-size icon.
 */
export function DirChip({
  d,
  tone,
  onClick,
  active,
}: {
  d: DirectoryPlace;
  tone: string;
  onClick: () => void;
  active?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const lit = hov || active;
  const icon = placeIcon(d);
  const named = active || !icon;
  return (
    <button
      type="button"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      onClick={onClick}
      aria-label={d.label}
      title={d.note ? `${d.label} — ${d.note}` : d.label}
      aria-current={active ? 'true' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: named ? 8 : 0,
        flex: '0 0 auto',
        minHeight: 40,
        padding: named ? '0 13px 0 5px' : '0 5px',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12.5,
        fontWeight: 600,
        color: lit ? '#fff' : 'var(--text-dim)',
        background: lit ? tone : 'var(--surface)',
        boxShadow: lit ? `0 10px 22px -10px color-mix(in srgb, ${tone} 85%, transparent)` : 'var(--nm-sm)',
        transition: 'background .24s, color .22s, box-shadow .24s',
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 30,
          height: 30,
          flex: '0 0 auto',
          borderRadius: '50%',
          color: lit ? tone : 'var(--text-dim)',
          background: lit ? '#fff' : 'var(--surface-2)',
          transition: 'background .24s, color .22s',
        }}
      >
        {icon ? (
          svg(icon, 16, 'currentColor', 1.8)
        ) : (
          <span style={{ fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{d.count ?? ''}</span>
        )}
      </span>
      {named && <span style={{ whiteSpace: 'nowrap' }}>{d.label}</span>}
      {/* the count is a badge beside the glyph, never the glyph itself */}
      {icon && d.count != null && (
        <span
          style={{
            marginLeft: named ? 0 : 4,
            marginRight: named ? 0 : 5,
            minWidth: 15,
            textAlign: 'center',
            fontSize: 10.5,
            fontWeight: 700,
            color: lit ? 'rgba(255,255,255,.9)' : 'var(--text-faint)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {d.count}
        </span>
      )}
    </button>
  );
}

export interface TabItem {
  value: string;
  label: ReactNode;
}

/** design: section-hero.jsx withTabIcons — DS Tabs labels enriched with a glyph. */
export const withTabIcons = (tabs: (string | TabItem)[]): TabItem[] =>
  (tabs || []).map((t) => {
    const it = typeof t === 'string' ? { value: t, label: t } : t;
    const text = typeof it.label === 'string' ? it.label : '';
    if (!text) return it;
    const hit = TAB_ICONS.find(([re]) => re.test(text.toLowerCase()));
    if (!hit) return it;
    return {
      ...it,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0 }}>
          {svg(hit[1], 14, 'currentColor', 1.8)}
          <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        </span>
      ),
    };
  });

export interface Priority {
  label: string;
  note?: ReactNode;
  id?: string;
  onClick?: () => void;
}

/**
 * design: section-hero.jsx PriorityRow — neutral glass at rest; on approach it takes the
 * section's colour whole and reverses its type, rank and chevron.
 */
export function PriorityRow({ p, i, tone }: { p: Priority; i: number; tone: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={() => (p.onClick ? p.onClick() : glideToId(p.id))}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
        padding: '11px 15px',
        borderRadius: 20,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        font: 'inherit',
        background: hov ? tone : 'color-mix(in srgb, var(--surface) 52%, transparent)',
        backdropFilter: hov ? 'none' : 'blur(16px)',
        WebkitBackdropFilter: hov ? 'none' : 'blur(16px)',
        boxShadow: hov ? `0 14px 30px -12px color-mix(in srgb, ${tone} 70%, transparent)` : 'inset 0 0 0 1px var(--glass-brd)',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: 'background .26s, box-shadow .26s, transform .26s var(--ease-portal)',
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 28,
          height: 28,
          flex: '0 0 auto',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: hov ? tone : 'var(--text-dim)',
          background: hov ? '#fff' : 'var(--surface-2)',
          transition: 'color .24s, background .24s',
        }}
      >
        {i + 1}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: '-.012em',
            color: hov ? '#fff' : 'var(--text)',
            transition: 'color .2s',
          }}
        >
          {p.label}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 3,
            fontSize: 11.5,
            fontWeight: 400,
            lineHeight: 1.5,
            color: hov ? 'rgba(255,255,255,.82)' : 'var(--text-dim)',
            transition: 'color .2s',
          }}
        >
          {p.note}
        </span>
      </span>
      {svg(<polyline points="9 6 15 12 9 18" />, 15, hov ? '#fff' : 'var(--text-faint)', 2)}
    </button>
  );
}

/** design: section-hero.jsx useCurrentPlace — which directory place is at the reading line. */
export function useCurrentPlace(dir: DirectoryPlace[]): string | null {
  const [at, setAt] = useState<string | null>(null);
  const key = dir.map((d) => d.id).join(',');
  useEffect(() => {
    const ids = key.split(',').filter(Boolean);
    if (!ids.length) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const line = (window.innerHeight || 800) * 0.38;
      let cur = ids[0] ?? null;
      ids.forEach((i) => {
        const el = document.getElementById(i);
        if (el && el.getBoundingClientRect().top <= line) cur = i;
      });
      setAt(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [key]);
  return at;
}
