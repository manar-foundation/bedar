import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@context/AuthContext.jsx';
import { MFA_SETUP_PATH } from '@utils/constants.js';
import RouteLoader from './RouteLoader.jsx';

/**
 * Client-side gate for /admin.
 *
 * This is a UX guard, not a security boundary — it only decides what
 * to render. Actual authorisation is enforced by Supabase RLS on
 * every table, so bypassing this component reveals an empty
 * dashboard, not data.
 *
 * Four gates, in this order:
 *
 *   1. no session            → login
 *   2. session at aal1 while a factor is enrolled → login, to finish
 *      the 2FA challenge. The dashboard would render but every write
 *      would be refused by `has_required_aal()`, so stopping here is
 *      the honest version of failing later.
 *   3. deactivated account   → a dead end with a sign-out button.
 *      Not a redirect to login: they can sign in perfectly well,
 *      which would make it a loop.
 *   4. no factor at all      → the enrolment screen, and nothing
 *      else (Dashboard spec §13).
 */
export default function RequireAuth({ children, role }) {
  const {
    isAuthenticated,
    isActive,
    loading,
    profile,
    needsMfaChallenge,
    needsMfaEnrollment,
    signOut,
  } = useAuth();
  const location = useLocation();

  if (loading) return <RouteLoader label="جارٍ التحقق من الجلسة" />;

  if (!isAuthenticated || needsMfaChallenge) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isActive) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app px-4">
        <div className="w-full max-w-md rounded-xl bg-surface p-7 text-center shadow-e3">
          <h1 className="mb-3 text-xl font-bold text-ink">هذا الحساب معطَّل</h1>
          <p className="mb-6 text-sm leading-relaxed text-ink-secondary">
            تم إيقاف صلاحية الوصول إلى لوحة التحكم لهذا الحساب. تواصل مع أحد المديرين لإعادة تفعيله.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-(--dur-fast) hover:bg-brand-600"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  if (needsMfaEnrollment && location.pathname !== MFA_SETUP_PATH) {
    return <Navigate to={MFA_SETUP_PATH} replace />;
  }

  if (role && profile?.role !== role) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
