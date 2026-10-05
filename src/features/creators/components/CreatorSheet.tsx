// design: screens-network.jsx CreatorSheet — the creator, anywhere
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { ActionTile, OProfileStage, type ActionTileItem } from '@/components/people/ProfileStage';
import { Button, OMark, Spinner, svg } from '@/design-system';
import { useCommunityCircles } from '@/features/community/api/community';
import { circleView } from '@/lib/circleModel';
import { compact, osFmt } from '@/lib/format';
import { relTime } from '@/lib/time';
import { closeCreator, openCollect, openCompose } from '@/stores/flow';
import { ack, toast } from '@/stores/ui';
import { useCircleThem, useCreator, useInviteToCircle, useTrackCreator } from '../api/creators';
import { acceptLabel, CONTACT_NOTE, isrStage, isrTone, orbitOf } from '../model/creators';

const ICONS: Record<string, ReactNode> = {
  collect: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  circle: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8.4" />
    </>
  ),
  track: (
    <>
      <path d="M18 9.4a6 6 0 1 0-12 0c0 5-2 6.6-2 6.6h16s-2-1.6-2-6.6z" />
      <path d="M10.4 19.4a2 2 0 0 0 3.2 0" />
    </>
  ),
  invite: (
    <>
      <circle cx="10" cy="8.4" r="3.4" />
      <path d="M4 19c.7-3.1 3-4.8 6-4.8s5.3 1.7 6 4.8" />
      <path d="M18.6 6.6v5M16.1 9.1h5" />
    </>
  ),
  contact: (
    <path d="M20.5 11.5a8 8 0 0 1-8 8 8 8 0 0 1-3.6-.85L3.5 20.5l1.85-5.4A8 8 0 0 1 12.5 3.5a8 8 0 0 1 8 8z" />
  ),
};

const first = (name: string) => name.split(' ')[0] || name;

