import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { Sheet } from '@/components/feedback/Sheet';
import { CIRCLE_ICONS } from '@/components/circle/Circle';
import { Button, Chip, Orb, svg } from '@/design-system';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { circleView, type CircleView } from '@/lib/circleModel';
import { formatHex } from '@/lib/cardModel';
import { closeFlow, type PushTarget } from '@/stores/flow';
import { ack, toast } from '@/stores/ui';
import { useCommunityCircles, useCreateThread, useMyWeos, usePush, useReport } from '../../api/community';
import { REPORT_REASONS } from '../../model/community';

/** design: screens-more.jsx wellInput */
export const wellInput: CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: 13,
  padding: '13px 16px',
  fontSize: 14,
  color: 'var(--text)',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-sm)',
  outline: 'none',
  fontFamily: 'inherit',
};
const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};
const QUESTION_MAX = 280;

const failed = (e: unknown) =>
  toast(e instanceof ApiError ? e.message : 'That did not go through — try again.');

const radio = (on: boolean, tone: string): CSSProperties => ({
  width: 15,
  height: 15,
  borderRadius: '50%',
  flex: '0 0 auto',
  background: 'var(--surface)',
  boxShadow: on ? `inset 0 0 0 4px ${tone}, inset 0 0 0 5px var(--surface)` : 'inset 0 0 0 1px var(--border)',
});

const option = (on: boolean, tone: string): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  border: 'none',
  borderRadius: 12,
  padding: '11px 14px',
  font: 'inherit',
  fontSize: 13.5,
  color: 'var(--text)',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-inset)',
  outline: on ? `1.5px solid ${tone}` : 'none',
  outlineOffset: -1,
});

/** Who is posting, the way the sheets say it. */
function usePostingAs() {
  const me = useNavSummary().data;
  return me ? `Posting as ${me.handle} · ISR ${me.isr}` : undefined;
}

/** Circles you can post in: yours and the open ones (design: joined or open). */
function usePostable() {
  const q = useCommunityCircles();
  return useMemo(() => {
    const seen = new Set<string>();
    return [...(q.data?.joined ?? []), ...(q.data?.suggested ?? [])]
      .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
      .filter((c) => c.isJoined || c.isOpen)
      .map(circleView);
  }, [q.data]);
}

