import { useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { Scene } from '@/components/layout/Scene';
import { SectionHead, SectionMark } from '@/components/layout/SectionMark';
import { OProfileHub, type HubModule } from '@/components/people/ProfileHub';
import { PublicPageButton } from '@/components/people/PublicPageButton';
import { PathBar } from '@/components/shell/PathBar';
import { useHubPath } from '@/components/shell/useHubPath';
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  OMark,
  StatGrid,
  svg,
  Tooltip,
  ValueLadder,
} from '@/design-system';
import { usePassport } from '@/features/passport/api/passport';
import { IsrImproveSheet, PublicProfileSheet } from '@/features/passport/components/PassportSheets';
import { formatHex, type WeoFormat } from '@/lib/cardModel';
import { compact, osFmt } from '@/lib/format';
import { glideToId } from '@/lib/glide';
import { relTime } from '@/lib/time';
import { openId } from '@/stores/ui';
import { useHoldingOrbit, useWalletView, type WalletViewDto } from '../api/wallet';
import { WalletRow } from '../components/WalletRow';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};
const micro: CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.13em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};
const formatOfType = (t: string): WeoFormat =>
  t === 'crowdfund' ? 'Pool' : t === 'lottery' ? 'Hunt' : 'Listing';
const Os = ({ n, size = 12 }: { n: number; size?: number }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <OMark size={size} /> {osFmt(n)}
  </span>
);

/**
 * design: wallet.jsx WalletScreen — the O-Wallet is not a balance screen: it is the credential
 * the whole network reads. Standing first, money second.
 */
