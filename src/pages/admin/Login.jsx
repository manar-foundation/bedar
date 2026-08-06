import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Spiral } from '@components/ui/Spiral.jsx';
import { useAuth } from '@context/AuthContext.jsx';
import { hasSupabase } from '@services/supabaseClient.js';

const FIELD_CLASS =
  'rounded-md border border-field-border bg-field px-4 py-3 text-base text-ink outline-none transition-colors duration-(--dur-fast) hover:border-brand-300 focus:border-brand-500';

const SUBMIT_CLASS =
  'mt-1 inline-flex h-12 items-center justify-center rounded-md bg-action-accent px-6 text-base font-semibold text-action-accent-on ' +
  'shadow-[0_12px_32px_-14px_var(--action-accent-glow)] transition-[background-color,box-shadow] duration-(--dur-fast) ' +
  'hover:bg-action-accent-hover hover:shadow-[0_18px_42px_-14px_var(--action-accent-glow)] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

const CARD_CLASS =
  'flex flex-col gap-5 rounded-xl border border-white/10 bg-surface p-7 shadow-e4 sm:p-8';

/**
 * Admin sign-in — two steps, one screen.
 *
 *   1. email + password
 *   2. the six-digit code, but only for an account that has a factor
 *      enrolled (Dashboard spec §13)
 *
 * The step is derived from `needsMfaChallenge` rather than held in
 * local state. That value comes from the session's assurance level,
 * so a reload mid-challenge lands back on the code step instead of
 * asking for the password again — the password half is already
 * spent, and Supabase would reject a second sign-in at aal1 anyway.
 *
 * An account with NO factor is not stopped here: it signs in at aal1
 * and `RequireAuth` sends it to /admin/security to enrol. Blocking
 * it at login instead would lock out the very first admin, who has
 * no factor and no way to add one.
 */
export default function Login() {
  const { signIn, verifyMfa, signOut, isAuthenticated, needsMfaChallenge, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'تسجيل الدخول | لوحة تحكم بدار';
  }, []);

  const destination = location.state?.from?.pathname ?? '/admin';

  if (!loading && isAuthenticated && !needsMfaChallenge) {
    return <Navigate to={destination} replace />;
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { needsChallenge } = await signIn({ email, password });
      // When a factor is enrolled the render below switches to the
      // code step on its own; navigating would unmount it.
      if (!needsChallenge) navigate(destination, { replace: true });
    } catch (caught) {
      setError(caught?.message ?? 'تعذّر تسجيل الدخول. تحقّق من البريد وكلمة المرور.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await verifyMfa(code);
      navigate(destination, { replace: true });
    } catch (caught) {
      setCode('');
      setError(caught?.message ?? 'الرمز غير صحيح أو انتهت صلاحيته. جرّب الرمز التالي.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseAnotherAccount = async () => {
    await signOut();
    setPassword('');
    setCode('');
    setError('');
  };

  return (
    <div className="surface-dark relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      {/* The same drifting colour fields as the homepage hero. Sign-in
          is the one dashboard screen a visitor sees before any content,
          so it is the screen that has to look like the site. */}
      <div className="hero-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/15 backdrop-blur-sm">
            <Spiral className="emblem-float size-8 text-brand-200" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold text-white">لوحة تحكم بدار</h1>
            <p className="text-sm text-brand-100/70">
              {needsMfaChallenge
                ? 'أدخل رمز التحقق من تطبيق المصادقة'
                : 'سجّل الدخول لإدارة محتوى الموقع'}
            </p>
          </div>
        </div>

        {needsMfaChallenge ? (
          <form onSubmit={handleCodeSubmit} className={CARD_CLASS}>
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="text-sm font-semibold text-ink">
                رمز التحقق
              </label>
              <input
                id="code"
                name="one-time-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                // The code is six Latin digits with no direction of
                // its own — `dir="ltr"` keeps the caret and the digit
                // order sane inside an RTL page.
                dir="ltr"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={`${FIELD_CLASS} text-center text-2xl tracking-[0.4em]`}
              />
              <p className="text-xs leading-relaxed text-ink-muted">
                افتح تطبيق المصادقة على هاتفك وأدخل الرمز المكوّن من 6 أرقام.
              </p>
            </div>

            {error ? (
              <p role="alert" className="rounded-md bg-error-100 px-4 py-3 text-sm text-error-700">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={submitting || code.length < 6} className={SUBMIT_CLASS}>
              {submitting ? 'جارٍ التحقق…' : 'تأكيد'}
            </button>

            <button
              type="button"
              onClick={handleUseAnotherAccount}
              className="text-sm font-medium text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
            >
              الدخول بحساب آخر
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className={CARD_CLASS}>
            {!hasSupabase ? (
              <p className="rounded-md bg-warning-100 px-4 py-3 text-sm leading-relaxed text-warning-700">
                Supabase غير مهيأ بعد. أضف
                <span className="ltr-run mx-1">VITE_SUPABASE_URL</span>و
                <span className="ltr-run mx-1">VITE_SUPABASE_ANON_KEY</span>
                إلى ملف <span className="ltr-run">.env</span> لتفعيل تسجيل الدخول.
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-ink">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-ink">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                dir="ltr"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={FIELD_CLASS}
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-md bg-error-100 px-4 py-3 text-sm text-error-700">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={submitting || !hasSupabase} className={SUBMIT_CLASS}>
              {submitting ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
