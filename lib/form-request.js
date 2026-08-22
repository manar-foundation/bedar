/* ================================================================
   FORM REQUEST HELPERS — reading and validating a form POST.

   The two things `api/contact.js` and `api/newsletter.js` both need
   before they can decide anything: the parsed body, and whether the
   address in it is plausibly an address.

   This file lives in `lib/`, OUTSIDE `src/`, so Vite never sees it —
   the same reason `recaptcha.js` and `supabase-rest.js` do. It is
   imported only by the `api/` handlers, which run in the Vercel
   serverless runtime.

   Nothing here sends mail: a submission is SAVED to
   `form_submissions` and read in the dashboard's "طلبات النماذج"
   screen, and that record is the whole delivery mechanism.
   ================================================================ */

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

/** Basic RFC-ish email check — enough to reject junk before storing. */
export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default { readBody, isEmail };
