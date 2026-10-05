import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { svg } from '@/design-system';
import { NoteBody, NoteDot, useNote } from '@/components/layout/Note';
import { glide, glideToId } from '@/lib/glide';
import {
  DirChip,
  HeroStat,
  placeIcon,
  PriorityRow,
  useCurrentPlace,
  type DirectoryPlace,
  type HeroStatItem,
  type Priority,
} from './HeroParts';
import { ViewBar } from './ViewBar';

/** design: section-hero.jsx useHeroOpen — the reveal remembers itself on this device. */
function useHeroOpen(id: string): [boolean, (v: boolean) => void] {
  const key = `weo.hero.${id}`;
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });
  return [
    open,
    (v) => {
      setOpen(v);
      try {
        localStorage.setItem(key, v ? '1' : '0');
      } catch {
        /* ignore */
      }
    },
  ];
}

export interface SectionHeroProps {
  id: string;
  tone?: string;
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
  sub?: ReactNode;
  lede?: ReactNode;
  stats?: HeroStatItem[];
  feature?: ReactNode;
  priorities?: Priority[];
  directory?: DirectoryPlace[];
  filters?: ReactNode;
  filterSummary?: ReactNode;
  actions?: ReactNode;
  /** an image URL (framed tile, or the bleed ground with `bleed`) or a node */
  art?: string | ReactNode;
  bleed?: boolean;
  bleedArt?: string;
  foot?: ReactNode;
}

/**
 * design: section-hero.jsx SectionHero — one snapshot per section: what it is, what matters
 * now, and the way into everything below it. Rest state holds only what you need to decide;
 * depth arrives on intent. Filters live here rather than scattered down the page.
 *
 * Until M11 the eyebrow mark is the section icon; the design's "Intro" replay chip arrives
 * with the section intros (`V3_SECTIONS`).
 */
