import type { ReactNode } from 'react';

/**
 * design: v3-spine.jsx StageRing — five segments, filled to the stage; the current segment
 * breathes while the community holds it.
 */
export function StageRing({
  size,
  index,
  fill,
  tone,
  band,
  children,
  waiting,
}: {
  size: number;
  /** 0–4: the current stage */
  index: number;
  /** 0–1: progress through the current stage */
  fill?: number;
  tone: string;
  band?: number;
  children?: ReactNode;
  waiting?: boolean;
}) {
  const S = size;
  const R = S / 2;
  const b = band || Math.max(4, Math.round(S * 0.055));
  const r = R - b / 2 - 1;
  const n = 5;
  const gapDeg = 9;
  const seg = 360 / n - gapDeg;
  const p = (a: number) => [R + r * Math.cos(((a - 90) * Math.PI) / 180), R + r * Math.sin(((a - 90) * Math.PI) / 180)];
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: S, height: S }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => {
          const a0 = i * (360 / n) + gapDeg / 2;
          const a1 = a0 + seg;
          const done = i < index;
          const cur = i === index;
          const f = cur ? Math.max(0, Math.min(1, fill || 0)) : 0;
          return (
            <g key={i}>
              <path d={arc(a0, a1)} fill="none" stroke="var(--surface-3)" strokeWidth={b} strokeLinecap="round" />
              {done && <path d={arc(a0, a1)} fill="none" stroke={tone} strokeWidth={b} strokeLinecap="round" />}
              {cur && f > 0 && (
                <path
                  d={arc(a0, a0 + seg * f)}
                  fill="none"
                  stroke={tone}
                  strokeWidth={b}
                  strokeLinecap="round"
                  style={{ transition: 'd .6s var(--ease-portal)' }}
                />
              )}
              {cur && waiting && (
                <path
                  d={arc(a0, a1)}
                  fill="none"
                  stroke={tone}
                  strokeWidth={b}
                  strokeLinecap="round"
                  opacity=".28"
                  style={{ animation: 'weo3-pulse 3.4s ease-in-out infinite' }}
                />
              )}
            </g>
          );
        })}
      </svg>
      <span style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>{children}</span>
    </span>
  );
}
