/* ================================================================
   STORING A SUBMISSION — client note ٢.

   "يجب حفظ جميع الطلبات المرسلة من خلال هذه النماذج في قاعدة
    البيانات وإتاحتها للمشرف من خلال جدول داخل لوحة التحكم."

   Inserted into `form_submissions` with the anon key, under the
   insert-only policy in migration 0011 (`lib/settings.js` explains
   why that key and not the service-role one).

   STORING COMES FIRST, MAILING SECOND
   ----------------------------------------------------------------
   The endpoints write the row and then send the email. If the mail
   fails the row still exists, so the request is not lost — the
   client's whole reason for asking for this. If the row fails, the
   endpoint returns 500 and the visitor is told to try again rather
   than being thanked for a message nobody will ever see.
   ================================================================ */

import { restPost } from './settings.js';

/** Trim and cap, matching the CHECK constraints on the table. */
function clamp(value, max) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

/**
 * Persist one submission.
 *
 * `payload` is the raw body minus the fields that are noise or
 * secrets in a record: the honeypot, and the captcha token (already
 * spent, and worth nothing after verification).
 */
export async function storeSubmission({ form, fields = {}, body = {}, req }) {
  const { _honeypot, captchaToken, ...payload } = body;
  void _honeypot;
  void captchaToken;

  await restPost('form_submissions', {
    form,
    name: clamp(fields.name, 200),
    email: clamp(fields.email, 320),
    phone: clamp(fields.phone, 60),
    subject: clamp(fields.subject, 300),
    message: clamp(fields.message, 5000),
    payload,
    source_path: clamp(body.sourcePath, 500),
    // Enough to tell a person from a script when triaging spam, and
    // not enough to profile anyone.
    user_agent: clamp(req?.headers?.['user-agent'], 500),
  });
}
