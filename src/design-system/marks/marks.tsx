// design: src/components/marks.jsx — ported verbatim, typed.
import type { CSSProperties } from 'react';

export interface MarkGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  /** the O's paths */
  o: string[];
  /** every other letter's paths */
  ink: string[];
}

export interface DrawnMarkProps {
  mark: MarkGeometry;
  /** rendered height in px; width follows the mark's aspect ratio */
  h: number;
  treatment?: 'ink' | 'tone' | 'micro';
  ink?: string;
  /** colour only the O (one edge colour for the whole mark — never two inks) */
  o?: string;
  style?: CSSProperties;
  title?: string;
  className?: string;
}

export type LetteringProps = Omit<DrawnMarkProps, 'mark'>;

/* ── The drawn WeO / WeOverse lettering, straight off the brand ID sheet ──
   Vector, not a bitmap: one hand-drawn lockup that stays crisp at any size, takes the
   surface it sits on through currentColor, and keeps the O in the brand violet.
   Geometry is lifted verbatim from uploads/WeO+WeOverse_ID.svg — do not redraw. */

/* the sheet's own coordinate space, so the paths stay untouched */
export const MARK_VERSE: MarkGeometry = {
  x: 88.4,
  y: 312.8,
  w: 171.4,
  h: 41.1,
  o: [
    'M171,342.9c-2.6,4.5-7.1,7.8-12,9c-5.1,1.3-10.4,0.4-14.9-2.3c-4.4-2.7-7.6-7-8.9-12c-1.1-4.3-0.7-9,1.3-13.1 c2.4-5.3,7.2-9.1,13.1-10.6c4.3-1.1,9-0.6,13.1,1.3c5.3,2.5,9.2,7.2,10.6,13C174.6,333.2,173.7,338.4,171,342.9z M152.2,324.6 c-4.6,1.1-7.4,5.7-6.2,10.3c1.1,4.6,5.8,7.4,10.3,6.3c4.6-1.1,7.4-5.8,6.3-10.4C161.4,326.2,156.8,323.5,152.2,324.6z',
  ],
  ink: [
    'M108.7,340.3c0-4.7,1.8-8.4,4.7-10.8l0.1-4c0-1.4,0.1-2.7,0.2-3.9l-5.9,1.7c0.2,0.9,0.3,2.1,0.4,3.6l0.3,5.2 c0,0.8,0,0.8,0.1,1.2c-0.2-0.3-0.5-0.8-0.7-1l-3.1-4.7c-0.8-1.2-1.5-2.4-1.7-2.9l-4,1.2c0.1,0.6,0.1,0.6,0.1,3.4l-0.1,5.4 c0,0.3,0,0.3,0,1.4c-0.1-0.2-0.3-0.6-0.7-1.2l-2.6-4.5c-0.7-1.2-1.1-2.1-1.5-3.1l-5.9,1.7c0.9,1.2,1.7,2.3,2.3,3.2l5.9,9 c0.9,1.3,1.3,2,1.7,2.9l4.6-1.3c-0.1-0.7-0.1-2.1-0.1-3.4l0.1-5.9c0-0.4,0-0.5,0-1.2c0.1,0.2,0.3,0.6,0.6,1l3.3,5 c1,1.4,1.4,2.2,1.8,2.9l0,0C108.8,340.8,108.7,340.6,108.7,340.3z',
    'M128.5,346.3c-1.1,1-2.5,1.5-4.2,1.5c-3.3,0-5.2-1.8-5.6-5.1H135c-0.9-1.6-1.6-3.3-2.1-5.1 c-0.7-2.6-0.7-5.4-0.3-8.1c-2.2-1.8-5-2.8-8.4-2.8c-7.9,0-13.2,5.4-13.2,13.6c0,4.1,1.3,7.6,3.8,10.1c2.4,2.4,5.6,3.5,9.6,3.5 c4.1,0,7.4-1.2,9.8-3.5c1.2-1.2,1.8-2.1,2.7-4.3l-7.2-2C129.4,345.2,129.1,345.7,128.5,346.3z M124.3,332.9c2.9,0,4.6,1.4,5.2,4.1 h-10.6C119.5,334.2,121.3,332.9,124.3,332.9z',
    'M186.8,324.2l-4.6,13.3l-7.2-12.1l-0.1,0c0.3,0.7,0.5,1.5,0.7,2.3c1.1,4.3,0.6,8.8-1.3,12.8l6.1,9.3l5.8-0.6 l10.2-26.1L186.8,324.2z',
    'M204.5,342.7c-0.7,1.5-1.8,2.4-3.5,2.6c-3.1,0.4-5-1-5.4-4.4l16.3-2.3l-0.1-0.8c-0.3-1.9-0.8-3.6-1.5-5.1 c-0.8-1.5-1.7-2.6-2.9-3.6c-1.2-0.9-2.5-1.5-4.1-1.9c-1.6-0.4-3.3-0.4-5.1-0.1c-0.4,0.1-0.8,0.1-1.2,0.2l-7.4,18.8 c0.7,1,1.6,1.9,2.6,2.7c1.2,0.9,2.7,1.5,4.3,1.8c1.6,0.3,3.4,0.4,5.2,0.1c6.1-0.8,9.5-3.9,10.3-9.1L204.5,342.7z M196.2,333.5 c0.7-0.7,1.6-1.2,2.8-1.4c1.1-0.2,2.2,0,3.1,0.6c0.9,0.5,1.5,1.3,2,2.4l-8.9,1.2C195.2,335.2,195.5,334.2,196.2,333.5z',
    'M239.1,342.8c-0.4-1.6-1.1-2.8-2.4-3.6c-1.2-0.8-2.9-1.2-4.9-1.1c-0.8,0-1.4,0-1.8,0c-0.5,0-0.8-0.1-1.1-0.1 c-0.3-0.1-0.4-0.2-0.5-0.3c-0.1-0.1-0.2-0.3-0.2-0.6c-0.1-0.5,0-0.9,0.4-1.2c0.4-0.4,0.9-0.6,1.5-0.8c1.3-0.3,2.7-0.2,4.1,0.2 l1.4-5.2c-2.3-0.4-4.6-0.3-6.9,0.2c-0.8,0.2-1.5,0.4-2.1,0.6c0.1,0,0.2,0,0.3,0v7.1c-1-0.5-2-0.7-3.2-0.7c-1,0-1.9,0.2-2.6,0.6 c0,0.6,0.1,1.2,0.2,1.9c0.4,1.6,1.1,2.7,2.2,3.4c1.1,0.7,2.8,1,5.1,1c0.7,0,1.3,0,1.7,0c0.4,0,0.8,0.1,1,0.2 c0.2,0.1,0.4,0.2,0.5,0.4c0.1,0.2,0.2,0.4,0.2,0.6c0.1,0.5,0,0.9-0.4,1.3c-0.4,0.4-0.9,0.7-1.5,0.8c-1.8,0.4-3.9,0.1-6.2-0.8 l-1.5,5.7c3,1,5.9,1.1,8.7,0.5c1.4-0.3,2.7-0.8,3.8-1.4c1.1-0.6,2-1.4,2.7-2.2c0.7-0.8,1.2-1.8,1.5-2.9 C239.4,345.2,239.4,344,239.1,342.8z',
    'M224.2,327.9c-0.2,0-0.4,0-0.6,0c-1.5,0-2.9,0.3-4,1c-1.1,0.7-2.1,1.6-2.9,2.9v-3.4h-7.4v0.5 c2.9,2.4,4.7,6,4.7,10c0,0.8-0.1,1.6-0.2,2.4l0.1,0c-0.4,2.3-1.3,4.2-2.7,5.7c-0.6,0.7-1.2,1.4-1.9,2v0.5h7.4v-9 c0-2,0.4-3.5,1.3-4.5c0.9-1,2.1-1.5,3.9-1.5c1.1,0,2.2,0.2,3.2,0.7v-7.1C224.7,327.9,224.4,327.9,224.2,327.9z',
    'M259.5,334.3c-0.3-1.4-0.9-2.7-1.8-3.9c-0.9-1.2-2.1-2.3-3.6-3.2c-1.5-0.9-3-1.6-4.5-1.9 c-1.5-0.3-2.9-0.3-4.3,0c-1.4,0.3-2.7,0.9-3.9,1.8c-1.2,0.9-2.3,2.1-3.2,3.6c-0.9,1.4-1.4,2.9-1.7,4.3c-0.1,0.5-0.1,1-0.1,1.6 c1,0.2,1.8,0.5,2.5,0.9c1.2,0.8,2,2,2.4,3.6c0.3,1.2,0.3,2.3,0,3.4c-0.1,0.3-0.2,0.6-0.3,0.9c0.5,0.4,1,0.7,1.5,1.1 c4.9,3,9.2,2.9,13-0.4l-6.1-3.8c-1.4,0.7-2.8,0.6-4.1-0.2c-2.5-1.6-3-3.7-1.3-6.4l13.2,8.2l0.4-0.7c1-1.6,1.6-3.1,1.9-4.6 C259.7,337.1,259.8,335.7,259.5,334.3z M253.5,336.6l-7.2-4.5c0.7-0.8,1.6-1.3,2.5-1.4c0.9-0.1,1.9,0.1,2.9,0.7 c0.9,0.6,1.5,1.3,1.9,2.3C253.8,334.6,253.8,335.6,253.5,336.6z',
  ],
};
export const MARK_WEO: MarkGeometry = {
  x: 358.6,
  y: 312.8,
  w: 86.2,
  h: 41.1,
  o: [
    'M441.2,342.9c-2.6,4.5-7.1,7.8-12,9c-5.1,1.3-10.4,0.4-14.9-2.3c-4.4-2.7-7.6-7-8.9-12c-1.1-4.3-0.7-9,1.3-13.1 c2.4-5.3,7.2-9.1,13.1-10.6c4.3-1.1,9-0.6,13.1,1.3c5.3,2.5,9.2,7.2,10.6,13C444.8,333.2,443.9,338.4,441.2,342.9z M422.4,324.6 c-4.6,1.1-7.4,5.7-6.2,10.3c1.1,4.6,5.8,7.4,10.3,6.3c4.6-1.1,7.4-5.8,6.3-10.4C431.6,326.2,427,323.5,422.4,324.6z',
  ],
  ink: [
    'M378.9,340.3c0-4.7,1.8-8.4,4.7-10.8l0.1-4c0-1.4,0.1-2.7,0.2-3.9l-5.9,1.7c0.2,0.9,0.3,2.1,0.4,3.6l0.3,5.2 c0,0.8,0,0.8,0.1,1.2c-0.2-0.3-0.5-0.8-0.7-1l-3.1-4.7c-0.8-1.2-1.5-2.4-1.7-2.9l-4,1.2c0.1,0.6,0.1,0.6,0.1,3.4l-0.1,5.4 c0,0.3,0,0.3,0,1.4c-0.1-0.2-0.3-0.6-0.7-1.2l-2.6-4.5c-0.7-1.2-1.1-2.1-1.5-3.1l-5.9,1.7c0.9,1.2,1.7,2.3,2.3,3.2l5.9,9 c0.9,1.3,1.3,2,1.7,2.9l4.6-1.3c-0.1-0.7-0.1-2.1-0.1-3.4l0.1-5.9c0-0.4,0-0.5,0-1.2c0.1,0.2,0.3,0.6,0.6,1l3.3,5 c1,1.4,1.4,2.2,1.8,2.9l0,0C379,340.8,378.9,340.6,378.9,340.3z',
    'M398.7,346.3c-1.1,1-2.5,1.5-4.2,1.5c-3.3,0-5.2-1.8-5.6-5.1h16.3c-0.9-1.6-1.6-3.3-2.1-5.1 c-0.7-2.6-0.7-5.4-0.3-8.1c-2.2-1.8-5-2.8-8.4-2.8c-7.9,0-13.2,5.4-13.2,13.6c0,4.1,1.3,7.6,3.8,10.1c2.4,2.4,5.6,3.5,9.6,3.5 c4.1,0,7.4-1.2,9.8-3.5c1.2-1.2,1.8-2.1,2.7-4.3l-7.2-2C399.6,345.2,399.3,345.7,398.7,346.3z M394.5,332.9c2.9,0,4.6,1.4,5.2,4.1 H389C389.7,334.2,391.5,332.9,394.5,332.9z',
  ],
};
/* the O on its own — the monogram */
export const MARK_O: MarkGeometry = { x: 134.1, y: 312.8, w: 40.5, h: 40.4, o: MARK_VERSE.o, ink: [] };

