import { useState } from 'react';

import { Button, Input, Textarea } from '@components/ui';
import { useContent } from '@context/ContentContext.jsx';
import { useCaptcha } from '@hooks/useCaptcha.js';
import { pushFormSuccess } from '@utils/analytics.js';
import { CAPTCHA_PROMPT, FORM_KEYS } from '@utils/constants.js';
import { isCaptchaIncomplete } from '@utils/recaptcha.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   CONTACT FORM — driven entirely by `contact.form` in pages.js.

   Fields, labels, placeholders, the submit label, the pending label
   and BOTH result messages are data. Dashboard spec §4 requires form
   copy and its states to be editable without a deploy, and the field
   `name` values match the live Webflow form so an existing
   integration keeps receiving the same keys.

   WIRED to `/api/contact` (a Vercel serverless function) through
   `services/publicForms.js`, passed in as `onSubmit` from the Contact
   page. That endpoint SAVES the submission to `form_submissions`,
   where it is read at /admin/submissions. Nothing is emailed — the
   stored row is the delivery. When `onSubmit` is absent the form still
   degrades to its own error message rather than pretending to send.

   THE THREE THINGS THAT HAPPEN ON SUBMIT, IN ORDER
   ----------------------------------------------------------------
   1. A reCAPTCHA token is read from the CHECKBOX the visitor ticked
      (client notes §4). No tick, no token, and the handler stops
      here — nothing is posted, so nothing is stored and no event
      fires. The token is obtained BEFORE the request, and the
      endpoint verifies it with Google's `siteverify` before it saves
      anything; this side alone proves nothing.
   2. The endpoint is awaited. It writes the row to
      `form_submissions` (§2), and a resolve means that row exists —
      which is what the success message below tells the visitor.
   3. ONLY THEN the analytics event fires (§3), with the name the
      dashboard holds for this form — never a name written here, and
      never on click. `pushFormSuccess` sits in the resolved branch
      for exactly that reason: a failed send that still reported a
      conversion would make every funnel in GA4 wrong.

   The result is announced with `role="status"` — a colour change
   alone tells a screen reader user nothing.
   ================================================================ */

export function ContactForm({ form, onSubmit, className }) {
  // idle | pending | success | error | captcha
  // `captcha` is its own state and not an `error`: the form is fine,
  // the visitor has simply not ticked the box, and telling them the
  // message failed to send would be both wrong and unhelpful.
  const [status, setStatus] = useState('idle');
  const { settings } = useContent();
  const {
    mount: mountCaptcha,
    getToken: getCaptchaToken,
    reset: resetCaptcha,
    visible: captchaVisible,
    solved: captchaSolved,
  } = useCaptcha(settings.captcha);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'pending') return;

    const data = Object.fromEntries(new FormData(event.currentTarget));
    setStatus('pending');
    try {
      if (!onSubmit) throw new Error('contact endpoint not configured');
      const token = await getCaptchaToken();
      await onSubmit(data, token);
      setStatus('success');
      pushFormSuccess(FORM_KEYS.CONTACT, settings);
    } catch (caught) {
      if (isCaptchaIncomplete(caught)) {
        // Nothing was sent. Prompt for the tick and leave the typed
        // fields exactly as they are — and do NOT reset the widget,
        // which would wipe a tick that merely expired mid-typing.
        setStatus('captcha');
        return;
      }
      setStatus('error');
      // A token may only be redeemed once, so a retry after any
      // failure needs a fresh one.
      resetCaptcha();
    }
  };

  if (status === 'success') {
    return (
      <p
        role="status"
        className={cn(
          'rounded-lg border border-success-500/30 bg-success-100 px-5 py-4 text-sm leading-relaxed text-success-700',
          className,
        )}
      >
        {form.successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-5', className)}>
      {form.fields.map((field) =>
        field.type === 'textarea' ? (
          <Textarea
            key={field.id}
            name={field.name}
            label={field.label}
            placeholder={field.placeholder}
            required={field.required}
            rows={5}
          />
        ) : (
          <Input
            key={field.id}
            name={field.name}
            type={field.type}
            label={field.label}
            placeholder={field.placeholder}
            required={field.required}
            autoComplete={field.autoComplete}
            // Latin-shaped values (email, phone) read backwards if
            // they inherit the page's RTL direction.
            dir={field.type === 'email' || field.type === 'tel' ? 'ltr' : undefined}
            className={field.type === 'email' || field.type === 'tel' ? 'text-start' : undefined}
          />
        ),
      )}

      {/* Honeypot — invisible to people, tempting to naive bots. Kept
          RENDERED (not `display: none`, which some bots and autofill
          skip) but taken out of the layout entirely. The endpoint
          silently drops any submission that fills it.

          `sr-only` and NOT `left: -9999px`. The old offset pushed the
          field 9999px outside its containing block, and on an RTL
          document that inflated the page's scroll width to ~11,000px
          on every render of this form — a 1px input dragging ten
          thousand pixels of phantom width behind it. `sr-only` is a
          1px clipped box at its own static position, so it costs the
          layout nothing, and it is already this codebase's way of
          keeping an input real but unseen (see `ui/Checkbox.jsx`).
          `aria-hidden` + `tabIndex={-1}` keep it away from screen
          readers and the tab order, which `sr-only` alone would not. */}
      <input
        type="text"
        name="_honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      {/* reCAPTCHA — the visible "أنا لست برنامج روبوت" box. The
          container is always in the document because Google measures
          it ON RENDER, and a `display:none` box renders a zero-size
          widget that can never be ticked. So the non-checkbox
          flavours take it OUT OF FLOW rather than hiding it, which
          also stops an empty div from eating one of the form's
          `gap-5` rows; the invisible badge is fixed-position and
          unaffected either way. */}
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
        <p role="alert" className="text-sm text-error-500">
          {CAPTCHA_PROMPT}
        </p>
      ) : null}

      <Button type="submit" variant="accent" size="lg" loading={status === 'pending'}>
        {status === 'pending' ? form.pendingLabel : form.submitLabel}
      </Button>

      {status === 'error' ? (
        <p role="status" className="text-sm text-error-500">
          {form.errorMessage}
        </p>
      ) : null}
    </form>
  );
}

export default ContactForm;
