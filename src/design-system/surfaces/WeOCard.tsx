// design: js/ds/_ds_bundle.js components/surfaces/WeOCard.jsx — converted from the compiled bundle (scripts/ds2tsx.mjs), then typed by hand.
import { useRef, useState } from 'react';
import type { CSSProperties, HTMLAttributes, PointerEvent, ReactNode } from 'react';
import { Avatar } from '../data/Avatar';
import { isrStage } from '../data/ISRRing';
import { OMark } from '../core/OMark';
import { Orb } from '../core/Orb';
import { useQrDataUrl } from './useQrDataUrl';

/** A face in a social-proof cluster or people list. */
export interface WeOCardPerson {
  name?: string;
  src?: string | null;
  seed?: string | number;
  initials?: string;
  note?: ReactNode;
}

export interface WeOCardCreator {
  name: string;
  avatar?: string | null;
  initials?: string;
  isr?: number | null;
  summary?: ReactNode;
  trades?: number | null;
  joined?: ReactNode;
}

export interface WeOCardTerm {
  k: ReactNode;
  v: ReactNode;
}

export interface WeOCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'id'> {
  name?: ReactNode;
  typeLabel?: ReactNode;
  id?: string;
  sub?: ReactNode;
  tone?: string;
  fill?: string;
  src?: string | null;
  logoSrc?: string;
  logoVideoSrc?: string;
  rarity?: ReactNode;
  edition?: ReactNode;
  timer?: ReactNode;
  creator?: WeOCardCreator | null;
  ask?: ReactNode;
  bids?: ReactNode;
  watchers?: ReactNode;
  likes?: ReactNode;
  trend?: ReactNode;
  /** live viewer count → "N active now" */
  activeNow?: number | null;
  /** social-proof cluster */
  viewers?: WeOCardPerson[];
  /** +N overflow chip on the cluster */
  viewersMore?: number;
  /** who's viewing now (expandable) */
  viewingPeople?: WeOCardPerson[];
  /** who's collected (expandable) */
  collectorPeople?: WeOCardPerson[];
  /** total collectors (if the list is truncated) */
  collectorCount?: number | null;
  /** key-terms scoreboard (up to 3) */
  terms?: WeOCardTerm[];
  termsLabel?: ReactNode;
  /** the O-tightening conversion strip */
  oDelta?: { fiat: ReactNode; os: ReactNode; rate?: ReactNode } | null;
  /** provenance strip */
  passport?: { label?: ReactNode; resale?: ReactNode } | null;
  /** "what's included" value bullets */
  points?: ReactNode[];
  /** prominent dual-currency price */
  price?: { os: ReactNode; fiat: ReactNode; label?: ReactNode } | null;
  description?: ReactNode;
  engageLabel?: ReactNode;
  qrData?: string | null;
  collected?: boolean;
  backTitle?: ReactNode;
  backFacts?: WeOCardTerm[];
  flippable?: boolean;
  initialFace?: 'front' | 'back';
  format?: 'card' | 'orb' | 'spatial';
  /** orb format: focused item in a feed → reveals detail */
  active?: boolean;
  /** card format: reveal the deeper engagement layer */
  selected?: boolean;
  /** card format: keep the Collect CTA pinned on the orb */
  ctaOnOrb?: boolean;
  w?: number;
  onEngage?: () => void;
  onResell?: () => void;
  onCreate?: () => void;
  style?: CSSProperties;
}

/**
 * WeOCard — the signature collectible and WeO's primary discovery + engage
 * metaphor. One component, three formats (card / orb / spatial) so the card
 * grammar is identical everywhere it appears.
 *
 * The two faces never repeat each other:
 *   • FRONT  = the SALES face — identity, the glass-matcap hero orb (tap = the
 *              negotiation / collect dial), the prominent dual-currency price,
 *              live social proof, and one Collect CTA. Everything that makes a
 *              WeO desirable to engage & collect.
 *   • BACK   = the STORY / OWNERSHIP face — the looping-logo dual-CTA orb
 *              (Resell / Create) dead-centre, and a slide-up details overlay
 *              (about, key terms, what's included, O-tightening, provenance,
 *              passport id — QR only once collected). No price / engagement here — that is the front.
 */
const WEO_VIDEO = '/media/WEO_Logo.webm';

