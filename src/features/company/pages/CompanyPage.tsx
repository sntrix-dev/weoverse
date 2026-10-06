import { useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router';
import { routes } from '@/app/routes';
import { Scene } from '@/components/layout/Scene';
import { SectionMark } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { useHubPath } from '@/components/shell/useHubPath';
import { Alert, Button, Card, Chip, StatGrid } from '@/design-system';
import { openDock } from '@/stores/ui';
import { useCompanyPages, type CompanyPageDto } from '../api/company';
import { CareersSheet } from '../components/CareersSheet';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};
const GOLD = '#8a6a06';

const changed = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/** design: company.jsx CompanyScreen — one screen, five documents (D-080). */
export function CompanyPage() {
  const navigate = useNavigate();
  const { doc: want } = useParams();
  const pages = useCompanyPages();
  const [careers, setCareers] = useState(false);
  const all = pages.data ?? [];
  const d: CompanyPageDto | undefined = all.find((x) => x.key === want) ?? all[0];
  const path = useHubPath([{ label: d?.label ?? 'Company' }]);

  if (!d) {
    return (
      <main style={page}>
        <PathBar onHub={path.onHub} items={path.items} />
        <p style={{ margin: '80px 0', textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
          {pages.isError ? 'This page did not load — try again in a moment.' : 'Opening…'}
        </p>
      </main>
    );
  }

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <Scene lead style={{ display: 'block' }}>
        <SectionMark
          icon={
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v.4M12 11v5.5" />
            </>
          }
          label="WeO Global"
          tone={GOLD}
          rule={false}
        />
        <h1
          style={{
            margin: '10px 0 0',
            maxWidth: '30ch',
            fontSize: 'clamp(25px,3.4vw,37px)',
            fontWeight: 700,
            letterSpacing: '-.035em',
            lineHeight: 1.04,
            color: 'var(--text)',
          }}
        >
          {d.lead}
        </h1>
        <nav
          className="weo-scroll-hide"
          aria-label="Company pages"
          style={{ display: 'flex', gap: 7, marginTop: 22, overflowX: 'auto', padding: '2px 2px 6px' }}
        >
          {all.map((x) => (
            <Chip
              key={x.key}
              role="link"
              tabIndex={0}
              aria-current={x.key === d.key ? 'page' : undefined}
              selected={x.key === d.key}
              tone={GOLD}
              onClick={() => void navigate(routes.company(x.key))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void navigate(routes.company(x.key));
              }}
              style={{ flex: '0 0 auto', cursor: 'pointer' }}
            >
              {x.label}
            </Chip>
          ))}
        </nav>
      </Scene>

      <Scene key={d.key} style={{ display: 'block', marginTop: 38 }}>
        {d.status === 'draft' && (
          <Alert status="info" style={{ maxWidth: '74ch', marginBottom: 22 }}>
            {`Draft — this page is being reviewed and may change. Last changed ${changed(d.updatedAt)}.`}
          </Alert>
        )}
        <div style={{ display: 'grid', gap: 14, maxWidth: '74ch' }}>
          {d.body.map((p) => (
            <p
              key={p}
              style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.62,
                color: 'var(--text-dim)',
                textWrap: 'pretty',
              }}
            >
              {p}
            </p>
          ))}
        </div>
        {d.facts && d.facts.length > 0 && (
          <Card elevation="inset" radius={26} padding={16} style={{ marginTop: 26 }}>
            <StatGrid
              columns={Math.min(4, d.facts.length)}
              well={false}
              items={d.facts.map(([k, v]) => ({ k, v }))}
            />
          </Card>
        )}
        {d.roles && d.roles.length > 0 && (
          <Card
            elevation="raised"
            radius={26}
            padding={0}
            style={{
              display: 'grid',
              gap: 1,
              overflow: 'hidden',
              marginTop: 26,
              background: 'var(--border)',
            }}
          >
            {d.roles.map((r) => (
              <div
                key={r.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  flexWrap: 'wrap',
                  padding: '15px 18px',
                  background: 'var(--surface)',
                }}
              >
                <span style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>
                    {r.title}
                  </span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-faint)' }}>
                    {r.where} · {r.note}
                  </span>
                </span>
                {d.apply && (
                  <Button size="sm" variant="ghost" tone="gold" onClick={() => setCareers(true)}>
                    Ask about it
                  </Button>
                )}
              </div>
            ))}
          </Card>
        )}
        {d.apply && (!d.roles || d.roles.length === 0) && (
          <Card
            elevation="raised"
            radius={26}
            padding="15px 18px"
            style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 26 }}
          >
            <span
              style={{
                flex: '1 1 240px',
                minWidth: 0,
                fontSize: 13.5,
                lineHeight: 1.5,
                color: 'var(--text-dim)',
              }}
            >
              {d.apply.note}
            </span>
            <Button size="sm" variant="ghost" tone="gold" onClick={() => setCareers(true)}>
              Tell us about you
            </Button>
          </Card>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
          <Button variant="primary" tone="violet" onClick={() => void navigate(routes.hub())}>
            Back to the WeOverse
          </Button>
          <Button variant="ghost" tone="blue" onClick={() => openDock('mya')}>
            Ask Mya about this
          </Button>
        </div>
      </Scene>
      {careers && d.apply && <CareersSheet apply={d.apply} onClose={() => setCareers(false)} />}
    </main>
  );
}

export default CompanyPage;
