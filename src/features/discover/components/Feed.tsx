import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { useViewPrefs } from '@/components/hero/ViewBar';
import { type SegItem } from '@/components/layout/SectionMark';
import { useWeoView } from '@/components/weo/WeoView';
import { Avatar, Chip, OMark, Orb, svg, WeOverseLettering } from '@/design-system';
import { MARK_O, MARK_VERSE } from '@/design-system';
import { FEED_KIND, FEED_KINDS, type FeedKind } from '@/lib/feedKinds';
import { cardModel } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { glide } from '@/lib/glide';
import { useWeos, type WeoListParams } from '@/features/weo/api/weos';
import { openCollect } from '@/stores/flow';
import { FEED_PER, useFeedPage } from '../api/discover';
import { coverLine, feedItemModel, URGENCY, weoFeedItem, type FeedItemModel } from '../model/feed';
import s from './Feed.module.css';
import { cssUrl } from '@/lib/cssUrl';

/*
 * design: discover.jsx — FeedCover, FeedCard, FeedRow, FeedBoard (feed-cover.jsx / feed-view.jsx).
 * The items come from `GET /frontend/feed`, already ranked by the backend's weight.
 */

const COVER_ROTATE_MS = 9000;
const MAST_H = 34;
/** The O sits 45.7 units into the 171.4-unit lockup, so the text column starts under it. */
const COVER_INDENT = Math.round((MARK_O.x - MARK_VERSE.x) * (MAST_H / MARK_VERSE.h));

