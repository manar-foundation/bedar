/* ================================================================
   RESEND EMAIL TRANSPORT — shared by the /api form endpoints.

   Plain `fetch` against Resend's REST API, so the serverless
   functions carry NO npm dependency. `RESEND_API_KEY` is read from
   the environment and never reaches the browser: these modules run
   only in the Vercel serverless runtime, never in the client bundle
   (they live outside `src/`, so Vite never sees them).

   Env vars (set in Vercel → Settings → Environment Variables, WITHOUT
   a VITE_ prefix — a VITE_ copy would be published to every visitor):

     RESEND_API_KEY       required — the Resend API key
     CONTACT_TO_EMAIL     recipient (default info@bedar.org)
     CONTACT_FROM_EMAIL   sender   (default onboarding@resend.dev)

   Until bedar.org is verified in Resend, keep FROM as the default
   `onboarding@resend.dev` and set CONTACT_TO_EMAIL to the address you
   registered with Resend — Resend only delivers to the account owner
   before a domain is verified. Once bedar.org is verified, set FROM to
   an address on it (e.g. `Bedar <noreply@bedar.org>`) and TO to
   info@bedar.org.
   ================================================================ */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Escape a user-supplied string for safe interpolation into HTML. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Send one email through Resend. Throws on a missing key or a non-2xx
 * response so the caller can map it to a 500 — the browser then shows
 * the form's own (dashboard-editable) error message.
 */
export async function sendEmail({ subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const from = process.env.CONTACT_FROM_EMAIL || 'Bedar <onboarding@resend.dev>';
  const to = process.env.CONTACT_TO_EMAIL || 'info@bedar.org';

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      // Replies go to the person who filled the form, not to the
      // no-reply sender.
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
  return res.json().catch(() => ({}));
}

/** Basic RFC-ish email check — enough to reject junk before sending. */
export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Parse a JSON body that Vercel may hand us as a raw string. */
export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}
