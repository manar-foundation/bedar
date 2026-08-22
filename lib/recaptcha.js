/* ================================================================
   reCAPTCHA VERIFICATION — the half that actually protects anything.

   CLIENT NOTES §4
   ----------------------------------------------------------------
   "Verification must be applied to every form BEFORE the request is
    accepted or saved to the database."
   "IMPORTANT TECHNICAL NOTE: keep the Secret Key on the server
    (Backend / Environment Variables) and do not expose it in the
    frontend or embed it in public JavaScript files."

   Both are structural here rather than advisory:

   · This file lives in `lib/`, OUTSIDE `src/`. Vite never sees it,
     so there is no build in which it can end up in a bundle. It is
     imported only by the `api/` handlers, which run in the Vercel
     serverless runtime.
   · `RECAPTCHA_SECRET_KEY` has no `VITE_` prefix. A `VITE_` copy
     would be inlined into the JavaScript every visitor downloads,
     which is precisely the failure the note warns about.
   · The callers `await verifyCaptcha(...)` and return 400 on a
     failure, before the insert and before the email.

   FAIL-CLOSED, WITH ONE DELIBERATE EXCEPTION
   ----------------------------------------------------------------
   With `RECAPTCHA_SECRET_KEY` set, a missing or rejected token is a
   refused request. With it UNSET, verification is skipped and the
   submission proceeds — otherwise adding this file would break every
   local `vercel dev` and every preview deploy that has not had the
   secret copied into it, and the fix for that would be someone
   disabling the captcha entirely. The skip is reported back to the
   caller so it can be recorded on the row and be visible in the
   dashboard, rather than silently looking like a passed check.
   ================================================================ */

const SITEVERIFY = 'https://www.google.com/recaptcha/api/siteverify';

/** v3 scores below this are treated as automated. */
const DEFAULT_SCORE_THRESHOLD = 0.5;

/**
 * Check one token with Google.
 *
 * @returns {Promise<{ok: boolean, skipped?: boolean, score?: number,
 *                    action?: string, errors?: string[], reason?: string}>}
 *   `ok:false` means REFUSE the submission. `skipped:true` means no
 *   secret is configured — see the note above.
 */
export async function verifyCaptcha(token, { remoteIp } = {}) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true, reason: 'no-secret-configured' };

  if (!token) return { ok: false, reason: 'missing-token' };

  const body = new URLSearchParams({ secret, response: String(token) });
  // Optional and only ever Google's own anti-abuse signal — it is
  // not stored anywhere (see the `form_submissions` migration).
  if (remoteIp) body.set('remoteip', remoteIp);

  let data;
  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    data = await res.json();
  } catch (error) {
    // Google unreachable. REFUSE rather than wave the request
    // through: an outage that silently disables spam protection is
    // how a form ends up with ten thousand rows in it.
    console.error('reCAPTCHA siteverify unreachable:', error);
    return { ok: false, reason: 'verify-unreachable' };
  }

  if (!data?.success) {
    return { ok: false, reason: 'rejected', errors: data?.['error-codes'] ?? [] };
  }

  // v3 only. v2 responses carry no score, and `undefined < threshold`
  // is false — so this check is inert for the v2 keys in use without
  // needing to branch on the version the browser happened to use.
  const threshold = Number(process.env.RECAPTCHA_SCORE_THRESHOLD || DEFAULT_SCORE_THRESHOLD);
  if (typeof data.score === 'number' && data.score < threshold) {
    return { ok: false, reason: 'low-score', score: data.score, action: data.action };
  }

  return {
    ok: true,
    ...(typeof data.score === 'number' ? { score: data.score } : {}),
    ...(data.action ? { action: data.action } : {}),
    ...(data.hostname ? { hostname: data.hostname } : {}),
  };
}

export default { verifyCaptcha };
