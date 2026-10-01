import { lazy, Suspense } from 'react';
import { useFlow } from '@/stores/flow';

// the sheet (dial, review, receipt) loads with the first collect, not with every page
const CollectSheet = lazy(() => import('./CollectSheet').then((m) => ({ default: m.CollectSheet })));

/** The collect sheet over any page (design `app.collectW && <CollectSheet …/>`). */
export function CollectHost() {
  const weoId = useFlow((s) => s.collect);
  return weoId ? (
    <Suspense fallback={null}>
      <CollectSheet key={weoId} weoId={weoId} />
    </Suspense>
  ) : null;
}
