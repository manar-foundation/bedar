import { sendEmail, escapeHtml, isEmail, readBody } from '../lib/email.js';

/* ================================================================
   POST /api/newsletter — record a newsletter signup by emailing the
   site inbox via Resend. Wired to <NewsletterForm> through
   src/services/publicForms.js.

   A signup is delivered as a notification for now; a future step can
   also push the address into a mailing-list provider from here without
   touching the client.
   ================================================================ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readBody(req);

  // Honeypot — see api/contact.js.
  if (body._honeypot) return res.status(200).json({ ok: true });

  const email = String(body.email || '').trim();
  if (!isEmail(email)) {
    return res.status(422).json({ error: 'Invalid email' });
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
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('newsletter subscription failed:', err);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
}
