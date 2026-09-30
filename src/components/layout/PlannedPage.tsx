import type { CSSProperties } from 'react';
import { EmptyState } from '@/design-system';
import { ROUTE_META, type RouteName } from '@/app/routes';
import styles from './PlannedPage.module.css';

/** Placeholder for a route whose screen lands in a later module (docs/03-module-plan.md). */
export function PlannedPage({ route }: { route: RouteName }) {
  const meta = ROUTE_META[route];
  return (
    <main className={styles.page} style={{ '--tone': meta.tone } as CSSProperties}>
      <div>
        <div className={styles.eyebrow}>{meta.module}</div>
        <EmptyState title={meta.label} description={`This screen is built in module ${meta.module}.`} />
      </div>
    </main>
  );
}
