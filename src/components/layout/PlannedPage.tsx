import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { EmptyState } from '@/design-system';
import { ROUTE_META, routes, type RouteName } from '@/app/routes';
import { FlowFoot, type FlowScreen } from '@/components/shell/FlowBar';
import styles from './PlannedPage.module.css';

const FLOW_SCREENS: Partial<Record<RouteName, FlowScreen>> = {
  discover: 'discover',
  collected: 'collected',
  hub: 'hub',
  listed: 'listed',
  create: 'create',
};

/**
 * Placeholder for a route whose screen lands in a later module (docs/03-module-plan.md).
 * The four O sections and Create already carry their flow bar, wired like the design pages.
 */
export function PlannedPage({ route }: { route: RouteName }) {
  const meta = ROUTE_META[route];
  const navigate = useNavigate();
  const screen = FLOW_SCREENS[route];
  const toHub = { label: 'Community', go: () => void navigate(routes.hub()) };
  // design: the pages' own V3FlowFoot props (discover/collect/exchange/community/create .jsx)
  const flow =
    screen === 'discover'
      ? { back: toHub }
      : screen === 'collected'
        ? {
            next: {
              label: 'Create',
              lead: 'Make one of your own',
              go: () => void navigate(routes.create()),
              tone: '#22C55E',
            },
          }
        : screen === 'listed'
          ? {
              back: toHub,
              next: {
                label: 'Discover',
                lead: 'See them on the floor',
                go: () => void navigate(routes.discover()),
                tone: '#3A95F2',
              },
            }
          : screen === 'hub'
            ? {
                next: {
                  label: 'Exchange',
                  lead: 'Move with the market',
                  go: () => void navigate(routes.listed()),
                  tone: '#F7C62B',
                },
              }
            : screen === 'create'
              ? { back: toHub }
              : null;
  return (
    <main className={styles.page} style={{ '--tone': meta.tone } as CSSProperties}>
      <section>
        <div className={styles.eyebrow}>{meta.module}</div>
        <EmptyState title={meta.label} description={`This screen is built in module ${meta.module}.`} />
      </section>
      {screen && flow && <FlowFoot screen={screen} {...flow} />}
    </main>
  );
}
