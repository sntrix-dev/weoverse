// design: js/ds/_ds_bundle.js components/motion/PortalJump.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { StyleVars } from '../types';

export type PortalJumpNode = ReactNode | { icon: ReactNode; label?: ReactNode };

export interface PortalJumpProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  /** change this counter/key to fire the motion */
  play?: number | string;
  color?: string;
  variant?: 'jump' | 'complete' | 'message';
  label?: ReactNode;
  nodes?: PortalJumpNode[];
  duration?: number;
  onDone?: () => void;
  style?: CSSProperties;
}

const isIconNode = (n: PortalJumpNode): n is { icon: ReactNode; label?: ReactNode } =>
  typeof n === 'object' && n !== null && 'icon' in n;

/**
 * PortalJump — WeO's signature motion, extracted into one reusable primitive
 * so every transition, completion and message feels identical. It plays a
 * burst of five concentric section-colored rings (the helloweo
 * PortalSuccessAnimation config: scale .42→1.85, .06s stagger, easeOut) with
 * an optional radial clip-path wipe in the section color.
 *
 * Fire it by changing `play` (a counter/key). Variants:
 *   'jump'      — rings + full radial wipe (section-to-section navigation)
 *   'complete'  — rings + wipe + a centred check / label (collect / post done)
 *   'message'   — rings + a soft scrim + centred label (alerts & completions)
 *
 * `nodes` — optional array of section-relevant icons (React nodes, or
 * { icon, label }). On a 'jump'/'complete' they assemble out of the centre O
 * into a concentric ring (the helloweo multi-network "posting" config), so the
 * transition previews what the section holds instead of showing a text title.
 */
const RING_COUNT = 5;
export function PortalJump({
  play = 0,
  color = '#3A95F2',
  variant = 'jump',
  label,
  nodes,
  duration = 900,
  onDone,
  style,
  ...rest
}: PortalJumpProps) {
  const [active, setActive] = useState(false);
  const prev = useRef(play);
  // the latest onDone, without restarting the jump when the parent re-renders
  const done = useEffectEvent(() => onDone?.());
  useEffect(() => {
    if (play === prev.current) return;
    prev.current = play;
    setActive(true);
    const t = window.setTimeout(() => {
      setActive(false);
      done();
    }, duration);
    return () => window.clearTimeout(t);
  }, [play, duration]);
  if (!active) return null;
  const wipe = variant === 'jump' || variant === 'complete';
  const dark = `color-mix(in srgb, ${color} 88%, #06122e)`;
  const hasNodes = Array.isArray(nodes) && nodes.length > 0;
  const ring = (i: number) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '52%',
        aspectRatio: '1',
        borderRadius: '50%',
        border: `2px solid ${color}`,
        boxShadow: `0 0 20px ${color}`,
        transform: 'translate(-50%,-50%) scale(.42)',
        opacity: 0,
        animation: `weo-ring-burst .8s ${(i * 0.06).toFixed(2)}s cubic-bezier(0,0,.2,1) forwards`,
      }}
    />
  );
  const nodeRing = (nodes: PortalJumpNode[]) => {
    const S = 300,
      R = 118,
      cx = S / 2,
      cy = S / 2,
      N = nodes.length;
    const pos = (i: number) => {
      const a = (i / N) * 2 * Math.PI - Math.PI / 2;
      return {
        a,
        x: cx + Math.cos(a) * R,
        y: cy + Math.sin(a) * R,
      };
    };
    return (
      <div
        style={{
          position: 'absolute',
          width: S,
          height: S,
          zIndex: 4,
          pointerEvents: 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${S} ${S}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          {nodes.map((_, i) => {
            const p = pos(i);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="1.5"
                strokeDasharray={R}
                strokeDashoffset={R}
                style={{
                  animation: `weo-spoke .5s ${(0.12 + i * 0.05).toFixed(2)}s cubic-bezier(.22,1,.36,1) forwards`,
                }}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: 66,
            height: 66,
            marginLeft: -33,
            marginTop: -33,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 10px 26px rgba(8,22,55,.4)',
            display: 'grid',
            placeItems: 'center',
            animation: 'weo-pop .45s both',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: `3.5px solid ${color}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: color,
              }}
            />
          </div>
        </div>
        {nodes.map((nd, i) => {
          const p = pos(i);
          const icon = isIconNode(nd) ? nd.icon : nd;
          const lbl = isIconNode(nd) ? nd.label : undefined;
          return (
            <div
              key={i}
              style={
                {
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  width: 48,
                  height: 48,
                  marginLeft: -24,
                  marginTop: -24,
                  borderRadius: '50%',
                  background: '#fff',
                  color,
                  boxShadow: '0 8px 18px rgba(8,22,55,.32)',
                  display: 'grid',
                  placeItems: 'center',
                  ['--tx']: `${(cx - p.x).toFixed(1)}px`,
                  ['--ty']: `${(cy - p.y).toFixed(1)}px`,
                  animation: `weo-node-pop .55s ${(0.18 + i * 0.06).toFixed(2)}s cubic-bezier(.22,1,.36,1) both`,
                } as StyleVars
              }
            >
              {icon}
              {lbl && (
                <span
                  style={{
                    position: 'absolute',
                    top: 52,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: '.02em',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 6px rgba(8,22,55,.55)',
                    animation: `weo-pop .4s ${(0.3 + i * 0.06).toFixed(2)}s both`,
                  }}
                >
                  {lbl}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      {...rest}
    >
      {wipe && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${dark}, ${color})`,
            animation: `weo-portal-wipe ${Math.round(duration * 0.55)}ms cubic-bezier(.25,.46,.45,.94) forwards`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          {variant === 'complete' && (
            <div
              style={{
                fontSize: 44,
                lineHeight: 1,
                animation: 'weo-pop .4s .2s both',
                textShadow: '0 2px 12px rgba(8,22,55,.5)',
              }}
            >
              ✓
            </div>
          )}
          {label && !hasNodes && (
            <div
              style={{
                fontWeight: 700,
                fontSize: 20,
                marginTop: 8,
                letterSpacing: '-.01em',
                textShadow: '0 2px 12px rgba(8,22,55,.5)',
              }}
            >
              {label}
            </div>
          )}
        </div>
      )}
      {wipe && hasNodes && nodes && nodeRing(nodes)}
      {variant === 'message' && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${color} 26%, transparent), transparent 72%)`,
            }}
          />
          {label && (
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                maxWidth: '80%',
                textAlign: 'center',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '-.01em',
                textShadow: '0 1px 8px var(--surface)',
                animation: 'weo-pop .45s cubic-bezier(.22,1,.36,1) both',
              }}
            >
              {label}
            </div>
          )}
        </>
      )}
      {Array.from({
        length: RING_COUNT,
      }).map((_, i) => ring(i))}
    </div>
  );
}
