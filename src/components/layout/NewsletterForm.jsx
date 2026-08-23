import { useId, useState } from 'react';

import { Button } from '@components/ui/Button.jsx';
import { fieldChrome, fieldTone } from '@components/ui/fieldStyles.js';
import { useContent } from '@context/ContentContext.jsx';
import { useCaptcha } from '@hooks/useCaptcha.js';
import { pushFormSuccess } from '@utils/analytics.js';
import { CAPTCHA_PROMPT, FORM_KEYS } from '@utils/constants.js';
import { isCaptchaIncomplete } from '@utils/recaptcha.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   NEWSLETTER FORM — the footer signup, verbatim from
   bedar.webflow.io (placeholder, button label, pending label,
   success and error messages all come from `footer.newsletter`).

   Dashboard spec §4 requires form copy AND its success/error states
   to be dashboard-editable, so not one of those strings is written
   into this file.

   WIRED to `/api/newsletter` (a Vercel serverless function) through
   `services/publicForms.js`, passed in as `onSubscribe` from the
   Footer. That endpoint SAVES the signup to `form_submissions`, where
   it is read at /admin/submissions. Nothing is emailed. When
   `onSubscribe` is absent the form still degrades to its own error
   message rather than pretending to subscribe.

   Same three steps as the contact form, and for the same reasons —
   see the header of `ContactForm.jsx`: the reCAPTCHA CHECKBOX must be
   ticked first and its token read before anything is posted (client
   notes §4), the endpoint verifies that token with Google and stores
   the signup in `form_submissions` (§2), and only the RESOLVED branch
   fires the analytics event whose name the dashboard holds (§3).
   Never on click. An unticked box stops the handler before the POST,
   so there is no row and no event.

   An address that is ALREADY on the list resolves too — the endpoint
   answers 200 for a repeat signup rather than an error, so somebody
   who subscribed last month and forgot sees the success message and
   not a failure.

   The live status is announced with `role="status"` so a screen
   reader user learns the outcome; a colour change alone tells them
   nothing.
   ================================================================ */

export function NewsletterForm({ newsletter, onSubscribe, className }) {
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const [email, setEmail] = useState('');
  // idle | pending | success | error | captcha — see ContactForm for
  // why an unticked box is its own state and not an error.
  const [status, setStatus] = useState('idle');
  const { settings } = useContent();
  const {
    mount: mountCaptcha,
    getToken: getCaptchaToken,
    reset: resetCaptcha,
    visible: captchaVisible,
    solved: captchaSolved,
    // The footer column is ~206px wide; the standard 304px widget
    // would hang out of it. Google's compact variant is 164px.
  } = useCaptcha(settings.captcha, { compact: true });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'pending') return;

    // The honeypot is an UNCONTROLLED field read straight off the form,
    // the same way ContactForm reads it — a real person never fills a
    // hidden input, and the endpoint drops any submission that carries a
    // value (api/newsletter.js). Unlike the contact form this handler does
    // not build its whole payload from FormData (the address is controlled
    // state), so the one trap field is pulled out on its own and threaded
    // through `onSubscribe` to reach the POST body as `_honeypot`.
    const honeypot = new FormData(event.currentTarget).get('_honeypot') ?? '';

    setStatus('pending');
    try {
      if (!onSubscribe) throw new Error('newsletter endpoint not configured');
      const token = await getCaptchaToken();
      await onSubscribe(email, token, honeypot);
      setStatus('success');
      setEmail('');
      pushFormSuccess(FORM_KEYS.NEWSLETTER, settings);
    } catch (caught) {
      if (isCaptchaIncomplete(caught)) {
        // Nothing was posted. Prompt for the tick and keep the typed
        // address; do not reset a widget the visitor may have ticked.
        setStatus('captcha');
        return;
      }
      setStatus('error');
      // A captcha token is single-use — a retry needs a fresh one.
      resetCaptcha();
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
        aria-describedby={status === 'error' || status === 'captcha' ? statusId : undefined}
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

      {/* Honeypot — the same trap as ContactForm, whose header carries
          the full reasoning: kept RENDERED (never `display: none`) but
          clipped with `sr-only` at its own static position, so it costs
          the layout nothing and cannot inflate the RTL scroll width the
          way a `left: -9999px` offset would. `aria-hidden` + `tabIndex={-1}`
          keep it off screen readers and out of the tab order. It is
          uncontrolled, so `FormData.get('_honeypot')` above reads whatever
          a naive bot typed; the endpoint silently drops any filled one. */}
      <input
        type="text"
        name="_honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      {/* See the note in ContactForm — the container stays mounted
          and displayed because Google measures it on render; the
          non-checkbox flavours are taken out of flow instead of
          hidden. */}
      <div
        ref={mountCaptcha}
        className={cn(
          // `.captcha-fit` sizes the VISIBLE widget to its column (see
          // layout.css). It must not be combined with the out-of-flow
          // styling below: that rule's `min-width: 100%` would beat
          // `size-px` and stretch this box back to the column width.
          captchaVisible
            ? 'captcha-fit'
            : 'pointer-events-none absolute size-px overflow-hidden',
        )}
      />

      {captchaVisible && status === 'captcha' && !captchaSolved ? (
        <p id={statusId} role="alert" className="text-xs text-accent-300">
          {CAPTCHA_PROMPT}
        </p>
      ) : null}

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
