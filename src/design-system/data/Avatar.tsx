// design: js/ds/_ds_bundle.js components/data/Avatar.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { Children } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  src?: string | null;
  initials?: string;
  size?: number | string;
  /** 0–100; draws the ISR ring when set */
  isr?: number | null;
  tone?: string;
  style?: CSSProperties;
}

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  children?: ReactNode;
  extra?: number;
  size?: number;
  style?: CSSProperties;
}

/**
 * Avatar — image, initials, or ISR-ringed. `group` stacks children with overlap.
 */
export function Avatar({ src, initials, size = 48, isr, tone = '#17C3D6', style, ...rest }: AvatarProps) {
  const px = typeof size === 'number' ? `${size}px` : size;
  const inner = src ? (
    <img
      src={src}
      alt=""
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#3A95F2,#7db0f5)',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: parseFloat(px) * 0.34,
      }}
    >
      {initials}
    </div>
  );
  if (isr != null) {
    const deg = (isr / 100) * 360;
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from -90deg, ${tone} ${deg}deg, var(--surface-3) 0)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 3,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid var(--surface)',
          }}
        >
          {inner}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        overflow: 'hidden',
        flex: 'none',
        boxShadow: 'var(--nm-sm)',
        border: '2px solid var(--surface)',
        ...style,
      }}
      {...rest}
    >
      {inner}
    </div>
  );
}

/** AvatarGroup — overlapping stack; `extra` renders a +N chip. */
export function AvatarGroup({ children, extra, size = 34, style, ...rest }: AvatarGroupProps) {
  const items = Children.toArray(children);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
      {...rest}
    >
      {items.map((ch, i) => (
        <div
          key={i}
          style={{
            marginLeft: i === 0 ? 0 : -10,
          }}
        >
          {ch}
        </div>
      ))}
      {extra != null && (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'var(--surface-2)',
            border: '2px solid var(--surface)',
            marginLeft: -10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-dim)',
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
