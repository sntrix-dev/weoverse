import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { routes } from '@/app/routes';
import { CopyBtn } from '@/components/shell/CopyBtn';
import { PathBar } from '@/components/shell/PathBar';
import { Badge, Button, OMark, svg, Toggle } from '@/design-system';
import { usePassport, useUpdatePublicProfile } from '@/features/passport/api/passport';
import { EditProfileSheet } from '@/features/passport/components/PassportSheets';
import { useLogout } from '@/features/shell/useLogout';
import { useWalletView } from '@/features/wallet/api/wallet';
import { osFmt } from '@/lib/format';
import { glide } from '@/lib/glide';
import { setPrefs, usePref } from '@/stores/prefs';
import { openDock, openExternal, setMyaHidden, toast } from '@/stores/ui';
import {
  useCancelAccountRequest,
  useExportData,
  useSettings,
  useUpdateSettings,
  type AccountRequestKind,
  type Channel,
  type ChannelGroup,
  type SettingsDto,
  type SettingsPatch,
} from '../api/settings';
import { AccountRequestSheet } from '../components/AccountRequestSheet';
import { SetCard, SetRow, SetSeg, SetSelect, setField } from '../components/SetParts';
import { resetTours } from '@/stores/intro';

const SECTIONS: { id: string; label: string; icon: ReactNode; tone?: string }[] = [
  {
    id: 'account',
    label: 'Account',
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.6" />
        <path d="M5 19.5c1.4-3.4 4-5 7-5s5.6 1.6 7 5" />
      </>
    ),
  },
  {
    id: 'security',
    label: 'Sign-in & security',
    icon: (
      <>
        <rect x="5" y="10.5" width="14" height="9.5" rx="2.4" />
        <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
      </>
    ),
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: <path d="M12 3.6l7 2.8v5.2c0 4.3-3 7.6-7 8.8-4-1.2-7-4.5-7-8.8V6.4z" />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <>
        <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z" />
        <path d="M10.2 20.2a2 2 0 0 0 3.6 0" />
      </>
    ),
  },
  {
    id: 'wallet',
    label: 'Wallet & payments',
    icon: (
      <>
        <rect x="3.6" y="6" width="16.8" height="12.6" rx="2.6" />
        <path d="M16 12.3h2.4" />
      </>
    ),
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: (
      <>
        <circle cx="12" cy="12" r="7.6" />
        <path d="M12 4.4v15.2" />
      </>
    ),
  },
  {
    id: 'apps',
    label: 'Connected apps',
    icon: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="7" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="13" width="7" height="7" rx="2" />
      </>
    ),
  },
  {
    id: 'data',
    label: 'Your data',
    icon: (
      <>
        <ellipse cx="12" cy="6.5" rx="6.6" ry="2.6" />
        <path d="M5.4 6.5v11c0 1.4 3 2.6 6.6 2.6s6.6-1.2 6.6-2.6v-11" />
        <path d="M5.4 12c0 1.4 3 2.6 6.6 2.6s6.6-1.2 6.6-2.6" />
      </>
    ),
  },
  {
    id: 'help',
    label: 'Help & legal',
    icon: (
      <>
        <circle cx="12" cy="12" r="8.2" />
        <path d="M9.8 9.6a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1.9-1.1 1.7" />
        <circle cx="12" cy="16.6" r=".6" fill="currentColor" />
      </>
    ),
  },
  {
    id: 'danger',
    label: 'Deactivate or delete',
    tone: 'var(--weo-req, #FF5A2C)',
    icon: (
      <>
        <path d="M12 4l8.6 15H3.4z" />
        <path d="M12 10v4" />
        <circle cx="12" cy="16.8" r=".6" fill="currentColor" />
      </>
    ),
  },
];

