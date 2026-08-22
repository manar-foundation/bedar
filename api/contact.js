import { sendEmail, escapeHtml, isEmail, readBody } from '../lib/email.js';
import { clientIp, verifyCaptcha } from '../lib/captcha.js';
import { storeSubmission } from '../lib/submissions.js';

/* ================================================================
   POST /api/contact — record a contact-form submission and deliver
   it to the site inbox via Resend. Wired to <ContactForm> through
   src/services/publicForms.js.

   ORDER OF OPERATIONS (client notes ٢ and ٤)
   ----------------------------------------------------------------
     1. honeypot   — a bot that fills the hidden field gets a 200 and
                     nothing happens.
     2. validate   — required fields, valid address.
     3. CAPTCHA    — verified against Google with the server-side
                     secret, "قبل قبول الطلب أو حفظه في قاعدة
                     البيانات". A failure returns before step 4.
     4. STORE      — the row in `form_submissions`, which is what the
                     dashboard's requests table lists.
     5. mail       — the notification.

   Only a 2xx from here lets the browser fire the analytics event
   (note ٣), so a conversion is never counted for a request that was
   not stored.

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

  const name = String(body['Name-7'] || '').trim();
  const email = String(body['Email-7'] || '').trim();
  const phone = String(body['Phone-7'] || '').trim();
  const subject = String(body['Company-7'] || '').trim();
  const message = String(body['Message-7'] || '').trim();

  if (!name || !message || !isEmail(email)) {
    return res.status(422).json({ error: 'Missing or invalid fields' });
  }

  const captcha = await verifyCaptcha(body.captchaToken, { remoteIp: clientIp(req) });
  if (!captcha.ok) {
    if (captcha.reason === 'misconfigured') {
      console.error('captcha is enabled in the dashboard but no secret key is set');
      return res.status(500).json({ error: 'Captcha is not configured' });
    }
    return res.status(400).json({ error: 'Captcha verification failed' });
  }

  // Stored BEFORE the mail: a Resend outage must not lose a request.
  try {
    await storeSubmission({
      form: 'contact',
      fields: { name, email, phone, subject, message },
      body,
      req,
    });
  } catch (err) {
    console.error('storing contact submission failed:', err);
    return res.status(500).json({ error: 'Failed to save message' });
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
    // The request IS saved and visible in the dashboard, so this is
    // not a failure from the visitor's point of view — telling them
    // to send it again would duplicate a message we already have.
    console.error('contact notification email failed (submission was stored):', err);
  }

  return res.status(200).json({ ok: true });
}
