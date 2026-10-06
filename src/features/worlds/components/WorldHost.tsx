import { lazy, Suspense } from 'react';
import { useWorld } from '@/stores/flow';

const WorldStudio = lazy(() => import('../pages/WorldStudio'));
const VettingSheet = lazy(() => import('./VettingSheet'));

/** The studio and the vetting sheet over any page (design `app.worldSeed && <WorldStudio/>`). */
export function WorldHost() {
  const world = useWorld((s) => s.world);
  const vet = useWorld((s) => s.vet);
  return (
    <Suspense fallback={null}>
      {world && <WorldStudio key={JSON.stringify(world)} seed={world} />}
      {vet && <VettingSheet key={vet} id={vet} />}
    </Suspense>
  );
}
