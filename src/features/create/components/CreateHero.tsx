// design: create.jsx CreateHero — the O is the chooser. Eight formats ride the ring; the centre is the
// one shared readout that names whatever is pointed at. Drafts and templates fold into the docks.
import { useEffect, useRef, useState } from 'react';
import type { DraftDto } from '@/features/community/api/community';
import type { TemplateDto } from '../api/create';
import {
  CREATE_MEDIA,
  CREATE_TEMPLATES,
  MAKE_EDGES,
  createTone,
  type CreateFormatDef,
  type EdgeDir,
  type MakeEdge,
} from '../model/formats';
import { HeroDocks } from './HeroDocks';
import { FormatOrb, FormatReadout } from './HeroRing';
import { MakeDonut, MakeWell, edgeAt, useLook, Headline } from './MakeO';

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode */
    }
  },
};

export interface CreateHeroProps {
  dark: boolean;
  drafts: DraftDto[];
  templates: TemplateDto[];
  asks: number;
  onPick: (t: CreateFormatDef) => void;
  onBlank: () => void;
  onDraft: (d: DraftDto) => void;
  onTemplate: (tp: TemplateDto) => void;
  onLocked: (tp: TemplateDto) => void;
  onAllTemplates: () => void;
  onEdge: (e: MakeEdge) => void;
  onAsks: () => void;
  onTrack: () => void;
  toast: (msg: string) => void;
}

