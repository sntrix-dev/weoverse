import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { withTabIcons } from '@/components/hero/HeroParts';
import { SectionHero } from '@/components/hero/SectionHero';
import { Rows } from '@/components/layout/Rows';
import { Scene } from '@/components/layout/Scene';
import { SectionHead } from '@/components/layout/SectionMark';
import { FlowFoot } from '@/components/shell/FlowBar';
import { PathBar } from '@/components/shell/PathBar';
import { useHubPath } from '@/components/shell/useHubPath';
import { SnapshotChart, SnapshotPanel, type BoardRow } from '@/components/snapshot/Snapshot';
import { ICO, Tabs, ValueLadder } from '@/design-system';
import { useWalletView } from '@/features/wallet/api/wallet';
import { WalletRow } from '@/features/wallet/components/WalletRow';
import { FORMATS } from '@/lib/cardModel';
import { pulseMap } from '@/lib/snapshotModel';
import { openCreator, openRelist } from '@/stores/flow';
import { ack, openExternal, toast } from '@/stores/ui';
import { useCollectionsSnapshot, useDispute, useRedeem } from '../api/holdings';
import { HoldingRow, type HoldingRowHandlers } from '../components/HoldingRow';
import { NeedsYou, type NeedsYouAction } from '../components/NeedsYou';
import {
  COLLECT_PULSE_TONES,
  collectBoards,
  collectStats,
  holdingModel,
  needsYou,
  type HoldingModel,
  type NeedsYouItem,
} from '../model/holdings';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const quiet: CSSProperties = {
  margin: 0,
  padding: 36,
  textAlign: 'center',
  fontSize: 13.5,
  color: 'var(--text-dim)',
  borderRadius: 26,
  background: 'var(--surface-2)',
  boxShadow: 'var(--nm-inset)',
};

const LEDE =
  'Get it. Use it. Resell it. Remix it. The stage after collecting: yours, and still in flow. What you put in, what it would fetch today, and which ones can travel again.';

const fail = (e: unknown) => (e instanceof ApiError ? e.message : 'That did not go through — try again.');

