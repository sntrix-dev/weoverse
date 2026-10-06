import { useState } from 'react';
import { ApiError } from '@/api/client';
import { Sheet } from '@/components/feedback/Sheet';
import { Button } from '@/design-system';
import { SetLabel, SetSelect, setField } from '@/features/settings/components/SetParts';
import { useSettings } from '@/features/settings/api/settings';
import { ack, toast } from '@/stores/ui';
import { EXPERIENCE_LABEL, ROLE_LABEL, useCareersInterest, type CompanyPageDto } from '../api/company';

/**
 * Careers lists no openings (D-083): this is how you say what you would bring. It sends the
 * website's careers form — name and email from your account, a role, your experience and
 * a link — and nothing else.
 */
export function CareersSheet({
  apply,
  onClose,
}: {
  apply: NonNullable<CompanyPageDto['apply']>;
  onClose: () => void;
}) {
  const account = useSettings().data?.account;
  const send = useCareersInterest();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string>(apply.roles[0] ?? 'other');
  const [experience, setExperience] = useState<string>(apply.experience[0] ?? '0-2years');
  const [portfolio, setPortfolio] = useState('');
  const [err, setErr] = useState('');
  const nm = name ?? account?.name ?? '';
  const em = email ?? account?.email ?? '';

  const go = () => {
    if (!nm.trim()) return setErr('Add your name');
    if (!/^\S+@\S+\.\S+$/.test(em.trim())) return setErr('Add an email we can reach you at');
    if (portfolio && !/^https?:\/\//.test(portfolio.trim())) return setErr('A link starts with https://');
    send.mutate(
      { name: nm.trim(), email: em.trim(), role, experience, portfolio: portfolio.trim() },
      {
        onSuccess: () => {
          ack('Sent', 'var(--o-gold)');
          toast('Sent · we will reach out when a role fits');
          onClose();
        },
        onError: (e) => setErr(e instanceof ApiError ? e.message : 'That did not go through — try again.'),
      },
    );
  };

  return (
    <Sheet
      title="Tell us about you"
      sub={apply.note}
      w={480}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="ghost" tone="blue" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" selected tone="gold" onClick={go} disabled={send.isPending}>
            {send.isPending ? 'Sending…' : 'Send'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <SetLabel>Your name</SetLabel>
          <input
            value={nm}
            onChange={(e) => {
              setName(e.target.value);
              setErr('');
            }}
            autoComplete="name"
            maxLength={255}
            style={setField}
          />
        </label>
        <label>
          <SetLabel>Email</SetLabel>
          <input
            type="email"
            value={em}
            onChange={(e) => {
              setEmail(e.target.value);
              setErr('');
            }}
            autoComplete="email"
            maxLength={255}
            style={setField}
          />
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <SetLabel>What you do</SetLabel>
            <SetSelect
              label="What you do"
              value={role}
              onChange={setRole}
              options={apply.roles.map((r) => [r, ROLE_LABEL[r] ?? r] as [string, string])}
            />
          </div>
          <div>
            <SetLabel>Experience</SetLabel>
            <SetSelect
              label="Experience"
              value={experience}
              onChange={setExperience}
              options={apply.experience.map((x) => [x, EXPERIENCE_LABEL[x] ?? x] as [string, string])}
            />
          </div>
        </div>
        <label>
          <SetLabel>A link to your work (optional)</SetLabel>
          <input
            type="url"
            value={portfolio}
            onChange={(e) => {
              setPortfolio(e.target.value);
              setErr('');
            }}
            placeholder="https://"
            maxLength={500}
            style={setField}
          />
        </label>
        {err && (
          <span role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--weo-req,#FF5A2C)' }}>
            {err}
          </span>
        )}
      </div>
    </Sheet>
  );
}