/** "Week of 28 Sep 2026" — the Monday of this week. */
export function weekOf(now: number = Date.now()): string {
  const d = new Date(now);
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return `Week of ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

const Readout = ({ text, size }: { text: string; size: number }) =>
  /^O\s/.test(text) ? (
    <>
      <OMark size={size} /> {text.replace(/^O\s/, '')}
    </>
  ) : (
    <>{text}</>
  );

function useOpen() {
  const navigate = useNavigate();
  return (it: FeedItemModel) => void navigate(it.to);
}

export function FeedCover({ items }: { items: FeedItemModel[] }) {
  const open = useOpen();
  const navigate = useNavigate();
  const pool = useMemo(
    () =>
      items
        .filter((i) => i.img)
        .slice()
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3),
    [items],
  );
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  const calm = useRef(
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (hold || calm.current || pool.length < 2) return;
    const t = setTimeout(() => setAt((a) => (a + 1) % pool.length), COVER_ROTATE_MS);
    return () => clearTimeout(t);
  }, [at, hold, pool.length]);

  const it = pool[at] ?? items[0];
  if (!it) return null;
  const tone = it.tone;
  const live = items.filter((i) => i.kind === 'weo').length;
  const inMotion = items.reduce((s, i) => s + (i.kind === 'weo' ? (i.os ?? 0) : 0), 0);

  return (
    <section
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      data-screen-label="Feed cover"
      style={{
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 18,
        borderRadius: 'clamp(26px,2.6vw,36px)',
        // v4: a shorter cover
        minHeight: 'clamp(300px, 30vw, 400px)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        padding: 'clamp(18px,2.2vw,30px)',
        color: '#fff',
        background: '#0b0e18',
        boxShadow: `var(--shadow-card), inset 0 0 0 1px color-mix(in srgb, ${tone} 34%, transparent)`,
      }}
    >
      {/* the photograph — the deepest layer, cross-faded, never cut, never zoomed */}
      {pool.map((p, i) => (
        <div
          key={p.id}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: cssUrl(p.img),
            backgroundSize: 'cover',
            backgroundPosition: 'center 46%',
            opacity: i === at ? 1 : 0,
            filter: hold ? 'saturate(1.34) contrast(1.08) brightness(1.03)' : 'saturate(1.12) contrast(1.02)',
            transition: 'opacity 1.1s var(--ease-portal), filter .5s',
          }}
        />
      ))}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          transition: 'background .5s var(--ease-portal)',
          background: hold
            ? 'linear-gradient(180deg, rgba(8,10,18,.32) 0%, transparent 24%, transparent 58%, rgba(8,10,18,.76) 100%)'
            : 'linear-gradient(180deg, rgba(8,10,18,.5) 0%, rgba(8,10,18,.05) 30%, rgba(8,10,18,.32) 66%, rgba(8,10,18,.86) 100%)',
        }}
      />

      {/* masthead */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => void navigate(routes.discover())}
          title="WeOverse"
          style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
        >
          <WeOverseLettering h={MAST_H} ink="#fff" className="weo-wordmark" />
        </button>
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.62)',
              }}
            >
              {weekOf()}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 3,
                fontSize: 13,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: '#fff',
              }}
            >
              <OMark size={12} /> {osFmt(inMotion)}
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,.66)' }}>in motion</span>
            </span>
          </span>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,.2)' }} />
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.62)',
              }}
            >
              Live WeOs
            </span>
            <span style={{ marginTop: 3, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {live}
            </span>
          </span>
        </span>
      </div>

      <span />

      {/* the cover story (v4: the controls sit at the bottom centre; no cover lines) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'clamp(18px,2.6vw,42px)',
          flexWrap: 'wrap',
          paddingBottom: pool.length > 1 ? 56 : 0,
        }}
      >
        <div style={{ flex: '1 1 min(560px, 100%)', minWidth: 0, paddingLeft: COVER_INDENT }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <Chip dot tone={tone}>
              {FEED_KIND[it.kind].label}
            </Chip>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.88)',
                textShadow: '0 1px 8px rgba(8,10,18,.7)',
              }}
            >
              {coverLine(it)}
            </span>
            {it.timer && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'rgba(255,255,255,.8)',
                }}
              >
                {it.timer}
              </span>
            )}
          </span>
          <h2
            style={{
              margin: '12px 0 0',
              maxWidth: '22ch',
              fontSize: 'clamp(30px,4.4vw,60px)',
              fontWeight: 700,
              letterSpacing: '-.042em',
              lineHeight: 0.98,
              textWrap: 'pretty',
              textShadow: '0 3px 26px rgba(8,10,18,.5)',
            }}
          >
            <button
              type="button"
              onClick={() => open(it)}
              style={{ all: 'inherit', margin: 0, cursor: 'pointer', textShadow: 'inherit' }}
            >
              {it.title}
            </button>
          </h2>
          {it.blurb && (
            <p
              style={{
                margin: '14px 0 0',
                maxWidth: '46ch',
                fontSize: 'clamp(13px,1.1vw,15px)',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,.82)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {it.blurb}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <button
              type="button"
              onClick={() => open(it)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                border: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                padding: '11px 20px',
                fontSize: 13.5,
                fontWeight: 700,
                color: '#0b0e18',
                background: '#fff',
                boxShadow: '0 8px 26px rgba(8,10,18,.34)',
              }}
            >
              Enter
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone }} />
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              {it.byAvatar ? <Avatar src={it.byAvatar} size={30} /> : null}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.78)' }}>
                {it.byName} · {it.sub}
              </span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 15,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Readout text={it.readout} size={13} />
            </span>
          </div>
          {pool.length > 1 && (
            <div
              className="weo-cover-nav"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setAt((a) => (a - 1 + pool.length) % pool.length)}
                aria-label="Previous cover"
                style={coverArrow}
              >
                {svg(<polyline points="15 6 9 12 15 18" />, 16, 'currentColor', 2)}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {pool.map((p, i) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setAt(i)}
                    aria-label={`Cover ${i + 1}`}
                    title={p.title}
                    style={{
                      width: i === at ? 26 : 9,
                      height: 5,
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      background: i === at ? '#fff' : 'rgba(255,255,255,.4)',
                      transition: 'width .4s var(--ease-portal), background .3s',
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAt((a) => (a + 1) % pool.length)}
                aria-label="Next cover"
                style={coverArrow}
              >
                {svg(<polyline points="9 6 15 12 9 18" />, 16, 'currentColor', 2)}
              </button>
              <span
                style={{
                  marginLeft: 4,
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '.12em',
                  color: 'rgba(255,255,255,.6)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {at + 1} / {pool.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const coverArrow = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: 'none',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  color: '#fff',
  background: 'rgba(255,255,255,.14)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28)',
} as const;

export function FeedCard({ it, w, plain }: { it: FeedItemModel; w: number; plain?: boolean }) {
  const open = useOpen();
  const [hov, setHov] = useState(false);
  const kind = FEED_KIND[it.kind];
  // v4: the lead is a card like the rest, in the same grid; only its chip says it leads
  const big = false;
  const mid = w === 3;
  const show = hov;
  /* a question or a brief has no object photograph — the person who asked is the imagery */
  const img = it.img || it.byAvatar || null;
  /* the CTA is named for the act, never "open" */
  const cta =
    it.kind === 'weo'
      ? 'Collect'
      : it.kind === 'request'
        ? 'Make an offer'
        : it.kind === 'question'
          ? 'Answer'
          : 'Read the story';
  const act = () => (it.weoId ? openCollect(it.weoId) : open(it));
  /* only a thing with a clock can be closing; a lead is named a lead */
  const urg = it.timer || it.kind === 'request' ? URGENCY[w] : w >= 4 ? 'Leads this week' : null;
  return (
    <article
      data-lead={big ? '1' : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        gridColumn: plain ? 'auto' : `span ${big ? 7 : mid ? 5 : w === 2 ? 4 : 3}`,
        gridRow: plain ? 'auto' : `span ${big ? 2 : mid ? 2 : 1}`,
        position: 'relative',
        zIndex: hov ? 6 : 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: big ? 'row' : 'column',
        gap: big ? 22 : 12,
        minWidth: 0,
        borderRadius: big ? 32 : 24,
        padding: big ? 'clamp(18px,2.2vw,26px)' : 15,
        background: hov ? `color-mix(in srgb, ${it.tone} 16%, var(--surface))` : 'var(--surface)',
        boxShadow: hov
          ? `0 22px 46px -20px color-mix(in srgb, ${it.tone} 85%, transparent), inset 0 0 0 1.5px ${it.tone}`
          : 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        transform: hov ? 'translateY(-5px)' : 'none',
        transition: 'background .3s, box-shadow .32s, transform .32s var(--ease-settle)',
      }}
    >
      {/* the whole card opens the record; the act button sits above it */}
      <button
        type="button"
        onClick={() => open(it)}
        aria-label={`${kind.label} · ${it.title}`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
        }}
      />
      {img && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            overflow: 'hidden',
          }}
        >
          <img
            src={img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: hov ? 0.44 : 0.17,
              filter: hov ? 'saturate(1.2)' : 'none',
              transition: 'opacity .4s, filter .4s',
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: big
                ? 'linear-gradient(100deg, var(--surface) 12%, color-mix(in srgb, var(--surface) 88%, transparent) 52%, color-mix(in srgb, var(--surface) 62%, transparent))'
                : 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 58%, transparent) 0%, color-mix(in srgb, var(--surface) 90%, transparent) 46%, var(--surface) 100%)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(190deg, transparent 46%, color-mix(in srgb, ${it.tone} 16%, transparent))`,
            }}
          />
        </span>
      )}
      {img && (
        <div
          style={{
            position: 'relative',
            flex: '0 0 auto',
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <Orb
            size={(big ? 190 : mid ? 138 : 96) + (hov ? 8 : 0)}
            fill="image"
            src={img}
            ring
            ringColor={it.tone}
            matcap
            breathe={hov || w >= 4}
          />
        </div>
      )}
      <div
        style={{
          position: 'relative',
          minWidth: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: hov ? '3px 10px' : '3px 0',
              background: hov ? it.tone : 'transparent',
              transition: 'background .26s, padding .26s',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: hov ? '#fff' : it.tone,
                flex: '0 0 auto',
                transition: 'background .24s',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: hov ? '#fff' : 'var(--text-faint)',
                transition: 'color .24s',
              }}
            >
              {kind.label}
            </span>
          </span>
          {urg && <Chip tone={it.tone}>{urg}</Chip>}
          {it.timer && (
            // v4: the countdown is a red pill
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                color: 'color-mix(in srgb, #E5484D 78%, var(--text))',
                background: 'color-mix(in srgb, #E5484D 9%, var(--surface))',
                boxShadow: 'inset 0 0 0 1px color-mix(in srgb, #E5484D 18%, transparent)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {it.timer}
            </span>
          )}
        </span>
        <h3
          style={{
            margin: '8px 0 0',
            fontSize: big ? 'clamp(21px,2.5vw,30px)' : mid ? 17 : 14.5,
            fontWeight: big ? 700 : 600,
            letterSpacing: big ? '-.034em' : '-.022em',
            lineHeight: 1.14,
            color: hov || big ? 'var(--text)' : 'var(--text-dim)',
            transition: 'color .24s',
            textWrap: 'pretty',
          }}
        >
          {it.title}
        </h3>

        {/* rest holds the decision: the kind, the title, the figure. Nothing else. */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 9 }}>
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--text-faint)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {it.sub}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: big ? 16 : 13.5,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Readout text={it.readout} size={big ? 14 : 12} />
          </span>
        </span>

        {/* approach opens the record INLINE: the card grows in place */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: show ? '1fr' : '0fr',
            transition: 'grid-template-rows .44s var(--ease-portal)',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border)',
                opacity: show ? 1 : 0,
                transition: 'opacity .3s .05s',
              }}
            >
              {it.blurb && (
                <p
                  style={{
                    margin: 0,
                    maxWidth: '54ch',
                    fontSize: big ? 13.5 : 12.5,
                    lineHeight: 1.55,
                    color: 'var(--text-dim)',
                    display: '-webkit-box',
                    WebkitLineClamp: big ? 3 : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {it.blurb}
                </p>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                {it.byAvatar ? <Avatar src={it.byAvatar} size={big ? 28 : 24} /> : null}
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: 'var(--text-dim)',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.byName}
                </span>
                <button
                  type="button"
                  tabIndex={show ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    act();
                  }}
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '9px 16px',
                    font: 'inherit',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#fff',
                    background: it.tone,
                    boxShadow: `0 8px 18px -8px color-mix(in srgb, ${it.tone} 90%, transparent)`,
                    pointerEvents: 'auto',
                  }}
                >
                  {cta}
                  {svg(<polyline points="9 6 15 12 9 18" />, 14, 'currentColor', 2.4)}
                </button>
              </span>
              {it.metrics.length > 0 && (
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: big ? 22 : 16 }}>
                  {it.metrics.map(([v, k]) => (
                    <span key={k} style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          fontSize: big ? 15 : 13.5,
                          fontWeight: 600,
                          color: 'var(--text)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {v}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{k}</span>
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeedRow({ it }: { it: FeedItemModel }) {
  const open = useOpen();
  const [hov, setHov] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => open(it)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open(it);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        padding: '13px 18px',
        cursor: 'pointer',
        background: hov ? `color-mix(in srgb, ${it.tone} 4%, var(--surface))` : 'var(--surface)',
        transition: 'background .26s',
      }}
    >
      <span
        style={{ width: 4, alignSelf: 'stretch', borderRadius: 999, background: it.tone, flex: '0 0 auto' }}
      />
      {it.img ? (
        <Orb
          size={40}
          fill="image"
          src={it.img}
          ring
          ringColor={it.tone}
          matcap
          breathe={hov}
          style={{ flex: '0 0 auto' }}
        />
      ) : (
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.08em',
            color: it.tone,
            background: 'var(--surface-2)',
          }}
        >
          {FEED_KIND[it.kind].label.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span style={{ flex: '1 1 240px', minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 500,
            color: hov ? 'var(--text)' : 'var(--text-dim)',
            transition: 'color .2s',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {it.title}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-faint)' }}>
          {FEED_KIND[it.kind].label} · {it.byName} · {it.sub}
        </span>
      </span>
      {it.timer && (
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: 'var(--text-faint)',
            fontVariantNumeric: 'tabular-nums',
            flex: '0 0 auto',
          }}
        >
          {it.timer}
        </span>
      )}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          flex: '0 0 auto',
        }}
      >
        <Readout text={it.readout} size={12} />
      </span>
    </div>
  );
}

