import { useRef, useState } from 'react';
import { ICO, Icon } from '@/design-system';
import s from './SearchField.module.css';

/**
 * design: chrome.jsx TopBar search / shell.jsx SupportSearch — the icon opens a field that
 * grows in place; Enter searches, Escape or blur folds it away.
 */
export function SearchField({
  onSearch,
  variant,
}: {
  onSearch: (q: string) => void;
  variant: 'bar' | 'support';
}) {
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  return (
    <div className={s.root} data-open={open || undefined} data-variant={variant}>
      <button
        type="button"
        aria-label="Search the WeOverse"
        title="Search"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => field.current?.focus(), 120);
        }}
        className={s.icon}
        data-open={open || undefined}
      >
        <Icon size={18}>{ICO.search}</Icon>
      </button>
      <input
        ref={field}
        placeholder="WeOs, circles, creators"
        aria-label="Search WeOs, circles, creators"
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          const q = e.currentTarget.value.trim();
          if (e.key === 'Enter') {
            if (q) onSearch(q);
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') e.currentTarget.blur();
        }}
        className={s.input}
        data-open={open || undefined}
      />
    </div>
  );
}
