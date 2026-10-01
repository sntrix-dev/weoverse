import { useState, type ReactNode } from 'react';
import { Sheet } from '@/components/feedback/Sheet';
import { Avatar, Button, Chip, OMark, OPower, Orb, svg } from '@/design-system';
import { osFmt } from '@/lib/format';

export interface WalletBucketsModel {
  available: number;
  protected: number;
  pending: number;
  locked: number;
}

export interface MovePerson {
  id: string;
  name: string;
  avatar: string | null;
}

export interface OWalletPanelProps {
  wallet: WalletBucketsModel;
  /** O Power multiplier, when the backend measures one */
  power?: number | null;
  holdings: { collected: number; listed: number };
  /** faces of the first few things held */
  faces: { id: string; img: string }[];
  people: MovePerson[];
  onMove: (to: MovePerson, os: number) => Promise<void>;
  onCollected: () => void;
  onListed: () => void;
}

const chevron = svg(<polyline points="9 6 15 12 9 18" />, 15, 'var(--text-faint)', 2);

/**
 * design: screens-hub.jsx OWalletPanel — earned Os, the four buckets on one bar, what this
 * surface is (a testbed: movement only), and what the Os became. Moves forward from M09 for
 * the Community hub's Wallet row (D-038).
 */
export function OWalletPanel({ wallet: W, power, holdings, faces, people, onMove, onCollected, onListed }: OWalletPanelProps) {
  const total = W.available + W.protected + W.pending + W.locked;
  const [hot, setHot] = useState<string | null>(null);
  const [move, setMove] = useState(false);
  const [about, setAbout] = useState(false);
  /* No banking bridge exists here and none is implied: WeOverse is a testbed on mock Os.
     What a wallet can do here is MOVE earned Os. Settlement lives in the WeO apps. */
  const FNS = [
    {
      k: 'move',
      label: 'Move Os',
      tone: 'var(--o-green)',
      note: 'Send earned Os to another passport, inside the network.',
      go: () => setMove(true),
      icon: <path d="M4.6 9.4h11.8l-2.8-2.8M19.4 14.6H7.6l2.8 2.8" />,
    },
    {
      k: 'about',
      label: 'How Os work here',
      tone: 'var(--o-blue)',
      note: 'Earned, mock, movement only — no settlement, no cash out.',
      go: () => setAbout(true),
      icon: (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M12 11v5.4" />
          <circle cx="12" cy="8" r=".9" fill="currentColor" />
        </>
      ),
    },
  ];
  const buckets = [
    { k: 'Available', v: W.available, c: 'var(--o-green)', note: 'Free to move now' },
    { k: 'Protected', v: W.protected, c: 'var(--o-blue)', note: 'Held against something you opened' },
    { k: 'Pending', v: W.pending, c: 'var(--o-gold)', note: 'In flight' },
    { k: 'Locked', v: W.locked, c: 'var(--o-violet)', note: 'Held by an open commitment' },
  ];
  const row = (label: string, note: string, count: number, thumbs: ReactNode, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className="weo-dir-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        font: 'inherit',
        borderRadius: 18,
        padding: '11px 14px',
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
      }}
    >
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--text-faint)' }}>{note}</span>
      </span>
      {thumbs}
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      {chevron}
    </button>
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 6,
        borderRadius: 28,
        padding: 'clamp(16px,2vw,22px)',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
      }}
    >
      {/* the balance, and what you can do with it */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-faint)' }}
            >
              Earned Os · free to move
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: 999,
                padding: '2px 9px',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--o-violet)',
                background: 'color-mix(in srgb, var(--o-violet) 12%, var(--surface))',
              }}
            >
              Testbed
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 7 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                fontSize: 'clamp(28px,3.6vw,40px)',
                fontWeight: 700,
                letterSpacing: '-.035em',
                lineHeight: 1,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <OMark size="0.62em" />
              {osFmt(W.available)}
            </span>
            {power != null && <OPower power={power} os={W.available} format="inline" />}
          </span>
        </div>
        {/* Two functions, stated once: icon and label, fixed. Nothing expands, nothing
            reflows — the explanation rides the tooltip and the aria-label. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
          {FNS.map((fn) => {
            const on = hot === fn.k;
            return (
              <button
                key={fn.k}
                onClick={fn.go}
                onMouseEnter={() => setHot(fn.k)}
                onMouseLeave={() => setHot(null)}
                onFocus={() => setHot(fn.k)}
                onBlur={() => setHot(null)}
                aria-label={`${fn.label} — ${fn.note}`}
                title={fn.note}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 40,
                  padding: '0 14px 0 11px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: on ? '#fff' : 'var(--text)',
                  background: on ? fn.tone : 'var(--surface)',
                  boxShadow: on
                    ? `0 10px 22px -10px color-mix(in srgb, ${fn.tone} 85%, transparent)`
                    : 'var(--nm-sm), inset 0 0 0 1px var(--border)',
                  transition: 'background .2s, color .18s, box-shadow .22s',
                }}
              >
                <span style={{ display: 'grid', placeItems: 'center', color: on ? '#fff' : fn.tone }}>
                  {svg(fn.icon, 17, 'currentColor', 1.8)}
                </span>
                {fn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* four buckets, one bar — never one balance */}
      <div>
        <span style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', boxShadow: 'var(--nm-inset)' }}>
          {buckets.map((b) => (
            <span
              key={b.k}
              title={`${b.k} · O ${osFmt(b.v)}`}
              style={{ width: `${(b.v / Math.max(1, total)) * 100}%`, background: b.c }}
            />
          ))}
        </span>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '8px 16px', marginTop: 12 }}
        >
          {buckets.map((b) => (
            <span key={b.k} style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span
                style={{ width: 7, height: 7, borderRadius: '50%', background: b.c, flex: '0 0 auto', transform: 'translateY(-1px)' }}
              />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{b.k}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-faint)' }}>{b.note}</span>
              </span>
              <b
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12.5,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <OMark size={10} />
                {osFmt(b.v)}
              </b>
            </span>
          ))}
        </div>
      </div>

      {/* what this surface is, said once */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          borderRadius: 22,
          padding: '13px 16px',
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
        }}
      >
        <span style={{ flex: '1 1 230px', minWidth: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
          Mock Os, earned in the WeOverse and moved inside it. No settlement, no cash out and no staking on this surface —
          those live in your O-Wallet and the WeO apps.
        </span>
        <button
          onClick={() => setAbout(true)}
          style={{
            flex: '0 0 auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 999,
            padding: '8px 14px',
            font: 'inherit',
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--o-blue)',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-sm)',
          }}
        >
          How Os work here{svg(<polyline points="9 6 15 12 9 18" />, 13, 'currentColor', 2.4)}
        </button>
      </div>

      {/* what the Os became */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
        {row(
          'Collect',
          'Everything you hold',
          holdings.collected,
          <span style={{ display: 'flex' }}>
            {faces.slice(0, 3).map((h, i) => (
              <span key={h.id} style={{ marginLeft: i ? -8 : 0 }}>
                <Orb size={26} fill="image" src={h.img} ring ringColor="var(--o-blue)" matcap />
              </span>
            ))}
          </span>,
          onCollected,
        )}
        {row('Exchange', 'On the floor now', holdings.listed, null, onListed)}
      </div>
      {about && <MockOsSheet onClose={() => setAbout(false)} />}
      {move && <MoveOsSheet people={people} max={W.available} onMove={onMove} onClose={() => setMove(false)} />}
    </div>
  );
}