type FeedView = 'editorial' | 'cards' | 'list';
export const FEED_VIEWS: SegItem<FeedView>[] = [
  { value: 'editorial', label: 'Editorial' },
  { value: 'cards', label: 'Cards' },
  { value: 'list', label: 'List' },
];

/** v4: the WeO lenses that sit in the board's chip row (design FEED_LENSES) */
export type FeedLens = 'ending' | 'moving' | 'followed';
export type FeedTab = 'all' | FeedKind | FeedLens;
const FEED_LENSES: { k: FeedLens; label: string; urgent?: boolean }[] = [
  { k: 'ending', label: 'Closing soon', urgent: true },
  { k: 'moving', label: 'Moving now' },
  { k: 'followed', label: 'From creators you circle' },
];
const LENS_QUERY: Record<FeedLens, WeoListParams> = {
  ending: { sort: 'ending_soon', status: 'active' },
  moving: { sort: 'trending', status: 'active' },
  followed: { feed: 'following', status: 'active' },
};
const isLens = (t: FeedTab): t is FeedLens => FEED_LENSES.some((l) => l.k === t);

/** design: discover.jsx feedPager (v4) — "Showing 1–9 of N", then prev · 1 2 3 · next. */
function FeedPager({
  page,
  pages,
  total,
  per,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  per: number;
  onPage: (p: number) => void;
}) {
  if (pages < 2) return null;
  const chev = (pts: string) => svg(<polyline points={pts} />, 15, 'currentColor', 2.2);
  const btn = (key: string, label: ReactNode, p: number, on: boolean, disabled: boolean, aria: string) => (
    <button
      key={key}
      type="button"
      onClick={() => {
        if (!disabled && !on) onPage(p);
      }}
      disabled={disabled}
      aria-current={on ? 'page' : undefined}
      aria-label={aria}
      style={{
        display: 'grid',
        placeItems: 'center',
        minWidth: 40,
        height: 40,
        padding: '0 12px',
        borderRadius: 999,
        border: 'none',
        font: 'inherit',
        fontSize: 13,
        fontWeight: on ? 700 : 600,
        fontVariantNumeric: 'tabular-nums',
        cursor: disabled || on ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        color: on ? '#fff' : 'var(--text)',
        background: on ? 'var(--o-blue)' : 'var(--surface)',
        boxShadow: on ? 'none' : 'var(--nm-sm), inset 0 0 0 1px var(--border)',
      }}
    >
      {label}
    </button>
  );
  return (
    <nav
      aria-label="Feed pages"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 24 }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
        Showing {page * per + 1}–{Math.min(total, (page + 1) * per)} of {total}
      </span>
      <span
        style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {btn('prev', chev('15 6 9 12 15 18'), page - 1, false, page === 0, 'Previous page')}
        {Array.from({ length: pages }, (_, p) =>
          btn(`p${p}`, String(p + 1), p, p === page, false, `Page ${p + 1}`),
        )}
        {btn('next', chev('9 6 15 12 9 18'), page + 1, false, page >= pages - 1, 'Next page')}
      </span>
    </nav>
  );
}