const CATS: [ChannelGroup, string, string][] = [
  ['sales', 'Collects & sales', 'Someone collects, pledges to or pays for your WeO'],
  ['bids', 'Bids & offers', 'New bids, being outbid, offers on your requests'],
  ['circles', 'Circle activity', 'New posts and events in Circles you joined'],
  ['mentions', 'Mentions & replies', 'Someone mentions you or answers you'],
  ['mya', 'Tips from Mya', 'Suggestions for what to do next'],
  ['news', 'WeOverse news', 'New features and announcements'],
  ['security', 'Security alerts', 'New sign-ins and account changes — always on by email'],
];
const CHANNELS: [Channel, string][] = [
  ['app', 'In app'],
  ['email', 'Email'],
  ['push', 'Push'],
];

const page: CSSProperties = {
  maxWidth: 'var(--page-w)',
  margin: '0 auto',
  padding: 'clamp(18px,2.6vw,32px) clamp(16px,2.4vw,28px) 190px',
  animation: 'weo-cardin .5s var(--ease-portal) both',
};
const field = (w: number): CSSProperties => ({ ...setField, width: w, height: 38 });

/** Every IANA zone the browser knows, with the one saved and the one you are in. */
function useTimeZones(current: string | undefined) {
  return useMemo(() => {
    const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    const all = sv ? sv('timeZone') : [];
    const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const set = new Set(['UTC', ...all]);
    if (here) set.add(here);
    if (current) set.add(current);
    return [...set];
  }, [current]);
}

/** design: scrollIntoView, through the app's own glide (a native smooth scroll is cut short here) */
function toSection(id: string) {
  const el = document.getElementById(`set-${id}`);
  if (el) glide(window, el.getBoundingClientRect().top + window.scrollY - 130);
}

