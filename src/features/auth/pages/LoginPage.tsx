import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { buildAuthorizeUrl, buildGoogleSignInUrl } from '@/api/auth';
import { safeNext } from '@/app/routes';
import { useHasSession } from '@/app/session';
import { Alert, Button, Card, WeOverseLettering } from '@/design-system';
import { env } from '@/lib/env';
import styles from './AuthPage.module.css';

/** Sign in with the O-Wallet (OAuth2 + PKCE). */
export function LoginPage() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const hasSession = useHasSession();
  const [busy, setBusy] = useState<null | 'owallet' | 'google'>(null);
  const [error, setError] = useState<string | null>(null);

  if (hasSession) return <Navigate to={next} replace />;

  const configured = Boolean(env.walletUrl && env.clientId);

  const start = async (flow: 'owallet' | 'google') => {
    setBusy(flow);
    setError(null);
    try {
      window.location.assign(
        await (flow === 'google' ? buildGoogleSignInUrl(next) : buildAuthorizeUrl(next)),
      );
    } catch {
      setBusy(null);
      setError('Could not start sign-in. Try again.');
    }
  };

  return (
    <main className={styles.frame}>
      <Card elevation="glass" padding={36} radius={30} className={styles.card}>
        <WeOverseLettering h={40} className={styles.mark} />
        <p className={styles.lede}>One passport for every WeO you make, collect and trade.</p>
        {!configured && (
          <Alert status="warning" style={{ textAlign: 'left' }}>
            Sign-in isn’t configured. Set VITE_WALLET_URL and VITE_OAUTH_CLIENT_ID in .env.local.
          </Alert>
        )}
        {error && (
          <Alert status="error" style={{ textAlign: 'left' }}>
            {error}
          </Alert>
        )}
        <div className={styles.actions}>
          <Button
            tone="violet"
            size="lg"
            dot
            selected={!busy}
            disabled={!configured || !!busy}
            onClick={() => void start('owallet')}
          >
            {busy === 'owallet' ? 'Opening your O-Wallet…' : 'Continue with O-Wallet'}
          </Button>
          <Button
            tone="violet"
            variant="ghost"
            size="lg"
            disabled={!configured || !!busy}
            onClick={() => void start('google')}
          >
            {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </Button>
        </div>
        <p className={styles.fine}>You’ll sign in on wallet.ocono.me and come straight back.</p>
      </Card>
    </main>
  );
}
