import { useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { SectionHero } from '@/components/hero/SectionHero';
import { Scene } from '@/components/layout/Scene';
import { SectionHead } from '@/components/layout/SectionMark';
import { Spark } from '@/components/people/People';
import { OProfileHub, type HubModule } from '@/components/people/ProfileHub';
import type { StageItem } from '@/components/people/ProfileStage';
import { PublicPageButton } from '@/components/people/PublicPageButton';
import { PathBar } from '@/components/shell/PathBar';
import { Avatar, Chip, ICO, OMark, svg, ValueLadder } from '@/design-system';
import { useExportData } from '@/features/settings/api/settings';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { useWalletView } from '@/features/wallet/api/wallet';
import { formatHex, type WeoFormat } from '@/lib/cardModel';
import { osFmt } from '@/lib/format';
import { glideToId } from '@/lib/glide';
import { useHashGlide } from '@/lib/useHashGlide';
import { toast } from '@/stores/ui';
import { usePassport, useGraph, type GraphDto, type PassportDto } from '../api/passport';
import { PassportBalance } from '../components/PassportBalance';
import {
  EditProfileSheet,
  IsrImproveSheet,
  PassportSettingsSheet,
  PublicProfileSheet,
  TierLadderSheet,
} from '../components/PassportSheets';
import { currentRung, joinedLabel, loseLine, pct, reachLine } from '../model/passport';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};
const card: CSSProperties = {
  borderRadius: 30,
  padding: 'clamp(18px,2.2vw,24px)',
  background: 'var(--surface)',
  boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
};
const well: CSSProperties = {
  borderRadius: 26,
  padding: 18,
  background: 'var(--surface-2)',
  boxShadow: 'var(--nm-inset)',
};
const micro: CSSProperties = {
  margin: 0,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
};

/** the orbit carries `weoType`; the display format follows the card model's projection */
const formatOfType = (t: string): WeoFormat =>
  t === 'crowdfund' ? 'Pool' : t === 'lottery' ? 'Hunt' : 'Listing';

/** the passport's hash names (and the wallet's "isr") → the section ids */
const HASH: Record<string, string> = {
  standing: 'pp-standing',
  isr: 'pp-standing',
  tier: 'pp-tier',
  graph: 'pp-graph',
};

const dot = (tone: string, size = 5) => (
  <span style={{ width: size, height: size, borderRadius: '50%', background: tone, flex: '0 0 auto' }} />
);

