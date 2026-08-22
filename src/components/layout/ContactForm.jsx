import { useState } from 'react';

import { Button, Input, Textarea } from '@components/ui';
import { useContent } from '@context/ContentContext.jsx';
import { useCaptcha } from '@hooks/useCaptcha.js';
import { pushFormSuccess } from '@utils/analytics.js';
import { FORM_KEYS } from '@utils/constants.js';
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
   1. A reCAPTCHA token is minted (client notes §4). The token is
      obtained BEFORE the request, and the endpoint verifies it with
      Google before it saves anything — this side alone
      proves nothing.
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
  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const { settings } = useContent();
  const {
    mount: mountCaptcha,
    getToken: getCaptchaToken,
    reset: resetCaptcha,
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
    } catch {
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
          in the DOM but off-screen (not display:none, which some bots
          and autofill skip). The endpoint silently drops any
          submission that fills it. */}
      <input
        type="text"
        name="_honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />

      {/* reCAPTCHA. The container is always in the document because
          Google measures it on render; for the invisible flavour it
          occupies nothing and the badge floats bottom-left of the
          viewport instead. */}
      <div ref={mountCaptcha} className="empty:hidden" />

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
