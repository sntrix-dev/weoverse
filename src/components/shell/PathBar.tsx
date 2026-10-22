import type { ReactNode } from 'react';
import { Icon } from '@/design-system';
import s from './PathBar.module.css';

export interface PathItem {
  label: string;
  onClick?: () => void;
}

/**
 * design: screens-circle.jsx PathBar (v4) — the sticky way back. Only the section is named
 * (the first crumb after "WeOverse"); the back button still goes to the last clickable crumb,
 * or the Community hub.
 */
export function PathBar({
  items,
  right,
  onHub,
}: {
  items: PathItem[];
  right?: ReactNode;
  onHub: () => void;
}) {
  const parent = items.filter((i) => i.onClick).slice(-1)[0];
  const back = parent ? `Back to ${parent.label}` : 'Back to Community hub';
  const sec = items.find((i) => i.label !== 'WeOverse') ?? items[items.length - 1];
  return (
    <div className={s.bar}>
      <button
        type="button"
        onClick={parent?.onClick ?? onHub}
        aria-label={back}
        title={back}
        className={s.back}
      >
        <Icon size={16} sw={1.8}>
          <path d="M15 6l-6 6 6 6" />
        </Icon>
      </button>
      {sec && (
        <span aria-current="page" className={s.current}>
          {sec.label}
        </span>
      )}
      {right}
    </div>
  );
}
