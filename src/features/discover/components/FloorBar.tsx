import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { svg } from '@/design-system';
import { isIntroKey } from '@/components/intro/sections';
import { NoteBody, NoteDot, useNote } from '@/components/layout/Note';
import { useStuck } from '@/components/hero/FilterMenu';
import { replayIntro } from '@/stores/intro';
import s from './FloorBar.module.css';

/**
 * design: discover.jsx + app.css (v4) — the filter bar pinned under the nav at 62px. At rest it
 * is clear and shares its row with the hero pill; once pinned it turns frosted glass, widens
 * across the row and shows its pinned-only controls (`.weo-stuck-views`).
 */
export function StickyFilters({
  children,
  heroRef,
}: {
  children: ReactNode;
  heroRef?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stuck = useStuck(ref);
  const [ext, setExt] = useState(0);
  // design: a bar sharing its row with the hero widens to the full row while pinned
  useLayoutEffect(() => {
    const el = ref.current;
    const hero = heroRef?.current;
    if (!stuck || !el || !hero) {
      setExt(0);
      return;
    }
    const par = el.parentElement;
    if (!par) return;
    const ps = getComputedStyle(par);
    const inner = par.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
    const gap = parseFloat(ps.columnGap) || 0;
    const bw = el.getBoundingClientRect().width + ext;
    const hw = hero.getBoundingClientRect().width;
    setExt(bw + gap + hw <= inner + 2 ? hw + gap : 0);
    // ext is read, not followed: re-measuring on its own change would loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stuck, heroRef]);
  return (
    <div
      ref={ref}
      className={`weo-sticky-filters ${s.bar}`}
      data-stuck={stuck ? '' : undefined}
      style={{ marginRight: ext ? -ext : undefined }}
    >
      <div className={`weo-viewbar ${s.inner}`}>{children}</div>
    </div>
  );
}

export interface PillStat {
  value: string;
  label: string;
  title?: string;
}

/**
 * design: app.css "Discover hero: compact white pill on the filter row" (v4) — the hero shrinks
 * to a 44px pill of three figures, then the section's Intro replay and its note.
 */
export function HeroPill({
  id,
  title,
  tone,
  stats,
  lede,
  pillRef,
}: {
  id: string;
  title: string;
  tone: string;
  stats: PillStat[];
  lede?: ReactNode;
  pillRef?: React.Ref<HTMLElement>;
}) {
  const note = useNote();
  return (
    <section
      ref={pillRef}
      aria-label={title}
      className={`weo-hero ${s.pill}`}
      data-hero={id}
      style={{ '--t': tone } as CSSProperties}
    >
      {/* v4 hides the section's title; it stays the page's heading for assistive tech */}
      <h1 className={s.srOnly}>{title}</h1>
      <div data-hero-stats="1" className={s.stats}>
        {stats.map((x) => (
          <span key={x.label} className={s.stat} title={x.title}>
            <b className={s.statValue}>{x.value}</b>
            <span className={s.statLabel}>{x.label}</span>
          </span>
        ))}
      </div>
      <div className={s.mark}>
        {isIntroKey(id) && (
          <button
            type="button"
            onClick={() => replayIntro(id)}
            title={`Replay the ${title} intro`}
            aria-label={`Replay the ${title} intro`}
            className={s.intro}
          >
            <span className={s.introDisc}>
              {svg(<path d="M9 6.5v11l9-5.5z" fill="currentColor" />, 10, 'currentColor', 1.5)}
            </span>
            Intro
          </button>
        )}
        {lede && <NoteDot show={note.show} onClick={note.toggle} label={`What ${title} is`} />}
      </div>
      {lede && note.show && (
        <div className={s.note}>
          <NoteBody note={lede} show={note.show} size={13} width={46} />
        </div>
      )}
    </section>
  );
}
