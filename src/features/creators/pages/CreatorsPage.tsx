// design: creators.jsx CreatorsScreen — `/creators`, `/creators/:creatorId` opens that record
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router';
import { routes } from '@/app/routes';
import { SectionHero } from '@/components/hero/SectionHero';
import { Scene } from '@/components/layout/Scene';
import { SectionHead } from '@/components/layout/SectionMark';
import { PathBar } from '@/components/shell/PathBar';
import { SnapshotPanel } from '@/components/snapshot/Snapshot';
import { WeoView } from '@/components/weo/WeoView';
import { ICO } from '@/design-system';
import { useContributors } from '@/features/community/api/community';
import { useWeos } from '@/features/weo/api/weos';
import { useWeoHandlers } from '@/features/weo/useWeoHandlers';
import { cardModel } from '@/lib/cardModel';
import { openCreator } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useCircleThem, useCreatorDirectory } from '../api/creators';
import { CreatorGrid } from '../components/CreatorGrid';
import { creatorBoards, creatorModel, creatorPulse, type CreatorModel } from '../model/creators';

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(16px,2.2vw,26px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};

const quiet: CSSProperties = {
  margin: 0,
  padding: 40,
  textAlign: 'center',
  fontSize: 13.5,
  color: 'var(--text-dim)',
  borderRadius: 26,
  background: 'var(--surface-2)',
  boxShadow: 'var(--nm-inset)',
};

export default function CreatorsPage() {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const h = useWeoHandlers();
  const dir = useCreatorDirectory(48);
  const stewards = useContributors(48);
  const their = useWeos({ feed: 'following', status: 'active', limit: 24 });
  const circleThem = useCircleThem();
  const [board, setBoard] = useState('standing');
  const [mya, setMya] = useState(false);

  const list = useMemo(() => (dir.data?.items ?? []).map(creatorModel), [dir.data]);
  const boards = useMemo(() => creatorBoards(list), [list]);
  const pulse = useMemo(() => creatorPulse(list), [list]);
  const theirWeos = useMemo(() => (their.data?.items ?? []).map((w) => cardModel(w)), [their.data]);
  const theirCount = their.data?.pagination.total ?? theirWeos.length;
  const circledCount = list.filter((c) => c.circled).length;

  // the record in the URL opens in place; someone outside the directory opens as their sheet
  const inList = !!creatorId && list.some((c) => c.id === creatorId);
  useEffect(() => {
    if (creatorId && dir.isSuccess && !inList) openCreator(creatorId);
  }, [creatorId, dir.isSuccess, inList]);
  useEffect(() => {
    if (!inList || !creatorId) return;
    const t = window.setTimeout(
      () =>
        document.getElementById(`cr-${creatorId}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }),
      120,
    );
    return () => window.clearTimeout(t);
  }, [inList, creatorId]);
  const openId = mya ? 'mya' : inList ? (creatorId ?? null) : null;
  const onOpenId = (id: string | null) => {
    setMya(id === 'mya');
    const to = id && id !== 'mya' ? routes.creators(id) : routes.creators();
    if (to !== window.location.pathname) void navigate(to, { replace: true, preventScrollReset: true });
  };
  const onCircle = (c: CreatorModel) =>
    circleThem.mutate(
      { id: c.id, on: !c.circled },
      { onSuccess: () => toast(!c.circled ? `Following ${c.name}` : `Unfollowed ${c.name}`) },
    );

  return (
    <main style={page}>
      <PathBar
        onHub={() => void navigate(routes.hub())}
        items={[{ label: 'WeOverse', onClick: () => void navigate(routes.hub()) }, { label: 'Creators' }]}
      />

      <SectionHero
        id="creators"
        tone="#3A95F2"
        icon={ICO.creators}
        eyebrow="01 — Creators"
        title="Who is trading, and how well"
        bleedArt="/media/weo-fitness.jpg"
        lede="Standing leads, and the seven days behind it are shown beside it. Circle a creator and their next WeO arrives in your Find rail."
        stats={[
          { value: String(dir.data?.total ?? list.length), label: 'Creators trading' },
          { value: String(circledCount), label: 'You circle' },
          { value: String(theirCount), label: 'WeOs from them' },
          { value: String(stewards.data?.contributors.length ?? 0), label: 'Stewards' },
        ]}
        priorities={[
          {
            id: 'cr-people',
            label: 'Creators by standing',
            note: 'Open a record to see their WeOs orbit it',
          },
          {
            id: 'cr-their',
            label: 'Their work',
            note: theirCount ? `${theirCount} WeOs from creators you circle` : 'Circle someone to fill this',
          },
        ]}
        directory={[
          { id: 'cr-snapshot', label: 'Snapshot · 7d' },
          { id: 'cr-people', label: 'Creators by standing', count: dir.data?.total ?? list.length },
          { id: 'cr-their', label: 'WeOs from creators you circle', count: theirCount },
          {
            label: 'Requests',
            note: 'Who is asking for work',
            onClick: () => void navigate(routes.requests()),
          },
        ]}
        foot={
          <div id="cr-snapshot">
            {list.length ? (
              <SnapshotPanel
                boards={boards}
                pulse={pulse}
                board={board}
                onBoard={setBoard}
                eyebrow="Creators · 7d"
                onPick={(r) => openCreator(r.id)}
              />
            ) : (
              <p style={quiet}>{dir.isLoading ? 'Reading the directory…' : 'No one is trading yet.'}</p>
            )}
          </div>
        }
      />

      <Scene
        id="cr-people"
        style={{
          marginTop: 56,
          borderRadius: 30,
          padding: 'clamp(20px,2.6vw,30px) clamp(16px,2.4vw,26px)',
          background: 'color-mix(in srgb, var(--o-blue) 5%, var(--surface))',
          boxShadow: 'inset 0 0 0 1px var(--border)',
        }}
      >
        <SectionHead
          eyebrow="02 — People"
          title="Creators, by standing"
          note="Open a record to see their WeOs orbit their standing. Collect or circle them. Mya sits with them as your guide — she is never ranked."
        />
        <CreatorGrid
          list={list}
          openId={openId}
          onOpenId={onOpenId}
          onCircle={onCircle}
          onOpenWeo={(id) => void navigate(routes.weo(id))}
        />
      </Scene>

      <Scene id="cr-their" style={{ display: 'block', marginTop: 56 }}>
        <WeoView
          id="creators.their"
          list={theirWeos}
          h={h}
          tone="var(--o-blue)"
          head={(segs) => (
            <SectionHead
              eyebrow="03 — Their work"
              title="WeOs from creators you follow"
              note={theirWeos.length ? null : 'Circle a creator above and their WeOs land here.'}
              right={theirWeos.length ? segs : null}
            />
          )}
          empty={<p style={quiet}>Circle a creator above and their WeOs land here.</p>}
        />
      </Scene>
    </main>
  );
}
