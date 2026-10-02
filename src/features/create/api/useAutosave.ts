import { useEffect, useRef, useState } from 'react';
import { draftBody, worthSaving, type ComposerForm } from '../model/composer';
import { useSaveDraft, type DraftWrite } from './create';

/** How long the composer must be quiet before the write goes out. */
export const QUIET_MS = 2500;

/**
 * The composer, saved without being asked: a few seconds after it goes quiet, and once more on
 * the way out. Nothing is written until it holds something a person typed or chose. `enabled` is
 * false while editing a live WeO and once the WeO has been posted.
 */
export function useAutosave(f: ComposerForm, enabled: boolean, initialId: string | null) {
  const save = useSaveDraft();
  const [id, setId] = useState<string | null>(initialId);
  const idRef = useRef<string | null>(initialId);
  const sent = useRef<string>('');
  const pending = useRef<DraftWrite | null>(null);
  const inFlight = useRef(false);

  const flush = () => {
    const body = pending.current;
    if (!body || inFlight.current) return;
    pending.current = null;
    inFlight.current = true;
    save.mutate(
      { id: idRef.current, body },
      {
        onSuccess: (d) => {
          if (!idRef.current && d?._id) {
            idRef.current = d._id;
            setId(d._id);
          }
        },
        onSettled: () => {
          inFlight.current = false;
          if (pending.current) flush();
        },
      },
    );
  };

  useEffect(() => {
    if (!enabled || !worthSaving(f)) return;
    const body = draftBody(f) as DraftWrite;
    const key = JSON.stringify(body);
    if (key === sent.current) return;
    const t = setTimeout(() => {
      sent.current = key;
      pending.current = body;
      flush();
    }, QUIET_MS);
    return () => clearTimeout(t);
    // flush is stable enough: it reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, enabled]);

  // on the way out: whatever is newer than the last write
  const latest = useRef({ f, enabled });
  useEffect(() => {
    latest.current = { f, enabled };
  });
  useEffect(
    () => () => {
      const { f: last, enabled: on } = latest.current;
      if (!on || !worthSaving(last)) return;
      const body = draftBody(last) as DraftWrite;
      if (JSON.stringify(body) === sent.current) return;
      pending.current = body;
      flush();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** stop saving (posted): drop anything queued */
  const stop = () => {
    pending.current = null;
    sent.current = '';
  };
  return { id, stop };
}