/** design: passport.jsx PassportScreen — standing first, the ladder beside it. */
export function PassportPage() {
  const navigate = useNavigate();
  const passport = usePassport();
  const graph = useGraph();
  const wallet = useWalletView();
  const nav = useNavSummary();
  const exporter = useExportData();
  const [why, setWhy] = useState(false);
  const [improve, setImprove] = useState(false);
  const [tiers, setTiers] = useState(false);
  const [pub, setPub] = useState(false);
  const [edit, setEdit] = useState(false);
  const [settings, setSettings] = useState(false);
  const p = passport.data;
  useHashGlide(!!p, HASH);

  if (!p) {
    return (
      <main style={page}>
        <p style={{ margin: '80px 0', textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
          {passport.isError
            ? 'Your passport did not load — try again in a moment.'
            : 'Opening your passport…'}
        </p>
      </main>
    );
  }

  const S = p.standing;
  const id = p.identity;
  const t = currentRung(p);
  const isr = Math.round(S.isr);
  const w = wallet.data;
  const inFlight = w ? w.balance.protected + w.balance.pending + w.balance.locked : null;
  const circles = nav.data?.counts?.circles;
  const g = graph.data;
  const where = [id.where, id.joinedAt ? `joined ${joinedLabel(id.joinedAt)}` : null]
    .filter(Boolean)
    .join(' · ');

  const items: StageItem[] = p.orbit.map((o) => ({
    id: o.id,
    name: o.title,
    type: formatOfType(o.weoType),
    img: o.img,
    tone: formatHex(formatOfType(o.weoType)),
    onClick: () => void navigate(routes.weo(o.id)),
  }));

  const around: HubModule[] = [
    {
      label: 'What moved it',
      note: S.moves ? `${S.moves.length} inputs this week` : 'Not tracked yet · the inputs are published',
      tone: '#3A95F2',
      cta: S.moves ? 'See the week' : 'What it never counts',
      icon: (
        <>
          <path d="M4 15l5-6 4 4 6-8" />
          <path d="M4 20h16" />
        </>
      ),
      preview: S.moves ? (
        <>
          {S.trace && <Spark values={S.trace} tone="#3A95F2" h={30} />}
          {S.moves.slice(0, 2).map((m) => (
            <span key={m.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
              {dot(m.up ? 'var(--o-green)' : 'var(--status-error)')}
              <span
                style={{
                  color: 'var(--text-dim)',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.k}
              </span>
              <b style={{ marginLeft: 'auto', color: m.up ? 'var(--o-green)' : 'var(--status-error)' }}>
                {m.v}
              </b>
            </span>
          ))}
        </>
      ) : (
        <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-dim)' }}>
          ISR {isr}, scored under {S.policyVersion}. No week-by-week record is kept yet.
        </span>
      ),
      onClick: () => {
        if (!S.moves) setWhy(true);
        glideToId('pp-standing');
      },
    },
    {
      label: 'Your tier',
      note: `${t.label} · ${pct(t.adv)}% advantage`,
      tone: '#F7C62B',
      cta: 'What it is worth',
      icon: <path d="M12 3.6l2.6 5.6 6.1.6-4.6 4.1 1.4 6-5.5-3.2-5.5 3.2 1.4-6L3.3 9.8l6.1-.6z" />,
      preview: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {p.tier.ladder.map((x) => (
            <span key={x.n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span
                style={{
                  width: 46,
                  color: x.current ? 'var(--text)' : 'var(--text-faint)',
                  fontWeight: x.current ? 700 : 500,
                }}
              >
                {x.label}
              </span>
              <span
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 999,
                  background: 'var(--surface-2)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: `${Math.round(x.adv * 400)}%`,
                    maxWidth: '100%',
                    height: '100%',
                    borderRadius: 999,
                    background: x.current ? 'var(--o-gold)' : 'var(--text-faint)',
                    opacity: x.current ? 1 : 0.4,
                  }}
                />
              </span>
              <b
                style={{
                  width: 30,
                  textAlign: 'right',
                  color: 'var(--text-dim)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pct(x.adv)}%
              </b>
            </span>
          ))}
        </div>
      ),
      onClick: () => glideToId('pp-tier'),
    },
    {
      label: 'Improve',
      note: 'The moves that lift your standing',
      tone: '#22C55E',
      cta: 'Improve your standing',
      icon: (
        <>
          <circle cx="12" cy="12" r="8.4" />
          <path d="M12 8v8M8 12h8" />
        </>
      ),
      preview: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {S.inputs
            .filter((m) => m.w > 0)
            .slice(0, 3)
            .map((m) => (
              <span key={m.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                {dot('var(--o-green)')}
                <span
                  style={{
                    color: 'var(--text-dim)',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.k}
                </span>
                <b style={{ marginLeft: 'auto', color: 'var(--o-green)' }}>+{m.w}</b>
              </span>
            ))}
        </div>
      ),
      onClick: () => setImprove(true),
    },
    {
      label: 'Your graph',
      note: `${p.totals.circledBy} circle you · you back ${p.totals.backs}`,
      tone: '#D946EF',
      cta: 'See who is around you',
      icon: (
        <>
          <circle cx="12" cy="8" r="3" />
          <path d="M6 19c.8-3 3.2-4.6 6-4.6S17.2 16 18 19" />
        </>
      ),
      preview: g?.circledBy.length ? (
        <span style={{ display: 'flex' }}>
          {g.circledBy.slice(0, 5).map((q, i) => (
            <span key={q.id} style={{ marginLeft: i ? -9 : 0 }}>
              <Avatar src={q.avatarUrl ?? undefined} isr={Math.round(q.isr)} size={28} />
            </span>
          ))}
        </span>
      ) : (
        <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>Nobody circles you yet.</span>
      ),
      onClick: () => glideToId('pp-graph'),
    },
  ];

  return (
    <main style={page}>
      <PathBar
        onHub={() => void navigate(routes.hub())}
        items={[
          { label: 'WeOverse', onClick: () => void navigate(routes.hub()) },
          { label: 'Your passport' },
        ]}
      />

      <SectionHero
        id="passport"
        tone="#3A95F2"
        icon={ICO.passport}
        eyebrow={`Your passport · ${S.policyVersion}`}
        title={id.name}
        sub={
          <span
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '4px 10px',
              fontSize: 12.5,
              color: 'var(--text-dim)',
            }}
          >
            <b style={{ fontWeight: 600, color: 'var(--text)' }}>{id.handle}</b>
            {id.passportId && (
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--text-faint)',
                }}
              >
                # {id.passportId}
              </span>
            )}
            {where && <span style={{ color: 'var(--text-faint)' }}>{where}</span>}
          </span>
        }
        actions={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PublicPageButton
              avatar={id.avatarUrl}
              isr={S.isr}
              weos={p.totals.listed}
              contact={p.publicProfile.contact}
              onOpen={() => setPub(true)}
            />
            <button
              type="button"
              onClick={() => setSettings(true)}
              aria-label="Passport settings"
              title="Passport settings"
              style={{
                flex: '0 0 auto',
                display: 'grid',
                placeItems: 'center',
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                background: 'var(--surface)',
                boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
              }}
            >
              {svg(
                <>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                </>,
                19,
                'currentColor',
                1.6,
              )}
            </button>
          </span>
        }
        feature={
          <PassportBalance
            available={w ? w.balance.available : null}
            inFlight={inFlight}
            onWallet={() => void navigate(routes.wallet())}
            onTopUp={() => toast('Top up in WeO Local — money moves there')}
          />
        }
        stats={[
          S.delta
            ? { value: String(isr), label: 'ISR', delta: S.delta, deltaNote: 'Last 7 days' }
            : { value: String(isr), label: 'ISR' },
          {
            value: t.label,
            label: `Tier ${t.n} · ${pct(t.adv)}% advantage`,
            title:
              'Your tier and the advantage it carries — what each tier asks, and what would cost you this one',
            onClick: () => setTiers(true),
          },
          {
            value: circles == null ? '—' : String(circles),
            label: 'Circles joined',
            title: 'Open your circles in Community',
            onClick: () => void navigate(routes.manage()),
          },
        ]}
        priorities={[
          {
            id: 'pp-standing',
            label: 'What moved it this week',
            note: S.moves
              ? `${S.moves.length} inputs, each one named`
              : 'Not tracked yet — the inputs are published',
          },
          {
            id: 'pp-tier',
            label: 'What your tier is worth',
            note: `${p.tier.ladder.length} participant tiers, one advantage`,
          },
          {
            label: 'Your wallet',
            note: 'Available, protected, pending, locked',
            onClick: () => void navigate(routes.wallet()),
          },
        ]}
        directory={[
          { id: 'pp-graph', label: 'Who is around you', count: p.totals.circledBy },
          { label: 'Collect', note: 'Everything you hold', onClick: () => void navigate(routes.collected()) },
          {
            label: 'Listed',
            note: 'What you have up in Exchange',
            count: p.totals.listed || undefined,
            onClick: () => void navigate(routes.listed()),
          },
        ]}
        foot={
          <OProfileHub
            storeKey="passport"
            stage={{
              size: 300,
              tone: '#3A95F2',
              avatar: id.avatarUrl,
              isr,
              collapsible: true,
              items,
              onOpen: () => setWhy(true),
              utility: {
                label: 'Edit your profile',
                onClick: () => setEdit(true),
                icon: (
                  <>
                    <path d="M4 20h4l10-10-4-4L4 16z" />
                    <path d="M14 6l4 4" />
                  </>
                ),
              },
            }}
            views={[
              {
                key: 'passport',
                label: 'Passport',
                tone: '#3A95F2',
                note: 'Your standing and who is around you',
                around,
              },
            ]}
          />
        }
      />

      <Scene id="pp-standing" style={{ display: 'block', marginTop: 46 }}>
        <SectionHead
          eyebrow="01 — Standing"
          title="What moved it, this week"
          note="Public on every profile. Standing you can watch is standing you can trust."
        />
        <div
          className="weo-snap-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.4fr) minmax(260px,.9fr)',
            gap: 'clamp(16px,2vw,26px)',
            alignItems: 'start',
          }}
        >
          <div style={card}>
            {S.moves ? (
              <>
                {S.trace && <Spark values={S.trace} tone="#22C55E" h={64} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                  {S.moves.map((m) => (
                    <div key={m.k} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5 }}>
                      {dot(m.up ? 'var(--o-green)' : 'var(--status-error)', 7)}
                      <span style={{ color: 'var(--text-dim)' }}>{m.k}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-faint)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {m.n}
                      </span>
                      <b
                        style={{
                          marginLeft: 'auto',
                          fontSize: m.soft ? 12 : 13.5,
                          color: m.soft ? 'var(--text-dim)' : m.up ? 'var(--o-green)' : 'var(--status-error)',
                        }}
                      >
                        {m.v}
                      </b>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <NotTracked
                isr={isr}
                policy={S.policyVersion}
                onImprove={() => setImprove(true)}
                onWhy={() => setWhy(true)}
              />
            )}
            {why && (
              <div
                style={{
                  marginTop: 18,
                  borderRadius: 20,
                  padding: 16,
                  background: 'var(--surface-2)',
                  boxShadow: 'var(--nm-inset)',
                  animation: 'weo-cardin .38s var(--ease-settle) both',
                }}
              >
                <p style={{ ...micro, fontSize: 10, letterSpacing: '.13em' }}>What it never counts</p>
                <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-dim)' }}>
                  {S.excludes.join(' · ')}
                </p>
                <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-dim)' }}>
                  <b style={{ color: 'var(--text)' }}>Appeal.</b> {S.appeal}
                </p>
              </div>
            )}
          </div>
          <div className="weo-osonly" style={{ ...card, padding: 'clamp(16px,2vw,22px)' }}>
            {w ? (
              <ValueLadder balances={w.balance} rate={w.peg.rate} />
            ) : (
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)' }}>
                {wallet.isError ? 'The wallet did not load.' : 'Opening your wallet…'}
              </p>
            )}
          </div>
        </div>
      </Scene>

      <Scene id="pp-tier" style={{ display: 'block', marginTop: 52 }}>
        <SectionHead
          eyebrow="02 — Your tier"
          title="What your standing is worth"
          note="Three participant tiers. They vary the advantage, never a rate — and the advantage you earn here is the edge you carry into the marketplace apps at launch."
        />
        <div
          className="weo-snap-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.35fr) minmax(260px,.9fr)',
            gap: 'clamp(16px,2vw,26px)',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {p.tier.ladder.map((r) => (
              <TierRow key={r.key} r={r} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                ...card,
                borderRadius: 26,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span style={{ ...micro, letterSpacing: '.13em' }}>
                On a WeO listed at O {osFmt(p.tier.example.ask)}
              </span>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '-.035em',
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <OMark size={20} />
                  {osFmt(p.tier.example.pay)}
                </span>
                <span style={{ display: 'block', marginTop: 5, fontSize: 12.5, color: 'var(--text-dim)' }}>
                  Your price · {t.label} · {p.tier.example.pct}% advantage
                </span>
              </div>
              <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <OMark size={13} />
                  {osFmt(p.tier.outside.pay)}
                </span>
                <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--text-faint)' }}>
                  {p.tier.outside.label} · {p.tier.outside.note}
                </span>
              </div>
            </div>
            <div style={well}>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-dim)' }}>
                Your tier travels. When the marketplace apps launch, the standing you built here sets the
                advantage you arrive with — it is never a rate, never interest, and it moves only on the
                inputs above.
              </p>
            </div>
          </div>
        </div>
      </Scene>

      <Scene id="pp-graph" style={{ display: 'block', marginTop: 52 }}>
        <SectionHead eyebrow="03 — Your graph" title="Who is around you" />
        <Graph
          g={g}
          failed={graph.isError}
          totals={p.totals}
          onOpen={(pid) => void navigate(routes.creators(pid))}
        />
      </Scene>

      {tiers && (
        <TierLadderSheet p={p} available={w?.balance.available ?? 0} onClose={() => setTiers(false)} />
      )}
      {pub && <PublicProfileSheet p={p} onClose={() => setPub(false)} />}
      {improve && <IsrImproveSheet p={p} onClose={() => setImprove(false)} />}
      {edit && <EditProfileSheet p={p} onClose={() => setEdit(false)} />}
      {settings && (
        <PassportSettingsSheet
          p={p}
          onEdit={() => setEdit(true)}
          onPublic={() => setPub(true)}
          onSettings={(section) => void navigate(routes.settings(section))}
          onExport={() =>
            exporter.mutate(undefined, {
              onSuccess: () => toast('Your data is downloading'),
              onError: () => toast('The export did not go through — try again'),
            })
          }
          exporting={exporter.isPending}
          onClose={() => setSettings(false)}
        />
      )}
    </main>
  );
}

