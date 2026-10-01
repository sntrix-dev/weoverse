import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { OMark, Orb, PortalJump, svg } from '@/design-system';
import { osFmt } from '@/lib/format';

/*
 * design: screens-flows.jsx — the pieces every flow sheet shares: the portal stage, the
 * negotiation dial, the stage rail and the one success moment. Ported with the design's
 * inline styles (D-027). The dial's "likelihood" colour reads the range the quote returns.
 */

/** What the dial travels between. design `V` */
export interface DialRange {
  label: ReactNode;
  pre?: 'O';
  unit?: string;
  min: number;
  max: number;
  /** the band where an offer starts to hold (design lo/hi) */
  lo: number;
  hi: number;
  step?: number;
  /** a set price: the dial renders at rest and its controls are inert */
  fixed?: boolean;
}

export const oddsWord = (L: number) =>
  L < 0.2
    ? 'Very unlikely'
    : L < 0.4
      ? 'Unlikely'
      : L < 0.6
        ? 'Even odds'
        : L < 0.82
          ? 'Likely'
          : 'Very likely';

export const likeOf = (V: DialRange, v: number) => {
  if (V.fixed) return 1;
  if (v <= V.lo) return Math.max(0.04, (0.5 * (v - V.min)) / Math.max(1, V.lo - V.min));
  if (v <= V.hi) return 0.5 + (0.45 * (v - V.lo)) / Math.max(1, V.hi - V.lo);
  return Math.min(1, 0.95 + (0.05 * (v - V.hi)) / Math.max(1, V.max - V.hi));
};

const warmTone = (tone: string, L: number) =>
  `color-mix(in srgb, ${tone} ${Math.round(22 + L * 78)}%, var(--surface-3))`;

export const snapTo = (V: DialRange, v: number) =>
  Math.max(V.min, Math.min(V.max, Math.round(v / (V.step || 1)) * (V.step || 1)));

/** one motion signature: the tube contracts, the aperture blooms — every stage change */
export function PortalStage({
  size,
  stage,
  children,
}: {
  size: number;
  stage: string;
  children?: ReactNode;
}) {
  const band = Math.round(size * 0.075);
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <span
        key={`ring-${stage}`}
        className="weo-portal-tube"
        style={
          {
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            boxSizing: 'border-box',
            border: `${band}px solid var(--surface-2)`,
            boxShadow: 'var(--nm-hero)',
            pointerEvents: 'none',
            '--tube': `${band}px`,
            '--tube-open': `${Math.round(band * 2.1)}px`,
          } as CSSProperties
        }
      />
      <span
        key={`ap-${stage}`}
        className="weo-portal-aperture"
        style={{ position: 'relative', display: 'grid', placeItems: 'center', opacity: 1, transform: 'none' }}
      >
        {children}
      </span>
    </span>
  );
}

const stepBtn: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-sm)',
  color: 'var(--text-dim)',
  fontSize: 17,
  lineHeight: 1,
  display: 'grid',
  placeItems: 'center',
};

/** the negotiation dial — colour IS the threshold; the seller's numbers stay theirs */
export function Dial({
  V,
  cur,
  onValue,
  tone,
  size,
  commit,
}: {
  V: DialRange;
  cur: number;
  onValue: (v: number) => void;
  tone: string;
  size?: number;
  commit?: ReactNode;
}) {
  const S = size || 300;
  const R = S / 2;
  const band = Math.round(S * 0.105);
  const ro = R - 2;
  const ri = ro - band;
  const L = likeOf(V, cur);
  const hot = warmTone(tone, L);
  const frac = (cur - V.min) / Math.max(1, V.max - V.min);
  const deg = Math.max(6, frac * 350);
  const mask = `radial-gradient(circle closest-side at 50% 50%, transparent ${(ri / R) * 100}%, #000 ${(ri / R) * 100 + 0.6}%, #000 ${(ro / R) * 100}%, transparent ${(ro / R) * 100 + 0.6}%)`;
  const ref = useRef<HTMLSpanElement>(null);
  const setFromPoint = (x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const a = Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2));
    const d = (((a * 180) / Math.PI + 90 + 360) % 360) as number;
    onValue(snapTo(V, V.min + (d / 350) * (V.max - V.min)));
  };
  const drag = (e: ReactPointerEvent) => {
    e.preventDefault();
    setFromPoint(e.clientX, e.clientY);
    const mv = (ev: PointerEvent) => setFromPoint(ev.clientX, ev.clientY);
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  };
  const step = V.step || 1;
  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'grid', placeItems: 'center', width: S, height: S }}
    >
      <span
        onPointerDown={V.fixed ? undefined : drag}
        role={V.fixed ? undefined : 'slider'}
        tabIndex={V.fixed ? undefined : 0}
        aria-label={typeof V.label === 'string' ? V.label : 'Value'}
        aria-valuenow={V.fixed ? undefined : cur}
        aria-valuemin={V.fixed ? undefined : V.min}
        aria-valuemax={V.fixed ? undefined : V.max}
        onKeyDown={
          V.fixed
            ? undefined
            : (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onValue(snapTo(V, cur + step));
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onValue(snapTo(V, cur - step));
              }
        }
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxSizing: 'border-box',
          border: `${band}px solid var(--surface-2)`,
          boxShadow: 'var(--nm-hero)',
          cursor: V.fixed ? 'default' : 'grab',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          WebkitMaskImage: mask,
          maskImage: mask,
          background: `conic-gradient(from 0deg, ${hot} 0deg ${deg}deg, transparent ${deg}deg)`,
          filter: `drop-shadow(0 3px 10px color-mix(in srgb, ${hot} 34%, transparent))`,
          transition: 'background .3s, filter .3s',
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          width: S - band * 2 - 26,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.13em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          {V.label}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!V.fixed && (
            <button
              type="button"
              aria-label="Less"
              onClick={() => onValue(snapTo(V, cur - step))}
              style={stepBtn}
            >
              −
            </button>
          )}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: V.pre ? 27 : 34,
              fontWeight: 700,
              letterSpacing: '-.035em',
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {V.pre === 'O' && <OMark size={20} />}
            {osFmt(cur)}
            {V.unit || ''}
          </span>
          {!V.fixed && (
            <button
              type="button"
              aria-label="More"
              onClick={() => onValue(snapTo(V, cur + step))}
              style={stepBtn}
            >
              +
            </button>
          )}
        </span>
        {!V.fixed && (
          <span style={{ marginTop: 2, fontSize: 11.5, fontWeight: 700, letterSpacing: '.04em', color: hot }}>
            {oddsWord(L)}
          </span>
        )}
        {commit && <span style={{ marginTop: 10 }}>{commit}</span>}
      </span>
    </span>
  );
}

