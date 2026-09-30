// design: js/ds/_ds_bundle.js components/feedback/EmptyState.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
}

/** EmptyState — a dashed O with title, copy and a primary action. */
export function EmptyState({ title, description, action, style, ...rest }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '10px 0',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          position: 'relative',
          width: 70,
          height: 70,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dashed var(--border)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 20,
            borderRadius: '50%',
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        />
      </div>
      {title && (
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--text)',
            marginBottom: 4,
          }}
        >
          {title}
        </div>
      )}
      {description && (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-dim)',
            marginBottom: 16,
            maxWidth: 220,
          }}
        >
          {description}
        </div>
      )}
      {action}
    </div>
  );
}
