import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { OWalletPanel, type MovePerson } from '@/components/wallet/OWalletPanel';
import { useCreators } from '@/features/discover/api/discover';
import { useHoldingFaces, useMoveOs, useWalletView } from '@/features/wallet/api/wallet';
import { osFmt } from '@/lib/format';
import { ack, toast } from '@/stores/ui';
import { useMeId } from '../useCommunity';

/** The hub's Wallet row: the O-Wallet panel on the real wallet read (D-038). */
export function WalletRow() {
  const navigate = useNavigate();
  const me = useMeId();
  const wallet = useWalletView();
  const faces = useHoldingFaces(3);
  const creators = useCreators(6);
  const move = useMoveOs();
  // design: the first five creators are who you can move Os to
  const people: MovePerson[] = useMemo(
    () =>
      (creators.data?.items ?? [])
        .filter((c) => c.id !== me)
        .slice(0, 5)
        .map((c) => ({ id: c.id, name: c.name, avatar: c.avatarUrl })),
    [creators.data, me],
  );
  const w = wallet.data;
  if (!w) {
    return (
      <p style={{ margin: 0, padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
        {wallet.isError ? 'The wallet did not load.' : 'Opening your wallet…'}
      </p>
    );
  }
  return (
    <OWalletPanel
      wallet={w.balance}
      power={w.power}
      holdings={w.holdings}
      faces={faces.data ?? []}
      people={people}
      onCollected={() => void navigate(routes.collected())}
      onListed={() => void navigate(routes.listed())}
      onMove={async (to, os) => {
        try {
          await move.mutateAsync({ toUserId: to.id, amount: os });
          ack(`Moved to ${to.name}`, 'var(--o-green)');
          toast(`Moved · O ${osFmt(os)} to ${to.name}`);
        } catch (e) {
          toast(e instanceof ApiError ? e.message : 'That did not go through. Nothing moved — try again.');
          throw e;
        }
      }}
    />
  );
}
