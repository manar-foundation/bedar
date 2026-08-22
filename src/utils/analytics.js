/* ================================================================
   ANALYTICS EVENTS — the dataLayer push after a form succeeds.
   (Client note ٣, Dashboard spec §4.1)

   THE RULE THE CLIENT WROTE TWICE
   ----------------------------------------------------------------
   1. The event NAME is not in the code. It comes from
      `integrations.formEvents.<form>` in the dashboard, one setting
      per form, because the names are what Google Tag Manager
      converts on and marketing has to be able to change them without
      a deploy:

        "يجب ألّا يكون اسم الـ Event ثابتًا داخل الكود، بل يتم جلبه
         من إعدادات لوحة التحكم لكل نموذج بشكل مستقل"

   2. It fires AFTER the submission succeeded and was stored — never
      on click:

        "يجب إطلاق الـ Event فقط بعد نجاح إرسال النموذج وحفظ
         البيانات، وليس بمجرد الضغط على زر الإرسال"

      That is why `trackFormSuccess` is called from the `await`
      RESOLUTION in each form component and nowhere near its submit
      handler's entry. The endpoint resolves only after the row is
      written and the mail is away; a rejection means no push, so a
      failed send can never be counted as a conversion.

   `window.dataLayer` is created here if GTM has not (yet) loaded.
   That is the documented GTM pattern: the array is a queue, and the
   container drains whatever is in it when it initialises — so an
   event fired during the second between page load and container load
   is delivered rather than lost.
   ================================================================ */

import { DATALAYER_EVENTS } from './constants.js';

/**
 * The configured event name for a form, or the built-in fallback.
 *
 * `settings` is `useContent().settings` — the merged settings blob,
 * so this reads the dashboard's value on the public site and the
 * seed's value when Supabase is unconfigured.
 */
export function formEventName(settings, form) {
  const configured = settings?.integrations?.formEvents?.[form];
  const name = typeof configured === 'string' ? configured.trim() : '';
  return name || DATALAYER_EVENTS[form] || '';
}

/**
 * Push one event onto the dataLayer.
 *
 * Silent no-op on an empty name: an admin who clears the field is
 * saying "do not track this form", and inventing a name for them
 * would send conversions they did not ask for.
 */
export function pushEvent(name, payload = {}) {
  if (!name || typeof window === 'undefined') return false;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...payload });
  return true;
}

/**
 * The one call site pattern for both forms.
 *
 *   await submit(...);          // resolves ONLY on a stored success
 *   trackFormSuccess(settings, FORM_KINDS.CONTACT);
 */
export function trackFormSuccess(settings, form, payload = {}) {
  return pushEvent(formEventName(settings, form), {
    form_id: form,
    ...payload,
  });
}
