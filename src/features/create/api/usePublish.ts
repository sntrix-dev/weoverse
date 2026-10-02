import { ApiError } from '@/api/client';
import { usePush } from '@/features/community/api/community';
import { toast } from '@/stores/ui';
import { buildPayload, type ComposerForm } from '../model/composer';
import { useDeleteDraft, usePostWeo, type PostedDto } from './create';

const why = (e: unknown) =>
  e instanceof ApiError ? (e.fieldErrors[0]?.message ?? e.message) : 'That did not go through — try again.';

/**
 * Post (or save an edit): the body built with the backend's peg, then — for a Circle — the push
 * that puts it into that circle (D-056), and the draft it came from removed.
 */
export function usePublish(opts: {
  usdAgainstO: number | undefined;
  creatorName: string;
  editId: string | null;
  draftId: string | null;
  onPosted?: () => void;
}) {
  const post = usePostWeo();
  const push = usePush();
  const drop = useDeleteDraft();
  const busy = post.isPending || push.isPending;

  const publish = async (
    f: ComposerForm,
    circleId: string | null,
    askId: string | null,
  ): Promise<PostedDto> => {
    if (!opts.usdAgainstO) {
      toast('Still reading the O rate — try again in a moment.');
      throw new Error('no peg');
    }
    let res: PostedDto;
    try {
      const payload = buildPayload(f, {
        usdAgainstO: opts.usdAgainstO,
        creatorName: opts.creatorName,
        requestedId: askId ?? undefined,
      });
      res = await post.mutateAsync({ payload, editId: opts.editId ?? undefined });
    } catch (e) {
      toast(why(e));
      throw e;
    }
    opts.onPosted?.();
    if (opts.draftId) drop.mutate(opts.draftId);
    if (circleId && res?._id) {
      try {
        await push.mutateAsync({
          weoId: res._id,
          question: f.title.trim().slice(0, 280),
          description: f.desc.trim(),
          circleId,
        });
      } catch {
        toast('It is live — the Circle push did not go through. Push it from Exchange.');
      }
    }
    return res;
  };
  return { publish, busy };
}
