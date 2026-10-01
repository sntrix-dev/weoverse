import { useState, type ReactNode } from 'react';
import { svg } from '@/design-system';

/**
 * design: chrome.jsx useNote / NoteDot / NoteBody — one grammar for "why": the dot invites,
 * the note arrives. Rest state holds what you need to decide; depth arrives on intent.
 */
export function useNote() {
  const [hov, setHov] = useState(false);
  const [pin, setPin] = useState(false);
  return {
    show: hov || pin,
    enter: () => setHov(true),
    leave: () => setHov(false),
    toggle: () => setPin((p) => !p),
  };
}

export function NoteDot({ show, onClick, label }: { show: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={show}
      aria-label={label || 'What this is'}
      title={label || 'What this is'}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 22,
        height: 22,
        flex: '0 0 auto',
        borderRadius: '50%',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        background: show ? 'color-mix(in srgb, var(--o-violet) 12%, transparent)' : 'transparent',
        color: show ? 'var(--o-violet)' : 'var(--text-faint)',
        transition: 'background .24s, color .24s',
      }}
    >
      {svg(
        <>
          <circle cx="12" cy="12" r="8.6" />
          <circle cx="12" cy="12" r="2.6" />
        </>,
        15,
        'currentColor',
        1.6,
      )}
    </button>
  );
}

export function NoteBody({
  note,
  show,
  size,
  width,
}: {
  note: ReactNode;
  show: boolean;
  size?: number;
  width?: number | string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: show ? '1fr' : '0fr', transition: 'grid-template-rows .42s var(--ease-portal)' }}>
      <p
        style={{
          margin: 0,
          overflow: 'hidden',
          fontSize: size || 13,
          lineHeight: 1.5,
          color: 'var(--text-dim)',
          maxWidth: typeof width === 'number' ? `${width}ch` : width || '58ch',
          opacity: show ? 1 : 0,
          paddingTop: show ? 5 : 0,
          transition: 'opacity .26s, padding-top .3s',
        }}
      >
        {note}
      </p>
    </div>
  );
}