function CirclePick({
  list,
  value,
  onPick,
}: {
  list: CircleView[];
  value: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {list.map((c) => {
        const on = value === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            aria-pressed={on}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer',
              borderRadius: 999,
              padding: '7px 13px',
              font: 'inherit',
              fontSize: 12,
              fontWeight: on ? 700 : 500,
              color: on ? '#fff' : c.toneHex,
              background: on ? c.toneHex : `color-mix(in srgb, ${c.toneHex} 10%, var(--surface))`,
              border: `1px solid ${on ? 'transparent' : `color-mix(in srgb, ${c.toneHex} 30%, transparent)`}`,
              transition: 'background .24s, color .24s',
            }}
          >
            {svg(CIRCLE_ICONS[c.icon ?? 'ask'] ?? CIRCLE_ICONS.ask, 13, 'currentColor', 1.8)}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

/** design: screens-more.jsx ComposeModal — ask your Circles in two steps. */
export function ComposeSheet({ circleId }: { circleId: string | null }) {
  const navigate = useNavigate();
  const sub = usePostingAs();
  const circles = usePostable();
  const mine = useMyWeos();
  const create = useCreateThread();
  const [step, setStep] = useState<1 | 2>(1);
  const [question, setQuestion] = useState('');
  const [detail, setDetail] = useState('');
  const [weoId, setWeoId] = useState('none');
  const [picked, setPicked] = useState<string | null>(circleId);
  // the general circle is the design's default ("ask"), else the first you can post in
  const target = picked ?? circles.find((c) => c.icon === 'ask')?.id ?? circles[0]?.id ?? null;
  const weos = (mine.data?.items ?? []).filter((w) => w.status === 'active');

  const next = () => {
    if (step === 1) {
      if (!question.trim()) return toast('Add a question first');
      return setStep(2);
    }
    const c = circles.find((x) => x.id === target);
    if (!c) return toast('Pick a Circle first');
    create.mutate(
      {
        question: question.trim(),
        detail: detail.trim() || undefined,
        circleId: c.id,
        attachedWeoId: weoId === 'none' ? undefined : weoId,
        tags: [],
      },
      {
        onSuccess: () => {
          closeFlow();
          ack(`Posted in ${c.name}`, 'var(--o-violet)');
          toast(`Discussion posted in ${c.name}`);
          // a CTA lands somewhere: the post exists in the Circle, so that is where you arrive
          void navigate(routes.circle(c.id));
        },
        onError: failed,
      },
    );
  };

  return (
    <Sheet
      title={step === 1 ? 'Ask your Circles' : 'Add details'}
      sub={sub}
      onClose={closeFlow}
      footer={
        <>
          {step === 2 && (
            <Button size="sm" variant="ghost" tone="violet" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          <Button size="sm" variant="ghost" tone="violet" onClick={closeFlow}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            tone="green"
            disabled={(step === 1 && !question.trim()) || create.isPending}
            onClick={next}
          >
            {step === 1 ? 'Next' : 'Post discussion'}
          </Button>
        </>
      }
    >
      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={question}
            maxLength={QUESTION_MAX}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Your question"
            aria-label="Your question"
            style={wellInput}
          />
          {!question.trim() && (
            <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
              Ask something before you carry on — the rest is optional.
            </span>
          )}
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="Add detail (optional)"
            aria-label="Add detail"
            style={{ ...wellInput, resize: 'none' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {[
              'How do I reach my first collectors?',
              'Is my price right for this edition?',
              'What should the world sim tell me?',
            ].map((p) => (
              <Chip
                key={p}
                tone="var(--o-violet)"
                role="button"
                tabIndex={0}
                onClick={() => setQuestion(p)}
                style={{ cursor: 'pointer' }}
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={eyebrow}>Attach a WeO (optional)</p>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}
          >
            {[{ id: 'none', title: 'No WeO' }, ...weos].map((o) => (
              <button
                key={o.id}
                onClick={() => setWeoId(o.id)}
                aria-pressed={weoId === o.id}
                style={option(weoId === o.id, 'var(--o-violet)')}
              >
                <span style={radio(weoId === o.id, 'var(--o-violet)')} />
                {o.title}
              </button>
            ))}
          </div>
          <p style={{ ...eyebrow, margin: '6px 0 0' }}>Pick a Circle</p>
          <CirclePick list={circles} value={target} onPick={setPicked} />
        </div>
      )}
    </Sheet>
  );
}

/**
 * design: screens-more.jsx PushModal — a WeO becomes a thread in a Circle. Yours goes through
 * the push (stamped on the WeO, counted in the circle); anyone else's is a question with the
 * WeO attached — the same sheet, the same result on the page (D-040).
 */
export function PushSheet({ weo: w, circleId }: { weo: PushTarget; circleId: string | null }) {
  const navigate = useNavigate();
  const me = useNavSummary().data?.id;
  const circles = usePostable();
  const push = usePush();
  const ask = useCreateThread();
  const mine = !!me && me === w.creatorId;
  const busy = push.isPending || ask.isPending;
  const [step, setStep] = useState<1 | 2>(1);
  const [question, setQuestion] = useState('');
  const [detail, setDetail] = useState('');
  // inside a circle it goes there; elsewhere to the circle of its format, else its own (design)
  const c =
    circles.find((x) => x.id === circleId) ??
    circles.find((x) => x.bestType === w.type) ??
    circles.find((x) => w.circleIds.includes(x.id)) ??
    circles.find((x) => x.icon === 'ask') ??
    circles[0];

  const next = () => {
    if (step === 1) {
      if (!question.trim()) return toast('Add a question first');
      return setStep(2);
    }
    if (!c) return toast('There is no Circle to push to yet');
    const done = {
      onSuccess: () => {
        closeFlow();
        toast(mine ? `Posted to ${c.name} · your WeO is now a thread` : `Discussion posted in ${c.name}`);
        void navigate(routes.circle(c.id));
      },
      onError: failed,
    };
    const q = question.trim();
    const d = detail.trim() || undefined;
    if (mine) push.mutate({ weoId: w.id, question: q, description: d, circleId: c.id }, done);
    else ask.mutate({ question: q, detail: d, circleId: c.id, attachedWeoId: w.id, tags: [] }, done);
  };

  return (
    <Sheet
      title="Push to the Hub"
      onClose={closeFlow}
      w={460}
      footer={
        <>
          <Button size="sm" variant="ghost" tone="violet" onClick={step === 1 ? closeFlow : () => setStep(1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            size="sm"
            variant="primary"
            tone="green"
            disabled={(step === 1 && !question.trim()) || busy}
            onClick={next}
          >
            {step === 1 ? 'Next' : 'Push to Hub'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Orb
          size={56}
          fill={w.img ? 'image' : w.hex}
          src={w.img}
          ring
          ringColor={w.hex || formatHex('Listing')}
          matcap
          style={{ flex: '0 0 auto' }}
        />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{w.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-dim)' }}>
            {w.type} · {w.category}
            {c ? ` · goes to ${c.name}` : ''}
          </p>
        </div>
      </div>
      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={question}
            maxLength={QUESTION_MAX}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What do you want to ask your Circle?"
            aria-label="What do you want to ask your Circle?"
            style={wellInput}
          />
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="Context that helps people answer well…"
            aria-label="Context"
            style={{ ...wellInput, resize: 'none' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {[
              'Why is my first-collector time slow?',
              'How do I price the next edition?',
              'Which world should I rehearse in?',
            ].map((p) => (
              <Chip
                key={p}
                tone="var(--o-violet)"
                role="button"
                tabIndex={0}
                onClick={() => setQuestion(p)}
                style={{ cursor: 'pointer' }}
              >
                {p}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              borderRadius: 16,
              padding: 14,
              background: 'var(--surface)',
              boxShadow: 'var(--nm-inset)',
            }}
          >
            <p style={eyebrow}>Your question</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text)' }}>{question || '—'}</p>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** design: screens-more.jsx ReportModal — four reasons, one submit (D-041). */
export function ReportSheet({
  label,
  threadId,
  answerId,
}: {
  label: string;
  threadId?: string;
  answerId?: string;
}) {
  const report = useReport();
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number] | null>(null);
  const submit = () => {
    if (!reason) return toast('Pick a reason first');
    report.mutate(
      { threadId, answerId, reportType: reason.type },
      {
        onSuccess: () => {
          closeFlow();
          toast('Report submitted · thank you');
        },
        onError: failed,
      },
    );
  };
  return (
    <Sheet
      title="Report"
      sub={`Reporting: ${label}`}
      onClose={closeFlow}
      w={420}
      footer={
        <>
          <Button size="sm" variant="ghost" tone="violet" onClick={closeFlow}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" disabled={report.isPending} onClick={submit}>
            Submit report
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REPORT_REASONS.map((r) => {
          const on = reason?.type === r.type;
          return (
            <button
              key={r.type}
              onClick={() => setReason(r)}
              aria-pressed={on}
              style={option(on, 'var(--status-error)')}
            >
              <span style={radio(on, 'var(--status-error)')} />
              {r.label}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
