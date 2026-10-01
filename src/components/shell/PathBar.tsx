import { Fragment, type ReactNode } from 'react';
import { Icon } from '@/design-system';
import s from './PathBar.module.css';

export interface PathItem {
  label: string;
  onClick?: () => void;
}

/**
 * design: screens-circle.jsx PathBar — the sticky breadcrumb with a way back. The back
 * button goes to the last clickable crumb, or the Community hub.
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
      <span className={s.dot} />
      <nav aria-label="Breadcrumb" className={`weo-scroll-hide ${s.crumbs}`}>
        {items.map((it, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span className={s.sep}>
                <Icon size={13} sw={1.8}>
                  <path d="M9 6l6 6-6 6" />
                </Icon>
              </span>
            )}
            {it.onClick ? (
              <button type="button" onClick={it.onClick} className={s.crumb}>
                {it.label}
              </button>
            ) : (
              <span aria-current="page" className={s.current}>
                {it.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
      {right}
    </div>
  );
}
