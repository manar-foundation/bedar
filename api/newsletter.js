import { sendEmail, escapeHtml, isEmail, readBody } from '../lib/email.js';
import { verifyCaptcha } from '../lib/recaptcha.js';
import { canWrite, insertRow } from '../lib/supabase-rest.js';

/* ================================================================
   POST /api/newsletter — a newsletter signup.

   Wired to <NewsletterForm> through `src/services/publicForms.js`.
   Same gates and the same order as `api/contact.js` — honeypot,
   captcha (client notes §4), shape — then store (client notes §2)
   and notify. See that file's header for why the store comes first
   and why a failed email is still a success once the row exists.

   RE-SUBSCRIBING IS NOT AN ERROR
   ----------------------------------------------------------------
   `form_submissions_newsletter_email_key` is a partial unique index
   on `lower(email)` for newsletter rows, so the same address cannot
   appear twice however many times the visitor presses the button.
   Hitting it is the expected outcome of a second signup, not a
   failure: the endpoint answers 200 and sends no second
   notification. Doing this in the database rather than with a
   read-then-write also settles the race where two clicks land at
   once.
   ================================================================ */

/** Is this Supabase error the newsletter uniqueness index? */
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
    return res.status(422).json({ error: 'Invalid email' });
  }

  let stored = false;
  if (canWrite()) {
    try {
      await insertRow('form_submissions', {
        form_key: 'newsletter',
        email,
        payload: { email },
        user_agent: String(req.headers?.['user-agent'] ?? '').slice(0, 500),
        captcha,
      });
      stored = true;
    } catch (err) {
      if (isDuplicate(err)) {
        // Already on the list. Tell the visitor it worked — because
        // from where they are standing, it did.
        return res.status(200).json({ ok: true, alreadySubscribed: true });
      }
      console.error('newsletter signup could not be stored:', err);
      return res.status(500).json({ error: 'Failed to subscribe' });
    }
  } else {
    console.warn(
      'form_submissions not written: SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.',
    );
  }

  const safe = escapeHtml(email);
  try {
    await sendEmail({
      subject: 'اشتراك جديد في النشرة البريدية',
      html:
        `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.8">` +
        `اشتراك جديد في النشرة البريدية: <strong>${safe}</strong>` +
        `</div>`,
      text: `اشتراك جديد في النشرة البريدية: ${email}`,
      replyTo: email,
    });
  } catch (err) {
    console.error('newsletter notification email failed:', err);
    if (stored) return res.status(200).json({ ok: true, emailed: false });
    return res.status(500).json({ error: 'Failed to subscribe' });
  }

  return res.status(200).json({ ok: true });
}
