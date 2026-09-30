// design: js/ds/_ds_bundle.js components/forms/Toggle.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { ButtonHTMLAttributes, CSSProperties } from 'react';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'onChange'> {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  tone?: string;
  style?: CSSProperties;
}

/** Toggle — a pill switch. On = filled section color, inset track when off. */
export function Toggle({
  checked = false,
  onChange,
  tone = '#3A95F2',
  disabled = false,
  style,
  ...rest
}: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        border: 'none',
        padding: 0,
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flex: 'none',
        opacity: disabled ? 0.5 : 1,
        background: checked ? tone : 'var(--surface-2)',
        boxShadow: checked ? `inset 0 1px 3px color-mix(in srgb, ${tone} 60%, #000)` : 'var(--nm-inset)',
        transition: 'background .2s',
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: checked ? '#fff' : 'var(--surface)',
          boxShadow: checked ? '0 2px 5px rgba(0,0,0,.3)' : 'var(--nm-sm)',
          transition: 'left .2s var(--ease-standard)',
        }}
      />
    </button>
  );
}
