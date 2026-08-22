/* ================================================================
   PUBLIC FORMS — the browser side of the contact + newsletter forms.

   Posts to the site's own Vercel serverless functions (`/api/contact`,
   `/api/newsletter`), which deliver the submission to the site inbox
   via Resend. Same discipline as `publicContent.js`: plain `fetch`,
   NO `@supabase/supabase-js`, so `grep -c supabase dist/index.html`
   stays 0.

   Each function REJECTS (throws) on a non-2xx response. That is the
   contract <ContactForm>/<NewsletterForm> rely on — their handlers
   await this and fall to the dashboard-editable error message on a
   throw, and only show the success state on a resolve.
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

/** Contact form → /api/contact. `data` is the raw FormData object. */
export function submitContactForm(data) {
  return postJson('/api/contact', data);
}

/** Newsletter → /api/newsletter. */
export function subscribeNewsletter(email) {
  return postJson('/api/newsletter', { email });
}
