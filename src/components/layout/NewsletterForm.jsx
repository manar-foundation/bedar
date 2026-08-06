import { useId, useState } from 'react';

import { Button } from '@components/ui/Button.jsx';
import { fieldChrome, fieldTone } from '@components/ui/fieldStyles.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   NEWSLETTER FORM — the footer signup, verbatim from
   bedar.webflow.io (placeholder, button label, pending label,
   success and error messages all come from `footer.newsletter`).

   Dashboard spec §4 requires form copy AND its success/error states
   to be dashboard-editable, so not one of those strings is written
   into this file.

   NOT YET WIRED. There is no subscribe endpoint until Phase 4, so
   `onSubscribe` is undefined today and a submission resolves to the
   site's own error message — which is the truth, not a simulation:
   there is nothing to submit to. The moment Phase 4 passes a real
   `onSubscribe`, the success path works with no change here.

   Phase 5 (Dashboard spec §4.1) adds the `newsletter_submission`
   dataLayer push — on CONFIRMED success only, never on click.

   The live status is announced with `role="status"` so a screen
   reader user learns the outcome; a colour change alone tells them
   nothing.
   ================================================================ */

export function NewsletterForm({ newsletter, onSubscribe, className }) {
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | pending | success | error

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'pending') return;

    setStatus('pending');
    try {
      if (!onSubscribe) throw new Error('newsletter endpoint not configured');
      await onSubscribe(email);
      setStatus('success');
      setEmail('');
    } catch {
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
