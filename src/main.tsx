import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import '@/design-system/tokens/index.css';
import '@/styles/global.css';
import { Providers } from '@/app/providers';
import { router } from '@/app/router';
import { routes } from '@/app/routes';

const toLogin = () => {
  const here = window.location.pathname + window.location.search + window.location.hash;
  void router.navigate(routes.login(here), { replace: true });
};

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

createRoot(root).render(
  <StrictMode>
    <Providers onSessionExpired={toLogin}>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