export function WalletPage() {
  const navigate = useNavigate();
  const path = useHubPath([{ label: 'O-Wallet' }]);
  const wallet = useWalletView();
  const passport = usePassport();
  const orbit = useHoldingOrbit(6);
  const [pub, setPub] = useState(false);
  const [improve, setImprove] = useState(false);
  const w = wallet.data;
  const p = passport.data;

  if (!w) {
    return (
      <main style={page}>
        <PathBar onHub={path.onHub} items={path.items} />
        <p style={{ margin: '80px 0', textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
          {wallet.isError ? 'The wallet did not load — try again in a moment.' : 'Opening your wallet…'}
        </p>
      </main>
    );
  }

  const st = w.standing;
  const B = w.balance;
  const tierN = p?.tier.ladder.find((r) => r.current)?.n;

  const around: HubModule[] = [
    {
      label: 'Your standing',
      note: `ISR ${Math.round(st.isr)} · of 100`,
      tone: 'var(--o-blue)',
      cta: 'The record behind it',
      icon: (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M12 3.6v4M12 16.4v4M3.6 12h4M16.4 12h4" />
        </>
      ),
      preview: (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip dot selected tone={st.tone}>
            {tierN ? `Tier ${tierN} · ${st.label}` : st.label}
          </Chip>
          <Chip selected tone="var(--o-blue)">{`${st.advantagePct}% advantage`}</Chip>
        </span>
      ),
      onClick: () => void navigate(routes.passport()),
    },
    {
      label: 'Your passport id',
      note: p?.identity.passportId ? `# ${p.identity.passportId}` : 'Your passport',
      tone: 'var(--o-blue)',
      cta: 'Show the ID',
      icon: (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <circle cx="12" cy="10" r="2.6" />
          <path d="M7.4 18c.7-2.2 2.5-3.4 4.6-3.4S16 15.8 16.6 18" />
        </>
      ),
      preview: (
        <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
          {p?.identity.name ?? 'You'} · one credential, read by every property on the network.
        </span>
      ),
      onClick: openId,
    },
    {
      label: 'Where it works',
      note: 'Every property reads this credential',
      tone: 'var(--o-violet)',
      cta: 'See the ecosystem',
      icon: (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M3.6 12h16.8M12 3.6c2.4 2.6 2.4 14.2 0 16.8M12 3.6c-2.4 2.6-2.4 14.2 0 16.8" />
        </>
      ),
      preview: (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {w.ecosystem.slice(0, 4).map((x) => (
            <Chip key={x.key} selected tone={x.tone}>
              {x.key}
            </Chip>
          ))}
        </span>
      ),
      onClick: () => glideToId('w-ecosystem'),
    },
    {
      label: 'What an O is worth',
      note: 'The peg is fixed — O Power is what moves',
      tone: 'var(--o-gold)',
      cta: 'See the rates',
      icon: (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M8.6 14.4h6.8M8.6 10.4h6.8M12 7v10" />
        </>
      ),
      preview: (
        <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
          {w.peg.label}, the same figure for everyone. What grows is what an O buys.
        </span>
      ),
      onClick: () => glideToId('w-rates'),
    },
  ];

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />

      {/* the credential leads — standing first, money second */}
      <Scene lead style={{ display: 'block' }}>
        <SectionMark
          icon={
            <>
              <rect x="3" y="6" width="18" height="13" rx="3.4" />
              <path d="M3 10.5h18" />
              <circle cx="17" cy="15" r="1.4" />
            </>
          }
          label="O-Wallet · your passport"
          tone="var(--o-gold)"
          rule={false}
        />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <h1
            style={{
              margin: '10px 0 0',
              maxWidth: '28ch',
              fontSize: 'clamp(25px,3.4vw,37px)',
              fontWeight: 700,
              letterSpacing: '-.035em',
              lineHeight: 1.04,
              color: 'var(--text)',
            }}
          >
            One standing, honoured everywhere the network runs
          </h1>
          {p && (
            <PublicPageButton
              avatar={p.identity.avatarUrl}
              isr={p.standing.isr}
              weos={p.totals.listed}
              contact={p.publicProfile.contact}
              onOpen={() => setPub(true)}
            />
          )}
        </div>
        <Card
          elevation="raised"
          radius={30}
          padding="clamp(18px,2.4vw,26px)"
          style={{ marginTop: 22, overflow: 'hidden' }}
        >
          <OProfileHub
            storeKey="wallet"
            stage={{
              size: 286,
              tone: 'var(--o-gold)',
              avatar: p?.identity.avatarUrl ?? null,
              isr: Math.round(st.isr),
              collapsible: true,
              onOpen: () => void navigate(routes.passport()),
              utility: {
                label: 'Show your ID',
                onClick: openId,
                icon: (
                  <>
                    <rect x="3" y="6" width="18" height="13" rx="3.4" />
                    <circle cx="9" cy="12.5" r="2.2" />
                    <path d="M14 11h4M14 14.5h3" />
                  </>
                ),
              },
              items: (orbit.data ?? []).map((h) => ({
                id: h.id,
                name: h.name,
                img: h.img,
                tone: formatHex(formatOfType(h.type)),
                onClick: () => void navigate(routes.weo(h.weoId)),
              })),
            }}
            views={[
              {
                key: 'wallet',
                label: 'Your wallet',
                tone: '#F7C62B',
                note: 'Balances, functions and what you hold',
                panel: <WalletRow />,
              },
              {
                key: 'passport',
                label: 'Your passport',
                tone: '#3A95F2',
                note: 'The standing this wallet belongs to',
                around,
              },
            ]}
          />
          <MoneyRows
            w={w}
            onWallet={() => glideToId('w-buckets')}
            onPower={() => void navigate(routes.passport('isr'))}
          />
        </Card>
        {pub && p && <PublicProfileSheet p={p} onClose={() => setPub(false)} />}
      </Scene>

      <Scene id="w-buckets" style={{ display: 'block', marginTop: 52 }}>
        <SectionHead
          eyebrow="02 — What is actually spendable"
          title="Four buckets, never one balance"
          note="Available spends. Protected is held against something you opened. Pending is in flight. Locked is committed."
        />
        <div
          className="weo-snap-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)',
            gap: 'clamp(14px,2vw,22px)',
          }}
        >
          <Card elevation="raised" radius={30} padding="clamp(16px,2vw,22px)" className="weo-osonly">
            <ValueLadder balances={B} rate={w.peg.rate} />
          </Card>
          <Card
            elevation="inset"
            radius={30}
            padding="clamp(16px,2vw,22px)"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <StatGrid
              columns={2}
              well={false}
              tone="var(--text)"
              items={[
                { k: 'In the network', v: <Os n={B.total} /> },
                { k: 'Spendable now', v: <Os n={B.available} /> },
                { k: 'Peg', v: w.peg.label },
                { k: 'Your tier', v: `${st.label} · ${st.advantagePct}%` },
              ]}
            />
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-dim)' }}>
              Withdrawals draw from available only, and anything unavailable is listed with its reason — never
              hidden behind a retention prompt.
            </p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--text-faint)' }}>
              {B.heldReason}
            </p>
            {w.commitments.outstanding > 0 && (
              <Alert status="info">
                O {osFmt(w.commitments.outstanding)} still owed on {w.commitments.holdings} holding
                {w.commitments.holdings === 1 ? '' : 's'}
                {w.commitments.nextDue
                  ? ` · next due ${new Date(w.commitments.nextDue).toLocaleDateString()}`
                  : ''}
                . It is not held from your balance.
              </Alert>
            )}
          </Card>
        </div>
      </Scene>

      {/* the point of the screen: this credential is not local to the WeOverse */}
      <Scene
        id="w-ecosystem"
        style={{
          marginTop: 56,
          borderRadius: 30,
          padding: 'clamp(20px,2.6vw,30px) clamp(16px,2.4vw,26px)',
          background: 'color-mix(in srgb, var(--o-gold) 6%, var(--surface))',
          boxShadow: 'inset 0 0 0 1px var(--border)',
        }}
      >
        <SectionHead
          eyebrow="03 — Where this passport works"
          title="The same standing, across the whole ecosystem"
          note="Every property on the network reads this credential. What each one grants differs; the number never does."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(232px,1fr))', gap: 14 }}>
          {w.ecosystem.map((e) => (
            <EcosystemCard key={e.key} e={e} tierN={tierN} />
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(206px,1fr))',
            gap: 12,
            marginTop: 18,
          }}
        >
          {w.carries.map(([k, v]) => (
            <Card key={k} elevation="inset" radius={22} padding="14px 16px">
              <span style={micro}>{k}</span>
              <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
                {v}
              </p>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          {w.never.map((n) => (
            <Alert key={n} status="info">
              {n}
            </Alert>
          ))}
        </div>
      </Scene>

      <Scene id="w-rates" style={{ display: 'block', marginTop: 56 }}>
        <SectionHead
          eyebrow="04 — What an O is worth"
          title="Your rate, and the network's"
          note="The peg is fixed. What moves is O Power — what one O buys as more of the network accepts Os."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
          <RateDial
            pct={100}
            value={String(w.peg.osPerDollar)}
            label={`The peg · ${w.peg.label}`}
            note={w.peg.note}
          />
          {w.power == null ? (
            <RateDial
              pct={0}
              value="—"
              label="O Power · what one O buys"
              note="Not measured yet — nothing computes it today"
            />
          ) : (
            <RateDial
              pct={Math.min(100, w.power * 50)}
              value={`${w.power}×`}
              label="O Power · what one O buys"
              note="Measured"
            />
          )}
        </div>
        <Card elevation="inset" radius={26} padding={16} style={{ marginTop: 14 }}>
          <StatGrid
            columns={4}
            well={false}
            items={[
              { k: 'Created', v: w.activity.created },
              { k: 'Sold', v: w.activity.sold },
              { k: 'Re-sold', v: w.activity.resold },
              { k: 'Earned', v: `O ${compact(w.activity.earned)}` },
            ]}
          />
        </Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <Button size="sm" variant="ghost" tone="violet" onClick={() => setImprove(true)} disabled={!p}>
            What builds a 100 standing?
          </Button>
          <Button size="sm" variant="ghost" tone="green" onClick={() => void navigate(routes.tracking())}>
            What you are tracking
          </Button>
        </div>
      </Scene>

      <Scene style={{ display: 'block', marginTop: 56 }}>
        <SectionHead
          eyebrow="05 — Apps and plans"
          title="Every app is free to enter"
          note="The passport is the account. What is priced is pro capability inside an app — in Os, per month — and your tier's advantage discounts it."
        />
        <div style={{ display: 'grid', gap: 12 }}>
          {w.apps.map((a) => (
            <Card key={a.key} elevation="raised" radius={26} padding={18}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                <Chip dot selected tone={a.tone}>
                  {a.name}
                </Chip>
                <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{a.line}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--status-success)',
                  }}
                >
                  {a.here ? 'You are here · free' : a.freeLine}
                </span>
              </div>
              {a.plans.length > 0 && (
                <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                  {a.plans.map((pl) => (
                    <Card
                      key={pl.key}
                      elevation="inset"
                      radius={20}
                      padding="13px 15px"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
                    >
                      <span style={{ flex: '1 1 220px', minWidth: 0 }}>
                        <span
                          style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}
                        >
                          {pl.name}
                        </span>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 11.5,
                            lineHeight: 1.45,
                            color: 'var(--text-dim)',
                          }}
                        >
                          {pl.line}
                        </span>
                      </span>
                      <span style={{ flex: '0 0 auto', textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 15,
                            fontWeight: 700,
                            color: 'var(--text)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <Os n={pl.payOs} />
                        </span>
                        <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-faint)' }}>
                          a month · {st.advantagePct}% off
                        </span>
                      </span>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          ))}
          <p style={{ margin: '2px 4px 0', fontSize: 12, lineHeight: 1.55, color: 'var(--text-faint)' }}>
            {w.plansNote}
          </p>
        </div>
      </Scene>

      <Scene style={{ display: 'block', marginTop: 56 }}>
        <SectionHead
          eyebrow="06 — The record"
          title="Every flow, permanently"
          note="Submitted, received, verified, completed. This record is what travels with you — nothing here can be edited after the fact."
        />
        <Ledger rows={w.ledger} />
      </Scene>

      {improve && p && <IsrImproveSheet p={p} onClose={() => setImprove(false)} />}
    </main>
  );
}

/* The money as the card's own last lines — what you hold, then the one thing that is not money. */
function MoneyRows({
  w,
  onWallet,
  onPower,
}: {
  w: WalletViewDto;
  onWallet: () => void;
  onPower: () => void;
}) {
  const B = w.balance;
  const adv = w.standing.advantagePct;
  const row = (tint?: string): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: 'calc(100% + 2 * clamp(18px,2.4vw,26px))',
    margin: '0 calc(-1 * clamp(18px,2.4vw,26px))',
    minHeight: 62,
    border: 'none',
    borderTop: '1px solid var(--border)',
    background: tint || 'transparent',
    padding: '12px clamp(18px,2.4vw,26px)',
    cursor: 'pointer',
    font: 'inherit',
    textAlign: 'left',
  });
  return (
    <>
      <button
        type="button"
        onClick={onWallet}
        style={row()}
        aria-label={`Everything you hold — ${osFmt(B.total)} Os. Opens the breakdown.`}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...micro, fontSize: 9, letterSpacing: '.14em' }}>Yours</span>
          <span
            style={{
              display: 'block',
              marginTop: 4,
              fontSize: 11,
              color: 'var(--text-faint)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {osFmt(B.available)} free to move · {osFmt(B.protected + B.locked)} held
          </span>
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-.03em',
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <OMark size={15} />
          {osFmt(B.total)}
        </span>
        {svg(<path d="M9 6l6 6-6 6" />, 13, 'var(--text-faint)', 2)}
      </button>
      <button
        type="button"
        onClick={onPower}
        style={row('color-mix(in srgb, var(--o-green) 6%, transparent)')}
        aria-label={`O Power — not measured yet. A ${adv} percent advantage here. Not money.`}
      >
        <OMark size={14} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <b
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: w.power == null ? 'var(--text-faint)' : 'var(--o-green)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {w.power == null ? 'Not measured yet' : `${w.power}×`}
            </b>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>O Power</span>
          </span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, color: 'var(--text-faint)' }}>
            {adv}% off every WeO here · never cash
          </span>
        </span>
        {svg(<path d="M9 6l6 6-6 6" />, 13, 'var(--text-faint)', 2)}
      </button>
    </>
  );
}

