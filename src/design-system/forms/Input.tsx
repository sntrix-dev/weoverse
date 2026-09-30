// design: js/ds/_ds_bundle.js components/forms/Input.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'prefix'> {
  label?: ReactNode;
  error?: ReactNode;
  tone?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  style?: CSSProperties;
}

/**
 * Input — an inset "well". Focus rides a 2px section-color inset ring;
 * error is the starter-red. Neumorphic well background.
 */
export function Input({
  label,
  error,
  disabled = false,
  tone = '#3A95F2',
  prefix,
  suffix,
  style,
  ...rest
}: InputProps) {
  const ring = error ? '#FF5A2C' : tone;
  return (
    <label
      style={{
        display: 'block',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: error ? '#FF5A2C' : 'var(--text-dim)',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 15px',
          borderRadius: 'var(--radius-well)',
          background: disabled ? 'var(--surface-2)' : 'var(--surface)',
          boxShadow: disabled
            ? 'none'
            : error || rest.autoFocus
              ? `inset 0 0 0 2px ${ring}`
              : 'var(--nm-inset)',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {prefix && (
          <span
            style={{
              color: 'var(--text-faint)',
              display: 'flex',
            }}
          >
            {prefix}
          </span>
        )}
        <input
          disabled={disabled}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            fontSize: 14,
            color: 'var(--text)',
            minWidth: 0,
            ...style,
          }}
          onFocus={(e) => {
            const well = e.currentTarget.parentElement;
            if (!error && !disabled && well) well.style.boxShadow = `inset 0 0 0 2px ${ring}`;
          }}
          onBlur={(e) => {
            const well = e.currentTarget.parentElement;
            if (!error && !disabled && well) well.style.boxShadow = 'var(--nm-inset)';
          }}
          {...rest}
        />
        {suffix && (
          <span
            style={{
              color: 'var(--text-faint)',
              display: 'flex',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && typeof error === 'string' && (
        <div
          style={{
            fontSize: 11,
            color: '#FF5A2C',
            marginTop: 5,
          }}
        >
          {error}
        </div>
      )}
    </label>
  );
}
