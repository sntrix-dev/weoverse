import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { Sheet } from '@/components/feedback/Sheet';
import { StageRing } from '@/components/weo/StageRing';
import { Button, OMark, Orb, Spinner } from '@/design-system';
import { formatHex, type WeoFormat } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { closeVet, openCreator } from '@/stores/flow';
import { ack, toast } from '@/stores/ui';
import {
  useOpenPledges,
  usePledge,
  useReact,
  useUnpledge,
  useVetting,
  type VettingCardDto,
} from '../api/worlds';
import { STAGE_RING, STAGE_TONE, STAGE_WORD } from '../model/lifecycle';

const label: CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  marginBottom: 7,
};
const field: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: 'none',
  borderRadius: 13,
  padding: '11px 14px',
  font: 'inherit',
  fontSize: 13,
  color: 'var(--text)',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-inset)',
  outline: 'none',
};
const NOTE_MAX = 280;

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message || fallback : fallback);

/**
 * D-090: where others react and pledge — the design only fills the ring on a timer. One sheet:
 * the WeO as its creator rehearsed it, then what you would pay and why (reacting), or a pledge
 * at its price (pledging). A pledge is a promise; nothing is held (D-086).
 */
export function VettingSheet({ id }: { id: string }) {
  const navigate = useNavigate();
  const q = useVetting(id);
  const card = q.data;
  return (
    <Sheet
      title={card ? card.title : 'In vetting'}
      sub={card ? subOf(card) : undefined}
      w={480}
      onClose={closeVet}
      footer={
        card?.stage === 'live' && card.weoId ? (
          <Button
            size="sm"
            variant="primary"
            selected
            tone="gold"
            onClick={() => {
              closeVet();
              void navigate(routes.weo(card.weoId!));
            }}
          >
            Open the WeO
          </Button>
        ) : (
          <Button size="sm" variant="ghost" tone="violet" onClick={closeVet}>
            Close
          </Button>
        )
      }
    >
      {q.isLoading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: 30 }}>
          <Spinner size={30} />
        </div>
      ) : !card ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dim)' }}>
          This one is not open to you — it may have moved on, or it was shared with someone else.
        </p>
      ) : (
        <VetBody card={card} />
      )}
    </Sheet>
  );
}

function subOf(c: VettingCardDto) {
  const by = c.creator.handle || c.creator.name;
  return `${c.format ?? 'WeO'} · by ${by}${c.audience?.label ? ` · open to ${c.audience.label}` : ''}`;
}

