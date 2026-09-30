import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CallbackError, completeLogin } from '@/api/auth';
import { ApiError } from '@/api/client';
import { routes } from '@/app/routes';
import { Alert, Button, Card, Spinner } from '@/design-system';
import styles from './AuthPage.module.css';

/** `/callback` — the IdP returns here with `?code&state`; we trade it for our session. */
export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    // StrictMode mounts effects twice in dev; a code can be exchanged only once
    if (ran.current) return;
    ran.current = true;
    completeLogin(window.location.search)
      .then(({ returnTo }) => navigate(returnTo, { replace: true }))
      .catch((e: unknown) => {
        if (e instanceof CallbackError || e instanceof ApiError) setError(e.message);
        else setError('Sign-in failed. Try again.');
      });
  }, [navigate]);

  return (
    <main className={styles.frame}>
      <Card elevation="glass" padding={36} radius={30} className={styles.card}>
        {error ? (
          <>
            <Alert status="error" style={{ textAlign: 'left' }}>
              {error}
            </Alert>
            <Button tone="violet" onClick={() => navigate(routes.login(), { replace: true })}>
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <Spinner tone="#D946EF" />
            <p className={styles.lede}>Signing you in…</p>
          </>
        )}
      </Card>
    </main>
  );
}
