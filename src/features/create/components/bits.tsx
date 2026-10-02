// design: create.jsx Stepper, InlineText, InlineNum, V3ModRing; screens-create.jsx cField
import { useState, type CSSProperties } from 'react';
import { StageRing } from '@/components/weo/StageRing';
import { OMark } from '@/design-system';
import { osFmt } from '@/lib/format';

export const cMicro: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '.15em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};

export const cField: CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: 13,
  padding: '11px 14px',
  fontSize: 13.5,
  color: 'var(--text)',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-sm)',
  outline: 'none',
};

/** digits only → a whole number ≥ 0 */
export const digits = (v: string) => Math.max(0, Number(v.replace(/\D/g, '')) || 0);

export function Stepper({ v, set, min }: { v: number; set: (n: number) => void; min?: number }) {
  const b: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    background: 'var(--surface)',
    boxShadow: 'var(--nm-sm)',
    color: 'var(--text-dim)',
    fontSize: 16,
    lineHeight: 1,
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => set(Math.max(min ?? 0, v - 1))} style={b} aria-label="Less">
        −
      </button>
      <b
        style={{
          minWidth: 34,
          textAlign: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {v}
      </b>
      <button type="button" onClick={() => set(v + 1)} style={b} aria-label="More">
        +
      </button>
    </span>
  );
}

/** the WeO edits itself: type on it */
export function InlineText({
  value,
  onChange,
  placeholder,
  style,
  area,
  invalid,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  style?: CSSProperties;
  area?: boolean;
  invalid?: boolean;
  label?: string;
}) {
  const [hov, setHov] = useState(false);
  const [foc, setFoc] = useState(false);
  const base: CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: foc || hov ? 'var(--surface)' : 'transparent',
    // a hairline at rest so the field reads as a field; red while it is required and empty
    boxShadow: invalid
      ? 'inset 0 0 0 1.5px var(--weo-req, #FF5A2C)'
      : foc
        ? 'var(--nm-raised), inset 0 0 0 1px var(--weo-field-line)'
        : hov
          ? 'var(--nm-sm), inset 0 0 0 1px var(--weo-field-line)'
          : 'inset 0 0 0 1px var(--weo-field-line)',
    borderRadius: 14,
    padding: '4px 10px',
    color: 'var(--text)',
    font: 'inherit',
    letterSpacing: 'inherit',
    textAlign: 'inherit',
    transition: 'background .22s, box-shadow .22s',
  };
  const common = {
    value,
    placeholder: foc ? '' : placeholder,
    'aria-label': label ?? placeholder,
    className: invalid ? 'weo-req-miss' : undefined,
    'aria-invalid': invalid ? true : undefined,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    onFocus: () => setFoc(true),
    onBlur: () => setFoc(false),
  };
  return area ? (
    <textarea
      {...common}
      rows={2}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...base, resize: 'none', lineHeight: 1.5, ...style }}
    />
  ) : (
    <input {...common} onChange={(e) => onChange(e.target.value)} style={{ ...base, ...style }} />
  );
}

/** …and set its numbers on it */
export function InlineNum({
  value,
  onChange,
  pre,
  label,
  tone,
  invalid,
}: {
  value: number;
  onChange: (n: number) => void;
  pre: string;
  label: string;
  tone: string;
  invalid?: boolean;
}) {
  const [foc, setFoc] = useState(false);
  const shown = osFmt(value);
  return (
    <span
      className={invalid ? 'weo-req-miss' : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 16,
        padding: '7px 13px',
        background: 'var(--surface)',
        boxShadow: invalid
          ? 'var(--nm-sm), inset 0 0 0 1.5px var(--weo-req, #FF5A2C)'
          : foc
            ? `var(--nm-raised), inset 0 0 0 1.5px color-mix(in srgb, ${tone} 46%, transparent)`
            : 'var(--nm-sm)',
        transition: 'box-shadow .22s',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {pre === 'O' && <OMark size={13} />}
        <input
          value={shown}
          inputMode="numeric"
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          onChange={(e) => onChange(digits(e.target.value))}
          aria-label={label}
          style={{
            width: Math.max(34, shown.length * 9 + 6),
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'inherit',
          }}
        />
      </span>
      <span
        style={{
          marginTop: 2,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        {label}
      </span>
    </span>
  );
}

/** design: v3-spine.jsx V3ModRing — the composer's own progress, the first segment filling */
export function ModRing({ done, total, tone }: { done: number; total: number; tone: string }) {
  return (
    <span title={`${done} of ${total} set`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <StageRing size={30} index={0} fill={total ? done / total : 0} tone={tone} band={4}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: done === total ? tone : 'var(--surface-3)',
          }}
        />
      </StageRing>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-faint)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {done}/{total}
      </span>
    </span>
  );
}
