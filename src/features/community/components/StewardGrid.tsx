import { Avatar, Button } from '@/design-system';
import type { StewardModel } from '../model/community';

/**
 * design: screens-more.jsx StewardGrid — the stewards, each with their circles, what they
 * made and answered, and Follow. Stewards are the top contributors (D-036).
 */
export function StewardGrid({
  list,
  limit,
  onFollow,
  onOpen,
}: {
  list: StewardModel[];
  limit?: number;
  onFollow: (s: StewardModel) => void;
  onOpen?: (s: StewardModel) => void;
}) {
  const shown = list.slice(0, limit || 99);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
      {shown.map((s, i) => (
        <div
          key={s.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 22,
            padding: '22px 18px',
            background: 'var(--surface)',
            boxShadow: 'var(--nm-raised), inset 0 0 0 1px var(--border)',
            animation: `weo-cardin .44s var(--ease-settle) ${i * 0.06}s both`,
          }}
        >
          <Avatar
            src={s.avatar}
            isr={s.isr}
            size={80}
            onClick={onOpen ? () => onOpen(s) : undefined}
            style={onOpen ? { cursor: 'pointer' } : undefined}
          />
          <span
            style={{
              marginTop: 10,
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--o-gold-ink)',
              background: 'color-mix(in srgb,var(--o-gold) 14%,var(--surface))',
            }}
          >
            Steward · {s.circles} Circles
          </span>
          <h3 style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{s.name}</h3>
          {s.bio && <p style={{ margin: '4px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--text-dim)' }}>{s.bio}</p>}
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
            {s.weos} WeOs · {s.answers} answers · {Math.round(s.accept * 100)}% accepted
          </p>
          {!s.you && (
            <Button
              size="sm"
              variant="ghost"
              tone="gold"
              selected={s.following}
              style={{ marginTop: 12 }}
              onClick={() => onFollow(s)}
            >
              {s.following ? '✓ Following' : 'Follow'}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
