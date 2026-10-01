// design: section-hero.jsx PLACE_ICONS / TAB_ICONS — one glyph per kind of place or filter, verbatim.
import type { ReactNode } from 'react';

/* One glyph per KIND of place, matched from the place's own id or name, so every screen's
   directory gets a real icon without each screen having to hand one over. */
export const PLACE_ICONS: [RegExp, ReactNode][] = [
  [
    /wallet|\bbalance\b|\bbucket/,
    <>
      <rect x="3" y="6" width="18" height="13" rx="3.4" />
      <path d="M3 10.5h18" />
    </>,
  ],
  [
    /\bstage\b|showcase|spotlight/,
    <>
      <circle cx="12" cy="10" r="4.4" />
      <path d="M5.5 20c1.2-3 3.7-4.6 6.5-4.6S17.3 17 18.5 20" />
      <path d="M12 2.4v2M4.6 6l1.5 1.4M19.4 6l-1.5 1.4" />
    </>,
  ],
  [
    /\bfeed\b/,
    <>
      <path d="M4.5 6.5h15M4.5 12h15M4.5 17.5h9" />
    </>,
  ],
  [
    /\bending\b|closing|soonest/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3.2 2" />
    </>,
  ],
  [
    /\bmoving\b|trending|\bpulse\b/,
    <>
      <path d="M4 15.5l5-5.5 3.5 3.5L20 6" />
      <path d="M20 6v4.4h-4.4" />
    </>,
  ],
  [
    /\bfollowed\b|circle you|you circle/,
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8.4" />
    </>,
  ],
  [
    /\bcreator|trading|\bpeople\b|\bgraph\b/,
    <>
      <circle cx="12" cy="8.4" r="3.2" />
      <path d="M6 19c.8-3 3.2-4.6 6-4.6S17.2 16 18 19" />
    </>,
  ],
  [
    /\bcircles\b|community/,
    <>
      <circle cx="9.4" cy="12" r="5" />
      <circle cx="15.4" cy="12" r="5" />
    </>,
  ],
  [
    /\binterest|categor|\bbrowse\b/,
    <>
      <path d="M4.6 10.4l6-6 8.8 8.8-6 6z" />
      <circle cx="8.8" cy="8.8" r="1.2" />
    </>,
  ],
  [
    /\bfloor\b|whole floor|everything on the floor/,
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>,
  ],
  [
    /\bsnapshot\b/,
    <>
      <path d="M4.5 19.5h15" />
      <path d="M7.5 19.5v-6M12 19.5V7M16.5 19.5v-9" />
    </>,
  ],
  [
    /\bheld\b|\bhold\b|collect/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.2" />
    </>,
  ],
  [
    /\blisted\b|\blisting|you flow|in flow/,
    <>
      <path d="M4.6 9.4h11.8l-2.8-2.8M19.4 14.6H7.6l2.8 2.8" />
    </>,
  ],
  [
    /\bmya\b|\bask\b|question/,
    <>
      <path d="M20.5 11.5a8 8 0 0 1-8 8 8 8 0 0 1-3.6-.85L3.5 20.5l1.85-5.4A8 8 0 0 1 12.5 3.5a8 8 0 0 1 8 8z" />
    </>,
  ],
  [
    /\bstanding\b|moved it|\bisr\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 3.6v4M12 16.4v4M3.6 12h4M16.4 12h4" />
    </>,
  ],
  [
    /\btier\b|advantage/,
    <path d="M12 3.6l2.6 5.6 6.1.6-4.6 4.1 1.4 6-5.5-3.2-5.5 3.2 1.4-6L3.3 9.8l6.1-.6z" />,
  ],
  [
    /\bbrief|\brequest/,
    <>
      <rect x="5" y="3.6" width="14" height="16.8" rx="2.6" />
      <path d="M8.6 8.4h6.8M8.6 12h6.8M8.6 15.6h4" />
    </>,
  ],
  [
    /\bevent|near you|happening/,
    <>
      <rect x="4" y="5.4" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3.4v4M15 3.4v4" />
    </>,
  ],
  /* terms are a document; the card is a card — two places, two glyphs, terms first so it
     can never fall through to the card rule */
  [
    /\bterms\b|key terms/,
    <>
      <rect x="5" y="3.6" width="14" height="16.8" rx="2.6" />
      <path d="M8.6 8.4h6.8M8.6 12h6.8M8.6 15.6h4" />
    </>,
  ],
  [
    /weo-card|\bthe card\b|\bpassport\b/,
    <>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M7.6 9.6h8.8M7.6 13.4h5.6" />
    </>,
  ],
  [
    /\bworld|rehears/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12h16.8M12 3.6c2.4 2.6 2.4 14.2 0 16.8M12 3.6c-2.4 2.6-2.4 14.2 0 16.8" />
    </>,
  ],
  [
    /\bsteward/,
    <>
      <path d="M12 3.4l7 3v5.2c0 4-2.9 7.4-7 8.6-4.1-1.2-7-4.6-7-8.6V6.4z" />
    </>,
  ],
];

