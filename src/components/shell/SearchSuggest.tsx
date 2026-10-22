import { useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { ICO, Icon } from '@/design-system';
import { SEARCH_MIN, useGlobalSearch, type GlobalSearchDto } from '@/features/shell/api/search';
import { formatOfKind } from '@/lib/circleModel';
import { compact, osFmt } from '@/lib/format';
import { openCreator } from '@/stores/flow';
import s from './SearchSuggest.module.css';

export interface Suggestion {
  id: string;
  title: string;
  sub: string;
  img: string | null;
  round: boolean;
  go: () => void;
}
interface Group {
  key: string;
  label: string;
  items: Suggestion[];
}

/** design limits per group: WeOs 4, Requests 4, Circles 3, Creators 3 */
const CAP = { weos: 4, requests: 4, circles: 3, creators: 3 } as const;
const cap1 = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** The search answer as the design's labelled groups, in its order; empty groups drop out. */
export function toGroups(r: GlobalSearchDto | undefined, go: (to: string) => void): Group[] {
  if (!r) return [];
  const weos: Suggestion[] = (r.weos ?? []).slice(0, CAP.weos).map((w) => ({
    id: `w-${w.id}`,
    title: w.title ?? '',
    // design: "Sell · O 2,400" — the format, then the price (the category when it has none)
    sub: [
      w.format ?? formatOfKind(w.weoType) ?? 'WeO',
      (w.priceOs ?? 0) > 0 ? `O ${osFmt(w.priceOs ?? 0)}` : w.categoryName,
    ]
      .filter(Boolean)
      .join(' · '),
    img: w.mediaUrl ?? null,
    round: false,
    go: () => go(routes.weo(String(w.id))),
  }));
  const requests: Suggestion[] = (r.requests ?? []).slice(0, CAP.requests).map((q) => {
    const b = q.budget;
    const range = b.min > 0 && b.min !== b.max;
    const budget = b.max > 0 ? (range ? `O ${osFmt(b.min)}–${osFmt(b.max)}` : `O ${osFmt(b.max)}`) : '';
    return {
      id: `r-${q.id}`,
      // stored lower-case (request.weo.model); said as a sentence
      title: cap1(q.title),
      sub: [q.mine ? 'Your request' : 'Request', q.categoryName && cap1(q.categoryName), budget]
        .filter(Boolean)
        .join(' · '),
      img: null,
      round: false,
      go: () => go(routes.requests(String(q.id))),
    };
  });
  const circles: Suggestion[] = (r.circles ?? []).slice(0, CAP.circles).map((c) => ({
    id: `c-${c.id}`,
    title: c.name,
    sub: `${compact(c.memberCount)} members`,
    img: c.coverImage || null,
    round: true,
    go: () => go(routes.circle(String(c.id))),
  }));
  const creators: Suggestion[] = (r.creators ?? []).slice(0, CAP.creators).map((p) => ({
    id: `p-${p.id}`,
    title: p.name ?? '',
    sub: [p.handle, p.isr != null ? `ISR ${p.isr}` : ''].filter(Boolean).join(' · '),
    img: p.avatarUrl ?? null,
    round: true,
    go: () => openCreator(String(p.id)),
  }));
  return (
    [
      { key: 'weos', label: 'WeOs', items: weos },
      { key: 'requests', label: 'Requests', items: requests },
      { key: 'circles', label: 'Circles', items: circles },
      { key: 'creators', label: 'Creators', items: creators },
    ] satisfies Group[]
  ).filter((g) => g.items.length);
}

/** where the typed part sits: the first match at the start of a word, else the first anywhere */
export function markAt(text: string, q: string): number {
  const t = q.trim().toLowerCase();
  if (!t) return -1;
  const low = text.toLowerCase();
  for (let i = low.indexOf(t); i >= 0; i = low.indexOf(t, i + 1)) {
    if (i === 0 || /[\s\-_/.,:;'"(&]/.test(low[i - 1]!)) return i;
  }
  return low.indexOf(t);
}

/** the typed part, marked where it matches (case-insensitive, a word start first) */
function Mark({ text, q }: { text: string; q: string }): ReactNode {
  const t = q.trim();
  const i = markAt(text, t);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className={s.mark}>{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </>
  );
}

/** waits for the typing to settle before it asks the server */
function useDebounced(v: string, ms = 180) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/**
 * design: chrome.jsx SearchSuggest (v4) — live suggestions under the top bar's search field:
 * WeOs · Requests · Circles · Creators, the typed part marked, ↑/↓ + Enter, and "See all
 * results". The field owns the keys (`useSearchSuggest`); this draws the panel.
 */
export function useSearchSuggest(q: string, onSearch: (q: string) => void) {
  const navigate = useNavigate();
  const term = useDebounced(q);
  const res = useGlobalSearch(term);
  const groups = useMemo(() => toGroups(res.data, (to) => void navigate(to)), [res.data, navigate]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const [idx, setIdx] = useState(0);
  const [prevQ, setPrevQ] = useState(q);
  if (prevQ !== q) {
    setPrevQ(q);
    setIdx(0);
  }
  const live = q.trim().length >= SEARCH_MIN;
  const settled = live && term.trim() === q.trim() && !res.isFetching;
  return {
    live,
    groups,
    flat,
    active: flat.length ? flat[Math.min(idx, flat.length - 1)] : undefined,
    empty: settled && !flat.length && !res.isError,
    setActive: (it: Suggestion) => setIdx(flat.indexOf(it)),
    /** true when the key was the panel's (the field then does nothing else) */
    key(e: { key: string; preventDefault: () => void }) {
      if (!live || !flat.length) return false;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => (i + 1) % flat.length);
        return true;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => (i - 1 + flat.length) % flat.length);
        return true;
      }
      if (e.key === 'Enter') {
        flat[Math.min(idx, flat.length - 1)]?.go();
        return true;
      }
      return false;
    },
    all: () => onSearch(q.trim()),
  };
}

export function SearchSuggestPanel({
  anchor,
  q,
  sg,
  onPick,
}: {
  anchor: RefObject<HTMLElement | null>;
  q: string;
  sg: ReturnType<typeof useSearchSuggest>;
  onPick: () => void;
}) {
  const [box, setBox] = useState<DOMRect | null>(null);
  useEffect(() => {
    const place = () => setBox(anchor.current?.getBoundingClientRect() ?? null);
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, { passive: true });
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place);
    };
  }, [anchor]);
  if (!sg.live || !box || (!sg.flat.length && !sg.empty)) return null;
  const w = Math.min(440, window.innerWidth - 24);
  const left = Math.max(12, Math.min(box.right - w, window.innerWidth - w - 12));
  const t = q.trim();
  return createPortal(
    <div
      id="weo-search-suggest"
      role="listbox"
      tabIndex={-1}
      aria-label="Search suggestions"
      className={s.panel}
      style={{ top: box.bottom + 10, left, width: w }}
      // keep the field focused while a row is pressed
      onMouseDown={(e) => e.preventDefault()}
    >
      {sg.empty && <p className={s.empty}>Nothing matches “{t}”.</p>}
      {sg.groups.map((g) => (
        <div key={g.key} className={s.group}>
          <p className={s.label}>{g.label}</p>
          {g.items.map((it) => {
            const on = sg.active?.id === it.id;
            return (
              <button
                key={it.id}
                id={`weo-sg-${it.id}`}
                type="button"
                role="option"
                aria-selected={on}
                className={s.row}
                data-on={on || undefined}
                onMouseEnter={() => sg.setActive(it)}
                onClick={() => {
                  onPick();
                  it.go();
                }}
              >
                <span
                  className={s.thumb}
                  data-round={it.round || undefined}
                  style={it.img ? { backgroundImage: `url("${encodeURI(it.img)}")` } : undefined}
                />
                <span className={s.text}>
                  <span className={s.title}>
                    <Mark text={it.title} q={t} />
                  </span>
                  <span className={s.sub}>{it.sub}</span>
                </span>
                {on && (
                  <Icon size={14} sw={2}>
                    <polyline points="9 6 15 12 9 18" />
                  </Icon>
                )}
              </button>
            );
          })}
        </div>
      ))}
      {sg.flat.length > 0 && (
        <button
          type="button"
          className={s.all}
          onClick={() => {
            onPick();
            sg.all();
          }}
        >
          <Icon size={15}>{ICO.search}</Icon>
          See all results for “{t}”
        </button>
      )}
    </div>,
    document.body,
  );
}
