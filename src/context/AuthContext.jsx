import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase, hasSupabase } from '@services/supabaseClient.js';
import { AAL, MFA_REQUIRED, ROLES, TABLES } from '@utils/constants.js';

const AuthContext = createContext(null);

const EMPTY_AAL = { currentLevel: null, nextLevel: null };

/**
 * Session, role and two-factor state for the admin dashboard.
 *
 * WHAT THIS IS NOT
 * ----------------------------------------------------------------
 * Not a security boundary. Everything here decides what to RENDER.
 * Authorisation lives in RLS: `public.auth_role()` re-reads the role
 * from `profiles` on every statement, and every write policy also
 * requires `public.has_required_aal()`. Tampering with the values in
 * this context gets you a dashboard shell over an empty database.
 *
 * TWO-FACTOR (Dashboard spec §13)
 * ----------------------------------------------------------------
 * Supabase models 2FA as an assurance level on the session:
 *
 *   currentLevel  what this session has proved so far
 *   nextLevel     what it could still prove — 'aal2' once the user
 *                 has a verified factor
 *
 * So `currentLevel === 'aal1' && nextLevel === 'aal2'` is precisely
 * "password accepted, factor not yet presented", which is the login
 * challenge step. A user with no factor at all sits at aal1/aal1 and
 * is sent to enrolment by `RequireAuth`.
 *
 * The profile read happens at aal1 on purpose — `RequireAuth` needs
 * the role before it can decide anything, and the RLS policy for
 * reading your own row deliberately does not require aal2. Reading
 * your own name is not a write.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [factors, setFactors] = useState([]);
  const [aal, setAal] = useState(EMPTY_AAL);
  const [error, setError] = useState(null);
  // Starts false when there is no backend to ask, so the "checking
  // session" state never renders at all in that case.
  const [loading, setLoading] = useState(hasSupabase);

  /* ── Session ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!hasSupabase) return undefined;

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session ?? null);
      // With no session there is nothing left to fetch; with one, the
      // effect below owns the rest of the loading state.
      if (!data.session) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      if (!nextSession) {
        setProfile(null);
        setFactors([]);
        setAal(EMPTY_AAL);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  /* ── Profile + factors + assurance level ─────────────────────
     Keyed on the access token, not just the user id: completing the
     2FA challenge issues a NEW token at aal2 for the same user, and
     that is exactly the moment this has to re-run. ─────────────── */
  const userId = session?.user?.id ?? null;
  const accessToken = session?.access_token ?? null;

  useEffect(() => {
    if (!hasSupabase || !userId) return undefined;

    let cancelled = false;

    (async () => {
      const [profileResult, factorResult, aalResult] = await Promise.all([
        supabase
          .from(TABLES.PROFILES)
          .select('id, email, full_name, role, is_active')
          .eq('id', userId)
          .maybeSingle(),
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);

      if (cancelled) return;

      setProfile(profileResult.data ?? null);
      setError(profileResult.error ?? null);
      setFactors(factorResult.data?.all ?? []);
      setAal(
        aalResult.data
          ? {
              currentLevel: aalResult.data.currentLevel ?? null,
              nextLevel: aalResult.data.nextLevel ?? null,
            }
          : EMPTY_AAL,
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, accessToken]);

  /** Re-read factors after an enrolment or an unenrolment. */
  const refreshFactors = useCallback(async () => {
    if (!hasSupabase) return [];
    const { data } = await supabase.auth.mfa.listFactors();
    const all = data?.all ?? [];
    setFactors(all);
    return all;
  }, []);

  /* ── Actions ─────────────────────────────────────────────── */

  const signIn = useCallback(async ({ email, password }) => {
    if (!hasSupabase) throw new Error('Supabase غير مهيأ بعد.');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    // Read the level from the fresh session rather than waiting for
    // the effect above: the caller needs to know *now* whether to
    // render the code step or navigate away.
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const level = {
      currentLevel: data?.currentLevel ?? null,
      nextLevel: data?.nextLevel ?? null,
    };
    setAal(level);

    return {
      needsChallenge: level.currentLevel === AAL.PASSWORD && level.nextLevel === AAL.MFA,
    };
  }, []);

  /**
   * The login challenge step.
   *
   * `challengeAndVerify` is one call rather than challenge + verify:
   * the two-call form exists for factors where the challenge is
   * delivered out of band (SMS). For TOTP the code is already on the
   * user's phone, so splitting it only adds a request and a piece of
   * state that can go stale.
   */
  const verifyMfa = useCallback(async (code) => {
    if (!hasSupabase) throw new Error('Supabase غير مهيأ بعد.');

    const { data } = await supabase.auth.mfa.listFactors();
    const factor = (data?.totp ?? []).find((item) => item.status === 'verified');
    if (!factor) throw new Error('لا يوجد تطبيق مصادقة مسجَّل على هذا الحساب.');

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: normaliseCode(code),
    });
    if (verifyError) throw verifyError;

    const level = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal({
      currentLevel: level.data?.currentLevel ?? null,
      nextLevel: level.data?.nextLevel ?? null,
    });
  }, []);

  /** Enrolment step 1 — returns the QR code and the manual secret. */
  const startEnrollment = useCallback(async (friendlyName) => {
    if (!hasSupabase) throw new Error('Supabase غير مهيأ بعد.');

    // Supabase rejects a duplicate friendly name, and an abandoned
    // enrolment leaves an unverified factor behind — so clear those
    // first. Unverified factors grant nothing; they are debris from
    // a closed tab, not a second device.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    await Promise.all(
      (existing?.all ?? [])
        .filter((factor) => factor.status !== 'verified')
        .map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
    );

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName?.trim() || `bedar-${new Date().toISOString().slice(0, 10)}`,
    });
    if (enrollError) throw enrollError;

    return {
      factorId: data.id,
      qrCode: data.totp?.qr_code ?? '',
      secret: data.totp?.secret ?? '',
      uri: data.totp?.uri ?? '',
    };
  }, []);

  /** Enrolment step 2 — proves the app was set up, activates the factor. */
  const confirmEnrollment = useCallback(
    async ({ factorId, code }) => {
      if (!hasSupabase) throw new Error('Supabase غير مهيأ بعد.');

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: normaliseCode(code),
      });
      if (verifyError) throw verifyError;

      await refreshFactors();
      const level = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setAal({
        currentLevel: level.data?.currentLevel ?? null,
        nextLevel: level.data?.nextLevel ?? null,
      });
    },
    [refreshFactors],
  );

  const removeFactor = useCallback(
    async (factorId) => {
      if (!hasSupabase) throw new Error('Supabase غير مهيأ بعد.');
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
      if (unenrollError) throw unenrollError;
      await refreshFactors();
    },
    [refreshFactors],
  );

  const signOut = useCallback(async () => {
    if (!hasSupabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setFactors([]);
    setAal(EMPTY_AAL);
  }, []);

  const value = useMemo(() => {
    const verifiedFactors = factors.filter((factor) => factor.status === 'verified');
    const hasMfa = verifiedFactors.length > 0;

    return {
      session,
      user: session?.user ?? null,
      profile,
      error,
      loading,

      role: profile?.role ?? null,
      isAdmin: profile?.role === ROLES.ADMIN,
      isEditor: profile?.role === ROLES.EDITOR || profile?.role === ROLES.ADMIN,
      isAuthenticated: Boolean(session),
      /** Deactivating a user in the dashboard revokes access without
       *  deleting them or orphaning what they wrote. */
      isActive: profile ? profile.is_active : true,

      /* ── 2FA ───────────────────────────────────────────────── */
      factors: verifiedFactors,
      hasMfa,
      /** Password accepted, factor not yet presented. */
      needsMfaChallenge: aal.currentLevel === AAL.PASSWORD && aal.nextLevel === AAL.MFA,
      /** Signed in, but no factor exists to challenge. */
      needsMfaEnrollment: MFA_REQUIRED && Boolean(session) && !hasMfa,
      assuranceLevel: aal.currentLevel,

      signIn,
      verifyMfa,
      startEnrollment,
      confirmEnrollment,
      removeFactor,
      refreshFactors,
      signOut,
    };
  }, [
    session,
    profile,
    factors,
    aal,
    error,
    loading,
    signIn,
    verifyMfa,
    startEnrollment,
    confirmEnrollment,
    removeFactor,
    refreshFactors,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Authenticator apps show the code as "123 456", and a pasted code
 * carries the space. Arabic-Indic digits can also arrive from a
 * phone keyboard even though the site renders Western ones, so they
 * are folded back before the code goes to the server.
 */
function normaliseCode(code) {
  return String(code ?? '')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '');
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default AuthContext;
