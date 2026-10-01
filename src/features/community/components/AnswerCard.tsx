import type { CSSProperties } from 'react';
import { Avatar, Button, svg } from '@/design-system';
import { relTime } from '@/lib/time';
import type { AnswerModel } from '../model/community';

const vbtn = (on: boolean, color: string): CSSProperties => ({
  border: 'none',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  width: 34,
  height: 30,
  borderRadius: 12,
  color: on ? '#fff' : 'var(--text-dim)',
  background: on ? color : 'var(--surface-2)',
  boxShadow: on ? 'none' : 'var(--nm-inset)',
});

const star = (filled: boolean) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
    <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z" />
  </svg>
);

/**
 * design: screens-circle.jsx AnswerCard — vote, the answer, accept, and its replies. Only the
 * thread's author can accept (D-042): everyone else sees "Accepted" on the one that was. No
 * steward badge (D-036).
 */
export function AnswerCard({
  a,
  canAccept,
  composing,
  replyText,
  busy,
  onVote,
  onAccept,
  onToggleReply,
  onReplyText,
  onPostReply,
}: {
  a: AnswerModel;
  canAccept: boolean;
  composing: boolean;
  replyText: string;
  busy?: boolean;
  onVote: (dir: 1 | -1) => void;
  onAccept: () => void;
  onToggleReply: () => void;
  onReplyText: (s: string) => void;
  onPostReply: () => void;
}) {
  const p = a.author;
  const name = a.mine ? 'You' : p.name;
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        borderRadius: 22,
        padding: 18,
        background: a.accepted ? 'color-mix(in srgb,var(--o-gold) 7%,var(--surface))' : 'var(--surface)',
        boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
        borderLeft: a.accepted ? '3px solid var(--o-gold)' : 'none',
      }}
    >
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <button onClick={() => onVote(1)} aria-label="Upvote" aria-pressed={a.vote === 1} style={vbtn(a.vote === 1, 'var(--o-green)')}>
          {svg(<polyline points="18 15 12 9 6 15" />, 18, 'currentColor', 2)}
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{a.score}</span>
        <button
          onClick={() => onVote(-1)}
          aria-label="Downvote"
          aria-pressed={a.vote === -1}
          style={vbtn(a.vote === -1, 'var(--status-error)')}
        >
          {svg(<polyline points="6 9 12 15 18 9" />, 18, 'currentColor', 2)}
        </button>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Avatar src={p.avatar} isr={p.isr} size={38} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>· {a.createdAt ? relTime(a.createdAt) : 'just now'}</span>
          {(canAccept || a.accepted) && (
            <button
              onClick={canAccept ? onAccept : undefined}
              disabled={!canAccept || busy}
              aria-pressed={a.accepted}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: canAccept ? 'pointer' : 'default',
                border: 'none',
                borderRadius: 999,
                padding: '5px 12px',
                font: 'inherit',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--o-gold-ink)',
                background: a.accepted
                  ? 'color-mix(in srgb,var(--o-gold) 16%,var(--surface))'
                  : 'color-mix(in srgb,var(--o-gold) 8%,var(--surface))',
                boxShadow: a.accepted ? 'inset 0 0 0 1px var(--o-gold)' : 'none',
              }}
            >
              {star(a.accepted)}
              {a.accepted ? 'Accepted' : 'Accept answer'}
            </button>
          )}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-line' }}>{a.body}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)' }}>
          <button
            onClick={onToggleReply}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--o-green)',
              padding: 0,
            }}
          >
            Reply
          </button>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{a.replies.length} replies</span>
        </div>
        {a.replies.length > 0 && (
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              borderLeft: '1px solid var(--o-violet)',
              paddingLeft: 12,
            }}
          >
            {a.replies.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Avatar src={r.author.avatar} isr={r.author.isr} size={26} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{r.mine ? 'You' : r.author.name}</span>
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-faint)' }}>
                    {r.createdAt ? relTime(r.createdAt) : 'just now'}
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--text)' }}>
                    {r.mention && <span style={{ fontWeight: 700, color: 'var(--o-violet)' }}>{r.mention} </span>}
                    {r.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {composing && (
          <div style={{ marginTop: 12, borderRadius: 16, padding: 12, background: 'var(--surface)', boxShadow: 'var(--nm-inset)' }}>
            <textarea
              value={replyText}
              onChange={(e) => onReplyText(e.target.value)}
              rows={2}
              aria-label={`Reply to ${name}`}
              placeholder={`Reply to ${name}…`}
              style={{
                width: '100%',
                resize: 'none',
                border: 'none',
                background: 'transparent',
                fontSize: 13.5,
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <Button size="sm" variant="ghost" tone="violet" onClick={onToggleReply}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" tone="green" disabled={busy} onClick={onPostReply}>
                Reply
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
