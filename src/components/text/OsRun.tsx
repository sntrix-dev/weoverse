import { Fragment } from 'react';
import { OMark } from '@/design-system';

/**
 * design: section-hero.jsx OsRun — any run of text that mentions Os: every "O 1,200" inside a
 * sentence becomes the flow mark plus the figure. The typed letter O is never the currency.
 */
export function OsRun({ text, size }: { text: string | null | undefined; size?: number | string }) {
  const raw = String(text ?? '');
  const parts = raw.split(/O\s(?=[\d])/);
  if (parts.length === 1) return <>{raw}</>;
  return (
    <>
      {parts.map((p, i) =>
        i === 0 ? (
          <Fragment key={i}>{p}</Fragment>
        ) : (
          <Fragment key={i}>
            <OMark size={size ?? '0.8em'} /> {p}
          </Fragment>
        ),
      )}
    </>
  );
}