/** design FLOW_STEPS */
export const FLOW_STEPS = [
  { k: 'card', label: 'Card' },
  { k: 'deal', label: 'Terms' },
  { k: 'commit', label: 'Review' },
  { k: 'done', label: 'Done' },
] as const;
export type FlowStage = (typeof FLOW_STEPS)[number]['k'];

export function StageRail({ stage, tone }: { stage: FlowStage; tone: string }) {
  const at = FLOW_STEPS.findIndex((s) => s.k === stage);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {FLOW_STEPS.map((s, i) => (
        <span key={s.k} style={{ display: 'contents' }}>
          {i > 0 && (
            <span
              style={{
                flex: 1,
                height: 1,
                background: i <= at ? tone : 'var(--border)',
                transition: 'background .4s',
              }}
            />
          )}
          <span title={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: i === at ? 8 : 6,
                height: i === at ? 8 : 6,
                borderRadius: '50%',
                background: i <= at ? tone : 'var(--surface-3)',
                transition: 'all .3s var(--ease-portal)',
              }}
            />
            {i === at && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: tone,
                }}
              >
                {s.label}
              </span>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * ONE success moment for the four key events — the portal fires, the WeO's own O lands in the
 * centre, the verb names what just happened and one pill says where it went.
 */
export function SuccessMoment({
  tone,
  verb,
  name,
  img,
  dest,
  destTone,
  onDone,
  ms = 1900,
}: {
  tone: string;
  verb: string;
  name: string;
  img?: string | null;
  dest?: string;
  destTone?: string;
  onDone: () => void;
  ms?: number;
}) {
  const [phase, setPhase] = useState(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 380);
    const t2 = setTimeout(() => setPhase(2), ms - 320);
    const t3 = setTimeout(() => done.current(), ms);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [ms]);
  const dt = destTone || tone;
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-label={`${verb} · ${name}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'grid',
        placeItems: 'center',
        background: 'color-mix(in srgb, var(--surface) 72%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation:
          phase === 2
            ? 'weo-fadein .32s var(--ease-standard) reverse both'
            : 'weo-fadein .28s var(--ease-standard) both',
      }}
    >
      {/* a tap anywhere moves on (design: the overlay's own onClick) */}
      <button
        type="button"
        aria-label="Continue"
        onClick={() => done.current()}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 'min(460px, 94vw)',
          height: 380,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <PortalJump play={1} color={tone} variant="jump" duration={1000} />
        {phase >= 1 && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              textAlign: 'center',
              animation: 'weo-emerge .7s var(--ease-portal) both',
            }}
          >
            <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: -14,
                  borderRadius: '50%',
                  border: `2px solid ${tone}`,
                  animation: 'weo-ripple 1.1s var(--ease-portal) .2s both',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: -6,
                  bottom: -6,
                  display: 'grid',
                  placeItems: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  color: '#fff',
                  background: tone,
                  boxShadow: `0 0 0 3px var(--surface), 0 10px 22px -10px ${tone}`,
                  animation: 'weo-pop .5s var(--ease-portal) .35s both',
                  zIndex: 2,
                }}
              >
                {svg(<path d="M5 12.5l4.2 4.2L19 7" />, 18, 'currentColor', 2.6)}
              </span>
              <Orb size={128} fill={img ? 'image' : tone} src={img} ring ringColor={tone} matcap breathe />
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: tone,
              }}
            >
              {verb}
            </span>
            <span
              style={{
                fontSize: 'clamp(22px,3vw,30px)',
                fontWeight: 700,
                letterSpacing: '-.035em',
                lineHeight: 1.05,
                color: 'var(--text)',
                textWrap: 'balance',
                maxWidth: '18ch',
              }}
            >
              {name}
            </span>
            {dest && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 36,
                  padding: '0 14px 0 10px',
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#fff',
                  background: dt,
                  boxShadow: `0 12px 26px -10px ${dt}`,
                  animation: 'weo-cardin .5s var(--ease-portal) .45s both',
                }}
              >
                {svg(<path d="M5 12h14M13 6l6 6-6 6" />, 14, 'currentColor', 2.2)}
                {dest}
              </span>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
