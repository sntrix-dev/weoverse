// design: js/ds/_ds_bundle.js components/feedback/Tooltip.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
  label: ReactNode;
  side?: 'top' | 'bottom';
  style?: CSSProperties;
}

/** Tooltip — deep "hair" bubble with a pointer. Hover the child to reveal. */
export function Tooltip({ label, children, side = 'top', style, ...rest }: TooltipProps) {
  const [show, setShow] = useState(false);
  const pos =
    side === 'bottom'
      ? {
          top: '100%',
          marginTop: 8,
        }
      : {
          bottom: '100%',
          marginBottom: 8,
        };
  const arrow =
    side === 'bottom'
      ? {
          top: -5,
        }
      : {
          bottom: -5,
        };
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      {...rest}
    >
      {children}
      {show && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            ...pos,
            padding: '8px 13px',
            borderRadius: 10,
            background: 'var(--hair)',
            color: 'var(--surface)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 800,
            boxShadow: '0 8px 20px -6px rgba(0,0,0,.4)',
            ...style,
          }}
        >
          {label}
          <span
            style={{
              position: 'absolute',
              left: '50%',
              marginLeft: -5,
              width: 10,
              height: 10,
              background: 'var(--hair)',
              transform: 'rotate(45deg)',
              ...arrow,
            }}
          />
        </span>
      )}
    </span>
  );
}
