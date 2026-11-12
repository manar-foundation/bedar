import { Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { ContentProvider } from '@context/ContentContext.jsx';
import { ThemeProvider } from '@context/ThemeContext.jsx';
import AppRoutes from './routes.jsx';
import { captureUtm } from '@utils/utm.js';
import RouteLoader from '@components/layout/RouteLoader.jsx';

/**
 * App-wide providers:
 *   Theme   — must wrap everything so `data-theme` is set before paint
 *   Content — site content (nav, footer, pages, collections)
 *
 * AuthProvider is deliberately NOT here. It is mounted inside the
 * lazily-loaded admin branch (`layouts/AdminShell.jsx`) so the Supabase
 * client never reaches the public bundle. See that file for why.
 */
/** In-app navigation to a URL that carries UTMs is a new touch too. */
function UtmRouteCapture() {
  const { search } = useLocation();
  useEffect(() => {
    captureUtm(search);
  }, [search]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <UtmRouteCapture />
        <Suspense fallback={<RouteLoader />}>
          <AppRoutes />
        </Suspense>
      </ContentProvider>
    </ThemeProvider>
  );
}
