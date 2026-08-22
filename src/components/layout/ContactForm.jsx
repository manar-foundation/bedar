import { useState } from 'react';

import { Button, Input, Textarea } from '@components/ui';
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
   page. That endpoint emails the submission to the site inbox via
   Resend. When `onSubmit` is absent the form still degrades to its own
   error message rather than pretending to send.

   Phase 5 adds the `form_submission` dataLayer push on CONFIRMED
   success only, never on click (Dashboard spec §4.1). Captcha is
   configurable and mounts here too (`siteSettings.captcha`).

   The result is announced with `role="status"` — a colour change
   alone tells a screen reader user nothing.
   ================================================================ */

export function ContactForm({ form, onSubmit, className }) {
  const [status, setStatus] = useState('idle'); // idle | pending | success | error

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'pending') return;

    const data = Object.fromEntries(new FormData(event.currentTarget));
    setStatus('pending');
    try {
      if (!onSubmit) throw new Error('contact endpoint not configured');
      await onSubmit(data);
      setStatus('success');
    } catch {
      setStatus('error');
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