function VetBody({ card }: { card: VettingCardDto }) {
  const react = useReact();
  const pledge = usePledge();
  const unpledge = useUnpledge();
  const openPledges = useOpenPledges();
  const mine = card.mine;
  const [os, setOs] = useState<string>(mine.reaction?.os ? String(mine.reaction.os) : '');
  const [note, setNote] = useState(mine.reaction?.note ?? '');
  const stage = card.stage === 'posting' ? 'pledging' : card.stage;
  const tone = STAGE_TONE[stage] ?? '#D946EF';
  const need = card.reactions.need ?? 12;
  const threshold = card.pledges.threshold ?? 20;
  const rCount = card.reactions.count ?? 0;
  const pCount = card.pledges.count ?? 0;
  const fill =
    stage === 'reacting'
      ? rCount / need
      : stage === 'pledging'
        ? pCount / threshold
        : stage === 'live'
          ? 1
          : 0;
  const fmt = (card.format as WeoFormat | null) ?? 'Listing';

  const sendReaction = () => {
    const n = os.trim() ? Math.round(Number(os)) : null;
    if (n != null && (!Number.isFinite(n) || n < 1)) return toast('A price is a whole number of Os');
    if (!n && !note.trim()) return toast('Say what you would pay, or why');
    react.mutate(
      { id: card.id, os: n, note: note.trim() },
      {
        onSuccess: () => {
          ack(mine.reaction ? 'Reaction updated' : 'Reaction sent', '#D946EF');
        },
        onError: (e) => toast(errText(e, 'That did not go through — try again')),
      },
    );
  };
  const doPledge = () =>
    pledge.mutate(
      { id: card.id },
      {
        onSuccess: (c) => {
          if (c.stage === 'live') ack('Pledged · it is live', '#F7C62B');
          else ack('Pledged', '#F7C62B');
        },
        onError: (e) => toast(errText(e, 'The pledge did not go through — try again')),
      },
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <StageRing
          size={104}
          index={STAGE_RING[stage] ?? 0}
          fill={fill}
          tone={tone}
          waiting={stage === 'reacting' || stage === 'pledging'}
        >
          <Orb
            size={68}
            fill={card.cover ? 'image' : formatHex(fmt)}
            src={card.cover ?? undefined}
            matcap
            breathe
          />
        </StageRing>
        <div style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: tone,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone }} />
            {STAGE_WORD[card.stage] ?? 'In vetting'}
          </span>
          <p
            style={{
              margin: '6px 0 0',
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {stage === 'pledging' || stage === 'live' ? (
              <>
                {pCount}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-faint)' }}>
                  of {threshold} pledges
                </span>
              </>
            ) : (
              <>
                {rCount}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-faint)' }}>
                  of {need} reactions
                </span>
              </>
            )}
          </p>
          <p
            style={{
              margin: '4px 0 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-dim)',
            }}
          >
            {card.os != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <OMark size={11} /> {osFmt(card.os)}
              </span>
            )}
            {card.edition != null && <span>· {card.edition} units</span>}
            {card.days != null && <span>· {card.days} days</span>}
          </p>
          {card.rehearsed?.world && (
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-faint)' }}>
              Rehearsed in {card.rehearsed.world}
              {card.rehearsed.through != null
                ? ` · ${Math.round(card.rehearsed.through * 100)}% projected collect-through`
                : ''}
            </p>
          )}
          {card.creator.id && !mine.isOwner && (
            <button
              onClick={() => openCreator(card.creator.id!)}
              style={{
                marginTop: 6,
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--o-violet)',
              }}
            >
              {card.creator.name}
            </button>
          )}
        </div>
      </div>

      {(card.reactions.notes ?? []).length > 0 && (
        <div>
          <span style={label}>{mine.isOwner ? 'What your circle said' : 'Notes so far'}</span>
          <div
            style={{
              display: 'grid',
              gap: 1,
              borderRadius: 16,
              overflow: 'hidden',
              background: 'var(--border)',
            }}
          >
            {(card.reactions.notes ?? []).map((n, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'baseline',
                  padding: '9px 12px',
                  background: 'var(--surface)',
                }}
              >
                <span
                  style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.45, color: 'var(--text)' }}
                >
                  {n.note}
                </span>
                {n.os != null && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <OMark size={10} /> {osFmt(n.os)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mine.isOwner ? (
        <OwnerPart
          card={card}
          onOpenPledges={() =>
            openPledges.mutate(card.id, {
              onSuccess: () => ack('Pledges open', '#F7C62B'),
              onError: (e) => toast(errText(e, 'Pledges did not open — try again')),
            })
          }
          busy={openPledges.isPending}
        />
      ) : stage === 'reacting' || stage === 'reacted' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            <span style={label}>What would you pay? (Os, optional)</span>
            <input
              value={os}
              onChange={(e) => setOs(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder={card.os != null ? `It asks ${osFmt(card.os)}` : 'Os'}
              style={field}
            />
          </label>
          <label>
            <span style={label}>Why</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              rows={3}
              placeholder="What would make you collect it?"
              style={{ ...field, resize: 'vertical' }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {note.length}/{NOTE_MAX} · the creator sees your note and price, not your name
            </span>
            <Button
              size="sm"
              variant="primary"
              selected
              tone="violet"
              onClick={sendReaction}
              disabled={react.isPending}
              style={{ marginLeft: 'auto' }}
            >
              {react.isPending ? 'Sending…' : mine.reaction ? 'Update my reaction' : 'Send my reaction'}
            </Button>
          </div>
        </div>
      ) : stage === 'pledging' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
            A pledge is a promise at its price — nothing leaves your wallet. At {threshold} pledges it posts
            itself, validated, and you hear first. Collecting is still up to you.
          </p>
          {mine.pledge ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                You pledged <OMark size={11} /> {osFmt(mine.pledge.os ?? 0)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                tone="gold"
                style={{ marginLeft: 'auto' }}
                disabled={unpledge.isPending}
                onClick={() =>
                  unpledge.mutate(card.id, {
                    onSuccess: () => toast('Pledge withdrawn'),
                    onError: (e) => toast(errText(e, 'It did not go through — try again')),
                  })
                }
              >
                Withdraw my pledge
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="primary"
              selected
              tone="gold"
              onClick={doPledge}
              disabled={pledge.isPending || card.stage === 'posting'}
            >
              {pledge.isPending ? 'Pledging…' : card.os != null ? `Pledge at O ${osFmt(card.os)}` : 'Pledge'}
            </Button>
          )}
        </div>
      ) : card.stage === 'live' ? (
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
          Twenty pledges posted it — it is live on the floor with its validated mark.
        </p>
      ) : null}
    </div>
  );
}

function OwnerPart({
  card,
  onOpenPledges,
  busy,
}: {
  card: VettingCardDto;
  onOpenPledges: () => void;
  busy: boolean;
}) {
  const stage = card.stage;
  if (stage === 'reacted')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
          {card.reactions.count} reactions in. Open pledges and {card.pledges.threshold ?? 20} pledges
          pre-sell it — it posts itself, validated. The ones who reacted hear first.
        </p>
        <Button size="sm" variant="primary" selected tone="gold" onClick={onOpenPledges} disabled={busy}>
          {busy ? 'Opening…' : 'Open pledges'}
        </Button>
      </div>
    );
  if (stage === 'pledging' || stage === 'posting')
    return (
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
        Pre-sold so far: <OMark size={11} /> {osFmt(card.pledges.promisedOs ?? 0)} promised. It posts itself
        at {card.pledges.threshold ?? 20}.
      </p>
    );
  if (stage === 'reacting')
    return (
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
        Open to {card.audience?.label ?? 'your circle'}. Their notes land here as they come.
      </p>
    );
  return null;
}

export default VettingSheet;