function Frame({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  /* portalled: opened from inside transformed screen content as often as from the app root */
  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2400,
        display: 'grid',
        placeItems: 'start center',
        padding: '20px 20px 132px',
        overflowY: 'auto',
        background: 'color-mix(in srgb, var(--text) 36%, transparent)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{
          width: 'min(880px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          borderRadius: 32,
          padding: 'clamp(18px,2.2vw,26px)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--glass-brd)',
          animation: 'weo-cardin .34s var(--ease-portal) both',
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * A face on a podium, a thumbnail on a card, a name on a thread — all of them open the same
 * sheet: who they are, their standing, what they have made, what they have done in public, and
 * what you can do about it. Their settings are read here and obeyed: a hidden section says so.
 */
export function CreatorSheet({ id }: { id: string }) {
  const navigate = useNavigate();
  const q = useCreator(id);
  const c = q.data;
  const circlesQ = useCommunityCircles();
  const circleThem = useCircleThem();
  const track = useTrackCreator();
  const inviteM = useInviteToCircle();
  const [invite, setInvite] = useState(false);
  const [log, setLog] = useState(false);
  const onClose = closeCreator;

  if (!c) {
    return (
      <Frame label="Creator" onClose={onClose}>
        <div style={{ display: 'grid', placeItems: 'center', gap: 12, padding: 40, textAlign: 'center' }}>
          {q.isError ? (
            <>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>
                This profile could not be opened.
              </p>
              <Button size="sm" variant="ghost" tone="blue" onClick={onClose}>
                Close
              </Button>
            </>
          ) : (
            <Spinner tone="#3A95F2" />
          )}
        </div>
      </Frame>
    );
  }

  const own = c.viewer.isSelf;
  const perms = c.shows;
  const orbit = orbitOf(c);
  const tone = orbit[0]?.tone ?? 'var(--o-blue)';
  const latest = orbit[0];
  const joined = (circlesQ.data?.joined ?? []).map(circleView);
  const shared = c.viewer.sharedCircles;
  const canContact = c.viewer.canContact;
  const go = (path: string) => {
    onClose();
    void navigate(path);
  };

  const toggleCircle = () =>
    circleThem.mutate(
      { id: c.id, on: !c.viewer.circled },
      { onSuccess: () => toast(!c.viewer.circled ? `Following ${c.name}` : `Unfollowed ${c.name}`) },
    );
  const toggleTrack = () => {
    const will = !c.viewer.tracked;
    track.mutate(
      { id: c.id, on: will },
      {
        onSuccess: () =>
          toast(will ? `Tracking ${c.name} · you will hear when they drop` : `No longer tracking ${c.name}`),
        onError: (e) => toast(e instanceof ApiError ? e.message : 'That did not go through — try again'),
      },
    );
  };
  const inviteTo = (circleId: string, circleName: string) => {
    setInvite(false);
    inviteM.mutate(
      { circleId, userId: c.id },
      {
        onSuccess: () => {
          ack('Invite sent', 'var(--o-violet)');
          toast(`${c.name} invited to ${circleName}`);
        },
        onError: (e) =>
          toast(e instanceof ApiError ? e.message : 'The invite did not go through — try again'),
      },
    );
  };
  // contact obeys their setting: a shared Circle is the route when that is what they allow
  const contact = () => {
    const via = perms.contact === 'circles' ? shared[0] : undefined;
    if (via) {
      go(routes.circle(via.id));
      toast(`Ask ${first(c.name)} in ${via.name}`);
      return;
    }
    onClose();
    openCompose();
    toast(`Ask ${first(c.name)} — posted where they answer`);
  };

  const acts: ActionTileItem[] = own
    ? []
    : [
        {
          k: 'collect',
          label: 'Collect',
          note: latest ? latest.name : perms.collections ? 'Nothing live yet' : 'Their WeOs are private',
          tone: 'var(--o-blue)',
          off: !latest,
          go: () => {
            if (!latest) return;
            onClose();
            openCollect(latest.id);
          },
        },
        {
          k: 'circle',
          label: c.viewer.circled ? 'Circled' : 'Circle them',
          note: 'Their next WeO lands in your feed',
          tone: 'var(--o-green)',
          on: c.viewer.circled,
          go: toggleCircle,
        },
        {
          k: 'track',
          label: c.viewer.tracked ? 'Tracking' : 'Track drops',
          note: 'Hear the moment they list',
          tone: 'var(--o-gold)',
          on: c.viewer.tracked,
          go: toggleTrack,
        },
        {
          k: 'invite',
          label: 'Invite',
          note: perms.invites ? 'Into a Circle you are in' : 'Not taking invites',
          tone: 'var(--o-violet)',
          on: invite,
          off: !perms.invites,
          go: () => setInvite((v) => !v),
        },
        {
          k: 'contact',
          label: 'Contact',
          note: canContact
            ? perms.contact === 'circles'
              ? `Through ${shared[0]?.name ?? 'a shared Circle'}`
              : 'Open to anyone'
            : CONTACT_NOTE[perms.contact],
          tone: 'var(--o-blue)',
          off: !canContact,
          go: contact,
        },
      ];

  const stats: [ReactNode, string, string][] = [
    [
      <span key="s" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <OMark size={11} />
        {osFmt(c.stats.settled7d)}
      </span>,
      'Settled · 7d',
      'var(--o-gold)',
    ],
    [compact(c.stats.collectors), 'Collectors', 'var(--o-violet)'],
    [c.stats.weos == null ? 'Private' : String(c.stats.weos), 'WeOs published', 'var(--o-blue)'],
    [acceptLabel(c.stats.acceptRate), 'Answers kept', 'var(--o-green)'],
  ];

  const actRows = c.activity.map((a) => ({
    ...a,
    line: a.when ? `${a.note} · ${relTime(a.when)}` : a.note,
    go: () => go(a.kind === 'weo' ? routes.weo(a.id) : routes.thread(a.id)),
  }));

  return (
    <Frame label={`${c.name} — public profile`} onClose={onClose}>
      {/* the profile card itself: their face in the ring, their story behind it */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          padding: 'clamp(16px,2vw,24px)',
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset), inset 0 0 0 1px var(--border)',
        }}
      >
        {latest?.img && (
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <img
              src={latest.img}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.34 }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, color-mix(in srgb, var(--surface) 62%, transparent), color-mix(in srgb, var(--surface) 92%, transparent) 74%), radial-gradient(80% 60% at 50% 0%, color-mix(in srgb, ${tone} 22%, transparent), transparent 70%)`,
              }}
            />
          </span>
        )}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <OProfileStage
            size={262}
            isr={Math.round(c.isr)}
            avatar={c.avatarUrl}
            tone={tone}
            center
            items={orbit.slice(0, 6).map((w) => ({
              id: w.id,
              name: w.name,
              type: w.type,
              img: w.img,
              tone: w.tone,
              onClick: () => go(routes.weo(w.id)),
            }))}
          />
          <div style={{ textAlign: 'center' }}>
            <h4
              style={{
                margin: 0,
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: '-.03em',
                color: 'var(--text)',
              }}
            >
              {c.name}
            </h4>
            <p
              style={{
                margin: '5px 0 0',
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '.04em',
                color: isrTone(c.isr),
              }}
            >
              ISR {Math.round(c.isr)} · {isrStage(c.isr)}
            </p>
            {c.bio && (
              <p
                style={{
                  margin: '8px auto 0',
                  maxWidth: '38ch',
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: 'var(--text-dim)',
                }}
              >
                {c.bio}
              </p>
            )}
          </div>

          {/* the figures, one row of cells — colour-coded, tabular, nothing decorative */}
          <div
            className="weo-prof-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
              gap: 9,
              width: '100%',
              marginTop: 4,
            }}
          >
            {stats.map(([v, k, col]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 5,
                  minHeight: 66,
                  padding: '11px 13px',
                  borderRadius: 18,
                  background: 'var(--surface)',
                  boxShadow: 'var(--nm-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: 9, flex: 'none', background: col }} />
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {v}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-faint)',
                  }}
                >
                  {k}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* the core functions, one row, symmetrical under the card */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(1, own ? 1 : acts.length)}, minmax(0,1fr))`,
            gap: 8,
            marginTop: 'clamp(14px,1.8vw,20px)',
          }}
        >
          {own ? (
            <Button size="sm" variant="primary" tone="violet" onClick={onClose}>
              Done — this is what others see
            </Button>
          ) : (
            acts.map((a) => <ActionTile key={a.k} a={a} icon={ICONS[a.k]} />)
          )}
        </div>
      </div>

      {invite && perms.invites && (
        <div
          style={{
            borderRadius: 20,
            padding: 15,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          <p
            style={{
              margin: '0 0 9px',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            Invite to which Circle
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {joined.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Join a Circle first — you can only invite into rooms you are in.
              </span>
            ) : (
              joined.map((x) => (
                <button
                  type="button"
                  key={x.id}
                  onClick={() => inviteTo(x.id, x.name)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '8px 13px',
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 600,
                    color: x.toneHex,
                    background: `color-mix(in srgb, ${x.toneHex} 10%, var(--surface))`,
                    border: `1px solid color-mix(in srgb, ${x.toneHex} 30%, transparent)`,
                  }}
                >
                  {x.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* the record is context, not the point — one line at rest, open it if you want it */}
      <div
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
        }}
      >
        <button
          type="button"
          onClick={() => setLog((l) => !l)}
          aria-expanded={log}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
            padding: '11px 14px',
            textAlign: 'left',
          }}
        >
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
            In public
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
            {perms.activity ? actRows.length : 'off'}
          </span>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text-faint)',
              transform: log ? 'rotate(180deg)' : 'none',
              transition: 'transform .3s var(--ease-portal)',
            }}
          >
            {svg(<polyline points="6 9 12 15 18 9" />, 13, 'currentColor', 2.2)}
          </span>
        </button>
        <div
          style={{
            display: 'grid',
            gridTemplateRows: log ? '1fr' : '0fr',
            transition: 'grid-template-rows .38s var(--ease-portal)',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            {perms.activity ? (
              actRows.length ? (
                <div style={{ display: 'grid', gap: 1, background: 'var(--border)' }}>
                  {actRows.map((a, n) => (
                    <button
                      type="button"
                      key={a.kind + n}
                      onClick={a.go}
                      tabIndex={log ? 0 : -1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        font: 'inherit',
                        padding: '11px 14px',
                        background: 'var(--surface)',
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          flex: '0 0 auto',
                          background: a.tone,
                        }}
                      />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.label}
                        </span>
                        <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-faint)' }}>
                          {a.line}
                        </span>
                      </span>
                      {svg(<path d="M9 6l6 6-6 6" />, 13, 'var(--text-faint)', 1.8)}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, padding: '0 14px 13px', fontSize: 11.5, color: 'var(--text-faint)' }}>
                  Nothing in public yet.
                </p>
              )
            ) : (
              <p style={{ margin: 0, padding: '0 14px 13px', fontSize: 11.5, color: 'var(--text-faint)' }}>
                Activity is off. What they answer inside a Circle stays visible in that Circle.
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          alignSelf: 'flex-end',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-dim)',
        }}
      >
        Close
      </button>
    </Frame>
  );
}