/** design: collect.jsx CollectedScreen — what you hold, what it is worth, and what it still needs from you. */
export function CollectPage() {
  const navigate = useNavigate();
  const path = useHubPath([{ label: 'Collect' }]);
  const snap = useCollectionsSnapshot('7d');
  const wallet = useWalletView();
  const redeem = useRedeem();
  const dispute = useDispute();
  const [board, setBoard] = useState('movers');
  const [fmt, setFmt] = useState('All');
  const [kept, setKept] = useState<Set<string>>(() => new Set());

  const s = snap.data;
  const holdings = useMemo(() => (s?.rows ?? []).map((r) => holdingModel(r)), [s]);
  const byId = useMemo(() => new Map(holdings.map((h) => [h.id, h])), [holdings]);
  const todos = useMemo(() => needsYou(holdings).filter((t) => !kept.has(t.h.id)), [holdings, kept]);
  const boards = useMemo(() => collectBoards(s, byId), [s, byId]);
  const pulse = useMemo(() => pulseMap(s?.pulse, COLLECT_PULSE_TONES), [s]);
  const list = fmt === 'All' ? holdings : holdings.filter((h) => h.format === fmt);

  const openWeo = (h: HoldingModel) => void navigate(routes.weo(h.weoId));
  const relist = (h: HoldingModel) =>
    openRelist({ weoId: h.weoId, collectionId: h.id, name: h.name, img: h.img, format: h.format });
  const act: HoldingRowHandlers = {
    onResell: relist,
    onTrack: (h) => toast(`${h.name} · ${h.note}`),
    onCircle: (h) => void navigate(h.circleId ? routes.circle(h.circleId) : routes.weo(h.weoId)),
    onOpen: openWeo,
  };

  const actionsOf = (t: NeedsYouItem): NeedsYouAction[] => {
    const h = t.h;
    if (t.kind === 'receive')
      return [
        {
          label: 'Received',
          tone: 'gold',
          busy: redeem.isPending,
          go: () =>
            redeem.mutate(h.id, {
              onSuccess: () => {
                ack(`Received · ${h.seller.name} knows it arrived`, '#F7C62B');
                toast(`${h.name} · marked received`);
              },
              onError: (e) => toast(fail(e)),
            }),
        },
        {
          label: 'Something is wrong',
          ghost: true,
          go: () =>
            openExternal({
              label: 'Report a problem',
              eyebrow: 'Dispute',
              note: `${h.name} is marked disputed and a steward looks at it. You cannot relist it while it is open.`,
              cta: 'Open a dispute',
              tone: 'blue',
              onConfirm: () =>
                dispute.mutate(
                  { collectionId: h.id },
                  {
                    onSuccess: () => toast('Dispute opened · a steward will look'),
                    onError: (e) => toast(fail(e)),
                  },
                ),
            }),
        },
      ];
    if (t.kind === 'resell')
      return [
        { label: 'Resell it', tone: 'violet', go: () => relist(h) },
        { label: 'Keep it', ghost: true, go: () => setKept((k) => new Set(k).add(h.id)) },
      ];
    return [
      {
        label: 'Read the report',
        tone: 'green',
        go: () => void navigate(h.circleId ? routes.circle(h.circleId) : routes.weo(h.weoId)),
      },
    ];
  };

  const onPick = (r: BoardRow) => {
    if (r.id.startsWith('format:')) {
      setFmt(r.name);
      document.getElementById('c-held')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (r.id.startsWith('creator:')) {
      openCreator(r.id.slice('creator:'.length));
      return;
    }
    const h = byId.get(r.id);
    if (h) openWeo(h);
    else toast(`${r.name} · ${r.value}`);
  };

  const o = s?.osPlacement;
  const rail = (
    <div
      className="weo-osonly"
      style={{
        borderRadius: 24,
        padding: 18,
        background: 'var(--surface-2)',
        boxShadow: 'var(--nm-inset)',
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        Where your Os sit
      </p>
      <div style={{ height: 12 }} />
      {/* available is the wallet; the rest is what your holdings commit (D-048) */}
      <ValueLadder
        balances={{
          available: wallet.data?.balance.available ?? null,
          protected: o?.protected ?? null,
          pending: o?.pending ?? null,
          locked: o?.locked ?? null,
        }}
        compact
      />
    </div>
  );

  return (
    <main style={page}>
      <PathBar onHub={path.onHub} items={path.items} />
      <SectionHero
        id="collected"
        tone="#D946EF"
        icon={ICO.spark}
        eyebrow="02 of 04"
        title="Collect"
        bleedArt={holdings.find((h) => h.img)?.img ?? undefined}
        lede={LEDE}
        stats={collectStats(s)}
        directory={[
          { id: 'c-needs', label: 'Needs you', count: todos.length },
          { id: 'c-held', label: 'Your WeOs', count: holdings.length },
          { id: 'c-more', label: 'Snapshot & wallet' },
        ]}
        foot={
          Object.keys(pulse).length ? (
            <SnapshotChart
              pulse={pulse}
              keys={Object.keys(COLLECT_PULSE_TONES)}
              value={board}
              onChange={setBoard}
            />
          ) : undefined
        }
      />

      <NeedsYou items={todos} actionsOf={actionsOf} />

      <Scene id="c-held" style={{ display: 'block', marginTop: 40 }}>
        <SectionHead
          eyebrow="01 — Held"
          title="WeOs you hold"
          right={
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '100%' }}>
              <Tabs
                tabs={withTabIcons(['All', ...FORMATS])}
                value={fmt}
                onChange={setFmt}
                tone="var(--o-violet)"
                style={{ minWidth: 'max-content' }}
              />
            </div>
          }
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,420px),1fr))',
            gap: 14,
          }}
        >
          {list.map((h, i) => (
            <HoldingRow key={h.id} h={h} i={i} act={act} />
          ))}
        </div>
        {list.length === 0 && (
          <p style={quiet}>
            {snap.isLoading
              ? 'Reading your collection…'
              : snap.isError
                ? 'Your collection did not load.'
                : fmt === 'All'
                  ? 'Nothing held yet. Collect a WeO and it lands here.'
                  : 'Nothing held in this format yet.'}
          </p>
        )}
      </Scene>

      <Scene id="c-more" style={{ display: 'block', marginTop: 40 }}>
        <Rows
          rows={[
            {
              id: 'c-snapshot',
              title: 'Snapshot · 7d',
              tone: '#D946EF',
              body: Object.keys(boards).length ? (
                <SnapshotPanel
                  boards={boards}
                  pulse={pulse}
                  board={board}
                  onBoard={setBoard}
                  eyebrow="Your collection · 7d"
                  rail={rail}
                  onPick={onPick}
                />
              ) : (
                <p style={quiet}>{snap.isLoading ? 'Measuring…' : 'Nothing to measure yet.'}</p>
              ),
            },
            { id: 'c-wallet', title: 'Wallet', tone: '#F7C62B', body: <WalletRow /> },
          ]}
        />
      </Scene>
      <FlowFoot
        screen="collected"
        next={{
          label: 'Create',
          lead: 'Make one of your own',
          go: () => void navigate(routes.create()),
          tone: '#22C55E',
        }}
      />
    </main>
  );
}

export default CollectPage;
