// design: create.jsx CreateScreen — `/create`, `/create?draft=:id` (carry on), `/create?edit=:weoId`
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useWeo } from '@/features/weo/api/weos';
import { useCategories, useDraft } from '../api/create';
import { CreateFlow } from '../components/CreateFlow';
import { formFromDraft } from '../model/composer';
import { formFromWeo } from '../model/edit';

/**
 * Resolves what the composer opens with, then mounts the flow keyed by it — so a draft or a WeO
 * to edit seeds the form once, and switching between them starts a fresh composer.
 */
export default function CreatePage() {
  const [params] = useSearchParams();
  const draftId = params.get('draft');
  const editId = params.get('edit');
  const draft = useDraft(editId ? null : draftId);
  const weo = useWeo(editId ?? undefined);
  const cats = useCategories();

  const seed = useMemo(() => {
    if (editId) {
      if (!weo.data || !cats.data) return weo.isError ? 'blank' : null;
      return formFromWeo(weo.data, cats.data);
    }
    if (draftId) {
      if (!draft.data) return draft.isError ? 'blank' : null;
      return formFromDraft(draft.data);
    }
    return 'blank';
  }, [editId, draftId, weo.data, weo.isError, cats.data, draft.data, draft.isError]);

  if (seed === null)
    return (
      <div
        style={{
          maxWidth: 'var(--page-w)',
          margin: '0 auto',
          padding: '120px 28px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: 13.5,
        }}
        aria-busy="true"
      >
        Opening the composer…
      </div>
    );
  const key = editId ? `edit:${editId}` : draftId ? `draft:${draftId}` : 'new';
  return (
    <CreateFlow
      key={key}
      seed={seed === 'blank' ? null : seed}
      draftId={editId || seed === 'blank' ? null : draftId}
      editId={editId}
    />
  );
}
