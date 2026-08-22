/* ================================================================
   ANALYTICS — the one place the site pushes to `dataLayer`.

   CLIENT NOTES §3
   ----------------------------------------------------------------
   "Each form gets its own setting where the administrator types the
    name of the Event to fire after the form is submitted
    successfully… These names will be used later in Google Analytics /
    Google Tag Manager to track conversions, so the Event name must
    NOT be fixed inside the code — it is fetched from the dashboard
    settings, independently per form."

   So there is no event name in this file. `eventNameFor` resolves it
   from `settings.integrations.formEvents[formKey]` and only falls
   back to the historical default when that field is still blank —
   which is the difference between a name a marketer can change in
   ten seconds and a name that needs a developer and a deploy.

   "IMPORTANT: the Event must fire only after the form has been sent
    successfully and the data saved, not merely when the send button
    is pressed."

   That guarantee is not enforceable from here — it is enforced by
   the CALLERS, which `await` the endpoint and push only from the
   resolved branch. `ContactForm` and `NewsletterForm` are the only
   two, and both are written that way.

   No `@supabase/supabase-js`, no dependencies: this ships in the
   public bundle.
   ================================================================ */

import { DATALAYER_EVENTS } from './constants.js';

/**
 * The GTM data layer, created if the container script has not run
 * yet.
 *
 * Pushing before GTM loads is safe and is the documented pattern:
 * the container replays whatever is already in the array when it
 * initialises, so an event fired during a slow script load is
 * queued rather than lost.
 */
function dataLayer() {
  if (typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/**
 * The event name this form should fire.
 *
 * @param {string} formKey  'contact' | 'newsletter' — see FORM_KEYS
 * @param {object} settings the merged site settings from ContentContext
 */
export function eventNameFor(formKey, settings) {
  const configured = settings?.integrations?.formEvents?.[formKey];
  const name = typeof configured === 'string' ? configured.trim() : '';
  return name || DATALAYER_EVENTS[formKey] || '';
}

/**
 * Push one event. No-op when the name is empty — an administrator who
 * has cleared the field has asked for no event, and pushing
 * `{ event: '' }` would be a row of noise in every GTM debug session.
 */
export function pushEvent(name, params = {}) {
  const layer = dataLayer();
  if (!layer || !name) return false;
  layer.push({ event: name, ...params });
  return true;
}

/**
 * The §3 call: a form was CONFIRMED submitted, fire its configured
 * event.
 *
 * Called from the success branch of a form's submit handler, after
 * the endpoint has resolved — never from the click handler.
 */
export function pushFormSuccess(formKey, settings, params = {}) {
  return pushEvent(eventNameFor(formKey, settings), { form: formKey, ...params });
}

export default { pushEvent, pushFormSuccess, eventNameFor };
