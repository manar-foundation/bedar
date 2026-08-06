import { Outlet } from 'react-router-dom';

import { AuthProvider } from '@context/AuthContext.jsx';
import { ToastProvider } from '@context/ToastContext.jsx';

/**
 * Provider boundary for everything under /admin, including /admin/login.
 *
 * AuthProvider lives HERE rather than in App.jsx on purpose. It is the
 * only module that imports the Supabase client, and `@supabase/supabase-js`
 * is ~53 kB gzipped. Mounting it at the app root would put that in the
 * critical path of every public visitor, none of whom ever authenticate.
 * Because this file is reached through a `lazy()` route, Supabase is
 * fetched only when someone actually opens the dashboard.
 *
 * Live Preview (Phase 5) renders public page components inside the admin
 * tree, so it sits inside this boundary and still has the session it
 * needs to read draft rows.
 */
export default function AdminShell() {
  return (
    <AuthProvider>
      {/* Save confirmations and failures for every dashboard screen.
          Inside the auth boundary so it is part of the same lazy
          chunk, and above the router outlet so a toast survives the
          navigation that follows a save. */}
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </AuthProvider>
  );
}
