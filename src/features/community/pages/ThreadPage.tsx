import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { PathBar } from '@/components/shell/PathBar';
import { WeoTile } from '@/components/weo/WeoCards';
import { Avatar, Button, Chip } from '@/design-system';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { useWeo } from '@/features/weo/api/weos';
import { cardModel } from '@/lib/cardModel';
import { relTime } from '@/lib/time';
import { openReport } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useAccept, usePostAnswer, usePostReply, useThread, useVote } from '../api/community';
import { AnswerCard } from '../components/AnswerCard';
import { useHubPath } from '../components/Hub';
import { threadDetail, type AnswerModel } from '../model/community';
import { useCommunityWeoHandlers } from '../useCommunity';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};
const panel: CSSProperties = {
  background: 'var(--surface)',
  boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
};
const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};

const failed = (e: unknown) =>
  toast(e instanceof ApiError ? e.message : 'That did not go through — try again.');

/** design: thread.jsx ThreadScreen — the question, its answers by score, your answer, and what it is about. */
export function ThreadPage() {
  const { threadId = '' } = useParams();
  const navigate = useNavigate();
  const meQ = useNavSummary();
  const me = meQ.data;
  const q = useThread(threadId);
  const vote = useVote(threadId);
  const accept = useAccept(threadId);
  const answer = usePostAnswer(threadId);
  const reply = usePostReply(threadId);
  const [answerText, setAnswerText] = useState('');
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const t = useMemo(() => (q.data ? threadDetail(q.data, me?.id) : null), [q.data, me?.id]);
  const weoQ = useWeo(q.data?.attachedWeo ? (q.data.attachedWeoId ?? undefined) : undefined);
  const w = useMemo(() => (weoQ.data ? cardModel(weoQ.data) : null), [weoQ.data]);
  const wh = useCommunityWeoHandlers(t?.circleId ?? null);
  const circleName = t?.circleName ?? 'Circle';
  const path = useHubPath(
    t
      ? [{ label: circleName, onClick: () => void navigate(routes.circle(t.circleId)) }, { label: 'Thread' }]
      : [{ label: 'Thread' }],
  );

  if (!t) {
    return (
      <main style={page}>
        <PathBar onHub={path.onHub} items={path.items} />
        <p style={{ textAlign: 'center', padding: 40, fontSize: 14, color: 'var(--text-dim)' }}>
          {q.isError ? 'This thread could not be found.' : 'Opening the thread…'}
        </p>
      </main>
    );
  }

  const p = t.author;
  const onVote = (a: AnswerModel, dir: 1 | -1) =>
    vote.mutate({ answerId: a.id, value: a.vote === dir ? 0 : dir }, { onError: failed });
  const onAccept = (a: AnswerModel) =>
    accept.mutate(a.id, {
      onSuccess: (r) => toast(r.accepted ? 'Answer accepted · thread resolved' : 'Answer un-accepted'),
      onError: failed,
    });
  const toggleReply = (id: string) => {
    setReplyOpen((o) => (o === id ? null : id));
    setReplyText('');
  };
  const postReply = (answerId: string) => {
    const body = replyText.trim();
    if (!body) return;
    reply.mutate(
      { answerId, body },
      {
        onSuccess: () => {
          setReplyOpen(null);
          setReplyText('');
          toast('Reply posted');
        },
        onError: failed,
      },
    );
  };
  const postAnswer = () => {
    const body = answerText.trim();
    if (!body) return toast('Add your answer first');
    answer.mutate(body, {
      onSuccess: () => {
        setAnswerText('');
        toast('Answer posted');
      },
      onError: failed,
    });
  };

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'flex-start' }}>
        <div style={{ flex: '3 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ ...panel, borderRadius: 30, padding: 26 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <Avatar src={p.avatar} isr={p.isr} size={48} />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {p.name}{' '}
                  <span
                    style={{
                      marginLeft: 4,
                      borderRadius: 999,
                      padding: '2px 7px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--isr-strong)',
                      background: 'color-mix(in srgb, var(--isr-strong) 14%, transparent)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ISR {p.isr}
                  </span>
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-dim)' }}>
                  Posted {t.createdAt ? relTime(t.createdAt) : 'just now'} in {circleName}
                </p>
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  borderRadius: 999,
                  padding: '5px 13px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.resolved ? 'var(--o-green)' : 'var(--o-violet)',
                  background: `color-mix(in srgb, ${t.resolved ? 'var(--o-green)' : 'var(--o-violet)'} 12%, var(--surface))`,
                }}
              >
                {t.resolved ? 'Resolved' : 'Open'}
              </span>
            </div>
            <h1
              style={{
                margin: '16px 0 0',
                fontSize: 'clamp(21px,2.5vw,27px)',
                fontWeight: 700,
                letterSpacing: '-.025em',
                lineHeight: 1.15,
                color: 'var(--text)',
              }}
            >
              {t.title}
            </h1>
            {t.body && (
              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--text)',
                  maxWidth: '68ch',
                  whiteSpace: 'pre-line',
                }}
              >
                {t.body}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 16 }}>
              {t.tags.map((x) => (
                <Chip key={x} tone="var(--o-violet)">
                  #{x}
                </Chip>
              ))}
              {!t.mine && (
                <button
                  onClick={() => openReport({ label: t.title, threadId: t.id })}
                  style={{
                    marginLeft: 'auto',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--status-error)',
                    padding: 0,
                  }}
                >
                  Report
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: 'var(--text)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t.answers.length}</span>{' '}
              {t.answers.length === 1 ? 'answer' : 'answers'}
            </h2>
          </div>
          {t.answers.map((a) => (
            <AnswerCard
              key={a.id}
              a={a}
              canAccept={t.mine}
              composing={replyOpen === a.id}
              replyText={replyText}
              busy={accept.isPending || reply.isPending}
              onVote={(dir) => onVote(a, dir)}
              onAccept={() => onAccept(a)}
              onToggleReply={() => toggleReply(a.id)}
              onReplyText={setReplyText}
              onPostReply={() => postReply(a.id)}
            />
          ))}

          <div style={{ ...panel, borderRadius: 30, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <Avatar src={me?.avatarUrl} isr={me?.isr} size={34} />
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-dim)' }}>
                Answering as {me?.handle ?? 'you'} · ISR {me?.isr ?? '—'}
              </p>
            </div>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={4}
              aria-label="Your answer"
              placeholder="Share what worked for you…"
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--text)',
                background: 'var(--surface)',
                boxShadow: 'var(--nm-inset)',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                marginTop: 10,
                flexWrap: 'wrap',
              }}
            >
              <span />
              <Button
                size="sm"
                variant="primary"
                tone="green"
                disabled={answer.isPending}
                onClick={postAnswer}
              >
                Post answer
              </Button>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: '1 1 250px',
            minWidth: 230,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            alignItems: 'stretch',
          }}
        >
          {w && (
            <div
              style={{
                ...panel,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                borderRadius: 26,
                padding: '18px 14px',
              }}
            >
              <p style={{ ...eyebrow, alignSelf: 'flex-start' }}>Attached WeO</p>
              <WeoTile w={w} h={wh.h} width={216} active onEngage={() => wh.engage(w)} />
            </div>
          )}
          <div style={{ ...panel, borderRadius: 22, padding: 18 }}>
            <p style={{ ...eyebrow, margin: '0 0 10px' }}>Thread</p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                fontSize: 12.5,
                color: 'var(--text-dim)',
              }}
            >
              <p style={{ margin: 0 }}>
                Status{' '}
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {t.resolved ? 'Resolved' : 'Open'}
                </span>
              </p>
              <p style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {t.replies} replies · {t.reactions} reactions
              </p>
              <p style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>{t.views} views</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ThreadPage;
