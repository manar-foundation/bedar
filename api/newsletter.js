import { isEmail, readBody } from '../lib/form-request.js';
import { verifyCaptcha } from '../lib/recaptcha.js';
import { canWrite, insertRow } from '../lib/supabase-rest.js';

/* ================================================================
   POST /api/newsletter — a newsletter signup.

   Wired to <NewsletterForm> through `src/services/publicForms.js`.
   Same gates and the same order as `api/contact.js` — honeypot,
   captcha (client notes §4), shape — and then the one write that
   matters (client notes §2). See that file's header for why the
   stored row IS the delivery now that no email is sent.

   RE-SUBSCRIBING IS NOT AN ERROR
   ----------------------------------------------------------------
   `form_submissions_newsletter_email_key` is a partial unique index
   on `lower(email)` for newsletter rows, so the same address cannot
   appear twice however many times the visitor presses the button.
   Hitting it is the expected outcome of a second signup, not a
   failure: PostgREST answers 409, this handler reads that as "already
   on the list" and returns 200 — never a 500, and never the form's
   error message to somebody who is, in fact, subscribed. Doing this
   in the database rather than with a read-then-write also settles the
   race where two clicks land at once.
   ================================================================ */

/**
 * Is this Supabase error the newsletter uniqueness index?
 *
 * PostgREST maps SQLSTATE 23505 to HTTP 409 and repeats the code in
 * the JSON body, so either signal is enough; both are checked because
 * the status alone would also catch a future conflict on some other
 * constraint, and the code alone would miss a body we failed to read.
 */
function isDuplicate(error) {
  const detail = String(error?.detail ?? error?.message ?? '');
  return error?.status === 409 || detail.includes('23505') || detail.includes('duplicate key');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readBody(req);

  // Honeypot — see api/contact.js.
  if (body._honeypot) return res.status(200).json({ ok: true });

  const captcha = await verifyCaptcha(body.captchaToken, {
    remoteIp: req.headers?.['x-forwarded-for']?.split(',')[0]?.trim(),
  });
  if (!captcha.ok) {
    console.warn('newsletter signup refused by captcha:', captcha.reason, captcha.errors ?? '');
    return res
      .status(400)
      .json({ error: 'فشل التحقق من أنك لست روبوتاً. حدّث الصفحة وحاول مجدداً.' });
  }

  const email = String(body.email || '').trim();
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'البريد الإلكتروني غير صحيح.' });
  }

  if (!canWrite()) {
    console.error(
      'newsletter signup not stored: SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.',
    );
    return res.status(500).json({ error: 'تعذّر إتمام الاشتراك. حاول مرة أخرى لاحقاً.' });
  }

  try {
    await insertRow('form_submissions', {
      form_key: 'newsletter',
      email,
      payload: { email },
      user_agent: String(req.headers?.['user-agent'] ?? '').slice(0, 500),
      captcha,
      // `is_handled` defaults to false — a new signup is UNREAD until
      // someone marks it in the dashboard.
    });
  } catch (err) {
    if (isDuplicate(err)) {
      // Already on the list. Tell the visitor it worked — because
      // from where they are standing, it did.
      return res.status(200).json({ ok: true, alreadySubscribed: true });
    }
    console.error('newsletter signup could not be stored:', err);
    return res.status(500).json({ error: 'تعذّر إتمام الاشتراك. حاول مرة أخرى لاحقاً.' });
  }

  return res.status(200).json({ ok: true, stored: true });
}
