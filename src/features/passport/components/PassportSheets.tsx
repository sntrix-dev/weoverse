// design: passport.jsx IsrImproveSheet / EditProfileSheet / TierLadderSheet / PassportSettingsSheet
// · screens-network.jsx PublicProfileSheet
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ApiError } from '@/api/client';
import { Sheet } from '@/components/feedback/Sheet';
import { CopyBtn } from '@/components/shell/CopyBtn';
import { Avatar, Button, Chip, ISRRing, OMark, Orb, Toggle } from '@/design-system';
import { uploadMedia } from '@/features/create/api/create';
import { osFmt } from '@/lib/format';
import { openCreator } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useUpdateProfile, useUpdatePublicProfile, type PassportDto } from '../api/passport';
import { askFromHere, currentRung, nextRung, pct } from '../model/passport';

const micro: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};
const field: CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: 13,
  padding: '11px 14px',
  fontSize: 13.5,
  color: 'var(--text)',
  background: 'var(--surface-2)',
  boxShadow: 'var(--nm-inset)',
  outline: 'none',
  font: 'inherit',
};

/* ---------- standing you can work on ---------- */
export function IsrImproveSheet({ p, onClose }: { p: PassportDto; onClose: () => void }) {
  const S = p.standing;
  const next = nextRung(p);
  const [open, setOpen] = useState<string | null>('Open disputes');
  return (
    <Sheet
      title="Improve your standing"
      sub={`ISR ${Math.round(S.isr)} · ${S.policyVersion}`}
      w={520}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            borderRadius: 26,
            padding: 18,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          <ISRRing value={Math.round(S.isr)} size={84} />
          <div style={{ minWidth: 0 }}>
            {S.delta && (
              <Chip selected tone="var(--o-green)" style={{ marginBottom: 9 }}>
                {S.delta} this week
              </Chip>
            )}
            {next ? (
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--text)' }}>
                  {askFromHere(next)} to {next.label}
                </b>{' '}
                — {next.need}. That lifts your advantage to {pct(next.adv)}%.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dim)' }}>
                You are at the top tier. Standing decays fast and restores slowly — keep the weeks clean.
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {S.inputs.map((m) => {
            const on = open === m.k;
            const bad = m.w < 0;
            const tone = bad ? 'var(--status-error)' : 'var(--o-green)';
            return (
              <div
                key={m.k}
                style={{
                  borderRadius: 20,
                  background: on ? 'var(--surface)' : 'var(--surface-2)',
                  boxShadow: on
                    ? `var(--nm-raised), inset 0 0 0 1px color-mix(in srgb, ${tone} 26%, transparent)`
                    : 'var(--nm-inset)',
                  transition: 'background .3s, box-shadow .3s',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(on ? null : m.k)}
                  aria-expanded={on}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '13px 15px',
                    textAlign: 'left',
                    font: 'inherit',
                  }}
                >
                  <span
                    style={{ width: 7, height: 7, borderRadius: '50%', background: tone, flex: '0 0 auto' }}
                  />
                  <span
                    style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}
                  >
                    {m.k}
                  </span>
                  <b
                    style={{
                      width: 34,
                      textAlign: 'right',
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: tone,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {m.w > 0 ? '+' : '−'}
                    {Math.abs(m.w)}
                  </b>
                </button>
                {on && (
                  <div
                    style={{ padding: '0 15px 14px', animation: 'weo-cardin .32s var(--ease-settle) both' }}
                  >
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-dim)' }}>
                      {m.do}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-faint)',
                      }}
                    >
                      {m.cap}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div
          style={{
            borderRadius: 22,
            padding: 16,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.13em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            What it never counts
          </span>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-dim)' }}>
            {S.excludes.join(' · ')}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-dim)' }}>
            <b style={{ color: 'var(--text)' }}>Appeal.</b> {S.appeal}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="sm" variant="primary" tone="green" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- the profile is yours, and it travels ---------- */
export function EditProfileSheet({ p, onClose }: { p: PassportDto; onClose: () => void }) {
  const save = useUpdateProfile();
  const id = p.identity;
  const [name, setName] = useState(id.name);
  const [handle, setHandle] = useState(id.handle);
  const [bio, setBio] = useState(id.bio ?? '');
  const [photo, setPhoto] = useState<string | null>(id.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErr('Choose a photo (JPEG, PNG, WebP).');
    setErr(null);
    setUploading(true);
    try {
      const up = await uploadMedia(f);
      setPhoto(up.url);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'The photo did not upload — try again.');
    } finally {
      setUploading(false);
    }
  };

  const go = () => {
    const patch: Record<string, string> = {};
    if (name.trim() && name.trim() !== id.name) patch.name = name.trim();
    if (handle.trim() && handle.trim() !== id.handle) patch.handle = handle.trim();
    if (bio.trim() !== (id.bio ?? '')) patch.bio = bio.trim();
    if (photo && photo !== id.avatarUrl) patch.avatarUrl = photo;
    if (!Object.keys(patch).length) return onClose();
    setErr(null);
    save.mutate(patch, {
      onSuccess: () => {
        onClose();
        toast('Profile saved to your O wallet');
      },
      onError: (e) => setErr(e instanceof ApiError ? e.message : 'That did not save — try again.'),
    });
  };

  return (
    <Sheet
      title="Edit your profile"
      sub={id.passportId ? `# ${id.passportId}` : undefined}
      w={470}
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            title="Change photo"
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              borderRadius: '50%',
              opacity: uploading ? 0.5 : 1,
            }}
          >
            <Avatar src={photo} isr={Math.round(p.standing.isr)} size={62} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <label>
              <span style={micro}>Display name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} style={field} />
            </label>
          </div>
        </div>
        <label>
          <span style={micro}>Handle</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/\s/g, ''))}
            maxLength={31}
            style={field}
          />
        </label>
        <label>
          <span style={micro}>What you make</span>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            placeholder="One line. It shows on every WeO you post."
            style={{ ...field, resize: 'vertical', lineHeight: 1.5 }}
          />
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 13,
            borderRadius: 22,
            padding: 16,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          <span style={{ position: 'relative', flex: '0 0 auto', display: 'grid', placeItems: 'center' }}>
            <Orb size={40} fill="#F7C62B" matcap breathe />
            <span aria-hidden="true" style={{ position: 'absolute', color: 'var(--o-gold-ink, #8a6a06)' }}>
              <OMark size={16} />
            </span>
          </span>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--text-dim)' }}>
            Saved to your O wallet with your passport id, standing and tier — so it travels with you when the
            wallet moves to the apps.
          </p>
        </div>
        {err && (
          <span role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--status-error)' }}>
            {err}
          </span>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="sm" variant="ghost" tone="blue" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            tone="green"
            onClick={go}
            disabled={save.isPending || uploading}
            dot
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- every tier, read from where you stand ---------- */
export function TierLadderSheet({
  p,
  available,
  onClose,
}: {
  p: PassportDto;
  available: number;
  onClose: () => void;
}) {
  const mine = currentRung(p);
  const isr = Math.round(p.standing.isr);
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
        aria-label="Participant tiers"
        style={{
          width: 'min(560px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          borderRadius: 30,
          padding: 24,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--glass-brd)',
          animation: 'weo-cardin .32s var(--ease-portal) both',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            Participant tiers
          </p>
          <h3
            style={{
              margin: '6px 0 0',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-.026em',
              color: 'var(--text)',
            }}
          >
            Where you stand, and what moves you
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
            A tier changes the advantage you carry into every marketplace app — never the rate anyone else
            pays.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {p.tier.ladder.map((t) => {
            const above = !t.reached;
            return (
              <div
                key={t.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  borderRadius: 20,
                  padding: '13px 15px',
                  background: t.current
                    ? `color-mix(in srgb, ${t.tone} 9%, var(--surface))`
                    : 'var(--surface)',
                  boxShadow: t.current ? `inset 0 0 0 1.5px ${t.tone}` : 'var(--nm-sm)',
                }}
              >
                <span
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 30,
                    height: 30,
                    flex: '0 0 auto',
                    borderRadius: '50%',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: t.current ? '#fff' : t.tone,
                    background: t.current ? t.tone : `color-mix(in srgb, ${t.tone} 12%, var(--surface-2))`,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {t.n}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{t.label}</b>
                    <Chip tone={t.tone}>{`${pct(t.adv)}% advantage`}</Chip>
                    {t.current && (
                      <Chip dot tone={t.tone}>
                        You are here
                      </Chip>
                    )}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 5,
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: 'var(--text-dim)',
                    }}
                  >
                    {t.need}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 3,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: above ? t.tone : 'var(--text-faint)',
                    }}
                  >
                    {above ? `From here: ${askFromHere(t)}` : askFromHere(t)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            borderRadius: 20,
            padding: '13px 15px',
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            What would cost you Tier {mine.n}
          </p>
          <ul
            style={{
              margin: '9px 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {[
              mine.n === 1
                ? 'Only a suspended passport falls below this'
                : `ISR falling below ${mine.isr} — you are ${Math.max(0, isr - mine.isr)} above it now`,
              'A flow that settles late, or a redemption you cannot verify',
              'An accepted answer withdrawn by the person who accepted it',
            ].map((x) => (
              <li
                key={x}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: 'var(--text-dim)',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    marginTop: 6,
                    borderRadius: '50%',
                    flex: '0 0 auto',
                    background: 'var(--status-error)',
                  }}
                />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 5,
              fontSize: 12,
              color: 'var(--text-dim)',
            }}
          >
            Worth{' '}
            <b style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, color: 'var(--text)' }}>
              <OMark size={11} />
              {osFmt(Math.round(available * mine.adv))}
            </b>{' '}
            on what you hold today
          </span>
          <Button size="sm" variant="ghost" tone="violet" style={{ marginLeft: 'auto' }} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- your side of the same card ---------- */
