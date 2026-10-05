import { lazy, Suspense } from 'react';
import { useFlow } from '@/stores/flow';

const OfferSheet = lazy(() => import('./OfferSheet').then((m) => ({ default: m.OfferSheet })));

/** The offer sheet over any page (design `flow.kind === 'offer'`). */
export function OfferHost() {
  const id = useFlow((s) => s.offer);
  return <Suspense fallback={null}>{id && <OfferSheet key={id} requestId={id} />}</Suspense>;
}
