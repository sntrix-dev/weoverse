import { useCallback, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useLiveNotifications } from '@/api/live';
import { Footer } from '@/components/shell/Footer';
import { IdSheet } from '@/components/shell/IdSheet';
import { MyaDock } from '@/components/shell/MyaDock';
import { QuickJump } from '@/components/shell/QuickJump';
import { SplitShell } from '@/components/shell/SplitShell';
import { TopBar, type ShellNavProps } from '@/components/shell/TopBar';
import { CollectHost } from '@/features/collect/components/CollectHost';
import { CommunityHost } from '@/features/community/components/modals/CommunityHost';
import { CreatorHost } from '@/features/creators/components/CreatorHost';
import { OfferHost } from '@/features/requests/components/OfferHost';
import { WorldHost } from '@/features/worlds/components/WorldHost';
import { SectionIntro } from '@/components/intro/SectionIntro';
import { useNavSummary } from '@/features/shell/api/navSummary';
import { useLogout } from '@/features/shell/useLogout';
import { usePref, usePrefs } from '@/stores/prefs';
import { toast, useUi } from '@/stores/ui';
import { ROUTE_META, routes, type RouteName } from './routes';
import { useGoHome, useJump, useSearch } from './useJump';
import { useShellRoute, type SectionKey } from './useShellRoute';

export interface RouteHandle {
  route?: RouteName;
}

/** design: app.jsx — the floating controls stop at the footer's top edge (`--foot-lift`). */
function useFootLift() {
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const f = document.querySelector('footer');
      const lift = f ? Math.max(0, Math.round(window.innerHeight - f.getBoundingClientRect().top)) : 0;
      document.documentElement.style.setProperty('--foot-lift', `${lift}px`);
    };
    const req = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(req) : null;
    ro?.observe(document.body);
    return () => {
      window.removeEventListener('scroll', req);
      window.removeEventListener('resize', req);
      ro?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
}

/**
 * design: app.jsx — the route's colour (`--focus-tint`) on #root and <html>, and the first
 * top-level <section> of the screen marked `data-lead` so the wash sits behind it.
 */
function useRouteTint(route: RouteName | null) {
  const tint = route ? ROUTE_META[route].tone : '#D946EF';
  useEffect(() => {
    const root = document.getElementById('root');
    document.documentElement.style.setProperty('--focus-tint', tint);
    if (!root) return;
    root.style.setProperty('--focus-tint', tint);
    let raf = 0;
    const mark = () => {
      const own = Array.from(root.querySelectorAll('section')).filter(
        (el) => !el.parentElement?.closest('section'),
      );
      own.forEach((el, i) => {
        if (i === 0) el.setAttribute('data-lead', '');
        else el.removeAttribute('data-lead');
      });
    };
    mark();
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(mark);
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [tint]);
}

/**
 * The frame every signed-in page renders in (design `app.jsx` render order): the nav (bar or
 * split), the screen, the footer, the floating O nav, Mya's dock, the passport dropdown.
 * Toasts, the ack ripple and the external gate live in RootLayout.
 */
export function AppLayout() {
  const navigate = useNavigate();
  const { route, section } = useShellRoute();
  const { data: me } = useNavSummary();
  const navMode = usePref('navMode');
  const idSheet = useUi((u) => u.idSheet);
  const jump = useJump();
  const goHome = useGoHome();
  const search = useSearch();
  const logoutNow = useLogout();

  useRouteTint(route);
  useFootLift();
  useLiveNotifications();

  useEffect(() => {
    usePrefs.setState({ onSaveError: () => toast('That setting didn’t save — try again') });
    return () => usePrefs.setState({ onSaveError: null });
  }, []);

  const onJump = useCallback((k: SectionKey | 'mya') => void jump(k), [jump]);
  const go = useCallback((to: string) => void navigate(to), [navigate]);

  const nav: ShellNavProps = {
    me,
    section,
    onJump,
    onHome: goHome,
    onSearch: search,
    onNotifications: () => go(routes.notifications()),
  };

  return (
    <>
      {navMode === 'split' ? <SplitShell {...nav} /> : <TopBar {...nav} />}
      <Outlet />
      <Footer me={me} onGo={go} />
      <QuickJump section={section} onJump={onJump} />
      <MyaDock
        settings={{ me, onPassport: () => go(routes.passport()), onAllSettings: () => go(routes.settings()) }}
      />
      {idSheet && me && (
        <IdSheet
          me={me}
          onWallet={() => go(routes.wallet())}
          onSettings={() => go(routes.settings())}
          onPassport={() => go(routes.passport())}
          onLogout={() => void logoutNow()}
        />
      )}
      <CollectHost />
      <CommunityHost />
      <OfferHost />
      <CreatorHost />
      <WorldHost />
      <SectionIntro />
    </>
  );
}
