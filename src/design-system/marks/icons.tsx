// design: src/components/chrome.jsx ICO + svg(), src/components/shell.jsx SICO — ported verbatim.
import type { ReactNode } from 'react';

export type ChromeIcon =
  | 'hub'
  | 'world'
  | 'search'
  | 'bell'
  | 'bellOff'
  | 'spark'
  | 'chat'
  | 'send'
  | 'close'
  | 'dock'
  | 'ring'
  | 'creators'
  | 'requests'
  | 'passport';
export type ShellIcon = 'panel' | 'bar' | 'collapse' | 'expand';

/** Chrome icon glyphs (24×24 stroke paths). Render with <Icon>. */
export const ICO: Record<ChromeIcon, ReactNode> = {
  hub: (
    <>
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </>
  ),
  world: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  bellOff: (
    <>
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      <path d="M18.6 13c.2-1.6.4-3.5.4-5a6 6 0 0 0-9.3-5" />
      <path d="M6 8c0 5-2 7-3 9h13" />
      <path d="M3 3l18 18" />
    </>
  ),
  spark: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  chat: (
    <>
      <circle cx="12" cy="11" r="7.5" />
      <path d="M8.5 20.5l1.6-3" />
      <circle cx="12" cy="11" r="2.4" />
    </>
  ),
  send: (
    <>
      <path d="M21 3L10.5 13.5" />
      <path d="M21 3l-6.6 18-3.9-7.5L3 9.6z" />
    </>
  ),
  close: (
    <>
      <path d="M18 6L6 18M6 6l12 12" />
    </>
  ),
  dock: (
    <>
      <path d="M4 4.8h16" />
      <path d="M12 20.4v-9.6" />
      <path d="M8.3 14.4L12 10.7l3.7 3.7" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 3.6v2.6M18.9 8.2l-2.3 1.3M5.1 8.2l2.3 1.3" />
    </>
  ),
  creators: (
    <>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M5.2 20c0-3.4 3-6 6.8-6s6.8 2.6 6.8 6" />
      <circle cx="19.4" cy="6.2" r="1.5" />
    </>
  ),
  requests: (
    <>
      <path d="M5.4 4.6h9.2l4 4v10.8a1.2 1.2 0 0 1-1.2 1.2H5.4a1.2 1.2 0 0 1-1.2-1.2V5.8a1.2 1.2 0 0 1 1.2-1.2z" />
      <path d="M14.4 4.6v4.2h4" />
      <path d="M8 12.4h6M8 15.8h4" />
    </>
  ),
  passport: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="10.2" r="2.6" />
      <path d="M7.4 18.2c.7-2.2 2.5-3.4 4.6-3.4s3.9 1.2 4.6 3.4" />
    </>
  ),
};

/** Split-nav shell glyphs. */
export const SICO: Record<ShellIcon, ReactNode> = {
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9.6 4v16" />
    </>
  ),
  bar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9.6h18" />
    </>
  ),
  collapse: (
    <>
      <path d="M14.5 8.5L10 12l4.5 3.5" />
      <path d="M19 5v14" />
    </>
  ),
  expand: (
    <>
      <path d="M9.5 8.5L14 12l-4.5 3.5" />
      <path d="M5 5v14" />
    </>
  ),
};

export interface IconProps {
  /** glyph children — one of ICO/SICO/O_SECTION_ICONS, or custom paths */
  children: ReactNode;
  size?: number;
  stroke?: string;
  /** stroke width */
  sw?: number;
}

/** design: chrome.jsx `svg(children, size, stroke, sw)` — the one stroke-icon frame. */
export function Icon({ children, size = 18, stroke = 'currentColor', sw = 1.6 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