export function CreateHero(p: CreateHeroProps) {
  const [hov, setHov] = useState<number | null>(null);
  const [peek, setPeek] = useState(-1);
  // the O is also the media well: the edge under the pointer plays its stage in the hole
  const [edge, setEdge] = useState<EdgeDir | null>(null);
  const [voicedRaw, setVoiced] = useState(false);
  // leaving the edges mutes it again
  const voiced = voicedRaw && !!edge;
  const [centerHov, setCenterHov] = useState(false);
  // the format orbs arrive by orbiting the O once, then settle into their places
  const [orbsGo, setOrbsGo] = useState(false);
  const [settled, setSettled] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [glimpse, setGlimpse] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOrbsGo(true), 250);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!orbsGo) return;
    const t0 = setTimeout(() => setEngaged(true), 0);
    const t = setTimeout(() => setSettled(true), 3400);
    return () => {
      clearTimeout(t0);
      clearTimeout(t);
    };
  }, [orbsGo]);
  // once engaged, the modules arrive open — a glimpse of what each holds — then fold to rest
  useEffect(() => {
    if (!engaged) return;
    const t1 = setTimeout(() => setGlimpse(true), 1400);
    const t2 = setTimeout(() => setGlimpse(false), 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [engaged]);
  // a settled hover: a leave only lands after a beat, so crossing the gap between orbs cannot flicker
  const leaveT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hovIn = (i: number) => {
    clearTimeout(leaveT.current);
    setHov(i);
  };
  const hovOut = (i: number) => {
    clearTimeout(leaveT.current);
    leaveT.current = setTimeout(() => setHov((h) => (h === i ? null : h)), 140);
  };
  useEffect(() => () => clearTimeout(leaveT.current), []);
  useEffect(() => {
    // the preview drifts in and out rather than flicking between stills
    let n = 0;
    const t = setInterval(() => {
      n = (n + 1) % (CREATE_MEDIA.length + 1);
      setPeek(n - 1);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const [size, setSize] = useState(420);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fit = () => {
      if (!box.current) return;
      // the O takes the room the frame can give it; below 900px the docks sit under it
      const sec = box.current.closest('section');
      const stacked = window.innerWidth <= 900;
      const room = Math.min(
        sec ? (stacked ? sec.clientWidth - 40 : sec.clientWidth - 2 * (230 + 24) - 40) : window.innerWidth,
        (sec ? sec.clientHeight : window.innerHeight) - 2 * (stacked ? 150 : 130),
      );
      const v = Math.round(Math.max(300, Math.min(520, room)));
      setSize(v - (v % 2));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const orb = size < 400 ? 54 : 62;
  const [myaSeen, setMyaSeen] = useState(() => store.get('wv.myaMakeSeen') === '1');
  const k = Math.min(1, (size - 2 * (orb + 16)) / 306);
  // on approach the tube swells outward into a dimensional border around the media
  const D0 = Math.round(306 * k * (centerHov ? 1.1 : 1));
  const D = D0 - (D0 % 2);
  const h0 = Math.round(220 * k * (centerHov ? 1.06 : 1));
  const hole = h0 - (h0 % 2);
  const cx = size / 2;
  const cy = size / 2;
  const R = (306 * k) / 2 + orb / 2 + 14;

  // CRE-12 · Notify me: a blocked format remembers that you asked (this device only, D-054)
  const [notify, setNotify] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(store.get('wv.notifySoon') ?? '{}') as Record<string, boolean>;
    } catch {
      return {};
    }
  });
  const askNotify = (tp: CreateFormatDef) => {
    const was = !!notify[tp.key];
    const x = { ...notify, [tp.key]: !was };
    setNotify(x);
    store.set('wv.notifySoon', JSON.stringify(x));
    p.toast(was ? `No longer watching ${tp.label}` : `We’ll tell you when ${tp.label} goes live`);
  };
  const pickOrNotify = (tp: CreateFormatDef) => (tp.soon ? askNotify(tp) : p.onPick(tp));
  const t = hov != null ? CREATE_TEMPLATES[hov]! : null;
  const live = t ? null : edge ? MAKE_EDGES[edge] : null;
  const tone = t ? createTone(t.key) : live ? live.tone : 'var(--o-green)';
  const goEdge = () => {
    if (!live) return;
    if (live.key === 'create') p.onBlank();
    else p.onEdge(live);
  };
  const oRef = useRef<HTMLDivElement>(null);
  const look = useLook(oRef, !!(live || t));

  return (
    <section
      aria-label="Make a WeO"
      className="weo-hero"
      style={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        minHeight: 'calc(100vh - 128px)',
        marginTop: 16,
        borderRadius: 32,
        padding: 'clamp(16px,2vw,26px)',
        background: 'var(--glass)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        boxShadow: `var(--shadow-card), var(--nm-raised), inset 0 1px 0 rgba(255,255,255,.42), inset 0 0 0 1px var(--glass-brd), inset 0 0 0 2px color-mix(in srgb, ${tone} 10%, transparent)`,
        transition: 'box-shadow .4s',
      }}
    >
      <span
        aria-hidden="true"
        className="weo-hero-bloom"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${tone} 34%, transparent), transparent 68%)`,
          transition: 'background .4s',
        }}
      />
      <Headline />
      <div
        className="weo-create-grid"
        style={{ position: 'relative', zIndex: 4, display: 'grid', placeItems: 'center' }}
      >
        <div
          ref={box}
          className="weo-create-ring"
          style={{ minWidth: 0, display: 'grid', placeItems: 'center' }}
        >
          <div ref={oRef} style={{ position: 'relative', width: size, height: size, perspective: 900 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                transform: `rotateX(${look.rx}deg) rotateY(${look.ry}deg) scale(${live || t ? 1.02 : engaged ? 1 : 0.9})`,
                transition: engaged
                  ? 'transform .28s cubic-bezier(.25,.6,.3,1)'
                  : 'transform .9s var(--ease-portal)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: (size - D) / 2,
                  transition: 'inset .4s var(--ease-portal)',
                }}
              >
                <MakeDonut size={D} hole={hole} live={live} looking={look.active} />
              </span>
              {/* the four edges of the O, one live target — press to voice the clip, press again to go */}
              <button
                type="button"
                aria-label={
                  live
                    ? `${live.label} — press to ${voiced ? 'enter' : 'voice it'}`
                    : 'The four stages of a WeO — approach an edge'
                }
                onMouseMove={(e) => {
                  const d = edgeAt(e, e.currentTarget, hole / 2);
                  setEdge((prev) => (prev === d ? prev : d));
                }}
                onMouseLeave={() => setEdge(null)}
                onClick={() => {
                  if (!live) return;
                  if (voiced) goEdge();
                  else setVoiced(true);
                }}
                style={{
                  position: 'absolute',
                  inset: (size - D) / 2,
                  borderRadius: '50%',
                  border: 'none',
                  padding: 0,
                  cursor: live ? 'pointer' : 'default',
                  background: 'transparent',
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: cx - R,
                  top: cy - R,
                  width: R * 2,
                  height: R * 2,
                  borderRadius: '50%',
                  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--border) 60%, transparent)',
                  pointerEvents: 'none',
                }}
              />
              {/* the centre: one readout for whatever is pointed at, and the way in */}
              <button
                type="button"
                onClick={() =>
                  t ? pickOrNotify(t) : live ? (voiced ? goEdge() : setVoiced(true)) : p.onBlank()
                }
                onFocus={() => setHov(null)}
                onTouchStart={() => setCenterHov(true)}
                onMouseEnter={() => {
                  setEdge(null);
                  setCenterHov(true);
                }}
                onMouseLeave={() => {
                  setCenterHov(false);
                  if (!myaSeen) {
                    setMyaSeen(true);
                    store.set('wv.myaMakeSeen', '1');
                  }
                }}
                aria-label={
                  t
                    ? t.label
                    : live
                      ? `${live.label} — press to ${voiced ? 'enter' : 'voice it'}`
                      : 'Start from anything — or pick a format on the ring'
                }
                style={{
                  position: 'absolute',
                  left: (size - hole) / 2,
                  top: (size - hole) / 2,
                  width: hole,
                  height: hole,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  gap: 4,
                  padding: 0,
                  textAlign: 'center',
                  overflow: 'hidden',
                  background: t
                    ? `radial-gradient(64% 58% at 32% 24%, color-mix(in srgb, ${tone} 22%, #fff) 0%, ${tone} 52%, color-mix(in srgb, ${tone} 72%, #000) 100%)`
                    : 'var(--surface)',
                  boxShadow: t
                    ? `inset 0 -14px 34px -14px rgba(8,10,18,.55), inset 0 12px 30px -12px rgba(255,255,255,.6), 0 26px 60px -24px color-mix(in srgb, ${tone} 78%, transparent)`
                    : 'var(--nm-inset)',
                  transition:
                    'box-shadow .5s var(--ease-settle), background .5s var(--ease-settle), width .5s var(--ease-portal), height .5s var(--ease-portal), left .5s var(--ease-portal), top .5s var(--ease-portal)',
                }}
              >
                {t ? (
                  <FormatReadout t={t} hole={hole} tone={tone} notified={!!notify[t.key]} />
                ) : (
                  <MakeWell
                    size={hole}
                    live={live}
                    voiced={voiced}
                    peek={peek}
                    dark={p.dark}
                    intro={centerHov && !myaSeen}
                    onVoice={() => setVoiced(!voiced)}
                    onGo={goEdge}
                  />
                )}
              </button>
              {CREATE_TEMPLATES.map((tp, i) => (
                <FormatOrb
                  key={tp.key}
                  tp={tp}
                  i={i}
                  count={CREATE_TEMPLATES.length}
                  cx={cx}
                  cy={cy}
                  R={R}
                  orb={orb}
                  on={hov === i}
                  orbsGo={orbsGo}
                  settled={settled}
                  glimpse={glimpse}
                  notified={!!notify[tp.key]}
                  onEnter={() => hovIn(i)}
                  onLeave={() => hovOut(i)}
                  onFocus={() => setHov(i)}
                  onBlur={() => setHov((h) => (h === i ? null : h))}
                  onClick={() => pickOrNotify(tp)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {engaged && <HeroDocks {...p} glimpse={glimpse} />}
    </section>
  );
}