// Illustrated fallback avatar (deterministic per seed) so identity windows are
// never empty in demos. A real `creator.avatar` always wins.
const mockAvatar = (seed: string | number | undefined) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(String(seed || 'weo'))}&radius=50&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf,d1f4d9`;

// Canonical inactive-passport glyph — the pre-collection identity mark. Every
// surface showing an uncollected WeO's unique id uses THIS icon, never a
// QR-lookalike; the QR activates (as the receipt) only once collected.
export function PassportIcon({
  size = 24,
  color = 'var(--text-faint)',
  style,
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <circle cx="8.5" cy="10.3" r="2" />
      <path d="M5.9 15.4a2.7 2.7 0 0 1 5.2 0" />
      <path d="M14 9.6h4M14 12.4h4M14 15.2h2.6" />
    </svg>
  );
}
export function WeOCard({
  name,
  typeLabel,
  id,
  sub: _sub, // accepted for API parity with the design; not drawn by this card
  tone = '#D946EF',
  fill = 'image',
  src,
  logoSrc,
  logoVideoSrc = WEO_VIDEO,
  rarity: _rarity,
  edition: _edition,
  timer,
  creator,
  ask: _ask,
  bids,
  watchers,
  likes,
  trend,
  activeNow,
  // live viewer count → "N active now"
  viewers: _viewers,
  // [{src|initials|seed}] social-proof cluster
  viewersMore: _viewersMore,
  // +N overflow chip on the cluster
  viewingPeople,
  // [{name,src|seed|initials}] — who's viewing now (expandable)
  collectorPeople,
  // [{name,src|seed|initials}] — who's collected (expandable)
  collectorCount,
  // total collectors (if list is truncated)
  terms,
  // [{k,v}] key-terms scoreboard (up to 3)
  termsLabel = 'Key terms',
  oDelta,
  // {fiat, os, rate} — the O-tightening conversion strip
  passport,
  // {label, resale} — provenance strip
  points,
  // [string] "what's included" value bullets
  price,
  // { os, fiat, label } — prominent dual-currency price
  description,
  engageLabel = 'Collect',
  qrData,
  collected = false,
  backTitle = 'WeO details',
  backFacts = [],
  flippable = true,
  initialFace = 'front',
  format = 'card',
  active = false,
  // orb format: focused item in a feed → reveals detail
  selected = false,
  // card format: reveal the deeper engagement layer (else baseline attractors only)
  ctaOnOrb = false,
  // card format: keep the Collect CTA pinned on the orb (focused carousel card)
  w = 300,
  onEngage,
  onResell,
  onCreate,
  style,
  ...rest
}: WeOCardProps) {
  const [face, setFace] = useState(initialFace);
  const [engageHover, setEngageHover] = useState(false);
  const [frontHover, setFrontHover] = useState(false);
  const [duo, setDuo] = useState<'resell' | 'create' | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [orbOpen, setOrbOpen] = useState(false);
  const [orbFace, setOrbFace] = useState('front'); // orb format: front preview ⇄ dual-CTA logo back
  const [justCollected, setJustCollected] = useState(false); // transient collect animation (distinct from the `collected` ownership prop)
  const [peopleTab, setPeopleTab] = useState('viewing'); // expandable social panel
  const [peopleOpen, setPeopleOpen] = useState(false); // expandable social panel disclosure
  const [tip, setTip] = useState(false);
  const [tilt, setTilt] = useState({
    x: -8,
    y: 18,
  });
  const [spatialOpen, setSpatialOpen] = useState(false);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const h = Math.round(w * 1.58);
  const orb = Math.round(w * 0.64);
  const backOrb = Math.round(w * 0.62);
  const flip = () => flippable && setFace((f) => (f === 'front' ? 'back' : 'front'));
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const faceBase: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 30,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card), var(--nm-sm)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };
  const eyebrow: CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10.5,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    fontWeight: 700,
  };

  // ----- shared: creator identity + hover tooltip -----
  const creatorTip = creator && creator.isr != null && (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        top: 'calc(100% + 9px)',
        left: 0,
        width: 214,
        zIndex: 30,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-pop)',
        padding: '12px 13px',
        textAlign: 'left',
        opacity: tip ? 1 : 0,
        transform: `translateY(${tip ? 0 : -4}px)`,
        transition: 'opacity .18s, transform .18s',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -5,
          left: 16,
          width: 10,
          height: 10,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          borderTop: '1px solid var(--border)',
          transform: 'rotate(45deg)',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Avatar
          src={creator.avatar || mockAvatar(creator.name)}
          initials={creator.initials}
          isr={creator.isr}
          size={30}
          tone={isrStage(creator.isr).color}
        />
        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {creator.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9.5,
              color: isrStage(creator.isr).color,
              fontWeight: 700,
            }}
          >
            {'ISR '}
            {creator.isr}
            {' \xB7 '}
            {isrStage(creator.isr).label}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 11.5,
          lineHeight: 1.5,
          color: 'var(--text-dim)',
        }}
      >
        {creator.summary || 'Verified WeO creator on the network.'}
      </div>
      {(creator.trades != null || creator.joined) && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-faint)',
          }}
        >
          {creator.trades != null && (
            <span>
              <b
                style={{
                  color: 'var(--text)',
                }}
              >
                {creator.trades}
              </b>
              {' trades'}
            </span>
          )}
          {creator.joined && (
            <span>
              {'since '}
              {creator.joined}
            </span>
          )}
        </div>
      )}
    </div>
  );
  const creatorRow = (size = 34) =>
    creator && (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          minWidth: 0,
        }}
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        onClick={(e) => {
          stop(e);
          setTip((t) => !t);
        }}
      >
        <Avatar
          src={creator.avatar || mockAvatar(creator.name)}
          initials={creator.initials}
          isr={creator.isr}
          size={size}
          tone={isrStage(creator.isr || 0).color}
        />
        <div
          style={{
            lineHeight: 1.2,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {creator.name}
          </div>
          {creator.isr != null && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-faint)',
              }}
            >
              {'ISR '}
              {creator.isr}
              {' \xB7 '}
              {isrStage(creator.isr).label}
            </div>
          )}
        </div>
        {creatorTip}
      </div>
    );

  // The unique id only becomes a scannable QR (receipt) AFTER collection. Before
  // that it is represented by the inactive passport icon — never a QR-lookalike
  // that could be mistaken for a retrievable code.
  const qrSrc = useQrDataUrl(collected && qrData ? qrData : null);
  const passportIcon = (sz: number) => <PassportIcon size={sz} />;
  const flipBtn = (icon: ReactNode, aria: string) => (
    <button
      onClick={(e) => {
        stop(e);
        flip();
      }}
      aria-label={aria}
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        flex: 'none',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-sm)',
        color: 'var(--text-dim)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        opacity: 0.6,
        transition: 'opacity .2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
    >
      {icon}
    </button>
  );

  // ----- FRONT (sales) parts: price + social proof -----
  const priceBlock = price && (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 9,
        width: '100%',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 800,
          fontSize: 27,
          letterSpacing: '-.02em',
          color: tone,
          lineHeight: 1,
        }}
      >
        <OMark size="0.72em" />
        {price.os}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13.5,
          fontWeight: 700,
          color: 'var(--text-dim)',
        }}
      >
        {'\u2248 '}
        {price.fiat}
      </span>
    </div>
  );
  const _social = (
    [
      bids != null
        ? {
            k: 'bids',
            v: bids,
          }
        : null,
      watchers != null
        ? {
            k: 'watching',
            v: watchers,
          }
        : null,
      likes != null
        ? {
            k: 'likes',
            v: likes,
          }
        : null,
      trend != null
        ? {
            k: '7d',
            v: trend,
            c: String(trend).trim().startsWith('-') ? '#FF5A2C' : '#22C55E',
          }
        : null,
    ] as ({ k: string; v: ReactNode; c?: string } | null)[]
  ).filter((s): s is { k: string; v: ReactNode; c?: string } => s !== null);
  const socialStrip = _social.length > 0 && (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${_social.length}, 1fr)`,
        gap: 6,
        width: '100%',
      }}
    >
      {_social.map((s, i) => (
        <div
          key={i}
          style={{
            textAlign: 'center',
            borderRadius: 12,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
            padding: '9px 4px',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: 14.5,
              letterSpacing: '-.01em',
              color: s.c || 'var(--text)',
            }}
          >
            {s.v}
          </div>
          <div
            style={{
              ...eyebrow,
              fontSize: 7.5,
              color: 'var(--text-faint)',
              marginTop: 2,
            }}
          >
            {s.k}
          </div>
        </div>
      ))}
    </div>
  );
  const collectBtn = (label?: ReactNode) => (
    <button
      onClick={(e) => {
        stop(e);
        onEngage?.();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        width: '100%',
        padding: '13px 0',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 14,
        color: '#fff',
        background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 88%, #fff), ${tone})`,
        boxShadow: `0 12px 26px -10px color-mix(in srgb, ${tone} 75%, transparent)`,
      }}
    >
      {label || engageLabel} <span aria-hidden>→</span>
    </button>
  );

  // ----- BACK (story) parts: labelled detail blocks (no price/engagement) -----
  const aboutBlock = description && (
    <div>
      <div
        style={{
          ...eyebrow,
          fontSize: 8.5,
          color: 'var(--text-faint)',
          marginBottom: 5,
        }}
      >
        About
      </div>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.55,
          color: 'var(--text-dim)',
        }}
      >
        {description}
      </div>
    </div>
  );
  const termsBlock = terms && terms.length > 0 && (
    <div>
      <div
        style={{
          ...eyebrow,
          fontSize: 8.5,
          color: 'var(--text-faint)',
          marginBottom: 6,
        }}
      >
        {termsLabel}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(3, terms.length)}, 1fr)`,
          gap: 4,
          borderRadius: 14,
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
          padding: '10px 6px',
        }}
      >
        {terms.slice(0, 3).map((t, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              borderLeft: i ? '1px solid var(--border)' : 'none',
            }}
          >
            <div
              style={{
                ...eyebrow,
                fontSize: 8,
                color: 'var(--text-faint)',
                marginBottom: 3,
              }}
            >
              {t.k}
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: tone,
              }}
            >
              {t.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const includedBlock = points && points.length > 0 && (
    <div>
      <div
        style={{
          ...eyebrow,
          fontSize: 8.5,
          color: 'var(--text-faint)',
          marginBottom: 6,
        }}
      >
        What’s included
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {points.slice(0, 5).map((p, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 12,
              lineHeight: 1.4,
              color: 'var(--text)',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tone}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                flex: 'none',
                marginTop: 1,
              }}
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
  // Expandable social panel — WHO is viewing now and WHO has collected.
  const _viewing = viewingPeople || [];
  const _collectors = collectorPeople || [];
  const peopleBlock =
    (_viewing.length > 0 || _collectors.length > 0) &&
    (() => {
      const list = peopleTab === 'viewing' ? _viewing : _collectors;
      const tabs = (
        [
          _viewing.length > 0 && [
            'viewing',
            `${activeNow != null ? activeNow : _viewing.length} viewing`,
            '#3A95F2',
          ],
          _collectors.length > 0 && [
            'collectors',
            `${collectorCount != null ? collectorCount : _collectors.length} collected`,
            '#22C55E',
          ],
        ] as (false | [string, string, string])[]
      ).filter((t): t is [string, string, string] => t !== false);
      const tabTone = peopleTab === 'viewing' ? '#3A95F2' : '#22C55E';
      const nView = activeNow != null ? activeNow : _viewing.length;
      const nColl = collectorCount != null ? collectorCount : _collectors.length;
      return (
        <div
          style={{
            width: '100%',
            borderRadius: 12,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={(e) => {
              stop(e);
              setPeopleOpen((v) => !v);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <div
              style={{
                display: 'flex',
              }}
            >
              {(_viewing.length ? _viewing : _collectors).slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  style={{
                    marginLeft: i ? -8 : 0,
                    borderRadius: '50%',
                    boxShadow: '0 0 0 2px var(--surface-2)',
                  }}
                >
                  <Avatar src={p.src || mockAvatar(p.seed || p.name || i)} initials={p.initials} size={22} />
                </div>
              ))}
            </div>
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--text-dim)',
              }}
            >
              <span
                style={{
                  color: '#3A95F2',
                }}
              >
                {nView}
                {' viewing'}
              </span>
              {' \xB7 '}
              <span
                style={{
                  color: '#22C55E',
                }}
              >
                {nColl}
                {' collected'}
              </span>
            </span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color: 'var(--text-faint)',
                transform: `rotate(${peopleOpen ? 180 : 0}deg)`,
                transition: 'transform .25s',
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div
            style={{
              maxHeight: peopleOpen ? 260 : 0,
              opacity: peopleOpen ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height .38s var(--ease-portal, cubic-bezier(.22,1,.36,1)), opacity .25s',
            }}
          >
            <div
              style={{
                padding: '0 10px 11px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  padding: 4,
                  borderRadius: 999,
                  background: 'var(--surface)',
                  boxShadow: 'var(--nm-inset)',
                  marginBottom: 9,
                }}
              >
                {tabs.map(([k, lbl, c]) => (
                  <button
                    key={k}
                    onClick={(e) => {
                      stop(e);
                      setPeopleTab(k);
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 999,
                      padding: '7px 6px',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      fontSize: 11.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      color: peopleTab === k ? '#fff' : 'var(--text-dim)',
                      background: peopleTab === k ? c : 'transparent',
                      boxShadow: peopleTab === k ? `0 6px 14px -6px ${c}` : 'none',
                      transition: 'all .2s',
                    }}
                  >
                    {k === 'viewing' && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: peopleTab === k ? '#fff' : c,
                          boxShadow: peopleTab === k ? '0 0 6px #fff' : 'none',
                        }}
                      />
                    )}
                    {lbl}
                  </button>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {list.slice(0, 4).map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                    }}
                  >
                    <Avatar
                      src={p.src || mockAvatar(p.seed || p.name || i)}
                      initials={p.initials}
                      size={26}
                    />
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--text)',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.name}
                    </span>
                    {p.note && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          color: 'var(--text-faint)',
                        }}
                      >
                        {p.note}
                      </span>
                    )}
                  </div>
                ))}
                {list.length > 4 && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      color: tabTone,
                      paddingLeft: 35,
                    }}
                  >
                    +{list.length - 4}
                    {' more'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })();
  const oDeltaBlock = oDelta && (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        borderRadius: 12,
        border: `1px solid color-mix(in srgb, ${tone} 40%, transparent)`,
        background: `color-mix(in srgb, ${tone} 8%, var(--surface))`,
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke={tone}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M21 7v5h-5" />
      </svg>
      <span
        style={{
          color: 'var(--text)',
        }}
      >
        {oDelta.fiat}{' '}
        <span
          style={{
            opacity: 0.5,
          }}
        >
          ≈
        </span>{' '}
        <span
          style={{
            color: tone,
          }}
        >
          {oDelta.os}
        </span>
      </span>
      {oDelta.rate && (
        <span
          style={{
            color: 'var(--text-faint)',
          }}
        >
          {'\xB7 '}
          {oDelta.rate}
        </span>
      )}
    </div>
  );
  const factsBlock = backFacts.length > 0 && (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 8,
      }}
    >
      {backFacts.map((f, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
            fontSize: 12.5,
            padding: '4px 0',
          }}
        >
          <span
            style={{
              color: 'var(--text-faint)',
            }}
          >
            {f.k}
          </span>
          <span
            style={{
              color: 'var(--text)',
              fontWeight: 600,
            }}
          >
            {f.v}
          </span>
        </div>
      ))}
    </div>
  );
  const passportBlock = passport && (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        padding: '9px 12px',
        borderRadius: 12,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      <span
        style={{
          ...eyebrow,
          fontSize: 9,
          color: tone,
        }}
      >
        Passport
      </span>
      <span
        style={{
          color: 'var(--text-dim)',
        }}
      >
        {passport.label || 'Verified original'}
      </span>
      {passport.resale && (
        <span
          style={{
            marginLeft: 'auto',
            color: 'var(--text-faint)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}
        >
          {'Resale '}
          {passport.resale}
        </span>
      )}
    </div>
  );
  const detailStack = (
    <>
      {aboutBlock}
      {oDeltaBlock}
      {termsBlock}
      {includedBlock}
      {passportBlock}
      {factsBlock}
    </>
  );
  const hasDetails = !!(
    aboutBlock ||
    termsBlock ||
    includedBlock ||
    oDeltaBlock ||
    passportBlock ||
    factsBlock
  );

  // ----- shared: the looping-logo dual-function CTA orb (Resell top / Create bottom) -----
  const logoCTA = (size: number) => (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: 'pointer',
        flex: 'none',
      }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setDuo(e.clientY - r.top < r.height / 2 ? 'resell' : 'create');
      }}
      onMouseLeave={() => setDuo(null)}
      onClick={(e) => {
        stop(e);
        if (duo === 'create') onCreate?.();
        else onResell?.();
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size + 28,
          height: size + 28,
          transform: `translate(-50%,-50%) scale(${duo === 'resell' ? 1.05 : 1})`,
          borderRadius: '50%',
          clipPath: 'inset(0 0 51% 0)',
          background:
            duo === 'resell'
              ? `linear-gradient(180deg, color-mix(in srgb, ${tone} 60%, #fff), ${tone})`
              : `color-mix(in srgb, ${tone} 40%, var(--surface-3))`,
          WebkitMask: 'radial-gradient(circle, transparent 60%, #000 61%, #000 72%, transparent 73%)',
          mask: 'radial-gradient(circle, transparent 60%, #000 61%, #000 72%, transparent 73%)',
          boxShadow: duo === 'resell' ? `0 -6px 16px -6px ${tone}` : 'none',
          transition: 'background .2s, transform .25s',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size + 28,
          height: size + 28,
          transform: `translate(-50%,-50%) scale(${duo === 'create' ? 1.05 : 1})`,
          borderRadius: '50%',
          clipPath: 'inset(51% 0 0 0)',
          background:
            duo === 'create'
              ? `linear-gradient(0deg, color-mix(in srgb, ${tone} 60%, #fff), ${tone})`
              : `color-mix(in srgb, ${tone} 26%, var(--surface-3))`,
          WebkitMask: 'radial-gradient(circle, transparent 60%, #000 61%, #000 72%, transparent 73%)',
          mask: 'radial-gradient(circle, transparent 60%, #000 61%, #000 72%, transparent 73%)',
          boxShadow: duo === 'create' ? `0 6px 16px -6px ${tone}` : 'none',
          transition: 'background .2s, transform .25s',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: `inset 0 0 0 3px color-mix(in srgb, ${tone} 40%, transparent)`,
          background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${tone} 18%, #0b1020), #0b1020)`,
        }}
      >
        <video
          src={logoVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '152%',
            height: '152%',
            transform: 'translate(-50%,-50%)',
            objectFit: 'cover',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 36% 28%, rgba(255,255,255,.4), transparent 42%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: duo ? 0 : 1,
            transition: 'opacity .2s',
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,.3), rgba(0,0,0,.24) 70%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.45)',
              color: '#fff',
              fontSize: 14,
              textShadow: '0 1px 3px rgba(0,0,0,.6)',
            }}
          >
            ⇅
          </span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -15,
          transform: `translateX(-50%) translateY(${duo === 'resell' ? 0 : 4}px)`,
          padding: '5px 11px',
          borderRadius: 8,
          background: 'var(--text)',
          color: 'var(--bg-a)',
          fontWeight: 600,
          fontSize: 10.5,
          whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-pop)',
          opacity: duo === 'resell' ? 0.94 : 0,
          transition: 'opacity .2s, transform .2s',
          pointerEvents: 'none',
        }}
      >
        Resell
        <span
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -3,
            width: 7,
            height: 7,
            background: 'var(--text)',
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -15,
          transform: `translateX(-50%) translateY(${duo === 'create' ? 0 : -4}px)`,
          padding: '5px 11px',
          borderRadius: 8,
          background: 'var(--text)',
          color: 'var(--bg-a)',
          fontWeight: 600,
          fontSize: 10.5,
          whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-pop)',
          opacity: duo === 'create' ? 0.94 : 0,
          transition: 'opacity .2s, transform .2s',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: -3,
            width: 7,
            height: 7,
            background: 'var(--text)',
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
        Create a WeO
      </div>
    </div>
  );

  // ----- shared: the hero orb + full-circumference color drop-shadow border (engage state, front & orb formats) -----
  const heroOrb = (size: number, hovered: boolean) => (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '52%',
          width: size * 0.7,
          height: size * 0.15,
          transform: `translateX(-50%) translateY(${hovered ? 12 : 8}px) scale(${hovered ? 1.2 : 1})`,
          background: `radial-gradient(ellipse, rgba(15,30,70,${hovered ? 0.34 : 0.28}), transparent 70%)`,
          filter: 'blur(9px)',
          transition: 'transform .55s var(--ease-settle, cubic-bezier(.16,1,.3,1)), background .3s',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size + 24,
          height: size + 24,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          border: '1.5px solid var(--border)',
          opacity: hovered ? 0 : 0.7,
          transition: 'opacity .25s',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: size + 24,
          height: size + 24,
          transform: `translate(-50%,-50%) scale(${hovered ? 1 : 0.96})`,
          borderRadius: '50%',
          boxShadow: `0 0 0 1.5px ${tone}, 0 0 30px -2px ${tone}, inset 0 0 16px -8px ${tone}`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity .3s, transform .5s var(--ease-settle, cubic-bezier(.16,1,.3,1))',
          pointerEvents: 'none',
        }}
      />
      <Orb
        size={size}
        fill={fill}
        src={src}
        logoSrc={logoSrc}
        matcap
        ring
        ringColor={tone}
        style={{
          cursor: 'pointer',
          transform: hovered ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)',
          transition: 'transform .55s var(--ease-settle, cubic-bezier(.16,1,.3,1))',
        }}
      />
    </div>
  );

  // ---------- SPATIAL / 3D FORMAT ----------
  if (format === 'spatial') {
    const sSize = Math.round(w * 0.6);
    const onDown = (e: PointerEvent<HTMLDivElement>) => {
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        tx: tilt.x,
        ty: tilt.y,
        moved: false,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture is best-effort (unsupported on some touch sims)
      }
    };
    const onMove = (e: PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d) return;
      if (Math.abs(e.clientX - d.x) > 4 || Math.abs(e.clientY - d.y) > 4) d.moved = true;
      setTilt({
        x: Math.max(-40, Math.min(40, d.tx - (e.clientY - d.y) * 0.4)),
        y: d.ty + (e.clientX - d.x) * 0.4,
      });
    };
    const onUp = () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (d && !d.moved) setSpatialOpen((o) => !o);
    };
    return (
      <div
        style={{
          width: w,
          position: 'relative',
          fontFamily: 'var(--font-sans)',
          ...style,
        }}
        {...rest}
      >
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{
            position: 'relative',
            width: w,
            height: Math.round(w * 1.02),
            perspective: 1100,
            cursor: dragRef.current && dragRef.current.moved ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '13%',
              width: w * 1.2,
              height: w * 0.55,
              transform: 'translateX(-50%) rotateX(70deg)',
              backgroundImage: `linear-gradient(color-mix(in srgb, ${tone} 26%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, ${tone} 26%, transparent) 1px, transparent 1px)`,
              backgroundSize: '26px 26px',
              WebkitMaskImage: 'radial-gradient(closest-side, #000, transparent)',
              maskImage: 'radial-gradient(closest-side, #000, transparent)',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '17%',
              width: sSize * 0.82,
              height: sSize * 0.17,
              transform: `translateX(-50%) scale(${spatialOpen ? 0.82 : 1})`,
              background: 'radial-gradient(ellipse, rgba(10,20,50,.42), transparent 70%)',
              filter: 'blur(10px)',
              pointerEvents: 'none',
              transition: 'transform .45s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: spatialOpen ? '27%' : '43%',
              zIndex: 2,
              transformStyle: 'preserve-3d',
              transform: `translate(-50%,-50%) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${spatialOpen ? 0.72 : 1})`,
              transition: dragRef.current
                ? 'top .1s'
                : 'transform .45s var(--ease-portal, cubic-bezier(.22,1,.36,1)), top .45s var(--ease-portal, cubic-bezier(.22,1,.36,1))',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: sSize,
                height: sSize,
                borderRadius: '50%',
                overflow: 'hidden',
                background: `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${tone} 34%, #0b1020), #0b1020)`,
                boxShadow: `0 ${Math.round(sSize * 0.12)}px ${Math.round(sSize * 0.22)}px -${Math.round(sSize * 0.08)}px rgba(0,0,0,.55), inset -${Math.round(sSize * 0.14)}px -${Math.round(sSize * 0.16)}px ${Math.round(sSize * 0.3)}px rgba(3,8,25,.6), inset ${Math.round(sSize * 0.06)}px ${Math.round(sSize * 0.05)}px ${Math.round(sSize * 0.13)}px rgba(255,255,255,.18)`,
              }}
            >
              {src && (
                <div
                  style={{
                    position: 'absolute',
                    inset: `-${Math.round(sSize * 0.28)}px`,
                    backgroundImage: `url(${src})`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: 'auto 118%',
                    backgroundPosition: `${tilt.y * 1.5}px ${-tilt.x * 1.5}px`,
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 33% 25%, rgba(255,255,255,.6), rgba(255,255,255,.12) 24%, transparent 48%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 50% 48%, transparent 50%, rgba(3,8,25,.5) 86%, rgba(3,8,25,.78) 100%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${tone} 55%, transparent)`,
                  pointerEvents: 'none',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: sSize + 40,
                height: sSize + 40,
                transform: 'translate(-50%,-50%) rotateX(80deg)',
                borderRadius: '50%',
                border: `2px solid color-mix(in srgb, ${tone} 45%, transparent)`,
                pointerEvents: 'none',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '7%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              opacity: spatialOpen ? 0 : 1,
              transition: 'opacity .3s',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 15px',
                borderRadius: 999,
                background: 'var(--glass)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--nm-sm)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: tone,
                  boxShadow: `0 0 7px ${tone}`,
                }}
              />
              <span
                style={{
                  ...eyebrow,
                  fontSize: 8,
                  color: 'var(--text-dim)',
                }}
              >
                Tap to view · drag to rotate
              </span>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '5%',
              transform: `translateX(-50%) translateY(${spatialOpen ? 0 : 16}px) scale(${spatialOpen ? 1 : 0.94})`,
              width: Math.min(w - 22, 300),
              opacity: spatialOpen ? 1 : 0,
              pointerEvents: spatialOpen ? 'auto' : 'none',
              transition: 'opacity .35s, transform .42s var(--ease-portal, cubic-bezier(.22,1,.36,1))',
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: 22,
                background: 'var(--glass)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-pop)',
                padding: '15px 16px 17px',
                display: 'flex',
                flexDirection: 'column',
                gap: 11,
              }}
            >
              <button
                onClick={(e) => {
                  stop(e);
                  setSpatialOpen(false);
                }}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--surface-2)',
                  boxShadow: 'var(--nm-sm)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ✕
              </button>
              <div>
                <div
                  style={{
                    ...eyebrow,
                    fontSize: 9,
                    color: tone,
                  }}
                >
                  {typeLabel || 'WeO'}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 17,
                    letterSpacing: '-.02em',
                    color: 'var(--text)',
                    marginTop: 3,
                  }}
                >
                  {name}
                </div>
              </div>
              {priceBlock}
              {socialStrip}
              {peopleBlock}
              {description && (
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--text-dim)',
                  }}
                >
                  {description}
                </div>
              )}
              {collectBtn()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ORB FORMAT ----------
  // Feed / map / AR hero: at rest the orb IS the WeO (orb + name + price only).
  // On engage (hover / tap / active) it TRANSFORMS into the card layout — the
  // frame grows in with identity above and the info card below, the orb held in
  // the visual centre throughout, for format consistency with the card.
  if (format === 'orb') {
    const oSize = Math.round(w * 0.82);
    const reveal = active || orbOpen || engageHover;
    const doCollect = (e: { stopPropagation: () => void }) => {
      stop(e);
      setJustCollected(true);
      onEngage?.();
      setTimeout(() => setJustCollected(false), 2600);
    };
    return (
      <div
        style={{
          width: w,
          position: 'relative',
          zIndex: reveal ? 30 : 1,
          fontFamily: 'var(--font-sans)',
          ...style,
        }}
        {...rest}
      >
        <div
          onMouseEnter={() => setEngageHover(true)}
          onMouseLeave={() => setEngageHover(false)}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: reveal ? 'space-between' : 'center',
            borderRadius: 30,
            overflow: 'visible',
            minHeight: reveal ? Math.round(w * 1.5) : oSize,
            background: reveal ? 'var(--surface)' : 'transparent',
            border: reveal ? '1px solid var(--border)' : '1px solid transparent',
            boxShadow: reveal ? 'var(--shadow-card), var(--nm-sm)' : 'none',
            padding: reveal ? '16px 16px 18px' : '0',
            transition:
              'background .35s, box-shadow .35s, border-color .35s, padding .38s var(--ease-portal, cubic-bezier(.22,1,.36,1)), min-height .4s var(--ease-portal, cubic-bezier(.22,1,.36,1))',
          }}
        >
          {reveal && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 30,
                background: `radial-gradient(120% 55% at 50% 3%, color-mix(in srgb, ${tone} 12%, transparent), transparent 50%)`,
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              width: '100%',
              position: 'relative',
              zIndex: 3,
              maxHeight: reveal ? 120 : 0,
              opacity: reveal ? 1 : 0,
              overflow: 'visible',
              transition: 'max-height .4s var(--ease-portal, cubic-bezier(.22,1,.36,1)), opacity .3s',
              pointerEvents: reveal ? 'auto' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                minHeight: 32,
              }}
            >
              {creator ? (
                creatorRow(30)
              ) : (
                <span
                  style={{
                    ...eyebrow,
                    color: tone,
                  }}
                >
                  {typeLabel}
                </span>
              )}
              <button
                onClick={(e) => {
                  stop(e);
                  setOrbFace((f) => (f === 'front' ? 'back' : 'front'));
                }}
                aria-label="Flip orb"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  boxShadow: 'var(--nm-sm)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: 15,
                  flex: 'none',
                }}
              >
                ↻
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                marginTop: 10,
              }}
            >
              {creator && (
                <span
                  style={{
                    ...eyebrow,
                    color: tone,
                  }}
                >
                  {typeLabel}
                </span>
              )}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: '-.025em',
                  color: 'var(--text)',
                  textAlign: 'center',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </div>
            </div>
          </div>
          <div
            style={{
              flex: reveal ? 1 : 'none',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2,
              minHeight: 0,
            }}
          >
            {orbFace === 'back' ? (
              <div
                style={{
                  position: 'relative',
                  width: oSize,
                  height: oSize,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {logoCTA(Math.round(oSize * 0.82))}
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  width: oSize,
                  height: oSize,
                  display: 'grid',
                  placeItems: 'center',
                }}
                onClick={(e) => {
                  stop(e);
                  setOrbOpen((o) => !o);
                }}
              >
                {heroOrb(oSize, reveal)}
                {reveal && !justCollected && (
                  <button
                    onClick={doCollect}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 2,
                      transform: 'translateX(-50%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 88%, #fff), ${tone})`,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12.5,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 10px 22px -8px color-mix(in srgb, ${tone} 70%, transparent)`,
                      zIndex: 4,
                      animation: 'weo-pop .3s ease',
                    }}
                  >
                    {engageLabel} <span aria-hidden>→</span>
                  </button>
                )}
                {justCollected &&
                  [0, 1, 2].map((r) => (
                    <div
                      key={r}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: oSize * 0.9,
                        height: oSize * 0.9,
                        marginLeft: -oSize * 0.45,
                        marginTop: -oSize * 0.45,
                        borderRadius: '50%',
                        border: `2px solid ${tone}`,
                        animation: `weo-ping 1.6s ease-out ${r * 0.45}s 1`,
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                {justCollected && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '9px 17px',
                        borderRadius: 999,
                        background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 88%, #fff), ${tone})`,
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 13.5,
                        boxShadow: `0 12px 28px -10px ${tone}`,
                        animation: 'weo-pop .4s cubic-bezier(.34,1.4,.5,1) both',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Collected
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div
            style={{
              width: '100%',
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {!reveal && (
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: '-.02em',
                  color: 'var(--text)',
                  textAlign: 'center',
                }}
              >
                {name}
              </div>
            )}
            {priceBlock}
            <div
              style={{
                width: '100%',
                maxHeight: reveal ? 320 : 0,
                opacity: reveal ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height .6s var(--ease-settle, cubic-bezier(.16,1,.3,1)), opacity .35s',
              }}
            >
              {orbFace === 'back' ? (
                (qrSrc || id) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '10px 13px',
                      borderRadius: 14,
                      background: 'var(--surface-2)',
                      boxShadow: 'var(--nm-inset)',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        flex: 'none',
                        borderRadius: 9,
                        background: qrSrc ? '#fff' : 'var(--surface)',
                        padding: 4,
                        boxShadow: 'var(--nm-inset)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {qrSrc ? (
                        <img
                          src={qrSrc}
                          alt="WeO QR"
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                        />
                      ) : (
                        passportIcon(26)
                      )}
                    </div>
                    <div
                      style={{
                        minWidth: 0,
                        textAlign: 'left',
                      }}
                    >
                      {id && (
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: 'var(--text-dim)',
                            wordBreak: 'break-all',
                          }}
                        >
                          {id}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-faint)',
                          marginTop: 2,
                        }}
                      >
                        {qrSrc ? 'Your receipt — scan to verify' : 'Passport · QR activates on collection'}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    paddingTop: 2,
                  }}
                >
                  {socialStrip}
                  {peopleBlock}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- CARD FORMAT (front / back flip) ----------
  return (
    <div
      style={{
        width: w,
        height: h,
        perspective: 1300,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: face === 'back' ? 'rotateY(180deg)' : 'rotateY(0)',
          transition: 'transform .6s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div
          style={{
            ...faceBase,
            display: 'flex',
            flexDirection: 'column',
            // WeOverse fix: the hidden face must not catch clicks meant for the face you see
            pointerEvents: face === 'back' ? 'none' : 'auto',
          }}
          onClick={flip}
          role="button"
          aria-label="Flip for WeO details"
          onMouseEnter={() => setFrontHover(true)}
          onMouseLeave={() => setFrontHover(false)}
        >
          {(() => {
            const engaged = selected || frontHover || engageHover;
            return (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 30,
                    background: `radial-gradient(120% 60% at 50% 4%, color-mix(in srgb, ${tone} 14%, transparent), transparent 52%)`,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    zIndex: 6,
                    padding: '14px 16px 0',
                    flex: 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 34,
                    }}
                  >
                    {creator ? (
                      creatorRow(32)
                    ) : (
                      <span
                        style={{
                          ...eyebrow,
                          color: tone,
                        }}
                      >
                        {typeLabel}
                      </span>
                    )}
                    {flippable ? (
                      flipBtn('\u21BB', 'Flip for details')
                    ) : (
                      <div
                        style={{
                          width: 30,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 12,
                    }}
                  >
                    {creator && (
                      <span
                        style={{
                          ...eyebrow,
                          color: tone,
                        }}
                      >
                        {typeLabel}
                      </span>
                    )}
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 23,
                        letterSpacing: '-.025em',
                        color: 'var(--text)',
                        lineHeight: 1.1,
                        textAlign: 'center',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </div>
                    {timer && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: tone,
                        }}
                      >
                        {timer}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    display: 'grid',
                    placeItems: 'center',
                    minHeight: orb,
                    padding: '10px 0',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      display: 'grid',
                      placeItems: 'center',
                      zIndex: 5,
                    }}
                    onClick={(e) => {
                      stop(e);
                      onEngage?.();
                    }}
                    onMouseEnter={() => setEngageHover(true)}
                    onMouseLeave={() => setEngageHover(false)}
                  >
                    {heroOrb(orb, engageHover)}
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: -8,
                        transform: `translateX(-50%) translateY(${engageHover || ctaOnOrb ? 0 : 6}px)`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 999,
                        background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 88%, #fff), ${tone})`,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12.5,
                        whiteSpace: 'nowrap',
                        boxShadow: `0 10px 22px -8px color-mix(in srgb, ${tone} 70%, transparent)`,
                        opacity: engageHover || ctaOnOrb ? 1 : 0,
                        transition: 'opacity .2s, transform .2s',
                        pointerEvents: 'none',
                      }}
                    >
                      {engageLabel} <span aria-hidden>→</span>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    flex: 'none',
                    position: 'relative',
                    zIndex: 6,
                    padding: '0 14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {priceBlock}
                  <div
                    style={{
                      maxHeight: engaged ? 300 : 0,
                      opacity: engaged ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height .6s var(--ease-settle, cubic-bezier(.16,1,.3,1)), opacity .35s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {socialStrip}
                    {peopleBlock}
                  </div>
                  {!engaged && hasDetails && flippable && (
                    <div
                      style={{
                        ...eyebrow,
                        fontSize: 9,
                        color: 'var(--text-faint)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      Hover for engagement · flip for details
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
        <div
          style={{
            ...faceBase,
            pointerEvents: face === 'back' ? 'auto' : 'none',
            transform: 'rotateY(180deg)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={stop}
          role="group"
          aria-label="WeO details"
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 30,
              background: `radial-gradient(120% 55% at 50% 4%, color-mix(in srgb, ${tone} 12%, transparent), transparent 46%)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
              padding: '15px 15px 0',
            }}
          >
            {creatorRow(30) || (
              <span
                style={{
                  ...eyebrow,
                  color: tone,
                }}
              >
                {backTitle}
              </span>
            )}
            {flippable && flipBtn('\u2039', 'Back to WeO')}
          </div>
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: '6px 16px',
              minHeight: 0,
            }}
          >
            {logoCTA(backOrb)}
            <div
              style={{
                ...eyebrow,
                fontSize: 9,
                color: 'var(--text-faint)',
              }}
            >
              Resell · Create a WeO
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: '-.02em',
                color: 'var(--text)',
                textAlign: 'center',
              }}
            >
              {name}
            </div>
            {hasDetails && (
              <button
                onClick={(e) => {
                  stop(e);
                  setDetailsOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  boxShadow: 'var(--nm-sm)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: 'var(--text-dim)',
                }}
              >
                View details
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            )}
          </div>
          <div
            style={{
              position: 'relative',
              zIndex: 6,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '10px 16px 13px',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                flex: 'none',
                borderRadius: 10,
                background: qrSrc ? '#fff' : 'var(--surface-2)',
                padding: 4,
                boxShadow: 'var(--nm-inset)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="WeO QR"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              ) : (
                passportIcon(28)
              )}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              {id && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    color: 'var(--text-dim)',
                    wordBreak: 'break-all',
                    marginBottom: 2,
                  }}
                >
                  {id}
                </div>
              )}
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-faint)',
                }}
              >
                {qrSrc
                  ? 'Your receipt — scan to verify · unique on the network'
                  : 'Passport · becomes a scannable receipt when collected'}
              </div>
            </div>
          </div>
          {hasDetails && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 14,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--surface)',
                borderRadius: 30,
                transform: detailsOpen ? 'translateY(0)' : 'translateY(101%)',
                transition: 'transform .42s var(--ease-portal, cubic-bezier(.22,1,.36,1))',
                boxShadow: detailsOpen ? '0 -18px 40px -20px rgba(10,20,50,.4)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px 16px 10px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    ...eyebrow,
                    fontSize: 10,
                    color: tone,
                  }}
                >
                  {backTitle}
                </span>
                <button
                  onClick={(e) => {
                    stop(e);
                    setDetailsOpen(false);
                  }}
                  aria-label="Close details"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    boxShadow: 'var(--nm-sm)',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  ✕
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '13px 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 13,
                }}
              >
                {detailStack}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '10px 16px 14px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={(e) => {
                    stop(e);
                    onResell?.();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#fff',
                    background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 88%, #fff), ${tone})`,
                  }}
                >
                  Resell
                </button>
                <button
                  onClick={(e) => {
                    stop(e);
                    onCreate?.();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    color: 'var(--text)',
                    background: 'var(--surface-2)',
                    boxShadow: 'var(--nm-sm)',
                  }}
                >
                  Create a WeO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
