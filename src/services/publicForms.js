/* ================================================================
   PUBLIC FORMS — the browser side of the contact + newsletter forms.

   Posts to the site's own Vercel serverless functions (`/api/contact`,
   `/api/newsletter`), which do two things per submission (client
   notes §2, §4):

     1. verify the reCAPTCHA token with Google, server-side, BEFORE
        anything else — the secret key never reaches this file
     2. SAVE the submission to `form_submissions`, which is what the
        dashboard's "طلبات النماذج" screen reads at /admin/submissions

   There is no step 3. Nothing is emailed anywhere: the stored row IS
   the delivery, and a resolved promise here means it exists.

   Same discipline as `publicContent.js`: plain `fetch`, NO
   `@supabase/supabase-js`, so `grep -c supabase dist/index.html`
   stays 0. Note that the WRITE goes through the serverless function
   rather than through PostgREST — an anon INSERT policy on
   `form_submissions` would be an open, unauthenticated write
   endpoint into the database, and the captcha check has to happen
   somewhere the visitor cannot skip.

   Each function REJECTS (throws) on a non-2xx response. That is the
   contract <ContactForm>/<NewsletterForm> rely on — their handlers
   await this and fall to the dashboard-editable error message on a
   throw, and only show the success state (and fire the analytics
   event) on a resolve.
   ================================================================ */

async function postJson(path, payload) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Surface the endpoint's message when it sent one; otherwise the
    // status is enough for the caller, which only cares that it threw.
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(message);
  }

  return res.json().catch(() => ({}));
}

/**
 * Contact form → /api/contact.
 *
 * `data` is the raw FormData object; `captchaToken` is what
 * `useCaptcha` minted for THIS submission. It is sent under a key of
 * its own rather than mixed into the form fields so the endpoint can
 * strip it before the payload is stored — a spent captcha token in
 * the submissions table is noise.
 */
export function submitContactForm(data, captchaToken = '') {
  return postJson('/api/contact', { ...data, captchaToken });
}

/**
 * Newsletter → /api/newsletter.
 *
 * `honeypot` is the hidden trap field <NewsletterForm> reads off the form
 * (empty for a real visitor). It rides under `_honeypot` — the key the
 * endpoint checks BEFORE the captcha — so a bot that fills it gets the same
 * silent drop the contact form already gives. It is sent under its own key,
 * like `captchaToken`, rather than mixed into the stored payload.
 */
export function subscribeNewsletter(email, captchaToken = '', honeypot = '') {
  return postJson('/api/newsletter', { email, captchaToken, _honeypot: honeypot });
}