/* design RateDial — one figure on a ring; the note says which way it moves, or that it does not */
function RateDial({
  pct,
  value,
  label,
  note,
}: {
  pct: number;
  value: string;
  label: string;
  note: ReactNode;
}) {
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <Card
      elevation="flat"
      radius={22}
      padding="15px 17px"
      style={{ display: 'flex', alignItems: 'center', gap: 14 }}
    >
      <svg width="82" height="82" viewBox="0 0 82 82" style={{ flex: '0 0 auto' }} aria-hidden>
        <circle cx="41" cy="41" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
        {pct > 0 && (
          <circle
            cx="41"
            cy="41"
            r={R}
            fill="none"
            stroke="var(--o-gold)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(C * pct) / 100} ${C}`}
            transform="rotate(-90 41 41)"
          />
        )}
        <text
          x="41"
          y="45"
          textAnchor="middle"
          style={{ fontSize: 15, fontWeight: 700, fill: 'var(--text)' }}
        >
          {value}
        </text>
      </svg>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span
          style={{
            display: 'block',
            marginTop: 4,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--text-dim)',
          }}
        >
          {note}
        </span>
      </span>
    </Card>
  );
}

/* one property of the network, and what your standing grants inside it */
function EcosystemCard({ e, tierN }: { e: WalletViewDto['ecosystem'][number]; tierN: number | undefined }) {
  const [hov, setHov] = useState(false);
  const live = e.state === 'live';
  return (
    <Card
      elevation="raised"
      radius={26}
      padding={18}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        borderTop: `2px solid ${e.tone}`,
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'transform .3s var(--ease-settle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Chip dot selected tone={e.tone}>
          {e.key}
        </Chip>
        <span style={{ marginLeft: 'auto', flex: '0 0 auto' }}>
          {live ? (
            <Badge variant="status" tone="var(--status-success)">
              Live
            </Badge>
          ) : (
            <Badge variant="status" tone="var(--text-faint)">
              At launch
            </Badge>
          )}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: hov ? '1fr' : '0fr',
          transition: 'grid-template-rows .4s var(--ease-portal)',
        }}
      >
        <p
          style={{
            margin: 0,
            overflow: 'hidden',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--text-dim)',
            opacity: hov ? 1 : 0,
            transition: 'opacity .24s',
          }}
        >
          {e.grants}
        </p>
      </div>
      <span style={{ ...micro, fontSize: 10, letterSpacing: '.12em' }}>{e.edge} edge</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
        <Tooltip label={live ? 'Running today — your standing applies now' : 'Announced, not running yet'}>
          <span style={{ fontSize: 12, fontWeight: 600, color: live ? 'var(--text)' : 'var(--text-faint)' }}>
            {live ? 'Reads your passport now' : 'Reads it at launch'}
          </span>
        </Tooltip>
        {tierN && (
          <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600, color: 'var(--text-faint)' }}>
            Tier {tierN} honoured
          </span>
        )}
      </div>
    </Card>
  );
}