/**
 * design: discover.jsx FeedBoard (v4) — the cover, then one chip row (Everything, the three
 * WeO lenses, then the kinds) and the board in pages of nine. The view switch moved to the
 * pinned filter bar (`StuckViews`, same `feed.board` view). Kinds page on the server
 * (`/frontend/feed?kind=`); the lenses are the floor's own WeO lists, drawn as feed cards.
 */
export function FeedBoard({
  cover,
  tab,
  onTab,
}: {
  cover: FeedItemModel[];
  tab: FeedTab;
  onTab: (t: FeedTab) => void;
}) {
  const [view] = useWeoView<FeedView>('feed.board', FEED_VIEWS, 'editorial');
  const { prefs } = useViewPrefs();
  const [page, setPage] = useState(0);
  const [prevTab, setPrevTab] = useState(tab);
  if (prevTab !== tab) {
    setPrevTab(tab);
    setPage(0);
  }
  const lens = isLens(tab) ? tab : null;
  const kindQ = useFeedPage(lens ? 'all' : (tab as 'all' | FeedKind), page + 1, !lens);
  const lensQ = useWeos({ ...LENS_QUERY[lens ?? 'ending'], limit: FEED_PER, page: page + 1 }, !!lens);
  const items = useMemo(
    () =>
      lens
        ? (lensQ.data?.items ?? []).map((w) => weoFeedItem(cardModel(w)))
        : (kindQ.data?.items ?? []).map((i) => feedItemModel(i)),
    [lens, lensQ.data, kindQ.data],
  );
  const total = lens ? (lensQ.data?.pagination.total ?? 0) : (kindQ.data?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / FEED_PER));
  const loading = lens ? lensQ.isLoading : kindQ.isLoading;
  const shown = items.filter(
    (i) =>
      !prefs.mutedKinds.includes(i.kind) &&
      !(i.kind === 'weo' && prefs.mutedFormats.some((f) => i.sub.startsWith(`${f} ·`) || i.sub === f)),
  );
  const lead = shown.slice().sort((a, b) => b.weight - a.weight)[0];
  const goPage = (p: number) => {
    setPage(p);
    const el = document.getElementById('d-feed');
    if (el) glide(window, el.getBoundingClientRect().top + window.scrollY - 120);
  };
  const chip = (key: FeedTab, label: string, color: string, order: number) => (
    <Chip
      key={key}
      role="button"
      tabIndex={0}
      aria-pressed={tab === key}
      selected={tab === key}
      tone={color}
      onClick={() => onTab(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onTab(key);
      }}
      style={{ flex: '0 0 auto', cursor: 'pointer', order }}
    >
      {label}
    </Chip>
  );
  return (
    <>
      {cover.length > 0 && <FeedCover items={cover} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div
          className={s.chips}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            flex: '1 1 240px',
            minWidth: 0,
            padding: '2px 2px 5px',
          }}
        >
          {FEED_KINDS.map((k) =>
            k.k !== 'all' && prefs.mutedKinds.includes(k.k)
              ? null
              : chip(
                  k.k,
                  k.label,
                  k.k === 'all' ? 'var(--o-blue)' : FEED_KIND[k.k].color,
                  k.k === 'all' ? 0 : 2,
                ),
          )}
          {FEED_LENSES.map((l) => chip(l.k, l.label, l.urgent ? '#E5484D' : 'var(--o-blue)', 1))}
        </div>
      </div>
      {!shown.length && (
        <p style={quietWell}>
          {loading
            ? 'Reading the feed…'
            : tab === 'followed'
              ? 'Nothing yet — circle a creator and their WeOs arrive here.'
              : 'Nothing here yet.'}
        </p>
      )}
      {view === 'editorial' && shown.length > 0 && (
        <div
          className="weo-edit-grid"
          key={`ed${tab}${page}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, minmax(0,1fr))',
            gridAutoRows: 'min-content',
            alignItems: 'start',
            gap: 14,
          }}
        >
          {shown.map((it) => (
            <FeedCard key={it.id} it={it} w={lead && it.id === lead.id ? 4 : Math.min(it.weight, 3)} />
          ))}
        </div>
      )}
      {view === 'cards' && shown.length > 0 && (
        <div
          key={`ca${tab}${page}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
            gridAutoRows: 'min-content',
            alignItems: 'start',
            gap: 14,
          }}
        >
          {shown.map((it) => (
            <FeedCard key={it.id} it={it} w={2} plain />
          ))}
        </div>
      )}
      {view === 'list' && shown.length > 0 && (
        <div
          key={`li${tab}${page}`}
          style={{
            display: 'grid',
            gap: 1,
            borderRadius: 26,
            overflow: 'hidden',
            background: 'var(--border)',
            boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
          }}
        >
          {shown.map((it) => (
            <FeedRow key={it.id} it={it} />
          ))}
        </div>
      )}
      <FeedPager
        page={Math.min(page, pages - 1)}
        pages={pages}
        total={total}
        per={FEED_PER}
        onPage={goPage}
      />
    </>
  );
}

const quietWell: CSSProperties = {
  margin: 0,
  padding: 30,
  textAlign: 'center',
  fontSize: 13,
  color: 'var(--text-dim)',
  borderRadius: 24,
  background: 'var(--surface-2)',
  boxShadow: 'var(--nm-inset)',
};
