import { lazy, Suspense } from 'react';
import { useFlow } from '@/stores/flow';

// the sheets (dial, review, receipt) load with the first collect / relist, not with every page
const CollectSheet = lazy(() => import('./CollectSheet').then((m) => ({ default: m.CollectSheet })));
const RelistSheet = lazy(() => import('./RelistSheet').then((m) => ({ default: m.RelistSheet })));

/** The collect and relist sheets over any page (design `app.collectW` / `flow.kind === 'relist'`). */
export function CollectHost() {
  const weoId = useFlow((s) => s.collect);
  const relist = useFlow((s) => s.relist);
  return (
    <Suspense fallback={null}>
      {weoId && <CollectSheet key={weoId} weoId={weoId} />}
      {relist && <RelistSheet key={relist.collectionId} target={relist} />}
    </Suspense>
  );
}