/* Filter tabs carry a glyph as well as a word. */
export const TAB_ICONS: [RegExp, ReactNode][] = [
  [
    /^all\b|everything/,
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>,
  ],
  [
    /\blive\b|in motion/,
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M6.2 6.2a8.2 8.2 0 0 0 0 11.6M17.8 6.2a8.2 8.2 0 0 1 0 11.6" />
    </>,
  ],
  [
    /scheduled|upcoming/,
    <>
      <rect x="4" y="5.4" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3.4v4M15 3.4v4" />
    </>,
  ],
  [
    /\bdraft/,
    <>
      <path d="M4 20h4l10-10-4-4L4 16z" />
      <path d="M14 6l4 4" />
    </>,
  ],
  [
    /closed|resolved|\bdone\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <polyline points="8.4 12.4 11 15 15.8 9.6" />
    </>,
  ],
  [
    /closing|soonest|ending/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3.2 2" />
    </>,
  ],
  [
    /highest standing|\bstanding\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 3.6v4M12 16.4v4M3.6 12h4M16.4 12h4" />
    </>,
  ],
  [
    /settled|earning/,
    <>
      <path d="M12 4v11M8 11l4 4 4-4" />
      <path d="M4.5 19.5h15" />
    </>,
  ],
  [
    /reached|collectors|reach/,
    <>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M7.6 7.6a6.2 6.2 0 0 0 0 8.8M16.4 7.6a6.2 6.2 0 0 1 0 8.8M4.6 4.6a10.4 10.4 0 0 0 0 14.8M19.4 4.6a10.4 10.4 0 0 1 0 14.8" />
    </>,
  ],
  [
    /longest live|consistency|weeks/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6V12l3.2 2" />
    </>,
  ],
  [
    /best performing|performing|through/,
    <>
      <path d="M4 19.5h16" />
      <path d="M7.5 19.5v-5M12 19.5V8M16.5 19.5v-8.5" />
    </>,
  ],
  [
    /biggest movers|movers/,
    <>
      <path d="M4 15.5l5-5.5 3.5 3.5L20 6" />
      <path d="M20 6v4.4h-4.4" />
    </>,
  ],
  [
    /awaiting|pending/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 8.4v3.6l2.6 1.6" />
      <path d="M4.4 4.4l2.2 2.2" />
    </>,
  ],
  [
    /\bready\b|preflight/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <polyline points="8.4 12.4 11 15 15.8 9.6" />
    </>,
  ],
  [
    /kinds you engage|by format|formats/,
    <>
      <circle cx="8.8" cy="8.8" r="3.6" />
      <circle cx="15.2" cy="15.2" r="3.6" />
    </>,
  ],
  [
    /creators you circle|circle/,
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8.4" />
    </>,
  ],
  [
    /moving|trending/,
    <>
      <path d="M4 15.5l5-5.5 3.5 3.5L20 6" />
      <path d="M20 6v4.4h-4.4" />
    </>,
  ],
  [
    /discussion|question/,
    <>
      <path d="M20.5 11.5a8 8 0 0 1-8 8 8 8 0 0 1-3.6-.85L3.5 20.5l1.85-5.4A8 8 0 0 1 12.5 3.5a8 8 0 0 1 8 8z" />
    </>,
  ],
  [
    /member|people/,
    <>
      <circle cx="12" cy="8.4" r="3.2" />
      <path d="M6 19c.8-3 3.2-4.6 6-4.6S17.2 16 18 19" />
    </>,
  ],
  [
    /\bweos\b|\bweo\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.2" />
    </>,
  ],
  [
    /event|gathering/,
    <>
      <rect x="4" y="5.4" width="16" height="15" rx="3" />
      <path d="M4 10h16M9 3.4v4M15 3.4v4" />
    </>,
  ],
  [
    /about|\binfo\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11v5.4" />
      <circle cx="12" cy="8" r=".9" fill="currentColor" />
    </>,
  ],
  [
    /\bopen\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </>,
  ],
  [
    /\bmine\b|yours/,
    <>
      <circle cx="12" cy="8.4" r="3.2" />
      <path d="M6 19c.8-3 3.2-4.6 6-4.6S17.2 16 18 19" />
    </>,
  ],
  [
    /\bfree\b/,
    <>
      <path d="M5 11h14v9H5zM3.6 7.4h16.8V11H3.6zM12 7.4V20" />
      <path d="M12 7.4C10.6 4.6 6 4.6 6 7.4M12 7.4c1.4-2.8 6-2.8 6 0" />
    </>,
  ],
  [
    /priced|\bos\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M9 10.2h6M9 13.8h6M12 7.4v9.2" />
    </>,
  ],
  [
    /\bpool\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M4.4 14.2a20 20 0 0 0 15.2 0" />
    </>,
  ],
  [
    /\bhunt\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 3.6v3.4M12 17v3.4M3.6 12H7M17 12h3.4" />
    </>,
  ],
  [
    /digital arts|\barts\b/,
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="9.4" cy="10" r="1.2" fill="currentColor" />
      <circle cx="14.6" cy="10" r="1.2" fill="currentColor" />
      <path d="M8.6 14.6c1.9 1.8 4.9 1.8 6.8 0" />
    </>,
  ],
  [
    /digital assets|\bassets\b|listing/,
    <>
      <rect x="4.6" y="4.6" width="14.8" height="14.8" rx="3" />
      <path d="M8.4 9.6h7.2M8.4 13.4h4.4" />
    </>,
  ],
  [
    /\bdrop\b/,
    <>
      <path d="M12 3.6c3 3.6 5.4 6.4 5.4 9.4a5.4 5.4 0 0 1-10.8 0c0-3 2.4-5.8 5.4-9.4z" />
    </>,
  ],
  [
    /\bbid\b|auction/,
    <>
      <path d="M6 18.4h8M9.4 5.6l5 5M12.6 3l4.4 4.4M8.2 7.4l4.4 4.4-3.2 3.2-4.4-4.4z" />
    </>,
  ],
  [
    /\bcode\b|scan|show your/,
    <>
      <rect x="4.6" y="4.6" width="6" height="6" rx="1.6" />
      <rect x="13.4" y="4.6" width="6" height="6" rx="1.6" />
      <rect x="4.6" y="13.4" width="6" height="6" rx="1.6" />
      <path d="M13.4 13.4h6v6h-6z" />
    </>,
  ],
];
