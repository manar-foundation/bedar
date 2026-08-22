import { isEmail, readBody } from '../lib/form-request.js';
import { verifyCaptcha } from '../lib/recaptcha.js';
import { canWrite, insertRow } from '../lib/supabase-rest.js';

/* ================================================================
   POST /api/contact — a contact-form submission.

   Wired to <ContactForm> through `src/services/publicForms.js`.

   THREE GATES, THEN ONE WRITE, IN THIS ORDER
   ----------------------------------------------------------------
     honeypot   a hidden field only a bot fills
     captcha    Google siteverify, server-side (client notes §4:
                "before the request is accepted or saved")
     shape      required fields, valid email
     ─────────────────────────────────────────────────────────────
     store      INSERT into `form_submissions` (client notes §2) —
                the record the dashboard's "طلبات النماذج" screen
                reads, at /admin/submissions

   THE DATABASE IS THE DELIVERY
   ----------------------------------------------------------------
   No mail is sent from this path and no third party stands between
   the visitor pressing send and the enquiry being readable in the
   dashboard. Success means exactly one thing — the row is in
   `form_submissions`.

   Which is why a missing `SUPABASE_SERVICE_ROLE_KEY` is a hard 500
   and not a warning: an accepted submission that was not stored is
   an enquiry that went nowhere, and telling the visitor it worked
   would be a lie.

   The field `name` keys (Name-7, Email-7, …) match the live Webflow
   form, so the payload shape is stable — see content/pages.js.
   ================================================================ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readBody(req);

  // Honeypot — a real person never fills a hidden field. Bots that do
  // get a 200 so they think it worked and move on; nothing is stored.
  if (body._honeypot) return res.status(200).json({ ok: true });

  const captcha = await verifyCaptcha(body.captchaToken, {
    remoteIp: req.headers?.['x-forwarded-for']?.split(',')[0]?.trim(),
  });
  if (!captcha.ok) {
    console.warn('contact submission refused by captcha:', captcha.reason, captcha.errors ?? '');
    return res
      .status(400)
      .json({ error: 'فشل التحقق من أنك لست روبوتاً. حدّث الصفحة وحاول مجدداً.' });
  }

  const name = String(body['Name-7'] || '').trim();
  const email = String(body['Email-7'] || '').trim();
  const phone = String(body['Phone-7'] || '').trim();
  const subject = String(body['Company-7'] || '').trim();
  const message = String(body['Message-7'] || '').trim();

  if (!name || !message || !isEmail(email)) {
    return res.status(422).json({ error: 'البيانات المُرسَلة غير مكتملة أو غير صحيحة.' });
  }

  // The stored payload is what was submitted, minus the two fields
  // that are plumbing rather than content — a spent captcha token and
  // an empty honeypot are noise in a table an administrator reads.
  const { captchaToken: _token, _honeypot: _trap, ...payload } = body;

  if (!canWrite()) {
    // Loud, and fatal: with no database there is nowhere for this
    // enquiry to go. The dashboard screen would be empty and nobody
    // would know why.
    console.error(
      'contact submission not stored: SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.',
    );
    return res.status(500).json({ error: 'تعذّر حفظ الرسالة. حاول مرة أخرى لاحقاً.' });
  }

  try {
    await insertRow('form_submissions', {
      form_key: 'contact',
      name,
      email,
      phone,
      subject,
      message,
      payload,
      user_agent: String(req.headers?.['user-agent'] ?? '').slice(0, 500),
      captcha,
      // `is_handled` defaults to false — a new row is an UNREAD
      // request until someone marks it in the dashboard.
    });
  } catch (err) {
    console.error('contact submission could not be stored:', err);
    return res.status(500).json({ error: 'تعذّر حفظ الرسالة. حاول مرة أخرى لاحقاً.' });
  }

  return res.status(200).json({ ok: true, stored: true });
}
