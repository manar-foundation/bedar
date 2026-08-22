import { sendEmail, escapeHtml, isEmail, readBody } from '../lib/email.js';
import { verifyCaptcha } from '../lib/recaptcha.js';
import { canWrite, insertRow } from '../lib/supabase-rest.js';

/* ================================================================
   POST /api/contact — a contact-form submission.

   Wired to <ContactForm> through `src/services/publicForms.js`.

   FOUR GATES, THEN TWO WRITES, IN THIS ORDER
   ----------------------------------------------------------------
     honeypot   a hidden field only a bot fills
     captcha    Google siteverify, server-side (client notes §4:
                "before the request is accepted or saved")
     shape      required fields, valid email
     ─────────────────────────────────────────────────────────────
     store      INSERT into `form_submissions` (client notes §2) —
                the RECORD, which the dashboard's "طلبات النماذج"
                screen reads
     notify     email via Resend — the NOTIFICATION on top of it

   The order is the requirement. The store comes before the email
   because the record is the thing that must not be lost: Resend
   being down, or the inbox filtering the message, used to mean an
   enquiry that never existed.

   WHY A FAILED EMAIL IS STILL A 200
   ----------------------------------------------------------------
   Once the row is written the visitor's request HAS been accepted,
   and the enquiry is in the dashboard. Returning 500 there would
   show them the error message and invite a resubmission that
   duplicates a row already saved. A failed store, on the other
   hand, is a real 500 — unless no database is configured at all, in
   which case email alone is the documented fallback and the endpoint
   behaves as it did before this table existed.

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
  // get a 200 so they think it worked and move on; nothing is stored
  // and no email is sent.
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
    return res.status(422).json({ error: 'Missing or invalid fields' });
  }

  // The stored payload is what was submitted, minus the two fields
  // that are plumbing rather than content — a spent captcha token and
  // an empty honeypot are noise in a table an administrator reads.
  const { captchaToken: _token, _honeypot: _trap, ...payload } = body;

  let stored = false;
  if (canWrite()) {
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
      });
      stored = true;
    } catch (err) {
      console.error('contact submission could not be stored:', err);
      return res.status(500).json({ error: 'Failed to save message' });
    }
  } else {
    // Loud, because it means §2 is not actually in effect on this
    // deploy — the dashboard screen will be empty and nobody will
    // know why.
    console.warn(
      'form_submissions not written: SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.',
    );
  }

  const rows = [
    ['الاسم', name],
    ['البريد الإلكتروني', email],
    ['رقم الهاتف', phone],
    ['الموضوع', subject],
    ['الرسالة', message],
  ];

  const html =
    `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0f172a;line-height:1.8">` +
    `<h2 style="margin:0 0 16px;font-size:18px">رسالة جديدة من نموذج التواصل</h2>` +
    rows
      .map(
        ([label, value]) =>
          `<p style="margin:0 0 10px"><strong>${label}:</strong> ${escapeHtml(value) || '—'}</p>`,
      )
      .join('') +
    `</div>`;

  const text = rows.map(([label, value]) => `${label}: ${value || '—'}`).join('\n');

  try {
    await sendEmail({
      subject: subject ? `تواصل: ${subject}` : `رسالة جديدة من ${name}`,
      html,
      text,
      replyTo: email,
    });
  } catch (err) {
    console.error('contact notification email failed:', err);
    // The record is safe, so the visitor's submission succeeded and
    // only the notification did not. With no database configured
    // there is no record either, and a failed email means the
    // message went nowhere — which the visitor has to be told.
    if (stored) return res.status(200).json({ ok: true, emailed: false });
    return res.status(500).json({ error: 'Failed to send message' });
  }

  return res.status(200).json({ ok: true });
}
