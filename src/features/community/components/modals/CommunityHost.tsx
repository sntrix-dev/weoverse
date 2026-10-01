import { lazy, Suspense } from 'react';
import { useFlow } from '@/stores/flow';

// the three sheets load with the first one opened, not with every page
const sheets = () => import('./Compose');
const ComposeSheet = lazy(() => sheets().then((m) => ({ default: m.ComposeSheet })));
const PushSheet = lazy(() => sheets().then((m) => ({ default: m.PushSheet })));
const ReportSheet = lazy(() => sheets().then((m) => ({ default: m.ReportSheet })));

/** design `app.compose.open && <ComposeModal/>` · `PushModal` · `ReportModal`, over any page. */
export function CommunityHost() {
  const compose = useFlow((s) => s.compose);
  const push = useFlow((s) => s.push);
  const report = useFlow((s) => s.report);
  return (
    <Suspense fallback={null}>
      {compose && <ComposeSheet circleId={compose.circleId} />}
      {push && <PushSheet key={push.weo.id} weo={push.weo} circleId={push.circleId} />}
      {report && <ReportSheet {...report} />}
    </Suspense>
  );
}
