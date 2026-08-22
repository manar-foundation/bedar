import { sendEmail, escapeHtml, isEmail, readBody } from '../lib/email.js';
import { clientIp, verifyCaptcha } from '../lib/captcha.js';
import { storeSubmission } from '../lib/submissions.js';

/* ================================================================
   POST /api/newsletter — record a newsletter signup and notify the
   site inbox via Resend. Wired to <NewsletterForm> through
   src/services/publicForms.js.

   Same five steps and the same order as `api/contact.js` — honeypot,
   validate, verify the captcha, STORE, then mail. See that file's
   header for why the order is what it is.

   The signup now lives in `form_submissions` (client note ٢), so the
   list of subscribers is a query rather than a search through an
   inbox. A future step can also push the address into a mailing-list
   provider from here without touching the client.
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

  const captcha = await verifyCaptcha(body.captchaToken, { remoteIp: clientIp(req) });
  if (!captcha.ok) {
    if (captcha.reason === 'misconfigured') {
      console.error('captcha is enabled in the dashboard but no secret key is set');
      return res.status(500).json({ error: 'Captcha is not configured' });
    }
    return res.status(400).json({ error: 'Captcha verification failed' });
  }

  try {
    await storeSubmission({ form: 'newsletter', fields: { email }, body, req });
  } catch (err) {
    console.error('storing newsletter signup failed:', err);
    return res.status(500).json({ error: 'Failed to subscribe' });
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
    // Recorded already — see the same note in api/contact.js.
    console.error('newsletter notification email failed (signup was stored):', err);
  }

  return res.status(200).json({ ok: true });
}
