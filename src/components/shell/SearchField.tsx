import { useRef, useState } from 'react';
import { ICO, Icon } from '@/design-system';
import { SearchSuggestPanel, useSearchSuggest } from './SearchSuggest';
import s from './SearchField.module.css';

/**
 * design: chrome.jsx TopBar search / shell.jsx SupportSearch — the icon opens a field that
 * grows in place; Enter searches, Escape or blur folds it away. v4: in the top bar it suggests
 * WeOs, requests, circles and creators as you type (`SearchSuggest`).
 */
export function SearchField({
  onSearch,
  variant,
  iconSize = 18,
}: {
  onSearch: (q: string) => void;
  variant: 'bar' | 'support';
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const suggest = variant === 'bar';
  const sg = useSearchSuggest(suggest && open ? q : '', onSearch);
  const done = () => {
    setQ('');
    field.current?.blur();
  };
  return (
    <div ref={root} className={s.root} data-open={open || undefined} data-variant={variant}>
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
        <Icon size={iconSize}>{ICO.search}</Icon>
      </button>
      <input
        ref={field}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        placeholder="WeOs, requests, circles, creators"
        aria-label="Search WeOs, requests, circles, creators"
        role={suggest ? 'combobox' : undefined}
        aria-autocomplete={suggest ? 'list' : undefined}
        aria-expanded={suggest ? open && sg.live && sg.flat.length > 0 : undefined}
        aria-controls={suggest ? 'weo-search-suggest' : undefined}
        aria-activedescendant={suggest && open && sg.active ? `weo-sg-${sg.active.id}` : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (suggest && sg.key(e)) {
            if (e.key === 'Enter') done();
            return;
          }
          const v = e.currentTarget.value.trim();
          if (e.key === 'Enter') {
            if (v) onSearch(v);
            done();
          }
          if (e.key === 'Escape') e.currentTarget.blur();
        }}
        className={s.input}
        data-open={open || undefined}
      />
      {suggest && open && <SearchSuggestPanel anchor={root} q={q} sg={sg} onPick={done} />}
    </div>
  );
}
