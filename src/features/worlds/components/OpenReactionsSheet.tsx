import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { Sheet } from '@/components/feedback/Sheet';
import { Button, CommitReview, Spinner } from '@/design-system';
import { useDraft, useOPeg } from '@/features/create/api/create';
import { buildPayload, formFromDraft, missingOf } from '@/features/create/model/composer';
import { ack, toast } from '@/stores/ui';
import { useOpenReactions } from '../api/worlds';
import { NEED_REACT, THRESHOLD } from '../model/lifecycle';

/**
 * Rehearsed → Reacting. Opening tells real people (the audience chosen in the studio's Share
 * step), so it asks once (D-091). The WeO it will post as is built now from the draft and checked
 * by the server against the real create rules: a WeO that cannot post cannot open.
 */
export function OpenReactionsSheet({
  draftId,
  name,
  audience,
  onClose,
}: {
  draftId: string;
  name: string;
  audience: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const draftQ = useDraft(draftId);
  const pegQ = useOPeg();
  const open = useOpenReactions();
  const form = draftQ.data ? formFromDraft(draftQ.data) : null;
  const missing = form ? missingOf(form) : [];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const who = audience ?? 'your circle';

  const go = () => {
    if (!form) return;
    const peg = pegQ.data?.usdAgainstO ?? 0;
    const built = buildPayload(form, { usdAgainstO: peg });
    open.mutate(
      { draftId, post: built.body },
      {
        onSuccess: (r) => {
          ack('Open to your circle', '#D946EF');
          toast(
            r.notified
              ? `${r.notified} ${r.notified === 1 ? 'person' : 'people'} told · reactions land in In flight`
              : 'Open · nobody to tell yet',
          );
          onClose();
        },
        onError: (e) => toast(e instanceof ApiError ? e.message : 'It did not open — try again'),
      },
    );
  };

  if (draftQ.isLoading || pegQ.isLoading)
    return (
      <Sheet title="Open to reactions" onClose={onClose} w={460}>
        <div style={{ display: 'grid', placeItems: 'center', padding: 30 }}>
          <Spinner size={30} />
        </div>
      </Sheet>
    );

  if (!form || missing.length)
    return (
      <Sheet
        title="Finish it first"
        sub={`${name} opens to reactions as the WeO it will post — it still needs ${missing.join(', ') || 'its details'}.`}
        onClose={onClose}
        w={460}
        footer={
          <>
            <Button size="sm" variant="ghost" tone="violet" onClick={onClose}>
              Not now
            </Button>
            <Button
              size="sm"
              variant="primary"
              selected
              tone="green"
              onClick={() => {
                onClose();
                void navigate(routes.create(draftId));
              }}
            >
              Open the composer
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-dim)' }}>
          Its rehearsed terms are kept. Finish the details, save, and open it from In flight.
        </p>
      </Sheet>
    );

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        display: 'grid',
        placeItems: 'start center',
        alignContent: 'center',
        overflowY: 'auto',
        padding: 20,
        background: 'color-mix(in srgb, var(--bg-a) 55%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        animation: 'weo-cardin .3s var(--ease-portal) both',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Open to reactions"
        style={{ width: 'min(440px, 100%)', animation: 'weo-cardin .42s var(--ease-settle) both' }}
      >
        <CommitReview
          title="Open to reactions"
          what={<span>{name} — what would you pay, and why</span>}
          when="Now · it stays a draft; nothing posts"
          to={<span>{who} — each is told once</span>}
          next={`At ${NEED_REACT} reactions you can open pledges; ${THRESHOLD} pledges post it, validated. Or post it yourself any time.`}
          recover="Reactions are notes and prices, never Os. Nothing moves."
          confirmLabel={open.isPending ? 'Opening…' : `Open to ${who}`}
          busy={open.isPending}
          onConfirm={go}
          onEdit={onClose}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
