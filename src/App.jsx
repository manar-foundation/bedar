import { Suspense } from 'react';

import { ContentProvider } from '@context/ContentContext.jsx';
import { ThemeProvider } from '@context/ThemeContext.jsx';
import AppRoutes from './routes.jsx';
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
export default function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <Suspense fallback={<RouteLoader />}>
          <AppRoutes />
        </Suspense>
      </ContentProvider>
    </ThemeProvider>
  );
}