/** The section you are reading lights its place in the rail. */
function useActiveSection(ready: boolean) {
  const [active, setActive] = useState(() => window.location.hash.replace(/^#/, '') || 'account');
  useEffect(() => {
    if (!ready) return;
    const want = window.location.hash.replace(/^#/, '');
    if (want) {
      setTimeout(() => toSection(want), 300);
    }
    if (typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.getAttribute('data-set-section') || 'account');
        }),
      { rootMargin: '-35% 0px -60% 0px' },
    );
    document.querySelectorAll('[data-set-section]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ready]);
  const jumpTo = (id: string) => {
    setActive(id);
    toSection(id);
  };
  return { active, jumpTo };
}

/** design: settings.jsx SettingsScreen — everything an account needs in one place. */
export function SettingsPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const update = useUpdateSettings();
  const passport = usePassport();
  const pubUpd = useUpdatePublicProfile();
  const wallet = useWalletView();
  const exporter = useExportData();
  const cancelReq = useCancelAccountRequest();
  const logout = useLogout();
  const theme = usePref('theme');
  const home = usePref('home');
  const navMode = usePref('navMode');
  const myaHidden = usePref('myaHidden');
  const motion = usePref('motion');
  const [sheet, setSheet] = useState<null | 'profile' | AccountRequestKind>(null);
  const s = settings.data;
  const p = passport.data;
  const zones = useTimeZones(s?.timezone);
  const { active, jumpTo } = useActiveSection(!!s);

  const save = (patch: SettingsPatch, done?: string) =>
    update.mutate(patch, {
      onSuccess: () => done && toast(done),
      onError: () => toast('That did not save — try again'),
    });
  const setN = (g: ChannelGroup, ch: Channel, v: boolean) =>
    save({ notifications: { channels: { [g]: { [ch]: v } } } });
  const setPub = (patch: Parameters<typeof pubUpd.mutate>[0]) =>
    pubUpd.mutate(patch, { onError: () => toast('That did not save — try again') });
  const T = (on: boolean, fn: (v: boolean) => void, label: string, tone?: string) => (
    <Toggle checked={on} onChange={fn} tone={tone || '#3A95F2'} aria-label={label} />
  );
  const btn = (
    label: string,
    onClick: () => void,
    tone: 'blue' | 'violet' | 'green' | 'gold' = 'blue',
    disabled?: boolean,
  ) => (
    <Button size="sm" variant="ghost" tone={tone} onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
  const toWallet = (what: string) =>
    openExternal({
      label: 'Your O-Wallet account',
      eyebrow: 'Sign-in lives in O-Wallet',
      note: `${what} belong to your O-Wallet account, which every WeO app signs in with. It opens in a new tab.`,
      cta: 'Open O-Wallet',
      tone: 'gold',
      url: s?.account.manageUrl,
    });
  const doExport = () =>
    exporter.mutate(undefined, {
      onSuccess: () => toast('Your data is downloading'),
      onError: () => toast('The export did not go through — try again'),
    });

  return (
    <main style={page}>
      <PathBar
        onHub={() => void navigate(routes.hub())}
        items={[
          { label: 'WeOverse', onClick: () => void navigate(routes.discover()) },
          { label: 'Settings' },
        ]}
      />
      <h1
        style={{
          margin: '6px 0 0',
          fontSize: 'clamp(28px,3.6vw,40px)',
          fontWeight: 700,
          letterSpacing: '-.035em',
          color: 'var(--text)',
        }}
      >
        Settings
      </h1>
      <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-dim)' }}>
        Your account, sign-in, privacy and everything else — in one place.
      </p>

      {!s ? (
        <p style={{ margin: '60px 0', textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>
          {settings.isError
            ? 'Your settings did not load — try again in a moment.'
            : 'Opening your settings…'}
        </p>
      ) : (
        <div
          className="weo-settings-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '240px minmax(0,1fr)',
            gap: 'clamp(18px,2.4vw,32px)',
            alignItems: 'start',
            marginTop: 24,
          }}
        >
          <nav
            aria-label="Settings sections"
            className="weo-settings-nav"
            style={{
              position: 'sticky',
              top: 130,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              padding: 8,
              borderRadius: 24,
              background: 'var(--surface)',
              boxShadow: 'var(--nm-sm), inset 0 0 0 1px var(--border)',
            }}
          >
            {SECTIONS.map((sec) => {
              const on = active === sec.id;
              return (
                <button
                  type="button"
                  key={sec.id}
                  onClick={() => jumpTo(sec.id)}
                  aria-current={on ? 'true' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 13,
                    fontWeight: on ? 700 : 500,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    color: sec.tone || (on ? 'var(--text)' : 'var(--text-dim)'),
                    background: on ? 'var(--surface-2)' : 'transparent',
                    boxShadow: on ? 'var(--nm-inset)' : 'none',
                  }}
                >
                  {svg(sec.icon, 16, 'currentColor', 1.7)}
                  {sec.label}
                </button>
              );
            })}
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <SetCard id="account" title="Account" sub="How you appear, and how we reach you.">
              <SetRow label="Profile" note={`${s.account.name} · ${s.account.handle}`}>
                <span
                  aria-hidden
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: p?.identity.avatarUrl
                      ? `url('${p.identity.avatarUrl}') center/cover, var(--surface-2)`
                      : 'var(--surface-2)',
                    boxShadow: 'var(--nm-sm)',
                  }}
                />
                {btn('Change photo', () => setSheet('profile'), 'blue', !p)}
                {btn('Edit profile', () => void navigate(routes.passport()))}
              </SetRow>
              <SetRow label="Display name" note={s.account.name}>
                {btn('Edit', () => setSheet('profile'), 'blue', !p)}
              </SetRow>
              <SetRow label="Username" note={s.account.handle}>
                {btn('Change', () => setSheet('profile'), 'blue', !p)}
              </SetRow>
              <SetRow label="Email" note={s.account.email ?? 'Not set'}>
                {btn('Change', () => toWallet('Your email, phone and password'))}
              </SetRow>
              <SetRow label="Phone" note={s.account.phone ?? 'Not set'}>
                {btn(s.account.phone ? 'Change' : 'Add', () => toWallet('Your email, phone and password'))}
              </SetRow>
              {s.account.passportId && (
                <SetRow label="WeO ID" note="Your ID across every WeO app">
                  <code
                    style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', color: 'var(--text)' }}
                  >
                    # {s.account.passportId}
                  </code>
                  <CopyBtn text={s.account.passportId} what="WeO ID" />
                </SetRow>
              )}
              <SetRow label="Time zone" note="Quiet hours follow it" last>
                <SetSelect
                  label="Time zone"
                  value={s.timezone}
                  onChange={(v) => save({ timezone: v }, `Time zone · ${v}`)}
                  options={zones}
                />
              </SetRow>
            </SetCard>

            <SetCard id="security" title="Sign-in & security" sub="Keep your Os and your passport yours.">
              <SetRow label="Password" note="Set and changed in your O-Wallet account">
                {btn('Change password', () => toWallet('Your password, email and phone'))}
              </SetRow>
              <SetRow label="Sign-in alerts" note="O-Wallet emails you when a new device signs in" last>
                {btn('Manage', () => toWallet('Sign-in alerts'), 'violet')}
              </SetRow>
            </SetCard>

            <SetCard
              id="privacy"
              title="Privacy"
              sub="What your public profile shows, and who can reach you."
            >
              <SetRow label="Show my collections" note="WeOs you hold appear on your public profile">
                {p
                  ? T(p.publicProfile.collections, (v) => setPub({ collections: v }), 'Show my collections')
                  : null}
              </SetRow>
              <SetRow label="Show my activity" note="Threads you ask and answer are listed">
                {p ? T(p.publicProfile.activity, (v) => setPub({ activity: v }), 'Show my activity') : null}
              </SetRow>
              <SetRow label="Circle invites" note="Let people invite you to Circles">
                {p ? T(p.publicProfile.invites, (v) => setPub({ invites: v }), 'Circle invites') : null}
              </SetRow>
              <SetRow label="Who can reach you">
                {p && (
                  <SetSeg
                    label="Who can reach you"
                    value={p.publicProfile.contact}
                    onChange={(v) => setPub({ contact: v })}
                    tone="var(--o-blue)"
                    options={[
                      ['anyone', 'Anyone'],
                      ['circles', 'Shared Circles'],
                      ['off', 'Nobody'],
                    ]}
                  />
                )}
              </SetRow>
              <SetRow
                label="Your ISR and tier"
                note="Always public — they are what other people are trusting when they deal with you"
                last
              >
                <Badge variant="status" tone="var(--text-faint)">
                  Public
                </Badge>
              </SetRow>
            </SetCard>

            <SetCard
              id="notifications"
              title="Notifications"
              sub={
                s.notifications.emailDelivery
                  ? 'Choose what you hear about, and where.'
                  : 'Choose what you hear about, and where. In app and Push apply now; email is not sent yet — your email choices, the digest and receipts are saved for when it is.'
              }
            >
              <NotifyMatrix s={s} onSet={setN} />
              <SetRow label="Email digest" note="A summary instead of one email each">
                <SetSeg
                  label="Email digest"
                  value={s.notifications.digest}
                  onChange={(v) => save({ notifications: { digest: v } })}
                  options={[
                    ['off', 'Off'],
                    ['daily', 'Daily'],
                    ['weekly', 'Weekly'],
                  ]}
                />
              </SetRow>
              <SetRow
                label="Quiet hours"
                note={
                  s.notifications.quiet.on
                    ? `No push notifications ${s.notifications.quiet.from}–${s.notifications.quiet.to} · ${s.timezone}`
                    : 'Push notifications any time'
                }
                last
              >
                {s.notifications.quiet.on && (
                  <>
                    <input
                      type="time"
                      aria-label="Quiet from"
                      value={s.notifications.quiet.from}
                      onChange={(e) =>
                        e.target.value && save({ notifications: { quiet: { from: e.target.value } } })
                      }
                      style={field(124)}
                    />
                    <span style={{ color: 'var(--text-faint)' }}>to</span>
                    <input
                      type="time"
                      aria-label="Quiet until"
                      value={s.notifications.quiet.to}
                      onChange={(e) =>
                        e.target.value && save({ notifications: { quiet: { to: e.target.value } } })
                      }
                      style={field(124)}
                    />
                  </>
                )}
                {T(
                  s.notifications.quiet.on,
                  (v) => save({ notifications: { quiet: { on: v } } }),
                  'Quiet hours',
                )}
              </SetRow>
            </SetCard>

            <SetCard
              id="wallet"
              title="Wallet & payments"
              sub="Everything here is priced in Os. Money moves in WeO Local."
            >
              <SetRow label="Balance" note="Available to spend">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  <OMark size={12} />
                  {wallet.data ? osFmt(wallet.data.balance.available) : '—'}
                </span>
                {btn('Open O-Wallet', () => void navigate(routes.wallet()), 'gold')}
              </SetRow>
              <SetRow
                label="Show approximate value in"
                note={
                  wallet.data ? `US dollars, at the peg — ${wallet.data.peg.label}` : 'US dollars, at the peg'
                }
              >
                <Badge variant="status" tone="var(--text-faint)">
                  USD
                </Badge>
              </SetRow>
              <SetRow
                label="Email receipts"
                note={
                  s.notifications.emailDelivery
                    ? 'A receipt for every trade'
                    : 'A receipt for every trade · saved for when email is sent'
                }
                last
              >
                {T(s.receipts, (v) => save({ receipts: v }), 'Email receipts')}
              </SetRow>
            </SetCard>

            <SetCard id="appearance" title="Appearance" sub="How the WeOverse looks and moves for you.">
              <SetRow label="Theme">
                <SetSeg
                  label="Theme"
                  value={theme}
                  onChange={(v) => setPrefs({ theme: v })}
                  options={[
                    ['light', 'Light'],
                    ['dark', 'Dark'],
                  ]}
                />
              </SetRow>
              <SetRow label="The wordmark opens">
                <SetSeg
                  label="The wordmark opens"
                  value={home}
                  onChange={(v) => setPrefs({ home: v })}
                  options={[
                    ['hub', 'Community'],
                    ['discover', 'Discover'],
                    ['create', 'Create'],
                  ]}
                />
              </SetRow>
              <SetRow label="Navigation">
                <SetSeg
                  label="Navigation"
                  value={navMode}
                  onChange={(v) => setPrefs({ navMode: v })}
                  options={[
                    ['bar', 'One bar on top'],
                    ['split', 'Sections on the left'],
                  ]}
                />
              </SetRow>
              <SetRow
                label="Mya in the corner"
                note="Your guide stays reachable from the corner, the O nav and the top bar"
              >
                {T(!myaHidden, (v) => setMyaHidden(!v), 'Mya in the corner')}
              </SetRow>
              <SetRow label="Reduce motion" note="Calmer transitions" last>
                {T(motion === 'calm', (v) => setPrefs({ motion: v ? 'calm' : 'full' }), 'Reduce motion')}
              </SetRow>
            </SetCard>

            <SetCard id="apps" title="Connected apps" sub="WeO apps that share your ID, ISR and wallet.">
              {wallet.data ? (
                wallet.data.ecosystem.map((e, i, arr) => (
                  <SetRow key={e.key} label={e.key} note={e.grants} last={i === arr.length - 1}>
                    <Badge
                      variant="status"
                      tone={e.state === 'live' ? 'var(--status-success)' : 'var(--text-faint)'}
                    >
                      {e.state === 'live' ? 'Live' : 'At launch'}
                    </Badge>
                  </SetRow>
                ))
              ) : (
                <SetRow label="Loading the apps…" last />
              )}
            </SetCard>

            <SetCard id="data" title="Your data" sub="It’s yours. Take a copy any time.">
              <SetRow
                label="Download your data"
                note="Profile, settings, your WeOs, what you collected, transactions, circles and threads — as one JSON file, right here"
              >
                {btn(exporter.isPending ? 'Preparing…' : 'Download', doExport, 'blue', exporter.isPending)}
              </SetRow>
              <SetRow
                label="Reset the guided tours"
                note="See the section intros and Mya’s walkthrough again"
                last
              >
                {btn('Reset', () => {
                  resetTours();
                  toast('Tours reset · they play on your next visit');
                })}
              </SetRow>
            </SetCard>

            <SetCard id="help" title="Help & legal">
              <SetRow label="Help" note="Mya knows the WeOverse and can walk you through anything here">
                {btn('Ask Mya', () => openDock('mya'), 'violet')}
              </SetRow>
              <SetRow label="About WeO">{btn('Open', () => void navigate(routes.company('about')))}</SetRow>
              <SetRow label="Legal" last>
                {btn('Terms', () => void navigate(routes.company('terms')))}
                {btn('Privacy policy', () => void navigate(routes.company('privacy')))}
                {btn('Cookies', () => void navigate(routes.company('cookies')))}
              </SetRow>
            </SetCard>

            <SetCard
              id="danger"
              title="Deactivate or delete"
              tone="var(--weo-req, #FF5A2C)"
              sub="These affect your whole WeO account, in every WeO app."
            >
              <SetRow label="Sign out" note="Sign out of this device">
                {btn('Sign out', () => void logout())}
              </SetRow>
              {s.accountRequest ? (
                <SetRow
                  label={s.accountRequest.kind === 'delete' ? 'Deletion requested' : 'Deactivation requested'}
                  note={`Asked ${new Date(s.accountRequest.requestedAt).toLocaleDateString()}${
                    s.accountRequest.reason ? ` · ${s.accountRequest.reason}` : ''
                  } · a person confirms it with you before anything changes`}
                  last
                >
                  {btn(
                    cancelReq.isPending ? 'Cancelling…' : 'Cancel the request',
                    () =>
                      cancelReq.mutate(undefined, {
                        onSuccess: () => toast('Request cancelled · nothing changes'),
                        onError: () => toast('That did not go through — try again'),
                      }),
                    'green',
                    cancelReq.isPending,
                  )}
                </SetRow>
              ) : (
                <>
                  <SetRow label="Deactivate account" note="Ask us to hide your profile and WeOs for a while.">
                    {btn('Deactivate', () => setSheet('deactivate'), 'violet')}
                  </SetRow>
                  <SetRow
                    label="Delete account"
                    note="Ask us to delete it. Move or spend your Os first."
                    last
                  >
                    <Button
                      size="sm"
                      variant="primary"
                      selected
                      tone="danger"
                      onClick={() => setSheet('delete')}
                    >
                      Delete account
                    </Button>
                  </SetRow>
                </>
              )}
            </SetCard>
          </div>
        </div>
      )}

      {sheet === 'profile' && p && <EditProfileSheet p={p} onClose={() => setSheet(null)} />}
      {(sheet === 'delete' || sheet === 'deactivate') && (
        <AccountRequestSheet
          kind={sheet}
          available={wallet.data?.balance.available ?? null}
          onExport={doExport}
          exporting={exporter.isPending}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}

function NotifyMatrix({
  s,
  onSet,
}: {
  s: SettingsDto;
  onSet: (g: ChannelGroup, ch: Channel, v: boolean) => void;
}) {
  const ch = s.notifications.channels;
  const head: CSSProperties = {
    padding: '6px 0 10px',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: 'var(--text-faint)',
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px,1fr) repeat(3, 74px)',
          alignItems: 'center',
          minWidth: 420,
        }}
      >
        <span style={head} />
        {CHANNELS.map(([k, l]) => (
          <span key={k} style={{ ...head, textAlign: 'center' }}>
            {l}
          </span>
        ))}
        {CATS.map(([k, label, note]) => (
          <MatrixRow key={k} label={label} note={note}>
            {CHANNELS.map(([c, cl]) => {
              const locked = k === 'security' && c === 'email';
              return (
                <span
                  key={c}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    alignSelf: 'stretch',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="checkbox"
                    aria-label={`${label} · ${cl}`}
                    checked={locked || ch[k][c]}
                    disabled={locked}
                    onChange={(e) => onSet(k, c, e.target.checked)}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: 'var(--o-violet)',
                      cursor: locked ? 'not-allowed' : 'pointer',
                    }}
                  />
                </span>
              );
            })}
          </MatrixRow>
        ))}
      </div>
    </div>
  );
}

function MatrixRow({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <>
      <span style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-faint)' }}>{note}</span>
      </span>
      {children}
    </>
  );
}

export default SettingsPage;
