import { sendEmail, escapeHtml, isEmail, readBody } from '../lib/email.js';

/* ================================================================
   POST /api/contact — deliver a contact-form submission to the site
   inbox via Resend. Wired to <ContactForm> through
   src/services/publicForms.js.

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
  // get a 200 so they think it worked and move on; no email is sent.
  if (body._honeypot) return res.status(200).json({ ok: true });

  const name = String(body['Name-7'] || '').trim();
  const email = String(body['Email-7'] || '').trim();
  const phone = String(body['Phone-7'] || '').trim();
  const subject = String(body['Company-7'] || '').trim();
  const message = String(body['Message-7'] || '').trim();

  if (!name || !message || !isEmail(email)) {
    return res.status(422).json({ error: 'Missing or invalid fields' });
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
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact submission failed:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
