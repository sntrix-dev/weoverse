import type { CSSProperties } from 'react';
import { OMark, Orb } from '@/design-system';
import { osFmt } from '@/lib/format';
import type { WorldDef } from '../model/sim';

/** A WeO on the stage (design `markers`): its orb, where it stands, how large. */
export interface StageMarker {
  id: string;
  name: string;
  type: string;
  img: string | null;
  os: number;
  tone: string;
  subject: boolean;
  provisional: boolean;
  wx: number;
  wz: number;
  size: number;
}

const BLOCKS = [
  { x: -760, z: -120, w: 150, h: 210 },
  { x: -560, z: -320, w: 175, h: 300 },
  { x: -350, z: -80, w: 130, h: 150 },
  { x: -140, z: -420, w: 190, h: 360 },
  { x: 90, z: -180, w: 150, h: 235 },
  { x: 300, z: -360, w: 165, h: 285 },
  { x: 520, z: -120, w: 140, h: 175 },
  { x: 720, z: -330, w: 180, h: 250 },
  { x: -960, z: -420, w: 160, h: 320 },
  { x: 940, z: -200, w: 150, h: 195 },
];
/** where the six markers stand on the flat stage (design `spots`) */
export const STAGE_SPOTS = [
  [-520, -30, 84],
  [-215, -230, 80],
  [95, -95, 86],
  [365, -280, 78],
  [-690, -170, 76],
  [560, -40, 82],
] as const;

function Box({ b, fid }: { b: (typeof BLOCKS)[number]; fid: number }) {
  const lit = fid >= 4;
  const textured = fid >= 3;
  const massing = fid >= 2;
  const d = Math.round(b.w * 0.8);
  const face = (extra: CSSProperties): CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    backfaceVisibility: 'hidden',
    ...extra,
  });
  const windows: CSSProperties | null = textured
    ? {
        backgroundImage: `linear-gradient(color-mix(in srgb, var(--world-ink) ${lit ? 34 : 22}%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--world-ink) ${lit ? 34 : 22}%, transparent) 1px, transparent 1px)`,
        backgroundSize: '18px 26px',
      }
    : null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformStyle: 'preserve-3d',
        transform: `translate3d(${b.x}px, 220px, ${b.z}px)`,
      }}
    >
      <div
        style={face({
          width: b.w,
          height: b.h,
          marginLeft: -b.w / 2,
          marginTop: -b.h,
          transform: `translateZ(${d / 2}px)`,
          background: lit
            ? 'linear-gradient(180deg, color-mix(in srgb, var(--world-built) 88%, var(--world-key)), var(--world-built))'
            : 'var(--world-built)',
          boxShadow: lit ? 'inset 0 -30px 50px -30px rgba(0,0,0,.45)' : 'none',
        })}
      >
        {windows && (
          <span style={{ position: 'absolute', inset: 0, opacity: lit ? 0.55 : 0.4, ...windows }} />
        )}
      </div>
      {massing && (
        <div
          style={face({
            width: d,
            height: b.h,
            marginLeft: -d / 2,
            marginTop: -b.h,
            transform: `translateX(${b.w / 2}px) rotateY(90deg)`,
            background: 'var(--world-built-2)',
            filter: lit ? 'brightness(.82)' : 'none',
          })}
        >
          {windows && <span style={{ position: 'absolute', inset: 0, opacity: 0.28, ...windows }} />}
        </div>
      )}
      {fid >= 2 && (
        <div
          style={face({
            width: b.w * 1.5,
            height: d * 1.6,
            marginLeft: -b.w * 0.75,
            marginTop: -d * 0.8,
            transform: 'rotateX(90deg)',
            borderRadius: '50%',
            background: 'rgba(12,24,52,.28)',
            filter: 'blur(10px)',
          })}
        />
      )}
    </div>
  );
}

