import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { withTabIcons } from '@/components/hero/HeroParts';
import { SectionMark } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { Tabs } from '@/design-system';
import { compact } from '@/lib/format';
import { useContributors, usePulse, useStories } from '../api/community';
import { useHubPath } from '../components/Hub';
import { StewardGrid } from '../components/StewardGrid';
import { stewardModel } from '../model/community';
import { useCommunityActions } from '../useCommunity';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const FILTERS = ['All', 'Pool', 'Hunt', 'Digital arts', 'Digital assets'];

/** design: stewards.jsx StewardsScreen — the people who keep Circles calm (top contributors, D-036). */
export function StewardsPage() {
  const navigate = useNavigate();
  const act = useCommunityActions();
  const path = useHubPath([{ label: 'Stewards' }]);
  const q = useContributors(48);
  const pulse = usePulse();
  const stories = useStories();
  const [filter, setFilter] = useState('All');

  const all = useMemo(() => (q.data?.contributors ?? []).map(stewardModel), [q.data]);
  const list = filter === 'All' ? all : all.filter((s) => s.focus?.toLowerCase() === filter.toLowerCase());
  const avgIsr = all.length ? Math.round(all.reduce((n, s) => n + s.isr, 0) / all.length) : 0;
  const rate = pulse.data?.resolveRate;
  const stats: [string, string][] = [
    [compact(all.length), 'Active stewards'],
    [String(avgIsr), 'Average ISR'],
    [rate != null ? `${Math.round(rate * 100)}%` : '—', 'Resolved · 7d'],
    [String(stories.data?.total ?? 0), 'Stories featured'],
  ];

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <SectionMark
        icon={<path d="M12 3.4l2.6 5.6 6.1.6-4.6 4.1 1.4 6-5.5-3.2-5.5 3.2 1.4-6L3.3 9.6l6.1-.6z" />}
        label="Stewards"
        tone="var(--o-gold-ink)"
        rule={false}
      />
      <h1
        style={{
          margin: '10px 0 0',
          fontSize: 'clamp(26px,3.4vw,38px)',
          fontWeight: 700,
          letterSpacing: '-.035em',
          lineHeight: 1.02,
          color: 'var(--text)',
        }}
      >
        The creators who keep Circles calm
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginTop: 26 }}>
        {stats.map(([v, l]) => (
          <div key={l} style={{ borderRadius: 20, padding: 18, textAlign: 'center', background: 'var(--surface)', boxShadow: 'var(--nm-sm)' }}>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</p>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-dim)' }}>{l}</p>
          </div>
        ))}
      </div>
      {/* five tabs outgrow a phone: they scroll rather than widen the page (the design clips them) */}
      <div style={{ margin: '24px 0 22px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <Tabs tabs={withTabIcons(FILTERS)} value={filter} onChange={setFilter} tone="var(--o-gold)" style={{ minWidth: 'max-content' }} />
      </div>
      <StewardGrid list={list} onFollow={act.toggleFollow} onOpen={(s) => void navigate(routes.creators(s.id))} />
      {!list.length && (
        <p style={{ margin: 0, padding: 30, textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
          {q.isLoading ? 'Finding the stewards…' : 'No stewards here yet.'}
        </p>
      )}
    </main>
  );
}

export default StewardsPage;