const tick = svg(<polyline points="20 6 9 17 4 12" />, 11, 'currentColor', 2.4);

/* What an O is on this surface, stated once and plainly. No bank, no settlement, no
   conversion — the WeOverse is where terms get tested, not where money moves. */
export function MockOsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      title="How Os work here"
      w={540}
      onClose={onClose}
      sub="WeOverse is a testbed. The Os in this wallet are earned inside it and move inside it — there is no banking bridge on this surface."
      footer={
        <Button size="sm" variant="primary" tone="blue" onClick={onClose}>
          Understood
        </Button>
      }
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {[
          [
            'Earned, not bought',
            'Os arrive from what you do here — answers accepted, WeOs collected, Circles grown. Nothing is purchased on this surface.',
          ],
          ['Movement only', 'A wallet here can move earned Os to another passport. That is the whole capability.'],
          [
            'No settlement, no cash out',
            'No bank account, no card, no conversion. Commerce Os and settlement belong to the WeO apps, under their own rules.',
          ],
          [
            'What changes at launch',
            'When the O-Wallet is live in the WeO apps, this wallet still only transfers earned Os for movement — settlement and commerce stay there.',
          ],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 11 }}>
            <span
              style={{
                flex: '0 0 auto',
                width: 18,
                height: 18,
                marginTop: 2,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--o-blue)',
                background: 'color-mix(in srgb, var(--o-blue) 14%, var(--surface))',
              }}
            >
              {tick}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{k}</span>
              <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>{v}</span>
            </span>
          </div>
        ))}
      </div>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16 }}>
        <Chip dot tone="var(--o-violet)">
          Mock Os
        </Chip>
        <Chip tone="var(--o-green)">Earned inside the network</Chip>
        <Chip tone="var(--text-faint)">No banking bridge</Chip>
      </span>
    </Sheet>
  );
}

