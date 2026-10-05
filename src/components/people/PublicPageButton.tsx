// design: screens-network.jsx PublicPageButton
import { useState } from 'react';
import { Avatar, svg } from '@/design-system';

export type ContactPolicy = 'anyone' | 'circles' | 'off';

export const CONTACT_NOTE: Record<ContactPolicy, string> = {
  anyone: 'Open to anyone',
  circles: 'Only through a shared Circle',
  off: 'Closed — they answer in threads instead',
};

/**
 * The public page, as a control you can read: face, what it holds, and a way in. Never a dot
 * you have to discover.
 */
export function PublicPageButton({
  avatar,
  isr,
  weos,
  contact,
  onOpen,
}: {
  avatar: string | null;
  isr: number;
  weos: number;
  contact: ContactPolicy;
  onOpen: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onOpen}
      title="What a stranger sees when they open your name"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 44,
        padding: '4px 14px 4px 4px',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        background: 'var(--surface)',
        boxShadow: hov ? 'var(--nm-raised), inset 0 0 0 1px var(--o-green)' : 'var(--nm-sm)',
        transition: 'box-shadow .22s',
      }}
    >
      <Avatar src={avatar ?? undefined} isr={Math.round(isr)} size={34} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
          Your public page
        </span>
        <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-faint)' }}>
          {weos} WeO{weos === 1 ? '' : 's'} · {CONTACT_NOTE[contact].toLowerCase()}
        </span>
      </span>
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          color: hov ? 'var(--o-green)' : 'var(--text-faint)',
          transition: 'color .2s',
        }}
      >
        {svg(<path d="M9 6l6 6-6 6" />, 14, 'currentColor', 2)}
      </span>
    </button>
  );
}
