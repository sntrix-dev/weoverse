import { Avatar, OMark } from '@/design-system';
import type { ShellMe } from '@/features/shell/model/me';
import { osFmt } from '@/lib/format';
import { closeId, openId, useUi } from '@/stores/ui';
import s from './WalletMenu.module.css';

/**
 * design: chrome.jsx WalletMenu — one control on the right: your Os, your tier and your face.
 * The balance is not a second button — it rides in the passport pill it opens.
 */
export function WalletMenu({ me }: { me: ShellMe | undefined }) {
  const open = useUi((u) => u.idSheet);
  const t = me?.tier ?? null;
  return (
    <span data-idmenu className={s.root}>
      <button
        type="button"
        onClick={() => (open ? closeId() : openId())}
        aria-expanded={open}
        aria-label="Your Os, your tier and your passport"
        title={`Your Os, your tier and your passport · ${me?.handle ?? ''}`}
        className={s.pill}
        data-open={open || undefined}
      >
        <OMark size={13} /> {me ? osFmt(me.available) : '—'}
        {t && (
          <span title={`Tier ${t.rank} · ${t.label}`} className={s.tierDot} style={{ background: t.tone }} />
        )}
        <Avatar src={me?.avatarUrl} initials={me?.initials} isr={me?.isr} size={34} />
      </button>
    </span>
  );
}