/* The one thing a wallet does here: move earned Os to another passport. */
export function MoveOsSheet({
  people,
  max,
  onMove,
  onClose,
}: {
  people: MovePerson[];
  max: number;
  onMove: (to: MovePerson, os: number) => Promise<void>;
  onClose: () => void;
}) {
  const [to, setTo] = useState<MovePerson | null>(people[0] ?? null);
  const [os, setOs] = useState(Math.min(500, max));
  const [busy, setBusy] = useState(false);
  const pick = to ?? people[0] ?? null;
  const go = async () => {
    if (!pick) return;
    setBusy(true);
    try {
      await onMove(pick, os);
      onClose();
    } catch {
      /* the caller says why; the sheet stays open to try again */
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title="Move Os"
      w={520}
      onClose={onClose}
      sub="Earned Os, moved to another passport inside the network. No settlement, no conversion."
      footer={
        <>
          <Button size="sm" variant="ghost" tone="violet" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            tone="green"
            disabled={!os || os > max || !pick || busy}
            onClick={() => void go()}
          >
            Move O {osFmt(os)}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <span
            style={{
              display: 'block',
              marginBottom: 9,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            To
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {people.map((p) => {
              const on = pick?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setTo(p)}
                  aria-pressed={on}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 999,
                    cursor: 'pointer',
                    padding: '5px 13px 5px 5px',
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: on ? 700 : 500,
                    color: on ? '#fff' : 'var(--text-dim)',
                    background: on ? 'var(--o-green)' : 'var(--surface)',
                    boxShadow: on ? 'none' : 'var(--nm-sm)',
                  }}
                >
                  <Avatar src={p.avatar} size={26} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-faint)' }}
            >
              How many
            </span>
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <OMark size={14} />
              {osFmt(os)}
            </span>
          </span>
          <input
            type="range"
            aria-label="How many Os"
            min={Math.min(100, max)}
            max={max}
            step={100}
            value={os}
            onChange={(e) => setOs(Number(e.target.value))}
            style={{ width: '100%', marginTop: 10, accentColor: 'var(--o-green)' }}
          />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 4,
              marginTop: 6,
              fontSize: 11,
              color: 'var(--text-faint)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <OMark size={9} />
            {osFmt(max)} earned and free to move
          </span>
        </div>
      </div>
    </Sheet>
  );
}
