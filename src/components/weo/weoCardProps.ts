import type { WeOCardProps } from '@/design-system';
import type { WeoCardModel } from '@/lib/cardModel';
import { compact } from '@/lib/format';
import { toast } from '@/stores/ui';

/** What a WeO surface can do. Pages pass what their module has wired; the rest stays hidden. */
export interface WeoHandlers {
  /** open the WeO's own page */
  onOpen: (w: WeoCardModel) => void;
  /** the collect flow (M04) */
  onCollect?: (w: WeoCardModel) => void;
  /** relist something you hold (M06) */
  onResell?: (w: WeoCardModel) => void;
  /** start a new WeO */
  onCreate?: () => void;
  /** push to a Circle (M05) */
  onPush?: (w: WeoCardModel) => void;
  /** rehearse in a world (M11) */
  onRehearse?: (w: WeoCardModel) => void;
}

/**
 * design: screens-hub.jsx weoCardProps — every preview of a WeO is the SAME DS WeOCard built
 * from the same props, so a WeO looks like itself wherever you meet it. The price is drawn at
 * rest by the host (WeoPriceAtRest), so `price` is null here.
 */
export function weoCardProps(w: WeoCardModel, h: WeoHandlers): WeOCardProps {
  return {
    name: w.name,
    typeLabel: `${w.type} · ${w.category}`,
    id: w.weoId ? `# ${w.weoId}` : undefined,
    tone: w.hex,
    fill: 'image',
    src: w.img,
    rarity: w.rarity,
    edition: w.edition,
    timer: w.timer,
    creator: {
      name: w.creator.handle,
      avatar: w.creator.avatarUrl,
      isr: w.creator.isr,
      summary: w.creator.bio || undefined,
      trades: w.creator.tradeCount,
      joined: w.creator.joined || undefined,
    },
    price: null,
    terms: w.terms,
    points: w.points,
    watchers: compact(w.watchers),
    likes: compact(w.likes),
    activeNow: w.activeNow,
    collectorCount: w.collectors,
    trend: w.trend ?? undefined,
    collected: w.collected,
    qrData: w.weoId,
    passport: { label: 'Verified original', resale: w.resalePct != null ? `${w.resalePct}%` : '—' },
    backTitle: w.name,
    backFacts: [
      { k: 'Format', v: w.type },
      { k: 'Context', v: w.category },
      { k: 'Collectors', v: w.collectors },
    ],
    engageLabel: w.live ? w.cta : 'Closed',
    onEngage: () => {
      if (!w.live) return toast(`${w.name} has closed`);
      return h.onCollect ? h.onCollect(w) : h.onOpen(w);
    },
    onResell: h.onResell ? () => h.onResell?.(w) : undefined,
    onCreate: h.onCreate,
  };
}