function Ledger({ rows }: { rows: WalletViewDto['ledger'] }) {
  if (!rows.length)
    return (
      <Card elevation="inset" radius={26} padding={28} style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>
          Nothing has moved yet. Every collect, transfer and payout lands here, permanently.
        </p>
      </Card>
    );
  return (
    <Card
      elevation="raised"
      radius={26}
      padding={0}
      style={{ display: 'grid', gap: 1, overflow: 'hidden', background: 'var(--border)' }}
    >
      {rows.map((f) => {
        const inn = f.dir === 'in';
        return (
          <div
            key={f.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              padding: '14px 18px',
              background: 'var(--surface)',
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
                color: inn ? 'var(--status-success)' : 'var(--text-dim)',
                background: inn
                  ? 'color-mix(in srgb, var(--status-success) 12%, var(--surface))'
                  : 'var(--surface-2)',
              }}
            >
              {svg(
                inn ? <path d="M12 5v14M6 13l6 6 6-6" /> : <path d="M12 19V5M6 11l6-6 6 6" />,
                15,
                'currentColor',
                1.9,
              )}
            </span>
            <span style={{ flex: '1 1 200px', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                {f.what}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-faint)' }}>
                {relTime(f.at)} · {f.state}
              </span>
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flex: '0 0 auto',
                fontSize: 15,
                fontWeight: 700,
                color: inn ? 'var(--status-success)' : 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {inn ? '+' : '−'}
              <OMark size={12} /> {osFmt(f.os)}
            </span>
          </div>
        );
      })}
    </Card>
  );
}

export default WalletPage;
