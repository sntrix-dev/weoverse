// design: settings.jsx DangerSheet — here a request a person confirms (D-070)
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { Sheet } from '@/components/feedback/Sheet';
import { Button } from '@/design-system';
import { toast } from '@/stores/ui';
import { useAccountRequest, type AccountRequestKind } from '../api/settings';
import { SetLabel, SetSelect, setField } from './SetParts';

const REASONS = [
  'Choose a reason',
  'Taking a break',
  'Too many notifications',
  'Privacy concerns',
  'Not finding what I need',
  'Made another account',
  'Something else',
];

/**
 * Deactivate or delete — recorded as a request on the account. Nothing is hidden or removed
 * by this sheet: a person from WeO confirms it with you first, and you can cancel it until then.
 * The confirm step is typing the word; sign-in (and its password) belongs to O-Wallet.
 */
export function AccountRequestSheet({
  kind,
  available,
  onExport,
  exporting,
  onClose,
}: {
  kind: AccountRequestKind;
  available: number | null;
  onExport: () => void;
  exporting: boolean;
  onClose: () => void;
}) {
  const del = kind === 'delete';
  const word = del ? 'DELETE' : 'DEACTIVATE';
  const [why, setWhy] = useState(REASONS[0]!);
  const [typed, setTyped] = useState('');
  const [err, setErr] = useState('');
  const req = useAccountRequest();
  const ok = typed.trim().toUpperCase() === word;
  const go = () => {
    if (!ok) {
      setErr(`Type ${word} to confirm`);
      return;
    }
    req.mutate(
      { kind, reason: why === REASONS[0] ? undefined : why },
      {
        onSuccess: () => {
          toast(
            del
              ? 'Deletion requested · we will confirm it with you first'
              : 'Deactivation requested · we will confirm it with you first',
          );
          onClose();
        },
        onError: (e) => setErr(e instanceof ApiError ? e.message : 'That did not go through — try again.'),
      },
    );
  };
  return (
    <Sheet
      title={del ? 'Delete your account' : 'Deactivate your account'}
      w={500}
      onClose={onClose}
      sub={
        del
          ? 'This asks us to delete your profile, unsold WeOs, Circle posts and passport. A person confirms it with you before anything is removed, and you can cancel until then. Receipts for past trades are kept where the law requires.'
          : 'This asks us to hide your profile and WeOs for a while. A person confirms it with you first; nothing changes until then, and you can cancel.'
      }
      footer={
        <>
          <Button size="sm" variant="ghost" tone="blue" onClick={onClose}>
            Keep my account
          </Button>
          <Button size="sm" variant="primary" selected tone="danger" onClick={go} disabled={req.isPending}>
            {req.isPending ? 'Sending…' : del ? 'Request deletion' : 'Request deactivation'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <SetLabel>Why are you leaving? (optional)</SetLabel>
          <SetSelect label="Why are you leaving?" value={why} onChange={setWhy} options={REASONS} />
        </div>
        <label>
          <SetLabel>Type {word} to confirm</SetLabel>
          <input
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setErr('');
            }}
            autoComplete="off"
            style={{ ...setField, letterSpacing: '.1em' }}
          />
        </label>
        {del && available != null && available > 0 && (
          <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-dim)' }}>
            You still hold O {available.toLocaleString('en-US')} available. Move or spend it first.
          </span>
        )}
        {del && (
          <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-dim)' }}>
            Want your things first?{' '}
            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                font: 'inherit',
                fontWeight: 600,
                color: 'var(--o-violet)',
              }}
            >
              {exporting ? 'Preparing…' : 'Download your data'}
            </button>
          </span>
        )}
        {err && (
          <span role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--weo-req,#FF5A2C)' }}>
            {err}
          </span>
        )}
      </div>
    </Sheet>
  );
}
