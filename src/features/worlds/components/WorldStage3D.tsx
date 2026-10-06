import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { OMark, Spinner, svg } from '@/design-system';
import { osFmt } from '@/lib/format';
import type { Crowd, WorldDef } from '../model/sim';
import type { WeoWorld } from '../three/world3d';
import { WorldStage, type StageMarker } from './WorldStage';

const glass = {
  background: 'rgba(10,13,22,.4)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)',
} as const;

/**
 * design: world.jsx WorldStage3D — the same rehearsal in real space. `three` is loaded on demand
 * (its own chunk, never in the first bundle); if it cannot load or WebGL is missing, the flat
 * stage stands in.
 */
export function WorldStage3D({
  world,
  fid,
  markers,
  cohorts,
  subjectId,
  onSelect,
  worldRef,
  note,
  onWide,
  isWide,
}: {
  world: WorldDef;
  fid: number;
  markers: StageMarker[];
  cohorts: Crowd;
  subjectId: string | null;
  onSelect: (id: string | null) => void;
  worldRef: MutableRefObject<WeoWorld | null>;
  note?: string;
  onWide?: () => void;
  isWide?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  });

  useEffect(() => {
    let dead = false;
    let w: WeoWorld | null = null;
    void import('../three/world3d')
      .then(({ WeoWorld: W, canWebGL }) => {
        if (dead || !host.current) return;
        if (!canWebGL()) {
          setGone(true);
          return;
        }
        w = new W(host.current, (id) => selectRef.current(id));
        worldRef.current = w;
        setReady(true);
      })
      .catch(() => {
        if (!dead) setGone(true);
      });
    return () => {
      dead = true;
      w?.dispose();
      if (worldRef.current === w) worldRef.current = null;
    };
  }, [worldRef]);

  const mKey = markers.map((m) => m.id + (m.subject ? '*' : '') + m.img).join(',');
  const cKey = cohorts.map((c) => c.id + (c.on ? '1' : '0') + Math.round(c.share * 100)).join(',');
  useEffect(() => {
    if (!ready || !worldRef.current) return;
    worldRef.current.setScene({ theme: world.theme, fidelity: fid, markers, cohorts, subjectId });
    // markers and cohorts are keyed: a new array with the same contents must not rebuild the scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, world.theme, fid, mKey, cKey, subjectId, worldRef]);

  if (gone)
    return <WorldStage world={world} fid={fid} markers={markers} hoverId={subjectId} onHover={onSelect} />;
  const sel = markers.find((m) => m.id === subjectId);
  return (
    <div
      data-world={world.theme}
      style={{
        position: 'relative',
        flex: '1 1 auto',
        minHeight: 260,
        overflow: 'hidden',
        borderRadius: 26,
        boxShadow: 'inset 0 0 0 1px var(--border)',
        background: 'var(--world-fog, #0d1526)',
        transition: 'height .44s var(--ease-portal)',
      }}
    >
      <div
        ref={host}
        data-testid="weo-world"
        aria-label={`${world.name}, walkable — drag to look, W A S D to walk, click a WeO to make it the subject`}
        role="img"
        style={{ position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden', touchAction: 'none' }}
      />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Spinner size={30} />
        </div>
      )}
      {/* the readout: one line, whatever you are pointing at */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          padding: '10px 14px',
          borderRadius: 999,
          background: 'rgba(10,13,22,.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)',
          color: '#fff',
          pointerEvents: 'none',
        }}
      >
        {sel ? (
          <>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sel.tone }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{sel.name}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.66)' }}>{sel.type}</span>
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <OMark size={12} /> {osFmt(sel.os)}
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: 11,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'rgba(255,255,255,.6)',
            }}
          >
            {world.name} · fidelity {fid}
          </span>
        )}
        {/* the crowd in one line: every cohort in the world, and its share of the footfall */}
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {cohorts
            .filter((c) => c.on)
            .map((c) => (
              <span
                key={c.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,.78)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }} />
                {Math.round(c.share * 100)}%
              </span>
            ))}
        </span>
      </div>
      {/* how to move, shown as an affordance, never as a paragraph */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 12px',
          borderRadius: 999,
          ...glass,
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '.06em',
          color: 'rgba(255,255,255,.8)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ padding: '1px 5px', borderRadius: 5, background: 'rgba(255,255,255,.16)' }}>
          W A S D
        </span>{' '}
        walk
        <span
          style={{ marginLeft: 4, padding: '1px 5px', borderRadius: 5, background: 'rgba(255,255,255,.16)' }}
        >
          drag
        </span>{' '}
        look
      </div>
      {onWide && (
        <button
          onClick={onWide}
          aria-pressed={!!isWide}
          aria-label={isWide ? 'Show the modules' : 'Immersive — fill the studio'}
          title={isWide ? 'Show the modules' : 'Immersive — fill the studio'}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            zIndex: 3,
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: '#fff',
            background: 'rgba(10,13,22,.44)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22)',
          }}
        >
          {svg(
            isWide ? (
              <>
                <path d="M9 4.6v4.4H4.6M15 19.4v-4.4h4.4" />
                <path d="M9 9L4.6 4.6M15 15l4.4 4.4" />
              </>
            ) : (
              <>
                <path d="M4.6 9V4.6H9M19.4 15v4.4H15" />
                <path d="M4.6 4.6L9.4 9.4M19.4 19.4l-4.8-4.8" />
              </>
            ),
            17,
            'currentColor',
            1.9,
          )}
        </button>
      )}
      {note && !isWide && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 66,
            maxWidth: '46%',
            padding: '7px 13px',
            borderRadius: 16,
            ...glass,
            fontSize: 11,
            lineHeight: 1.45,
            color: 'rgba(255,255,255,.82)',
            pointerEvents: 'none',
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}
