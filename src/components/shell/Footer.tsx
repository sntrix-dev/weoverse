import { useState, type FormEvent } from 'react';
import { Avatar, Button, Icon, WeOverseLettering } from '@/design-system';
import { routes } from '@/app/routes';
import type { ShellMe } from '@/features/shell/model/me';
import { subscribeEmail } from '@/features/shell/api/newsletter';
import { openExternal, toast } from '@/stores/ui';
import { SOCIALS } from './socials';
import s from './Footer.module.css';

type FootLink = [label: string, to: string];

// design: screens-footer.jsx FOOT_SECTIONS (route keys mapped to app paths)
const FOOT_SECTIONS: { title: string; links: FootLink[] }[] = [
  {
    title: 'Marketplace',
    links: [
      ['Create · make your offer', routes.create()],
      ['Exchange · move with the market', routes.listed()],
      ['Ask · offer', routes.requests()],
      ['Discover · what’s happening now', routes.discover()],
      ['Collect · get it, use it, resell it', routes.collected()],
      ['Tracking', routes.tracking()],
    ],
  },
  {
    title: 'Community',
    links: [
      ['Community hub', routes.hub()],
      ['Creators', routes.creators()],
      ['WeO Stories', routes.stories()],
      ['Circles', routes.manage()],
    ],
  },
  {
    title: 'Your space',
    links: [
      ['Your passport', routes.passport()],
      ['O-Wallet', routes.wallet()],
      ['Notifications', routes.notifications()],
      ['Stewards', routes.stewards()],
      ['Settings', routes.settings()],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About WeO', routes.company('about')],
      ['Careers', routes.company('careers')],
      ['Privacy', routes.company('privacy')],
      ['Terms', routes.company('terms')],
    ],
  },
];

export interface FooterProps {
  me: ShellMe | undefined;
  onGo: (to: string) => void;
}

/**
 * design: screens-footer.jsx WeoFooter — always-visible bar, collapsible sitemap, newsletter,
 * legal strip. A dark full-bleed band: `data-theme="dark"` remaps the tokens inside it.
 */
export function Footer({ me, onGo }: FooterProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subbed, setSubbed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState(false);

  const subscribe = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      const res = await subscribeEmail(value);
      setSubbed(true);
      setEmail('');
      toast(res === 'already' ? 'You’re already on the list' : 'You’re on the list');
      setTimeout(() => {
        setSubbed(false);
        setSignup(false);
      }, 2200);
    } catch {
      toast('That address didn’t go through — check it and try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    /* The footer stays below the fold — it never rides up into the section's content. */
    <footer data-theme="dark" className={s.footer}>
      <span aria-hidden="true" className={s.glow} />
      {/* the horizon: a full-bleed band, not a card — the viewport above ends here */}
      <span aria-hidden="true" className={s.horizon} />
      <div className={s.inner}>
        <div className={s.top}>
          <button
            type="button"
            onClick={() => onGo(routes.create())}
            aria-label="WeOverse home"
            className={s.home}
          >
            {/* reversed for the grey ground — one ink, white */}
            <WeOverseLettering h={22} ink="#fff" className="weo-wordmark" />
          </button>
          <span className={`weo-search ${s.tagline}`}>Test it before you list it.</span>
          <span className={s.topRight}>
            <span className={`weo-search ${s.status}`}>
              <span className={s.statusDot} />
              <span className={s.statusText}>All systems operational</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className={s.sitemapBtn}
            >
              {open ? 'Less' : 'Sitemap'}
              <span className={s.chev} data-open={open || undefined}>
                <Icon size={13} sw={2.2}>
                  <polyline points="6 9 12 15 18 9" />
                </Icon>
              </span>
            </button>
          </span>
        </div>

        {open && (
          <div className={s.sitemap}>
            <div className={s.grid}>
              <div className={s.about}>
                <p className={s.aboutText}>
                  WeOverse is the proving ground for the creator economy — list, negotiate and collect WeOs,
                  priced in <b>Os</b>, the same figure for everyone.
                </p>
                {me && (
                  <button type="button" onClick={() => onGo(routes.passport())} className={s.me}>
                    <Avatar src={me.avatarUrl} initials={me.initials} isr={me.isr} size={32} />
                    <span>
                      <span className={s.meName}>{me.name}</span>
                      <span className={s.meSub}>View passport</span>
                    </span>
                  </button>
                )}
                <div className={s.socials}>
                  {SOCIALS.map((so) => (
                    <button
                      key={so.k}
                      type="button"
                      onClick={() =>
                        openExternal({
                          label: so.k,
                          eyebrow: 'Leaving the WeOverse',
                          note: `WeO's ${so.k} account is a public channel outside the network. Nothing about your passport travels with you.`,
                          url: `${so.k.toLowerCase()}.com/weo`,
                          cta: `Open ${so.k}`,
                        })
                      }
                      aria-label={so.k}
                      title={so.k}
                      className={s.social}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d={so.d} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              {FOOT_SECTIONS.map((sec) => (
                <nav key={sec.title} aria-label={sec.title}>
                  <div className={s.secHead}>
                    <span className={s.secDot} />
                    <span className={s.secTitle}>{sec.title}</span>
                  </div>
                  <ul className={s.links}>
                    {sec.links.map(([label, to]) => (
                      <li key={label}>
                        <button type="button" onClick={() => onGo(to)} className={s.link}>
                          {label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            {/* the field is not persistent — one quiet CTA, and it opens on intent */}
            <div className={s.signup}>
              {!signup ? (
                <button type="button" onClick={() => setSignup(true)} className={s.signupBtn}>
                  Signals from the O<span className={s.signupNote}>drops and creator moves · no noise</span>
                  <Icon size={13} sw={2.2}>
                    <polyline points="9 6 15 12 9 18" />
                  </Icon>
                </button>
              ) : (
                <form onSubmit={(e) => void subscribe(e)} className={s.form}>
                  <input
                    type="email"
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- design: the field opens on intent, focused
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    aria-label="Email for WeO updates"
                    className={s.email}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    tone={subbed ? 'green' : 'violet'}
                    type="submit"
                    disabled={busy}
                  >
                    {subbed ? 'Subscribed' : 'Subscribe'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSignup(false);
                      setEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className={s.legal}>
          <span className={s.copy}>© 2026 WeO Global, Inc</span>
          {(['Privacy', 'Terms', 'Cookies'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onGo(routes.company(l.toLowerCase()))}
              className={s.legalLink}
            >
              {l}
            </button>
          ))}
          <span className={s.protocol}>Powered by the O protocol v1.2</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={s.topBtn}
          >
            <Icon size={14} sw={1.8}>
              <path d="M12 19V5M6 11l6-6 6 6" />
            </Icon>{' '}
            Top
          </button>
        </div>
      </div>
    </footer>
  );
}
