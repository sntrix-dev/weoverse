// design: js/ds/_ds_bundle.js components/core/Button.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { pick, type ToneInput } from '../types';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  tone?: ToneInput;
  size?: ButtonSize;
  dot?: boolean;
  selected?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: CSSProperties;
}

/**
 * Button — the WeO pill. Baseline is a neutral neumorphic container with
 * dimensional depth (raised drop-shadow) and regular-weight neutral text. On
 * hover or when `selected`, the color-coded state fills in and the label
 * reverses to bold white. Containers run generous relative to the label.
 * Section color drives the selected tone via `tone`; a leading dot is the
 * house accent (tone-colored at rest, white when active).
 */
export function Button({
  children,
  variant = 'primary',
  tone = 'blue',
  size = 'md',
  dot = false,
  selected = false,
  disabled = false,
  leading,
  trailing,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const on = (hover || selected) && !disabled;
  const TONES: Record<string, string> = {
    blue: '#3A95F2',
    violet: '#D946EF',
    green: '#22C55E',
    gold: '#F7C62B',
    danger: '#FF5A2C',
  };
  const c = pick(TONES, tone, tone);
  const fill = `linear-gradient(180deg, color-mix(in srgb, ${c} 88%, #fff), ${c})`;

  // Generous containers — padding is roomy relative to the label.
  const sizes: Record<string, { pad: string; fs: number }> = {
    sm: {
      pad: '10px 22px',
      fs: 13,
    },
    md: {
      pad: '15px 30px',
      fs: 15,
    },
    lg: {
      pad: '18px 38px',
      fs: 16,
    },
  };
  const s = sizes[size] ?? sizes.md!;
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: s.pad,
    borderRadius: 999,
    fontFamily: 'var(--font-sans)',
    fontWeight: on ? 700 : 450,
    fontSize: s.fs,
    letterSpacing: on ? '0' : '.005em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    transform: on ? 'translateY(-1px)' : 'none',
    transition:
      'transform .14s var(--ease-standard), box-shadow .22s, background .22s, color .18s, font-weight .18s',
  };

  // Baseline for every variant: neutral neumorphic pill with dimensional
  // depth. The tone only appears on hover / selected.
  const neutralBase: CSSProperties = {
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--nm-sm)',
  };
  const variants: Record<string, { base: CSSProperties; hover: CSSProperties }> = {
    primary: {
      base: neutralBase,
      hover: {
        color: '#fff',
        background: fill,
        border: '1px solid transparent',
        boxShadow: `0 14px 30px -10px color-mix(in srgb, ${c} 70%, transparent)`,
      },
    },
    secondary: {
      base: neutralBase,
      hover: {
        color: 'var(--surface)',
        background: 'var(--text)',
        border: '1px solid var(--text)',
        boxShadow: 'var(--nm-raised)',
      },
    },
    ghost: {
      base: neutralBase,
      hover: {
        color: '#fff',
        background: fill,
        border: '1px solid transparent',
        boxShadow: `0 12px 26px -12px color-mix(in srgb, ${c} 65%, transparent)`,
      },
    },
    destructive: {
      base: neutralBase,
      hover: {
        color: '#fff',
        background: 'linear-gradient(180deg, #ff7a52, #FF5A2C)',
        border: '1px solid transparent',
        boxShadow: '0 14px 30px -10px rgba(255,90,44,.6)',
      },
    },
  };
  const v = variants[variant] ?? variants.primary!;
  const skin: CSSProperties = disabled
    ? {
        color: 'var(--text-faint)',
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
        border: '1px solid transparent',
        opacity: 0.6,
      }
    : on
      ? v.hover
      : v.base;
  const restDot = variant === 'destructive' ? '#FF5A2C' : c;
  const dotColor = disabled
    ? 'var(--text-faint)'
    : on
      ? variant === 'secondary'
        ? 'var(--surface)'
        : '#fff'
      : restDot;
  return (
    <button
      disabled={disabled}
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        onMouseLeave?.(e);
      }}
      style={{
        ...base,
        ...skin,
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            transition: 'background .18s',
          }}
        />
      )}
      {leading}
      {children}
      {trailing}
    </button>
  );
}