const CONTACTS: [PassportDto['publicProfile']['contact'], string][] = [
  ['anyone', 'Anyone'],
  ['circles', 'Shared Circles only'],
  ['off', 'Nobody'],
];
const ROWS: { k: 'collections' | 'activity' | 'invites'; label: string; on: string; off: string }[] = [
  {
    k: 'collections',
    label: 'Show what you hold',
    on: 'Anyone can see your collection',
    off: 'Your collection stays private',
  },
  {
    k: 'activity',
    label: 'Show what you do in public',
    on: 'Threads you ask and answer are listed',
    off: 'Activity is hidden outside its Circle',
  },
  {
    k: 'invites',
    label: 'Take Circle invites',
    on: 'People can invite you into their Circles',
    off: 'No invites — you find Circles yourself',
  },
];

export function PublicProfileSheet({ p, onClose }: { p: PassportDto; onClose: () => void }) {
  const upd = useUpdatePublicProfile();
  const P = p.publicProfile;
  const id = p.identity;
  const setPerm = (patch: Partial<PassportDto['publicProfile']>) =>
    upd.mutate(patch, { onError: () => toast('That did not save — try again') });
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
        aria-label="Your public profile"
        style={{
          width: 'min(460px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          borderRadius: 30,
          padding: 24,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card), inset 0 0 0 1px var(--glass-brd)',
          animation: 'weo-cardin .32s var(--ease-portal) both',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            Your public profile
          </p>
          <h3
            style={{
              margin: '6px 0 0',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-.026em',
              color: 'var(--text)',
            }}
          >
            What a stranger sees
          </h3>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 13,
            borderRadius: 22,
            padding: 14,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          <Avatar src={id.avatarUrl} isr={Math.round(p.standing.isr)} size={44} />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
              {id.name}
            </span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-dim)' }}>
              {id.handle} · ISR {Math.round(p.standing.isr)}
            </span>
          </span>
          <Button size="sm" variant="primary" tone="green" onClick={() => openCreator(id.id)}>
            Preview it
          </Button>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 1,
            borderRadius: 20,
            overflow: 'hidden',
            background: 'var(--border)',
          }}
        >
          {ROWS.map((r) => {
            const on = !!P[r.k];
            return (
              <button
                type="button"
                key={r.k}
                onClick={() => setPerm({ [r.k]: !on })}
                role="switch"
                aria-checked={on}
                aria-label={r.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                  padding: '13px 15px',
                  background: 'var(--surface)',
                }}
              >
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {r.label}
                  </span>
                  <span
                    style={{ display: 'block', marginTop: 2, fontSize: 11.5, color: 'var(--text-faint)' }}
                  >
                    {on ? r.on : r.off}
                  </span>
                </span>
                <span
                  style={{
                    position: 'relative',
                    width: 42,
                    height: 24,
                    flex: '0 0 auto',
                    borderRadius: 999,
                    background: on ? 'var(--o-green)' : 'var(--surface-3, var(--surface-2))',
                    boxShadow: on ? 'none' : 'var(--nm-inset)',
                    transition: 'background .24s',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: on ? 21 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 2px 6px rgba(8,10,18,.24)',
                      transition: 'left .24s var(--ease-portal)',
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            Who can contact you
          </p>
          <div
            style={{
              display: 'flex',
              gap: 5,
              padding: 4,
              borderRadius: 999,
              background: 'var(--surface-2)',
              boxShadow: 'var(--nm-inset)',
            }}
          >
            {CONTACTS.map(([k, label]) => {
              const on = P.contact === k;
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => setPerm({ contact: k })}
                  aria-pressed={on}
                  style={{
                    flex: 1,
                    minHeight: 36,
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 999,
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: on ? 700 : 500,
                    color: on ? '#fff' : 'var(--text-dim)',
                    background: on ? 'var(--o-blue)' : 'transparent',
                    transition: 'background .22s, color .2s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p style={{ margin: '9px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-faint)' }}>
            Standing, tier and the WeOs you have listed are always public — they are what other people are
            trusting.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" tone="violet" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- the passport's own controls ---------- */
function Row({
  label,
  note,
  children,
  last,
}: {
  label: string;
  note?: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        padding: '11px 0',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {note && (
          <div style={{ marginTop: 2, fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-dim)' }}>
            {note}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {children}
      </div>
    </div>
  );
}
const head = (t: string) => (
  <span
    style={{
      display: 'block',
      margin: '18px 0 4px',
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '.13em',
      textTransform: 'uppercase',
      color: 'var(--text-faint)',
    }}
  >
    {t}
  </span>
);

export function PassportSettingsSheet({
  p,
  onEdit,
  onPublic,
  onSettings,
  onExport,
  exporting,
  onClose,
}: {
  p: PassportDto;
  onEdit: () => void;
  onPublic: () => void;
  /** opens the settings page, at a section */
  onSettings: (section?: string) => void;
  onExport: () => void;
  exporting: boolean;
  onClose: () => void;
}) {
  const upd = useUpdatePublicProfile();
  const pub = p.publicProfile;
  const id = p.identity;
  const link = `${window.location.origin}/creators/${id.id}`;
  const setPerm = (patch: Partial<PassportDto['publicProfile']>) =>
    upd.mutate(patch, { onError: () => toast('That did not save — try again') });
  const T = (on: boolean, fn: (v: boolean) => void, label: string) => (
    <Toggle checked={on} onChange={fn} tone="#3A95F2" aria-label={label} />
  );
  const btn = (label: string, onClick: () => void, tone: 'blue' | 'violet' | 'green' = 'blue') => (
    <Button size="sm" variant="ghost" tone={tone} onClick={onClick}>
      {label}
    </Button>
  );
  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet
      title="Passport settings"
      sub="What your passport shows, how you share it, and who can reach you."
      w={580}
      onClose={onClose}
      footer={
        <>
          {btn(
            'Sign-in & security',
            go(() => onSettings('security')),
            'violet',
          )}
          <Button size="sm" variant="primary" selected tone="blue" onClick={go(() => onSettings())}>
            All settings
          </Button>
        </>
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 13,
          padding: 14,
          borderRadius: 20,
          background: 'var(--surface-2)',
          boxShadow: 'var(--nm-inset)',
        }}
      >
        <Avatar src={id.avatarUrl} isr={Math.round(p.standing.isr)} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>{id.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{id.handle}</div>
        </div>
        {btn('Change photo', go(onEdit))}
        <Button size="sm" variant="primary" selected tone="blue" onClick={go(onEdit)}>
          Edit profile
        </Button>
      </div>

      {head('Your ID & link')}
      {id.passportId && (
        <Row label="WeO ID" note="The same ID in every WeO app">
          <code
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '.06em',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
            }}
          >
            # {id.passportId}
          </code>
          <CopyBtn text={id.passportId} what="WeO ID" />
        </Row>
      )}
      <Row label="Your page" note="Members who open it see your public page" last>
        <CopyBtn text={link} what="Your page" />
      </Row>

      {head('Public page')}
      <Row label="Preview your public page" note="Exactly what others see">
        {btn('Preview', go(onPublic))}
      </Row>
      <Row label="Show my collections" note="WeOs you hold">
        {T(pub.collections, (v) => setPerm({ collections: v }), 'Show my collections')}
      </Row>
      <Row label="Show my activity" note="Recent collects, posts and pledges" last>
        {T(pub.activity, (v) => setPerm({ activity: v }), 'Show my activity')}
      </Row>

      {head('Who can reach you')}
      <Row label="Messages">
        <div
          style={{
            display: 'inline-flex',
            gap: 3,
            padding: 4,
            borderRadius: 999,
            background: 'var(--surface-2)',
            boxShadow: 'var(--nm-inset)',
          }}
        >
          {(
            [
              ['anyone', 'Anyone'],
              ['circles', 'My Circles'],
              ['off', 'No one'],
            ] as const
          ).map(([k, label]) => {
            const on = pub.contact === k;
            return (
              <button
                type="button"
                key={k}
                onClick={() => setPerm({ contact: k })}
                aria-pressed={on}
                style={{
                  height: 30,
                  padding: '0 12px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 12,
                  fontWeight: on ? 700 : 500,
                  color: on ? '#fff' : 'var(--text-dim)',
                  background: on ? 'var(--o-blue)' : 'transparent',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Row>
      <Row label="Circle invites" last>
        {T(pub.invites, (v) => setPerm({ invites: v }), 'Circle invites')}
      </Row>

      {head('Standing')}
      <Row
        label="Always public"
        note="Your ISR, tier and listed WeOs are what other people are trusting"
        last
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--o-blue)' }}>
          ISR {Math.round(p.standing.isr)}
        </span>
      </Row>

      {head('Verification')}
      <Row label="Verified original" note="Your WeOs carry your passport as proof of origin" last>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--o-green)' }}>Verified</span>
      </Row>

      {head('Your data')}
      <Row label="Download your passport" note="Standing, tier, graph and records as one file">
        {btn(exporting ? 'Preparing…' : 'Download', onExport)}
      </Row>
      <Row label="Deactivate or delete your account" last>
        {btn(
          'Open',
          go(() => onSettings('danger')),
          'violet',
        )}
      </Row>
    </Sheet>
  );
}
