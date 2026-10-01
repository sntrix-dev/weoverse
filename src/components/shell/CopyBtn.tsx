import { useState } from 'react';
import { Icon } from '@/design-system';
import { toast } from '@/stores/ui';
import s from './CopyBtn.module.css';

/** design: chrome.jsx CopyBtn — copy sits right beside the thing it copies. */
export function CopyBtn({ text, what, size = 28 }: { text: string; what?: string; size?: number }) {
  const [done, setDone] = useState(false);
  const go = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    setDone(true);
    setTimeout(() => setDone(false), 1400);
    toast(`${what || 'Copied'} copied · ${text}`);
  };
  return (
    <button
      type="button"
      onClick={go}
      aria-label={`Copy ${what || text}`}
      title={done ? 'Copied' : `Copy ${what || ''}`}
      className={s.btn}
      data-done={done || undefined}
      style={{ width: size, height: size }}
    >
      {done ? (
        <Icon size={13} sw={2.4}>
          <path d="M5 12.5l4.2 4.2L19 7" />
        </Icon>
      ) : (
        <Icon size={13} sw={1.8}>
          <rect x="9" y="9" width="11" height="11" rx="2.4" />
          <path d="M5 15V5.6A1.6 1.6 0 0 1 6.6 4H15" />
        </Icon>
      )}
    </button>
  );
}
