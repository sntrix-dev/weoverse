/** One readout in the rail: a figure, or a verb you can press. */
export interface RailRow {
  k: string;
  v: string;
  note?: string;
  tone: string;
  rate?: number | null;
  onAct?: () => void;
}

/** design: exchange.jsx (from snapshot.jsx) SnapshotRail — the snapshot's right rail: same well, one readout per row. */
export function SnapshotRail({ title, rows, empty }: { title: string; rows: RailRow[]; empty?: string }) {
  return (
    <div style={{ borderRadius: 24, padding: 18, background: 'var(--surface-2)', boxShadow: 'var(--nm-inset)', minWidth: 0 }}>
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
        {title}
      </p>
      <div style={{ height: 14 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map((r, i) => (
          <div key={`${r.k}-${i}`}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.k}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: r.tone, whiteSpace: 'nowrap' }}>{r.note}</span>
              {r.onAct ? (
                <button
                  type="button"
                  onClick={r.onAct}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 999,
                    padding: '4px 10px',
                    font: 'inherit',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: r.tone,
                    boxShadow: `0 6px 14px -7px ${r.tone}`,
                  }}
                >
                  {r.v}
                </button>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                    width: 62,
                    textAlign: 'right',
                  }}
                >
                  {r.v}
                </span>
              )}
            </div>
            {r.rate != null && (
              <div style={{ marginTop: 5, height: 6, borderRadius: 999, background: 'var(--surface)', boxShadow: 'var(--nm-inset)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(r.rate * 100)}%`, height: '100%', borderRadius: 999, background: r.tone }} />
              </div>
            )}
          </div>
        ))}
        {!rows.length && empty && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-dim)' }}>{empty}</p>}
      </div>
    </div>
  );
}
