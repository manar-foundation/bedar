/* ================================================================
   CAPTCHA VERIFICATION — the server half of client note ٤.

   "يجب تطبيق التحقق على جميع النماذج قبل قبول الطلب أو حفظه في
    قاعدة البيانات."
   "ملاحظة تقنية مهمة: يجب الاحتفاظ بالـ Secret Key في جهة الخادم
    (Backend / Environment Variables) وعدم إظهاره في Frontend أو
    تضمينه في ملفات JavaScript العامة."

   Both are structural here, not conventions:

   · The secret is `process.env.RECAPTCHA_SECRET_KEY`, read inside a
     Vercel serverless function. This file lives OUTSIDE `src/`, so
     Vite never sees it and it cannot be imported into the browser
     bundle even by accident. The variable has no `VITE_` prefix, so
     even if it were imported there, it would be undefined.

   · `verifyCaptcha` is called by each endpoint BEFORE the row is
     inserted and before the mail is sent. A failure returns 400 and
     nothing is written.

   WHAT COUNTS AS A PASS
   ----------------------------------------------------------------
   Google's `siteverify` answers `{ success, score?, action? }`. For
   v2 `success` is the whole answer. For v3 it also returns a score
   in [0,1]; below the configured threshold the request is treated as
   a bot. The threshold is a dashboard setting because the right
   value is traffic-dependent — 0.5 is Google's own default and is
   what the migration seeds.

   FAILING OPEN, AND WHEN
   ----------------------------------------------------------------
   If no provider is configured in the dashboard, verification is
   skipped — that is what an empty provider means, and the site has
   to work with the feature off.

   If a provider IS configured but the secret is missing from the
   environment, the request is REFUSED, not waved through. A silent
   fail-open there would mean an admin who turned captcha on in the
   dashboard is protected only as long as nobody notices; a 500 gets
   the deployment fixed.
   ================================================================ */

import { getSetting } from './settings.js';

const ENDPOINTS = {
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
  hcaptcha: 'https://api.hcaptcha.com/siteverify',
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
};

/** The secret for a provider. Never prefixed `VITE_`. */
function secretFor(provider) {
  if (provider === 'hcaptcha') return process.env.HCAPTCHA_SECRET_KEY || '';
  if (provider === 'turnstile') return process.env.TURNSTILE_SECRET_KEY || '';
  return process.env.RECAPTCHA_SECRET_KEY || '';
}

/**
 * Verify a submission's captcha token.
 *
 * Returns `{ ok, reason, skipped }`. The caller maps `ok === false`
 * to a 400 (or a 500 when `reason === 'misconfigured'`) and stops —
 * it must not store or send anything.
 */
export async function verifyCaptcha(token, { remoteIp = '' } = {}) {
  const config = await getSetting('captcha');
  const provider = String(config.provider ?? '').trim();

  // Not configured = not required. The dashboard's empty provider is
  // an explicit "off", and the public form renders no widget either.
  if (!provider || !ENDPOINTS[provider]) return { ok: true, skipped: true };

  const secret = secretFor(provider);
  if (!secret) {
    // Configured but not deployable. Refuse loudly — see the header.
    return { ok: false, reason: 'misconfigured' };
  }

  const value = String(token ?? '').trim();
  if (!value) return { ok: false, reason: 'missing' };

  const body = new URLSearchParams({ secret, response: value });
  if (remoteIp) body.set('remoteip', remoteIp);

  let result;
  try {
    const res = await fetch(ENDPOINTS[provider], {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    result = await res.json();
  } catch {
    // The verifier is unreachable. Refusing is the safe direction:
    // the visitor sees the form's own error message and can retry,
    // and an outage never becomes an open relay for spam.
    return { ok: false, reason: 'unreachable' };
  }

  if (!result?.success) return { ok: false, reason: 'rejected' };

  // v3 only — v2 and hCaptcha return no score, and `undefined` must
  // not be compared against a threshold.
  if (typeof result.score === 'number') {
    const threshold = Number(config.minScore ?? 0.5);
    const floor = Number.isFinite(threshold) ? threshold : 0.5;
    if (result.score < floor) return { ok: false, reason: 'low-score' };
  }

  return { ok: true };
}

/** The visitor's IP, as Vercel reports it. Optional for siteverify. */
export function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.headers?.['x-real-ip'] ?? '';
}
