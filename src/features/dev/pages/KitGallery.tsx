import { useState } from 'react';
import { Button } from '@/design-system';
import { CircleChip, CircleRecord, type CircleCardModel } from '@/components/circle/Circle';
import { SectionHero } from '@/components/hero/SectionHero';
import { Pip, StatStrip } from '@/components/layout/Pip';
import { SectionHead } from '@/components/layout/SectionMark';
import { OAvatarOrb, PersonOi, Spark, StandChip } from '@/components/people/People';
import { SnapshotPanel, WhatWinsRail, type Board, type Pulse } from '@/components/snapshot/Snapshot';
import { OsText } from '@/components/text/OsText';
import { StageRing } from '@/components/weo/StageRing';
import { StallTile, WeoTimer } from '@/components/weo/WeoBits';
import { WeoView } from '@/components/weo/WeoView';
import type { WeoHandlers } from '@/components/weo/weoCardProps';
import { cardModel } from '@/lib/cardModel';
import { toast } from '@/stores/ui';
import { ALL_FIXTURE_WEOS, FIXTURE_NOW } from '@/test/fixtures/weos';
import styles from './DsGalleryPage.module.css';

/*
 * `/dev/ds` — the M03 shared kit with sample data, for parity checks against the design.
 * Dev builds only (the route is not registered in production). The WeOs are the test
 * fixtures run through `cardModel`, so the gallery shows exactly what a page would.
 */

const IMGS = ['/brand/orb-market.png', '/brand/orb-coffee.png', '/media/plaza-mural.png'];
const AVATAR = '/brand/orb-coffee.png';

const weos = ALL_FIXTURE_WEOS().map((w, i) => ({
  ...cardModel(w, 'discover', FIXTURE_NOW),
  img: IMGS[i % IMGS.length] ?? null,
}));

const h: WeoHandlers = {
  onOpen: (w) => toast(`Open ${w.name}`),
  onCollect: (w) => toast(`Collect ${w.name}`),
  onPush: (w) => toast(`Push ${w.name}`),
};

const circles: CircleCardModel[] = [
  { id: 'c1', name: 'Loop makers', members: 1240, toneHex: '#22C55E', icon: 'pool', desire: 72, img: IMGS[0], bestType: 'Pool' },
  { id: 'c2', name: 'Night hunters', members: 318, toneHex: '#F7C62B', icon: 'hunt', desire: 38, bestType: 'Hunt' },
];

const row = (id: string, name: string, value: string, delta: string, tone: string, extra: object = {}) => ({
  id,
  name,
  sub: 'sample row',
  value,
  delta,
  tone,
  ...extra,
});
const boards: Record<string, Board> = {
  collected: {
    label: 'Where the Os flowed',
    metric: 'Os moved',
    rows: [
      row('r1', 'Loop pack', 'O 12,480', '+8%', '#22C55E', { img: IMGS[0] }),
      row('r2', 'Lena V.', 'O 9,120', '+3%', '#3A95F2', { avatar: AVATAR, isr: 82 }),
      row('r3', 'Night hunt', 'O 6,040', '+1%', '#F7C62B', { initial: 'N' }),
      row('r4', 'Sound kit', 'O 2,400', '−2%', '#D946EF'),
      row('r5', 'Plaza mural', 'O 1,980', '+5%', '#22C55E', { img: IMGS[2] }),
    ],
  },
  creators: {
    label: 'Who moved the most',
    metric: 'ISR',
    rows: [row('p1', 'Lena V.', '82', '+4', '#3A95F2', { avatar: AVATAR, isr: 82 }), row('p2', 'Mira K.', '76', '+2', '#D946EF')],
  },
};
const pulse: Record<string, Pulse> = {
  collected: { label: 'Flow', note: '7 days', headline: 'O 31,980', delta: '+6%', tone: '#3A95F2', series: [4, 6, 5, 8, 7, 9, 11] },
  creators: { label: 'Creators', note: 'active', headline: '214', delta: '+12', tone: '#D946EF', series: [3, 3, 4, 6, 5, 7, 8] },
};

export function KitGallery() {
  const [board, setBoard] = useState('collected');
  const [stage, setStage] = useState(2);
  const [first] = weos;
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Shared kit · hero (M03)</h2>
        <SectionHero
          id="dev-kit"
          tone="var(--o-blue)"
          eyebrow="Discover"
          title="Find what's happening now"
          sub="Sample hero with stats, priorities and the view controls."
          stats={[
            { label: 'Live now', value: weos.length },
            { label: 'Os moved · 7d', value: '31,980', os: true, delta: '+6%' },
          ]}
          priorities={[{ id: 'p1', label: 'Night hunt closes in 6h', note: 'Entry O 600' }]}
          art={IMGS[0]}
        />
      </section>

      <section className={styles.section}>
        <SectionHead eyebrow="02 — Section head" title="Layout bits" note="Pips, stat strip, Os text and the timer." />
        <div className={styles.row}>
          <Pip tone="var(--o-green)">Pool</Pip>
          <Pip tone="var(--o-gold)">Hunt</Pip>
          <OsText value="O 12,480" />
          <WeoTimer t="06:14:22" tone="var(--o-gold)" />
        </div>
        <StatStrip
          items={[
            { k: 'Collected', v: '12', note: 'all time' },
            { k: 'Value', v: <OsText value="O 31,980" />, note: 'today', tone: 'var(--o-blue)' },
          ]}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>WeoView (cardModel over the fixtures)</h2>
        <WeoView id="dev-kit" list={weos} h={h} head={(segs) => <div className={styles.row}>{segs}</div>} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Stall tiles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {weos.map((w) => (
            <StallTile key={w.id} w={w} onOpen={h.onOpen} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Circles</h2>
        <div className={styles.row}>
          {circles.map((c) => (
            <CircleChip key={c.id} c={c} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginTop: 16 }}>
          {circles.map((c, i) => (
            <CircleRecord key={c.id} c={c} joined={i === 0} onOpen={() => toast(`Open ${c.name}`)} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>People & stages</h2>
        <div className={styles.row}>
          <PersonOi p={{ isr: 82, avatar: AVATAR }} />
          <OAvatarOrb src={AVATAR} isr={82} tier={{ n: 2 }} onOpen={() => toast('Standing')} />
          <StandChip c={{ tone: '#22C55E', isr: 82, format: 'Pool' }} />
          <div style={{ width: 120 }}>
            <Spark values={[4, 6, 5, 8, 7, 9, 11]} tone="#3A95F2" />
          </div>
          <StageRing size={96} index={stage} fill={0.5} tone="#22C55E" waiting>
            <b>{stage + 1}/5</b>
          </StageRing>
          <Button size="sm" tone="green" onClick={() => setStage((s) => (s + 1) % 5)}>
            Next stage
          </Button>
        </div>
        {first && <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>First fixture: {first.name} · {first.priceLabel} O {first.priceOs}</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Snapshot</h2>
        <SnapshotPanel
          boards={boards}
          pulse={pulse}
          board={board}
          onBoard={setBoard}
          onPick={(r) => toast(`Pick ${r.name}`)}
          onOpenSection={(s) => toast(`Open section ${s}`)}
          rail={
            <WhatWinsRail
              contexts={[
                { context: 'Circles', type: 'Pool', rate: 0.64, tone: '#22C55E' },
                { context: 'Feed', type: 'Drop', rate: 0.41, tone: '#D946EF' },
              ]}
            />
          }
        />
      </section>
    </>
  );
}
