import { useMemo } from 'react';
import { ApiError } from '@/api/client';
import type { WeoCardModel } from '@/lib/cardModel';
import { useWeoHandlers } from '@/features/weo/useWeoHandlers';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { askAbout } from '@/stores/flow';
import { toast } from '@/stores/ui';
import { useCircleNotification, useFollow, useMembership } from './api/community';
import type { StewardModel } from './model/community';

const failed = (e: unknown, fallback: string) => toast(e instanceof ApiError ? e.message : fallback);

/** design `app.toggleJoin` / `toggleMute` / `toggleFollow` — the same toasts, on real writes. */
export function useCommunityActions() {
  const membership = useMembership();
  const notif = useCircleNotification();
  const follow = useFollow();
  return useMemo(
    () => ({
      toggleJoin: (c: { id: string; name: string; joined: boolean }) => {
        const will = !c.joined;
        membership.mutate(
          { id: c.id, join: will },
          {
            onSuccess: () => toast(will ? `Joined ${c.name}` : `Left ${c.name} · re-join anytime`),
            onError: (e) => failed(e, 'That did not go through — try again.'),
          },
        );
      },
      toggleMute: (c: { id: string; name: string; muted: boolean }) => {
        notif.mutate(
          { id: c.id, notification: c.muted ? 'all' : 'off' },
          {
            onSuccess: () => toast(c.muted ? `Unmuted ${c.name}` : `Muted ${c.name}`),
            onError: (e) => failed(e, 'That did not go through — try again.'),
          },
        );
      },
      toggleFollow: (s: StewardModel) => {
        const will = !s.following;
        follow.mutate(
          { userId: s.id, follow: will },
          {
            onSuccess: () => toast(will ? `Following ${s.name}` : `Unfollowed ${s.name}`),
            onError: (e) => failed(e, 'That did not go through — try again.'),
          },
        );
      },
    }),
    [membership, notif, follow],
  );
}

/** The signed-in member's id (the shell's one read). */
export function useMeId(): string | undefined {
  return useNavSummary().data?.id;
}

/**
 * WeO handlers inside a circle or a thread: a card's own button opens the push sheet aimed at
 * this circle (design `onEngage={() => app.openPush(w)}`).
 */
export function useCommunityWeoHandlers(circleId: string | null = null) {
  const h = useWeoHandlers();
  return useMemo(() => ({ h, engage: (w: WeoCardModel) => askAbout(w, circleId) }), [h, circleId]);
}
