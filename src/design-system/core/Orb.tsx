// design: js/ds/_ds_bundle.js components/core/Orb.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface OrbProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  size?: number | string;
  /** 'blue' (default sphere) | any CSS colour | 'logo' | 'image' */
  fill?: string;
  src?: string | null;
  logoSrc?: string;
  ring?: boolean;
  ringColor?: string;
  tint?: string;
  matcap?: boolean;
  label?: ReactNode;
  breathe?: boolean;
  highlight?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Orb — the signature WeO sphere. A separate material from neumorphism:
 * radial light + depth, with a specular highlight. Optionally wrapped in a
 * neutral donut ring (the "O") carrying a section-color tint + hairline.
 *
 * fill: 'blue' (default sphere) | any css color | 'logo' | 'image'
 *
 * matcap: wraps the sphere in a baked glass shell (specular + fresnel rim) so
 * it reads as a 3D object on a flat screen — the standard app/web treatment.
 * In AR/spatial UIs the orb is real geometry and the matcap is unnecessary.
 * label: centered content (a value or short message) for section-coded orbs
 * that carry a field instead of a WeO media preview.
 */
export function Orb({
  size = 120,
  fill = 'blue',
  src,
  logoSrc = '/brand/weo-logo-light.png',
  ring = false,
  ringColor = '#3A95F2',
  tint,
  matcap = false,
  label,
  breathe = false,
  highlight = true,
  style,
  children,
  ...rest
}: OrbProps) {
  const px = typeof size === 'number' ? `${size}px` : size;
  const blueSphere = 'radial-gradient(circle at 37% 28%, #ffffff, #cfe0fb 42%, #8fb8f6 78%, #5f97ef)';
  const isNamedBlue = fill === 'blue';
  const sphereBg =
    isNamedBlue || fill === 'logo' || fill === 'image'
      ? blueSphere
      : `radial-gradient(circle at 37% 28%, #ffffff, ${fill} 62%, color-mix(in srgb, ${fill} 60%, #000) 100%)`;
  const orbShadow =
    '0 16px 36px -10px rgba(58,120,240,.55), inset 0 -12px 22px rgba(58,110,230,.4), inset 5px 7px 12px rgba(255,255,255,.85)';
  const inset = ring ? Math.round(parseFloat(px) * 0.11) : 0;
  const labelBase = fill !== 'blue' && fill !== 'logo' && fill !== 'image' ? fill : '#3A95F2';
  const sphere = (
    <div
      style={{
        position: 'absolute',
        inset: ring ? `${inset}px` : 0,
        borderRadius: '50%',
        overflow: 'hidden',
        background: sphereBg,
        boxShadow: orbShadow,
        animation: breathe ? 'weo-breathe-sm 5s ease-in-out infinite' : undefined,
      }}
    >
      {fill === 'logo' && (
        <img
          src={logoSrc}
          alt=""
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '56%',
            transform: 'translate(-50%,-50%)',
            filter: 'drop-shadow(0 2px 5px rgba(10,30,80,.4))',
          }}
        />
      )}
      {fill === 'image' && src && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      {label != null && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: `radial-gradient(circle at 50% 56%, ${labelBase} 0%, color-mix(in srgb, ${labelBase} 55%, transparent) 55%, transparent 78%)`,
          }}
        />
      )}
      {matcap && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 30% 24%, rgba(255,255,255,.9), rgba(255,255,255,0) 40%), radial-gradient(circle at 72% 82%, rgba(255,255,255,.28), rgba(255,255,255,0) 48%)',
            boxShadow:
              'inset 7px 9px 18px rgba(255,255,255,.5), inset -11px -15px 28px rgba(8,22,55,.42), inset 0 0 0 1px rgba(255,255,255,.4)',
          }}
        />
      )}
      {matcap && (
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '20%',
            height: '11%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.95)',
            filter: 'blur(1.5px)',
            transform: 'rotate(-28deg)',
            pointerEvents: 'none',
          }}
        />
      )}
      {label != null && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#fff',
            fontWeight: 700,
            lineHeight: 1.1,
            padding: '0 12%',
            fontSize: Math.round(parseFloat(px) * 0.19),
            textShadow: '0 1px 6px rgba(8,22,55,.45)',
            pointerEvents: 'none',
          }}
        >
          {label}
        </div>
      )}
      {highlight && !matcap && (
        <div
          style={{
            position: 'absolute',
            top: '16%',
            left: '22%',
            width: '26%',
            height: '13%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.8)',
            filter: 'blur(3px)',
            transform: 'rotate(-30deg)',
          }}
        />
      )}
      {children}
    </div>
  );
  return (
    <div
      style={{
        position: 'relative',
        width: px,
        height: px,
        flex: 'none',
        ...style,
      }}
      {...rest}
    >
      {breathe && (
        <div
          style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ring ? ringColor : isNamedBlue ? '#3A95F2' : fill}, transparent 62%)`,
            opacity: 0.24,
            filter: 'blur(11px)',
            animation: 'weo-breathe 5s ease-in-out infinite',
          }}
        />
      )}
      {ring ? (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'var(--surface)',
              boxShadow: 'var(--nm-raised)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: tint || `color-mix(in srgb, ${ringColor} 14%, transparent)`,
              WebkitMask: 'radial-gradient(circle at 50% 50%, transparent 80%, #000 80.6%)',
              mask: 'radial-gradient(circle at 50% 50%, transparent 80%, #000 80.6%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              boxShadow: `inset 0 0 0 2px ${ringColor}`,
              opacity: 0.55,
            }}
          />
          {sphere}
        </>
      ) : (
        sphere
      )}
    </div>
  );
}
