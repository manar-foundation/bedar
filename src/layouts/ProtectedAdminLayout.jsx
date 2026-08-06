import RequireAuth from '@components/layout/RequireAuth.jsx';
import AdminLayout from './AdminLayout.jsx';

/**
 * The authenticated dashboard shell: auth gate + chrome.
 *
 * These two are composed in their own module, rather than inline in
 * `routes.jsx`, so `routes.jsx` never statically imports anything that
 * reaches AuthContext → the Supabase client. A static import there
 * would pull ~53 kB gzipped of Supabase into the public entry chunk
 * even though every admin route is lazy. Same reasoning as
 * `AdminShell.jsx` — verify with `grep supabase dist/index.html`
 * after a build: it must return nothing.
 */
export default function ProtectedAdminLayout() {
  return (
    <RequireAuth>
      <AdminLayout />
    </RequireAuth>
  );
}
