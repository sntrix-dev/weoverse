import { OMark } from '@/design-system';

/** design: section-hero.jsx OsText — an Os string with the flow mark in place of a typed O. */
export function OsText({
  value,
  size,
}: {
  value: string | number | null | undefined;
  size?: number | string;
}) {
  const raw = String(value ?? '');
  if (!/(^|\s)O\s\d/.test(raw)) return <>{raw}</>;
  const sign = (raw.match(/^[+−-]\s*/) || [''])[0];
  return (
    <>
      {sign}
      <OMark size={size ?? '0.72em'} /> {raw.replace(/^[+−-]\s*/, '').replace(/^O\s*/, '')}
    </>
  );
}
