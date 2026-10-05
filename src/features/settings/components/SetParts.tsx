// design: settings.jsx SetCard / SetRow / SetSeg / SetSelect / SetLabel
import type { CSSProperties, ReactNode } from 'react';

export function SetCard({
  id,
  title,
  sub,
  children,
  tone,
}: {
  id: string;
  title: string;
  sub?: ReactNode;
  children: ReactNode;
  tone?: string;
}) {
  return (
    <section
      id={`set-${id}`}
      data-set-section={id}
      aria-label={title}
      style={{
        scrollMarginTop: 150,
        borderRadius: 28,
        padding: 'clamp(18px,2.2vw,26px)',
        background: 'var(--surface)',
        boxShadow: tone
          ? `var(--nm-raised), inset 0 0 0 1.5px color-mix(in srgb, ${tone} 40%, transparent)`
          : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: '-.025em',
          color: tone || 'var(--text)',
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            margin: '5px 0 0',
            maxWidth: '62ch',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--text-dim)',
          }}
        >
          {sub}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>{children}</div>
    </section>
  );
}

export function SetRow({
  label,
  note,
  children,
  last,
}: {
  label: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        padding: '14px 0',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {note && (
          <div
            style={{
              marginTop: 3,
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--text-dim)',
              overflowWrap: 'anywhere',
            }}
          >
            {note}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          flex: '0 1 auto',
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function SetSeg<V extends string>({
  value,
  options,
  onChange,
  tone,
  label,
}: {
  value: V;
  options: [V, string][];
  onChange: (v: V) => void;
  tone?: string;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: 3,
        padding: 4,
        borderRadius: 999,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      {options.map(([k, l]) => {
        const on = value === k;
        return (
          <button
            type="button"
            key={k}
            onClick={() => onChange(k)}
            aria-pressed={on}
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 12.5,
              fontWeight: on ? 700 : 500,
              color: on ? '#fff' : 'var(--text-dim)',
              background: on ? tone || 'var(--o-violet)' : 'transparent',
              transition: 'background .24s, color .2s',
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

const CHEVRON =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%272.4%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E") no-repeat right 12px center';

export function SetSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: (string | [string, string])[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: 38,
        maxWidth: 260,
        padding: '0 34px 0 14px',
        borderRadius: 12,
        border: 'none',
        font: 'inherit',
        fontSize: 13,
        color: 'var(--text)',
        background: `var(--surface) ${CHEVRON}`,
        boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
        appearance: 'none',
        WebkitAppearance: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => {
        const [v, l] = typeof o === 'string' ? [o, o] : o;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

export const setField: CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 14px',
  borderRadius: 13,
  border: 'none',
  outline: 'none',
  font: 'inherit',
  fontSize: 13.5,
  color: 'var(--text)',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--weo-field-line, var(--border))',
};

export function SetLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{ display: 'block', marginBottom: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)' }}
    >
      {children}
    </span>
  );
}