export function SectionHero({
  id,
  tone,
  icon,
  eyebrow,
  title,
  sub,
  lede,
  stats,
  feature,
  priorities,
  directory,
  filters,
  filterSummary,
  actions,
  art,
  bleed,
  bleedArt,
  foot,
}: SectionHeroProps) {
  const [open, setOpen] = useHeroOpen(id);
  const note = useNote();
  const reveal = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = reveal.current;
    const vh = window.innerHeight;
    const glideTo = (y: number) => glide(window, Math.max(0, y));
    if (open && el) {
      /* meet the reveal: only travel if it is genuinely out of the reading band */
      const t = setTimeout(() => {
        const r = el.getBoundingClientRect();
        if (r.top > vh * 0.62) glideTo(r.top + window.scrollY - vh * 0.42);
      }, 90);
      return () => clearTimeout(t);
    }
    if (!open) {
      const host = document.querySelector(`[data-hero="${id}"]`);
      if (host) {
        const r = host.getBoundingClientRect();
        if (r.top < 0) glideTo(r.top + window.scrollY - 96);
      }
    }
  }, [open, id]);
  const t = tone || 'var(--o-violet)';
  const dir = directory || [];
  const here = useCurrentPlace(dir);
  /* Four places stay on the rail; the rest live behind one overflow button. */
  const [more, setMore] = useState(false);
  const [moreAt, setMoreAt] = useState<{ right: number; top: number; h: number } | null>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const shownDir = dir.slice(0, 4);
  const restDir = dir.slice(4);
  useEffect(() => {
    if (!more) return;
    const off = () => setMore(false);
    window.addEventListener('click', off);
    return () => window.removeEventListener('click', off);
  }, [more]);
  /* the reveal earns its toggle: no priorities, nothing to open */
  const hasMore = !!(priorities && priorities.length);
  const ground = bleedArt || (bleed && typeof art === 'string' ? art : null);
  const tile = art && !(bleed && typeof art === 'string');
  const go = (d: DirectoryPlace) => (d.onClick ? d.onClick() : glideToId(d.id));
  return (
    <section
      aria-label={title}
      className="weo-hero"
      data-hero={id}
      data-open={open ? '1' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginTop: 14,
        borderRadius: 30,
        padding: 'clamp(14px,1.7vw,20px)',
        background: 'var(--glass)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: `var(--shadow-card), var(--nm-raised), inset 0 1px 0 rgba(255,255,255,.42), inset 0 0 0 1px var(--glass-brd), inset 0 0 0 2px color-mix(in srgb, ${t} 10%, transparent)`,
      }}
    >
      {ground && (
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <img
            src={ground}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(100deg, var(--surface) 6%, color-mix(in srgb, var(--surface) 86%, transparent) 44%, color-mix(in srgb, var(--surface) 54%, transparent))',
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(190deg, transparent 40%, color-mix(in srgb, ${t} 22%, transparent))`,
            }}
          />
        </span>
      )}
      {!ground && (
        <span
          aria-hidden="true"
          className="weo-hero-bloom"
          style={{
            background: `radial-gradient(circle, color-mix(in srgb, ${t} 34%, transparent), transparent 68%)`,
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: 'clamp(12px,1.6vw,20px)',
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            {icon && (
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: `color-mix(in srgb, ${t} 13%, var(--surface))`,
                }}
              >
                {svg(icon, 14, t, 1.8)}
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              {eyebrow}
            </span>
            {/* the why is contextual, not persistent: the dot invites, the note arrives */}
            {lede && <NoteDot show={note.show} onClick={note.toggle} label={`What ${title} is`} />}
          </span>
          <h1
            style={{
              margin: '10px 0 0',
              fontSize: 'clamp(25px,3.1vw,38px)',
              color: 'var(--text)',
              textWrap: 'pretty',
            }}
          >
            {title}
          </h1>
          {sub && <div style={{ marginTop: 7 }}>{sub}</div>}
          {lede && <NoteBody note={lede} show={note.show} size={13} width={56} />}
        </div>
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            maxWidth: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            gap: 12,
          }}
        >
          <div
            style={{
              flex: '1 1 0',
              // a zero basis lets a short feature (the passport balance) squeeze this column to
              // nothing on a phone; a floor makes the feature wrap onto its own line instead
              minWidth: 'min(100%, 260px)',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            {/* the figures ride at the top of the hero as ONE rail — segmented cells in an inset groove */}
            {stats && stats.length > 0 && (
              <div
                data-hero-stats="1"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  alignItems: 'stretch',
                  gap: 5,
                  padding: 5,
                  maxWidth: '100%',
                  borderRadius: 20,
                  background: 'var(--surface-2)',
                  boxShadow: 'var(--nm-inset), inset 0 0 0 1px var(--border)',
                }}
              >
                {stats.map((s) => (
                  <HeroStat key={s.label} s={s} tone={t} />
                ))}
              </div>
            )}
            <div
              className="weo-scroll-hide"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
                marginTop: 'auto',
                maxWidth: '100%',
              }}
            >
              {shownDir.map((d) => (
                <DirChip
                  key={d.id || d.label}
                  d={d}
                  tone={t}
                  active={!!d.id && d.id === here}
                  onClick={() => go(d)}
                />
              ))}
              {restDir.length > 0 && (
                <span
                  style={{ position: 'relative' }}
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <button
                    ref={moreBtn}
                    type="button"
                    onClick={() => {
                      const r = moreBtn.current!.getBoundingClientRect();
                      const h = Math.min(restDir.length * 44 + 12, window.innerHeight * 0.6);
                      const below = r.bottom + 8;
                      const flip = below + h > window.innerHeight - 12;
                      setMoreAt({
                        right: Math.max(12, window.innerWidth - r.right),
                        top: flip ? Math.max(12, r.top - 8 - h) : below,
                        h,
                      });
                      setMore((m) => !m);
                    }}
                    aria-expanded={more}
                    aria-label={`${restDir.length} more places in this section`}
                    title="Everywhere else in this section"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      minHeight: 40,
                      padding: '0 13px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      font: 'inherit',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: more ? '#fff' : 'var(--text-dim)',
                      background: more ? t : 'var(--surface)',
                      boxShadow: more ? 'none' : 'var(--nm-sm)',
                      transition: 'background .22s, color .2s',
                    }}
                  >
                    {svg(
                      <>
                        <circle cx="5" cy="12" r="1.6" />
                        <circle cx="12" cy="12" r="1.6" />
                        <circle cx="19" cy="12" r="1.6" />
                      </>,
                      15,
                      'currentColor',
                      2,
                    )}
                    {restDir.length}
                  </button>
                  {more &&
                    moreAt &&
                    createPortal(
                      <span
                        onClick={(e) => e.stopPropagation()}
                        role="menu"
                        tabIndex={-1}
                        onKeyDown={(e) => e.key === 'Escape' && setMore(false)}
                        style={{
                          position: 'fixed',
                          right: moreAt.right,
                          top: moreAt.top,
                          zIndex: 2500,
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: 232,
                          maxHeight: '60vh',
                          overflowY: 'auto',
                          padding: 6,
                          borderRadius: 20,
                          background: 'var(--surface)',
                          boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--border)',
                          animation: 'weo-cardin .22s var(--ease-portal) both',
                        }}
                      >
                        {restDir.map((d) => {
                          const pi = placeIcon(d);
                          return (
                            <button
                              key={d.id || d.label}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMore(false);
                                go(d);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 9,
                                width: '100%',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                                font: 'inherit',
                                borderRadius: 14,
                                padding: '9px 11px',
                                background: 'transparent',
                              }}
                            >
                              <span
                                style={{
                                  display: 'grid',
                                  placeItems: 'center',
                                  width: 26,
                                  height: 26,
                                  flex: '0 0 auto',
                                  borderRadius: '50%',
                                  color: t,
                                  background: `color-mix(in srgb, ${t} 11%, var(--surface-2))`,
                                }}
                              >
                                {pi ? (
                                  svg(pi, 14, 'currentColor', 1.8)
                                ) : (
                                  <span style={{ fontSize: 10.5, fontWeight: 700 }}>{d.count ?? ''}</span>
                                )}
                              </span>
                              <span
                                style={{
                                  minWidth: 0,
                                  flex: 1,
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  color: 'var(--text)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {d.label}
                              </span>
                              {d.count != null && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--text-faint)',
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  {d.count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </span>,
                      document.body,
                    )}
                </span>
              )}
              {actions}
              {/* the view controls belong with the other controls — never a band of their own */}
              {(filters || filterSummary) && (
                <ViewBar bare tone={t} filters={filters} summary={filterSummary} />
              )}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  aria-expanded={open}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    minHeight: 40,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 700,
                    color: open ? '#fff' : t,
                    background: open ? t : `color-mix(in srgb, ${t} 11%, var(--surface))`,
                    boxShadow: open ? 'none' : 'var(--nm-sm)',
                    transition: 'background .24s, color .24s',
                  }}
                >
                  {open ? 'Less' : 'More'}
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      transform: open ? 'rotate(180deg)' : 'none',
                      transition: 'transform .3s var(--ease-portal)',
                    }}
                  >
                    {svg(<polyline points="6 9 12 15 18 9" />, 13, 'currentColor', 2.2)}
                  </span>
                </button>
              )}
            </div>
          </div>
          {feature}
          {/* imagery as a framed tile — glass edge over a neumorphic well, colour only on the rim */}
          {tile && (
            <span
              className="weo-hero-art"
              aria-hidden={typeof art === 'string' ? 'true' : undefined}
              style={
                typeof art !== 'string'
                  ? { position: 'relative', display: 'grid', placeItems: 'center', flex: '0 0 auto' }
                  : {
                      position: 'relative',
                      display: 'block',
                      width: 'clamp(168px, 21vw, 248px)',
                      aspectRatio: '16 / 10',
                      borderRadius: 22,
                      overflow: 'hidden',
                      flex: '0 0 auto',
                      background: 'var(--surface-2)',
                      boxShadow: `var(--nm-inset), inset 0 0 0 1px var(--glass-brd), 0 0 0 1px color-mix(in srgb, ${t} 22%, transparent)`,
                    }
              }
            >
              {typeof art === 'string' ? (
                <>
                  <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(160deg, transparent 40%, color-mix(in srgb, ${t} 26%, transparent))`,
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.34)',
                    }}
                  />
                </>
              ) : (
                art
              )}
            </span>
          )}
        </div>
      </div>

      {/* critical content (charts, rails, decks) never sits on the bleed art directly: a glass panel grounds it */}
      {foot && (
        <div
          className="weo-hero-foot"
          style={{
            position: 'relative',
            marginTop: 18,
            padding: 14,
            borderRadius: 24,
            background: 'color-mix(in srgb, var(--surface) 84%, transparent)',
            backdropFilter: 'blur(14px) saturate(1.1)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
            boxShadow: 'inset 0 0 0 1px var(--glass-brd)',
          }}
        >
          {foot}
        </div>
      )}

      {open && hasMore && (
        <div
          ref={reveal}
          className="weo-reveal"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            marginTop: 20,
            padding: 'clamp(14px,1.6vw,20px)',
            borderRadius: 26,
            background: `color-mix(in srgb, ${t} 7%, var(--surface-2))`,
            boxShadow: 'inset 0 0 0 1px var(--glass-brd)',
          }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {(typeof art === 'string' || bleedArt) && (
              <img
                src={bleedArt || (art as string)}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 34%',
                  opacity: 0.62,
                  filter: 'saturate(1.12)',
                }}
              />
            )}
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--surface) 66%, transparent) 0%, color-mix(in srgb, var(--surface) 82%, transparent) 100%)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(120% 90% at 88% 6%, color-mix(in srgb, ${t} 40%, transparent), transparent 62%)`,
              }}
            />
          </span>
          {priorities && priorities.length > 0 && (
            <div>
              <p style={{ margin: '0 0 11px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.15em',
                    textTransform: 'uppercase',
                    color: 'var(--text)',
                    background: 'var(--glass)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: 'inset 0 0 0 1px var(--glass-brd)',
                  }}
                >
                  Worth your attention
                </span>
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,270px),1fr))',
                  gap: 10,
                }}
              >
                {priorities.map((p, i) => (
                  <PriorityRow key={p.label} p={p} i={i} tone={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