/* One renderer for all three. `treatment`:
   ink    — flat, the primary
   tone   — letters at 86% so small sizes stay light
   There is no embossed or shadowed treatment: the mark is ALWAYS one flat colour, dark or
   light depending on the surface it sits on. Anything else distorts the drawn letterforms.
   The mark is MONOCHROME by default: one colour, taking the surface it sits on (white on
   imagery, ink on light, reversed on dark). Pass `o` only where a surface deliberately
   colour-codes the whole mark to one edge colour — never two inks in the same lockup. */
export function DrawnMark({
  mark,
  h,
  treatment = 'ink',
  ink = 'currentColor',
  o,
  style,
  title,
  className,
}: DrawnMarkProps) {
  const oc = o || ink;
  const w = Math.round(((h * mark.w) / mark.h) * 100) / 100;
  const shift = `translate(${-mark.x} ${-mark.y})`;
  const tone = treatment === 'tone' || treatment === 'micro';

  return (
    <svg
      className={className}
      viewBox={`0 0 ${mark.w} ${mark.h}`}
      width={w}
      height={h}
      role="img"
      aria-label={title || 'WeOverse'}
      style={{ display: 'block', flex: '0 0 auto', overflow: 'visible', ...style }}
    >
      {title ? <title>{title}</title> : null}
      {/* ONE unit: the letters and the O are the same lockup, drawn in one pass and never
         animated apart. Nothing in the mark moves relative to anything else in it. */}
      <g transform={shift} fill={ink} fillRule="nonzero" style={{ opacity: tone ? 0.86 : 1 }}>
        {mark.ink.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {oc === ink ? mark.o.map((d, i) => <path key={'o' + i} d={d} />) : null}
      </g>
      {oc !== ink ? (
        <g transform={shift} fill={oc}>
          {mark.o.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ) : null}
    </svg>
  );
}

export const WeOverseLettering = (p: LetteringProps) => (
  <DrawnMark mark={MARK_VERSE} title="WeOverse" {...p} />
);
export const WeOLettering = (p: LetteringProps) => <DrawnMark mark={MARK_WEO} title="WeO" {...p} />;
export const WeODrawnO = (p: LetteringProps) => <DrawnMark mark={MARK_O} title="WeO" {...p} />;
