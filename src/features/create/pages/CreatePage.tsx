// design: create.jsx CreateScreen — `/create`, `/create?draft=:id` (carry on), `/create?edit=:weoId`,
// `/create?kind=Request` (a format picked elsewhere), `/create?forRequest=:requestId` (make one for a brief, M08)
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useBrief } from '@/features/requests/api/requests';
import { briefModel, sentence } from '@/features/requests/model/briefs';
import { useWeo } from '@/features/weo/api/weos';
import { useCategories, useDraft } from '../api/create';
import { CreateFlow } from '../components/CreateFlow';
import type { PostAsk } from '../components/PostSheet';
import { EMPTY_FORM, formFromDraft, pickForm, type ComposerForm } from '../model/composer';
import { formFromWeo } from '../model/edit';
import { isLive } from '../model/formats';

/**
 * Resolves what the composer opens with, then mounts the flow keyed by it — so a draft or a WeO
 * to edit seeds the form once, and switching between them starts a fresh composer.
 */
export default function CreatePage() {
  const [params] = useSearchParams();
  const draftId = params.get('draft');
  const editId = params.get('edit');
  const kind = params.get('kind');
  const forRequest = editId || draftId ? null : params.get('forRequest');
  const draft = useDraft(editId ? null : draftId);
  const weo = useWeo(editId ?? undefined);
  const brief = useBrief(forRequest);
  const cats = useCategories();
  const [now] = useState(() => Date.now());

  // the brief seeds the composer: its words, its category, its budget as your ask (D-067)
  const ask: PostAsk | null = useMemo(() => {
    if (!brief.data) return null;
    const r = briefModel(brief.data, now);
    return {
      id: r.id,
      title: r.title,
      who: r.by.name,
      avatar: r.by.avatar,
      budget: r.budget,
      closes: r.closes,
    };
  }, [brief.data, now]);

  const seed = useMemo((): ComposerForm | 'blank' | null => {
    if (editId) {
      if (!weo.data || !cats.data) return weo.isError ? 'blank' : null;
      return formFromWeo(weo.data, cats.data);
    }
    if (draftId) {
      if (!draft.data) return draft.isError ? 'blank' : null;
      return formFromDraft(draft.data);
    }
    if (forRequest) {
      if (!brief.data || !cats.data) return brief.isError ? 'blank' : null;
      const r = brief.data;
      const cat =
        cats.data.find((c) => c._id === r.categoryId) ??
        cats.data.find((c) => c.name.toLowerCase() === (r.categoryName ?? '').toLowerCase());
      return {
        ...pickForm('Listing'),
        title: sentence(r.title),
        desc: r.description ?? EMPTY_FORM.desc,
        catId: cat?._id ?? '',
        cat: cat?.name ?? '',
        price: Number(r.price?.max ?? r.price?.min ?? 0),
        qty: 1,
        circ: 1,
      };
    }
    if (isLive(kind)) return pickForm(kind);
    return 'blank';
  }, [
    editId,
    draftId,
    forRequest,
    kind,
    weo.data,
    weo.isError,
    cats.data,
    draft.data,
    draft.isError,
    brief.data,
    brief.isError,
  ]);

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
  const key = editId
    ? `edit:${editId}`
    : draftId
      ? `draft:${draftId}`
      : forRequest
        ? `for:${forRequest}`
        : isLive(kind)
          ? `kind:${kind}`
          : 'new';
  return (
    <CreateFlow
      key={key}
      seed={seed === 'blank' ? null : seed}
      draftId={editId || seed === 'blank' ? null : draftId}
      editId={editId}
      forRequest={forRequest ? ask : null}
    />
  );
}