/** design: world.jsx WorldStage — the flat stage; stands in when WebGL is missing. */
export function WorldStage({
  world,
  fid,
  markers,
  hoverId,
  onHover,
}: {
  world: WorldDef;
  fid: number;
  markers: StageMarker[];
  hoverId: string | null;
  onHover: (id: string | null) => void;
}) {
  const lit = fid >= 4;
  const hov = markers.find((m) => m.id === hoverId);
  const blocks = BLOCKS.slice(0, fid <= 1 ? 6 : BLOCKS.length);
  return (
    <div
      data-world={world.theme}
      style={{
        position: 'relative',
        flex: '1 1 auto',
        minHeight: 320,
        maxHeight: 560,
        overflow: 'hidden',
        borderRadius: 26,
        boxShadow: 'inset 0 0 0 1px var(--border)',
        background:
          'radial-gradient(130% 96% at 50% 4%, var(--world-sky) 0%, var(--world-sky-2) 46%, var(--world-fog) 100%)',
        perspective: '560px',
        perspectiveOrigin: '50% 20%',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: fid <= 1 ? 0.5 : 0.3,
          backgroundImage:
            'radial-gradient(color-mix(in srgb, var(--world-ink) 26%, transparent) 1px, transparent 1px)',
          backgroundSize: `${fid <= 1 ? 22 : 32}px ${fid <= 1 ? 22 : 32}px`,
          WebkitMaskImage: 'radial-gradient(120% 80% at 50% 42%, #000 12%, transparent 72%)',
          maskImage: 'radial-gradient(120% 80% at 50% 42%, #000 12%, transparent 72%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: '38%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, color-mix(in srgb, var(--world-ink) 22%, transparent) 22%, color-mix(in srgb, var(--world-ink) 22%, transparent) 78%, transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '18%',
          right: '18%',
          top: '30%',
          height: '18%',
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--world-key) 70%, transparent), transparent 78%)',
          filter: 'blur(26px)',
          opacity: lit ? 0.8 : 0.45,
          pointerEvents: 'none',
        }}
      />
      {lit && (
        <div
          style={{
            position: 'absolute',
            left: '22%',
            top: '-16%',
            width: '52%',
            height: '54%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--world-key), transparent 66%)',
            opacity: 0.5,
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '38%',
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(14deg) translateZ(-90px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -1600,
            top: -1600,
            width: 3200,
            height: 3200,
            transform: 'translateY(220px) rotateX(90deg)',
            background: 'linear-gradient(180deg, var(--world-ground) 0%, var(--world-ground-2) 100%)',
            backgroundImage: `radial-gradient(color-mix(in srgb, var(--world-ink) ${fid <= 1 ? 20 : 11}%, transparent) 2px, transparent 2px)`,
            backgroundSize: `${fid <= 1 ? 80 : 130}px ${fid <= 1 ? 80 : 130}px`,
            boxShadow: 'inset 0 0 220px color-mix(in srgb, var(--world-fog) 60%, transparent)',
          }}
        />
        {blocks.map((b, i) => (
          <Box key={i} b={b} fid={fid} />
        ))}
        {markers.map((m) => {
          const on = hoverId === m.id;
          return (
            <div
              key={m.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transformStyle: 'preserve-3d',
                transform: `translate3d(${m.wx}px, 220px, ${m.wz}px)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -m.size * 0.75,
                  top: -m.size * 0.4,
                  width: m.size * 1.5,
                  height: m.size * 0.9,
                  transform: 'rotateX(90deg)',
                  borderRadius: '50%',
                  background: 'rgba(12,24,52,.32)',
                  filter: 'blur(7px)',
                }}
              />
              <button
                onMouseEnter={() => onHover(m.id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onHover(m.id)}
                title={`${m.name} · ${m.type}${m.provisional ? ' · provisional' : ''}`}
                style={{
                  position: 'absolute',
                  left: -m.size / 2,
                  top: -m.size - 14,
                  width: m.size,
                  height: m.size,
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  transform: `scale(${on ? 1.12 : 1})`,
                  transition: 'transform .3s var(--ease-portal)',
                }}
              >
                <Orb
                  size={m.size}
                  fill={m.img ? 'image' : m.tone}
                  src={m.img ?? undefined}
                  ring
                  ringColor={m.tone}
                  matcap
                  breathe={on}
                />
                {m.provisional && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: '50%',
                      border: '1.5px dashed var(--o-violet)',
                      animation: 'weo-orbit 24s linear infinite',
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--world-fog) 78%, transparent) 0%, color-mix(in srgb, var(--world-fog) 30%, transparent) 30%, transparent 52%, transparent 76%, color-mix(in srgb, var(--world-fog) 46%, transparent) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 18,
          bottom: 16,
          right: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 999,
          background: 'var(--glass)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: 'inset 0 0 0 1px var(--glass-brd)',
          opacity: hov ? 1 : 0.55,
          transition: 'opacity .25s',
        }}
      >
        {hov ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{hov.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{hov.type}</span>
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <OMark size={12} /> {osFmt(hov.os)}
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: 11.5,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'var(--text-faint)',
            }}
          >
            {world.name} · fidelity {fid} · {markers.length} live WeOs
          </span>
        )}
      </div>
    </div>
  );
}
