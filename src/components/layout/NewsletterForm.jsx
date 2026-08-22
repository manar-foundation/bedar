import { useId, useRef, useState } from 'react';

import { Button } from '@components/ui/Button.jsx';
import { fieldChrome, fieldTone } from '@components/ui/fieldStyles.js';
import { useContent } from '@context/ContentContext.jsx';
import { trackFormSuccess } from '@utils/analytics.js';
import { FORM_KINDS } from '@utils/constants.js';
import { cn } from '@utils/cn.js';

import { Captcha } from './Captcha.jsx';

/* ================================================================
   NEWSLETTER FORM — the footer signup, verbatim from
   bedar.webflow.io (placeholder, button label, pending label,
   success and error messages all come from `footer.newsletter`).

   Dashboard spec §4 requires form copy AND its success/error states
   to be dashboard-editable, so not one of those strings is written
   into this file.

   WIRED to `/api/newsletter` (a Vercel serverless function) through
   `services/publicForms.js`, passed in as `onSubscribe` from the
   Footer. That endpoint emails the signup to the site inbox via
   Resend. When `onSubscribe` is absent the form still degrades to its
   own error message rather than pretending to subscribe.

   Captcha, storage and the analytics event work exactly as they do
   on the contact form, and for the same reasons — see the header of
   `ContactForm.jsx`. Client note ٤ says "جميع النماذج", so the
   footer signup is protected too; note ٣ gives it its own event name
   setting, independent of the contact form's.

   The live status is announced with `role="status"` so a screen
   reader user learns the outcome; a colour change alone tells them
   nothing.
   ================================================================ */

export function NewsletterForm({ newsletter, onSubscribe, className }) {
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const { settings } = useContent();
  const captchaRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'pending') return;

    setStatus('pending');
    try {
      if (!onSubscribe) throw new Error('newsletter endpoint not configured');

      const captchaToken = (await captchaRef.current?.getToken()) ?? '';
      await onSubscribe(email, { captchaToken });

      // Stored and delivered — only now does it count as a signup.
      trackFormSuccess(settings, FORM_KINDS.NEWSLETTER);
      setStatus('success');
      setEmail('');
    } catch {
      captchaRef.current?.reset();
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p id={statusId} role="status" className={cn('text-sm text-brand-200', className)}>
        {newsletter.successMessage}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-3', className)}
      noValidate={false}
    >
      {/* The field has no visible label on the live site. The
          accessible name is "البريد الإلكتروني", not the block
          title — repeating the heading here would announce
          "النشرة البريدية" twice in a row. */}
      <label htmlFor={inputId} className="sr-only">
        البريد الإلكتروني
      </label>

      <input
        id={inputId}
        type="email"
        name="email"
        required
        maxLength={256}
        autoComplete="email"
        placeholder={newsletter.placeholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-describedby={status === 'error' ? statusId : undefined}
        aria-invalid={status === 'error' || undefined}
        // The footer sits on `.surface-dark`, so the field is glass
        // over the deep teal rather than the light `bg-field`.
        className={cn(
          fieldChrome,
          fieldTone(false),
          'h-11 border-white/20 bg-white/10 px-3.5 text-sm text-white placeholder:text-brand-100/50',
          // The placeholder is a Latin email address; keep it
          // left-to-right so it does not read backwards.
          'placeholder:[direction:ltr]',
        )}
      />

      <Captcha ref={captchaRef} captcha={settings?.captcha} />

      <Button type="submit" variant="accent" loading={status === 'pending'}>
        {status === 'pending' ? newsletter.pendingLabel : newsletter.submitLabel}
      </Button>

      {status === 'error' ? (
        <p id={statusId} role="status" className="text-xs text-accent-300">
          {newsletter.errorMessage}
        </p>
      ) : null}
    </form>
  );
}

export default NewsletterForm;
