import { lazy, Suspense } from 'react';
import { useFlow } from '@/stores/flow';

const CreatorSheet = lazy(() => import('./CreatorSheet').then((m) => ({ default: m.CreatorSheet })));

/** The creator sheet over any page (design `app.openCreator` / `creatorId && <CreatorSheet/>`). */
export function CreatorHost() {
  const id = useFlow((s) => s.creator);
  return <Suspense fallback={null}>{id && <CreatorSheet key={id} id={id} />}</Suspense>;
}
