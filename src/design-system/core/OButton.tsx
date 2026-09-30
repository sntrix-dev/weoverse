// design: js/ds/_ds_bundle.js components/core/OButton.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import type { ToneInput } from '../types';

export interface OButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: 'ghost' | 'raised' | 'solid';
  tone?: ToneInput;
  size?: number | string;
  active?: boolean;
  style?: CSSProperties;
}

/**
 * OButton — the circular icon control. Neumorphic surface that lifts on
 * raise, or a filled orb variant for the active/primary state.
 */
export function OButton({
  children,
  variant = 'ghost',
  tone = 'blue',
  size = 46,
  active = false,
  disabled = false,
  'aria-label': ariaLabel,
  style,
  ...rest
}: OButtonProps) {
  const TONES: Record<string, string> = {
    blue: '#3A95F2',
    violet: '#D946EF',
    green: '#22C55E',
    gold: '#F7C62B',
    danger: '#FF5A2C',
  };
  const c = TONES[tone] ?? tone;
  const px = typeof size === 'number' ? `${size}px` : size;
  const variants: Record<string, CSSProperties> = {
    ghost: {
      background: 'var(--surface-2)',
      boxShadow: 'var(--nm-sm)',
      color: 'var(--text-dim)',
    },
    raised: {
      background: 'var(--surface)',
      boxShadow: 'var(--nm-raised)',
      color: 'var(--text)',
    },
    solid: {
      background: `radial-gradient(circle at 37% 30%, color-mix(in srgb, ${c} 55%, #fff), ${c} 70%, color-mix(in srgb, ${c} 65%, #000))`,
      boxShadow: `0 0 0 4px color-mix(in srgb, ${c} 28%, transparent), inset 0 -4px 8px rgba(0,0,0,.25)`,
      color: '#fff',
    },
  };
  const activeStyle = active
    ? {
        background: `color-mix(in srgb, ${c} 14%, transparent)`,
        boxShadow: `0 0 0 3px color-mix(in srgb, ${c} 28%, transparent)`,
        color: c,
      }
    : {};
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        border: 'none',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform .12s var(--ease-standard), box-shadow .2s',
        ...(variants[variant] ?? variants.ghost),
        ...activeStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
