// design: create.jsx AiDraft + CardAssist — Mya reads what the WeO already is (title, format,
// category) and offers lines you can take. Nothing is written into your field until you choose one.
import { useState } from 'react';
import { svg } from '@/design-system';
import { useDescribe } from '../api/create';
import type { LiveKind } from '../model/formats';
import { SPARK } from './icons';

interface DraftInput {
  title: string;
  kind: LiveKind | null;
  cat: string;
}

export function AiDraft({
  f,
  tone,
  onPick,
}: {
  f: DraftInput;
  tone: string;
  onPick: (line: string) => void;
}) {
  const describe = useDescribe();
  const [opts, setOpts] = useState<string[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const busy = describe.isPending;
  const can = f.title.trim().length > 2 && !!f.kind;
  const ask = () => {
    if (!can || busy || !f.kind) return;
    setErr(null);
    describe.mutate(
      { title: f.title.trim(), format: f.kind, ...(f.cat ? { category: f.cat } : {}) },
      {
        onSuccess: (d) =>
          d.lines.length ? setOpts(d.lines.slice(0, 3)) : setErr('Could not draft that — try again.'),
        onError: () => setErr('Could not draft that — try again.'),
      },
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <button
        type="button"
        onClick={ask}
        disabled={!can || busy}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          border: 'none',
          cursor: can && !busy ? 'pointer' : 'default',
          borderRadius: 999,
          padding: '8px 14px',
          font: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          color: can ? '#fff' : 'var(--text-faint)',
          background: can ? tone : 'var(--surface-2)',
          boxShadow: can ? `0 8px 18px -8px color-mix(in srgb, ${tone} 85%, transparent)` : 'var(--nm-inset)',
          opacity: busy ? 0.7 : 1,
        }}
      >
        {svg(SPARK, 15, 'currentColor', 1.8)}
        {busy ? 'Drafting…' : opts ? 'Draft again' : 'Ask Mya to draft it'}
      </button>
      {!can && (
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          Name it first — the draft reads the title and the format.
        </span>
      )}
      {err && <span style={{ fontSize: 11, color: 'var(--status-error)' }}>{err}</span>}
      {opts?.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => onPick(o)}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 9,
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
            borderRadius: 16,
            padding: '11px 13px',
            fontSize: 12.5,
            lineHeight: 1.5,
            color: 'var(--text)',
            background: 'var(--surface)',
            boxShadow: `var(--nm-sm), inset 0 0 0 1px color-mix(in srgb, ${tone} 26%, var(--border))`,
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
              width: 6,
              height: 6,
              marginTop: 6,
              borderRadius: '50%',
              background: tone,
            }}
          />
          <span style={{ minWidth: 0, flex: 1 }}>{o}</span>
          <span
            style={{
              flex: '0 0 auto',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: tone,
            }}
          >
            Use
          </span>
        </button>
      ))}
    </div>
  );
}

/** the same assist, on the card itself: one spark under the description; the drafts open inline */
export function CardAssist({
  f,
  tone,
  onPick,
}: {
  f: DraftInput;
  tone: string;
  onPick: (line: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const can = f.title.trim().length > 2;
  return (
    <div
      className="weo-quiet"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 6 }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={
          can
            ? 'Ask Mya to draft the description from the title, format and category'
            : 'Name it first — the draft reads the title'
        }
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          border: 'none',
          cursor: 'pointer',
          borderRadius: 999,
          padding: '5px 11px',
          font: 'inherit',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.06em',
          color: open ? '#fff' : can ? tone : 'var(--text-faint)',
          background: open ? tone : 'var(--surface)',
          boxShadow: open ? 'none' : 'var(--nm-sm), inset 0 0 0 1px var(--border)',
        }}
      >
        {svg(SPARK, 13, 'currentColor', 1.8)}
        {open ? 'Close' : 'Draft with Mya'}
      </button>
      {open && (
        <div style={{ width: '100%', maxWidth: 460, textAlign: 'left' }}>
          <AiDraft
            f={f}
            tone={tone}
            onPick={(v) => {
              onPick(v);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
