import { useEffect, useState } from 'react';
import { Button, Chip, Icon, ISRRing, OMark, OPower, PassportIcon } from '@/design-system';
import type { ShellMe } from '@/features/shell/model/me';
import { osFmt } from '@/lib/format';
import { closeId } from '@/stores/ui';
import { CopyBtn } from './CopyBtn';
import s from './IdSheet.module.css';
import { cssUrl } from '@/lib/cssUrl';

export interface IdSheetProps {
  me: ShellMe;
  onWallet: () => void;
  onSettings: () => void;
  onPassport: () => void;
  onLogout: () => void;
}

/**
 * The passport number in the design's short form (`# WEO-223FEE`): `WEO-` and the last six of
 * the O-Wallet id, upper-case. The full id is the title and is what the copy button copies.
 */
export const shortWeoId = (id: string) =>
  /^[0-9a-f]{24}$/i.test(id) ? `WEO-${id.slice(-6).toUpperCase()}` : id;

const SETTINGS_ICON = (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.7-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21.4 11a2 2 0 1 1 0 4z" />
  </>
);

/**
 * design: chrome.jsx WeOverseIdSheet (v4) — the passport dropdown, one column: who you are
 * (settings one tap away), your ID, the balance with the O-Wallet beside it and the buckets on
 * demand, four activity tiles, the passport, then O Power and Log out. Anchored to the avatar,
 * no scrim — a menu, not a modal.
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
    { k: 'Collected', v: me.counts.collected },
    { k: 'Created', v: me.counts.created },
    { k: 'Circles', v: me.counts.circles },
    { k: 'Campaigns', v: me.counts.campaigns },
  ];
  // the design's four buckets; the backend has only the spendable one so far (gap G-25)
  const BUCKETS: [string, string, string, number | null][] = [
    ['available', 'Available', 'var(--o-green)', me.available],
    ['protected', 'Protected', 'var(--o-blue)', null],
    ['pending', 'Pending', 'var(--o-gold)', null],
    ['locked', 'Locked', 'var(--text-faint)', null],
  ];
  const then = (fn: () => void) => () => {
    closeId();
    fn();
  };
  return (
    <div data-idmenu className={`weo-menu ${s.sheet}`} role="dialog" aria-label="Your passport">
      {/* who you are */}
      <div className={s.who}>
        <div className={s.ring}>
          <ISRRing value={me.isr} size={68} showStage={false} showValue={false} />
          <span
            className={s.face}
            style={{
              background: me.avatarUrl
                ? `${cssUrl(me.avatarUrl)} center/cover, var(--surface-2)`
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
        <button
          type="button"
          onClick={then(onSettings)}
          aria-label="Settings"
          title="Settings"
          className={s.util}
        >
          <Icon size={16} sw={1.7}>
            {SETTINGS_ICON}
          </Icon>
        </button>
      </div>

      {/* ID */}
      {me.weoId && (
        <div className={s.idRow}>
          <PassportIcon size={18} color="var(--text-faint)" />
          <span className={s.weoId} title={me.weoId}>
            # {shortWeoId(me.weoId)}
          </span>
          <CopyBtn text={me.weoId} what="Your WeO ID" size={26} />
          {me.verified && (
            <span title="Verified original" className={s.verified}>
              Verified
            </span>
          )}
        </div>
      )}

      {/* balance: the figure leads, the wallet is one tap away, buckets on demand */}
      <div className={s.balanceCard}>
        <div className={s.balanceTop}>
          <div className={s.balanceText}>
            <span className={s.eyebrow}>Available to spend</span>
            <span className={s.balance}>
              <OMark size={18} /> {osFmt(me.available)}
            </span>
          </div>
          <Button size="sm" variant="primary" tone="gold" onClick={then(onWallet)}>
            O-Wallet
          </Button>
        </div>
        <div className={s.balanceMeta}>
          {t && (
            <span className={s.tier}>
              <Chip dot tone={t.tone}>
                {`Tier ${t.rank} · ${t.label}`}
              </Chip>
            </span>
          )}
          <span className={s.priced}>Priced in Os</span>
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
        </div>
        {buckets && (
          <div className={`weo-osonly ${s.buckets}`}>
            {BUCKETS.filter(([, , , v]) => v != null).map(([k, label, c, v]) => (
              <div key={k} className={s.bucket}>
                <span className={s.bucketLabel}>
                  <span className={s.bucketDot} style={{ background: c }} />
                  {label}
                </span>
                <span className={s.bucketValue}>
                  <OMark size={11} />
                  {osFmt(v ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* activity at a glance */}
      <div className={s.stats}>
        {rows.map((r) => (
          <div key={r.k} className={s.stat}>
            <b className={s.statValue}>{r.v}</b>
            <span className={s.statKey}>{r.k}</span>
          </div>
        ))}
      </div>

      {/* the one CTA, then what one O buys */}
      <Button size="sm" variant="primary" tone="blue" style={{ width: '100%' }} onClick={then(onPassport)}>
        Open your passport
      </Button>
      <div className={s.foot}>
        {me.power != null ? (
          <span title="What one O buys in this network" className={s.power}>
            O Power <OPower power={me.power} format="inline" size={11} />
          </span>
        ) : (
          <span />
        )}
        <button type="button" onClick={then(onLogout)} className={s.logout}>
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