/** No ISR ledger yet (D-074): say so, instead of drawing a week that never happened. */
function NotTracked({
  isr,
  policy,
  onImprove,
  onWhy,
}: {
  isr: number;
  policy: string;
  onImprove: () => void;
  onWhy: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Chip>Not tracked yet</Chip>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          ISR {isr} · {policy}
        </span>
      </span>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-dim)' }}>
        Your score is real; the week behind it is not recorded yet. Rather than draw a line that never
        happened, this stays empty until every move is kept with its reason.
      </p>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <ActionLink onClick={onImprove}>What moves it</ActionLink>
        <ActionLink onClick={onWhy}>What it never counts</ActionLink>
      </span>
    </div>
  );
}

function ActionLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        cursor: 'pointer',
        borderRadius: 999,
        padding: '8px 14px',
        font: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text)',
        background: 'var(--surface)',
        boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
      }}
    >
      {children}
      {svg(<polyline points="9 6 15 12 9 18" />, 12, 'currentColor', 2.2)}
    </button>
  );
}

function TierRow({ r }: { r: PassportDto['tier']['ladder'][number] }) {
  const on = r.current;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderRadius: 24,
        padding: '15px 18px',
        background: on ? `color-mix(in srgb, ${r.tone} 7%, var(--surface))` : 'var(--surface)',
        boxShadow: `var(--nm-raised), inset 0 0 0 1px ${on ? `color-mix(in srgb, ${r.tone} 34%, transparent)` : 'var(--border)'}`,
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          width: 42,
          height: 42,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: r.reached ? r.tone : 'var(--surface-2)',
          boxShadow: r.reached ? 'none' : 'var(--nm-inset)',
          color: r.reached ? '#fff' : 'var(--text-faint)',
          fontSize: 14,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {r.n}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-.018em',
              color: 'var(--text)',
            }}
          >
            {r.label}
          </h3>
          {on && (
            <Chip selected tone="var(--o-green)">
              You are here
            </Chip>
          )}
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-faint)' }}>
          {r.need}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 6 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              color: 'var(--text-dim)',
            }}
          >
            {svg(<path d="M12 19V5M6 11l6-6 6 6" />, 11, 'var(--o-green)', 2.2)}
            {reachLine(r)}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              color: 'var(--text-dim)',
            }}
          >
            {svg(<path d="M12 5v14M6 13l6 6 6-6" />, 11, 'var(--status-error)', 2.2)}
            {loseLine(r)}
          </span>
        </div>
      </div>
      <span style={{ flex: '0 0 auto', textAlign: 'right' }}>
        <b
          style={{
            display: 'block',
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: '-.025em',
            color: r.reached ? r.tone : 'var(--text-faint)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {pct(r.adv)}%
        </b>
        <span
          style={{
            display: 'block',
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          advantage
        </span>
      </span>
    </div>
  );
}

function Graph({
  g,
  failed,
  totals,
  onOpen,
}: {
  g: GraphDto | undefined;
  failed: boolean;
  totals: PassportDto['totals'];
  onOpen: (id: string) => void;
}) {
  const lists: [string, GraphDto['circledBy'], number][] = [
    ['Circled by', g?.circledBy ?? [], g?.counts.circledBy ?? totals.circledBy],
    ['You back', g?.backs ?? [], g?.counts.backs ?? totals.backs],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 14 }}>
      {lists.map(([k, list, n]) => (
        <div key={k} style={{ ...card, borderRadius: 26, padding: 18 }}>
          <p style={micro}>{k}</p>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, minHeight: 38 }}>
            {list.slice(0, 6).map((q, i) => (
              <button
                type="button"
                key={q.id}
                onClick={() => onOpen(q.id)}
                title={`${q.name} · ISR ${Math.round(q.isr)}`}
                aria-label={`Open ${q.name}`}
                style={{
                  marginLeft: i ? -10 : 0,
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  borderRadius: '50%',
                  transition: 'transform .22s var(--ease-portal)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.zIndex = '3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.zIndex = 'auto';
                }}
              >
                <Avatar src={q.avatarUrl ?? undefined} isr={Math.round(q.isr)} size={38} />
              </button>
            ))}
            {!list.length && (
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
                {!g && !failed ? 'Loading…' : failed ? 'Did not load.' : 'Nobody yet.'}
              </span>
            )}
            <span
              style={{
                marginLeft: 'auto',
                alignSelf: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {n}
            </span>
          </div>
        </div>
      ))}
      <div style={well}>
        <p style={micro}>Vouched</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
          {g?.vouched.length ? (
            g.vouched.map((v) => (
              <button
                type="button"
                key={v.id}
                onClick={() => onOpen(v.id)}
                title={`Open ${v.name}`}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  font: 'inherit',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: 'var(--text-dim)',
                }}
              >
                <b style={{ color: 'var(--text)', fontWeight: 600 }}>{v.name}</b> · {v.note}
              </button>
            ))
          ) : (
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-faint)' }}>
              Vouches are not recorded yet — when they are, who vouched and for what shows here.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PassportPage;
