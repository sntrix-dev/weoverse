import { useEffect, useState, type ReactNode } from 'react';
import { Button, Card, Chip, Icon, ISRRing, OMark, OPower, PassportIcon } from '@/design-system';
import type { ShellMe } from '@/features/shell/model/me';
import { osFmt } from '@/lib/format';
import { closeId } from '@/stores/ui';
import { CopyBtn } from './CopyBtn';
import s from './IdSheet.module.css';

export interface IdSheetProps {
  me: ShellMe;
  onWallet: () => void;
  onSettings: () => void;
  onPassport: () => void;
  onLogout: () => void;
}

const SETTINGS_ICON = (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.7-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21.4 11a2 2 0 1 1 0 4z" />
  </>
);

/**
 * design: chrome.jsx WeOverseIdSheet — the passport dropdown: identity and balance as ONE
 * unit. Anchored to the avatar, no scrim — a menu, not a modal. Balance left with the
 * buckets one tap away; the credential right.
 */
export function IdSheet({ me, onWallet, onSettings, onPassport, onLogout }: IdSheetProps) {
  const [buckets, setBuckets] = useState(false);
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.('[data-idmenu]')) closeId();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeId();
    };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, []);
  const t = me.tier;
  const rows = [
    { k: 'Collected', v: me.counts.collected, note: 'WeOs held' },
    { k: 'Created', v: me.counts.created, note: 'WeOs' },
    { k: 'Circles', v: me.counts.circles, note: 'joined' },
    { k: 'Campaigns', v: me.counts.campaigns, note: 'run' },
  ];
  // the design's four buckets; the backend has only the spendable one so far (gap G-25)
  const BUCKETS: [string, string, string, number | null][] = [
    ['available', 'Available', 'var(--o-green)', me.available],
    ['protected', 'Protected', 'var(--o-blue)', null],
    ['pending', 'Pending', 'var(--o-gold)', null],
    ['locked', 'Locked', 'var(--text-faint)', null],
  ];
  const utilities: { k: string; label: string; icon: ReactNode; onClick: () => void }[] = [
    { k: 'set', label: 'Settings', icon: SETTINGS_ICON, onClick: onSettings },
  ];
  return (
    <div data-idmenu className={`weo-menu ${s.sheet}`} role="dialog" aria-label="Your passport">
      <div className={s.grid}>
        {/* balance — one unit, buckets on demand */}
        <Card
          elevation="inset"
          radius={22}
          padding={15}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <span className={s.eyebrow}>Available to spend</span>
          <span className={s.balance}>
            <OMark size={16} /> {osFmt(me.available)}
          </span>
          {t && (
            <Chip dot tone={t.tone}>
              {`Tier ${t.rank} · ${t.label}`}
            </Chip>
          )}
          <button
            type="button"
            onClick={() => setBuckets((b) => !b)}
            aria-expanded={buckets}
            className={s.bucketsToggle}
          >
            {buckets ? 'Hide buckets' : 'Show buckets'}
            <span className={s.chev} data-open={buckets || undefined}>
              <Icon size={13} sw={2}>
                <polyline points="6 9 12 15 18 9" />
              </Icon>
            </span>
          </button>
          {buckets && (
            /* the four buckets, sized for this column: label left (never under the figure), figure right */
            <div className={`weo-osonly ${s.buckets}`}>
              {BUCKETS.filter(([, , , v]) => v != null).map(([k, label, c, v]) => (
                <div key={k} className={s.bucket}>
                  <span className={s.bucketDot} style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                  <span className={s.bucketLabel}>{label}</span>
                  <span className={s.bucketValue}>
                    <OMark size={10} />
                    {osFmt(v ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <span className={s.priced}>Priced in Os</span>
          <div className={s.walletRow}>
            <Button
              size="sm"
              variant="primary"
              tone="gold"
              onClick={() => {
                closeId();
                onWallet();
              }}
            >
              O-Wallet
            </Button>
          </div>
        </Card>

        {/* the credential */}
        <div className={s.credential}>
          <div className={s.who}>
            <div className={s.ring}>
              <ISRRing value={me.isr} size={74} showStage={false} showValue={false} />
              <span
                className={s.face}
                style={{
                  background: me.avatarUrl
                    ? `url('${me.avatarUrl}') center/cover, var(--surface-2)`
                    : 'var(--surface-2)',
                }}
              >
                {!me.avatarUrl && <span className={s.initials}>{me.initials}</span>}
              </span>
            </div>
            <div className={s.whoText}>
              <h3 className={s.name}>{me.name}</h3>
              <p className={s.handle}>
                {me.handle}
                {me.joined && ` · joined ${me.joined}`}
              </p>
              <p className={s.isr} style={{ color: me.isrColor }}>
                ISR {me.isr} · {me.isrLabel.toUpperCase()}
              </p>
            </div>
          </div>
          {me.weoId && (
            <div className={s.idRow}>
              <PassportIcon size={18} color="var(--text-faint)" />
              <span className={s.weoId}># {me.weoId}</span>
              <CopyBtn text={me.weoId} what="Your WeO ID" size={26} />
              {me.verified && (
                <span title="Verified original" className={s.verified}>
                  Verified
                </span>
              )}
            </div>
          )}
          <div className={s.rows}>
            {rows.map((r) => (
              <div key={r.k} className={s.row}>
                <span className={s.rowKey}>{r.k}</span>
                <span className={s.rowValue}>{r.v}</span>
                <span className={s.rowNote}>{r.note}</span>
              </div>
            ))}
          </div>
          <div className={s.utilRow}>
            {me.power != null && (
              <span title="What one O buys in this network" className={s.power}>
                O Power <OPower power={me.power} format="inline" size={11} />
              </span>
            )}
            <div className={s.utils}>
              {/* one CTA carries the weight; the utilities are icons that name themselves on hover */}
              {utilities.map((u) => (
                <button
                  key={u.k}
                  type="button"
                  onClick={() => {
                    closeId();
                    u.onClick();
                  }}
                  aria-label={u.label}
                  title={u.label}
                  className={s.util}
                >
                  <Icon size={16} sw={1.7}>
                    {u.icon}
                  </Icon>
                </button>
              ))}
            </div>
          </div>
          {/* the one CTA gets its own full-width row, so nothing wraps under it */}
          <Button
            size="sm"
            variant="primary"
            tone="blue"
            style={{ width: '100%' }}
            onClick={() => {
              closeId();
              onPassport();
            }}
          >
            Open your passport
          </Button>
        </div>
      </div>
      {/* NAV-06: leaving is its own row, apart from everything else */}
      <div className={s.leave}>
        <button
          type="button"
          onClick={() => {
            closeId();
            onLogout();
          }}
          className={s.logout}
        >
          <Icon size={15} sw={1.7}>
            <path d="M14 5h3.5A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5H14" />
            <path d="M10 8l-4 4 4 4M6 12h9" />
          </Icon>{' '}
          Log out
        </button>
      </div>
    </div>
  );
}
