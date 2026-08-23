/* ================================================================
   GOOGLE reCAPTCHA — the browser half (client notes §4).

   "Enable Google reCAPTCHA on every form on the site to stop
    automated messages and requests… Verification must be applied to
    every form BEFORE the request is accepted or saved in the
    database."

   This file only OBTAINS a token. It proves nothing on its own: a
   token is worth exactly as much as the server-side check that
   redeems it, which is `lib/recaptcha.js` calling Google's
   `siteverify` before `api/contact.js` and `api/newsletter.js` write
   anything. A front end that collects a token and an endpoint that
   ignores it is theatre.

   THE SECRET KEY IS NOT IN THIS FILE, and cannot be: everything
   under `src/` is compiled into the bundle every visitor downloads.
   It lives in `RECAPTCHA_SECRET_KEY` in the server environment. The
   SITE key is the opposite — it is transmitted to every visitor by
   design, so it is an ordinary dashboard setting.

   WHICH reCAPTCHA
   ----------------------------------------------------------------
   All three flavours are supported because the key is a dashboard
   setting and swapping it must not need a deploy (§5's whole
   premise). CHECKBOX is the default for a configuration that does
   not say — a visible "أنا لست برنامج روبوت" tick is what the client
   asked for, and it is the only flavour a visitor can see working.

     v2-checkbox   render a visible widget; the token exists only
                   once the visitor has ticked it.  ← the default
     v2-invisible  render a hidden widget, `execute` it, wait for the
                   callback to hand back a token. Shows a badge.
     v3            `execute(siteKey, { action })` — no widget, a
                   score the server thresholds.

   A KEY IS BOUND TO ONE FLAVOUR. A site key registered as v2
   invisible CANNOT render a checkbox and vice versa — Google's
   anchor refuses it and the widget shows "ERROR for site owner:
   Invalid key type", which fails the form for every visitor. So the
   version field and the site key must be changed TOGETHER, and
   changing one alone is the failure this comment exists to prevent.

   The key currently in `content/site.js` was probed against Google's
   anchor endpoint on its own registered domain (bedar.org):

     size=invisible → renders, no error
     size=normal    → "Invalid input"

   i.e. it is v2 INVISIBLE and cannot serve a checkbox. Moving the
   site to checkbox needs a NEW key pair from the reCAPTCHA admin
   console — a new SITE key here, and its matching SECRET key in
   `RECAPTCHA_SECRET_KEY`. The two halves are issued together and a
   secret from one pair never verifies a token from another.

   The script is loaded LAZILY, on first interaction with a form, not
   on page load: it is ~250 kB of third-party JavaScript that sets
   cookies, and a visitor who never touches a form should never pay
   for it — in performance or in privacy.
   ================================================================ */

import { CAPTCHA_VERSIONS } from './constants.js';

const SCRIPT_ID = 'bedar-recaptcha';

/** One in-flight load per page, whatever asks for it. */
let loadPromise = null;

/** Is a captcha actually configured and switched on? */
export function captchaEnabled(captcha) {
  return Boolean(captcha?.provider === 'recaptcha' && captcha?.siteKey);
}

/**
 * Which flavour to render. Anything unrecognised — including a
 * settings blob written before this field existed — is treated as
 * CHECKBOX, because a visible tick is the one mode whose failure a
 * visitor can see and recover from.
 */
export function captchaVersion(captcha) {
  const version = captcha?.version;
  return Object.values(CAPTCHA_VERSIONS).includes(version)
    ? version
    : CAPTCHA_VERSIONS.V2_CHECKBOX;
}

/**
 * Load `api.js` and resolve with `window.grecaptcha`.
 *
 * v3 needs the site key on the script URL; the v2 modes need
 * `render=explicit` so nothing is rendered until we ask. Because the
 * two URLs differ, the FIRST configuration to load wins for the life
 * of the page — which is correct, since a page only ever has one
 * captcha configuration.
 */
export function loadRecaptcha({ siteKey, version }) {
  if (loadPromise) return loadPromise;
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));

  loadPromise = new Promise((resolve, reject) => {
    const settle = () => {
      const api = window.grecaptcha;
      if (!api) {
        reject(new Error('grecaptcha unavailable'));
        return;
      }
      // `ready` guarantees the internal API is initialised. v3
      // exposes it immediately; v2 explicit exposes it after load.
      if (typeof api.ready === 'function') api.ready(() => resolve(api));
      else resolve(api);
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', settle, { once: true });
      if (window.grecaptcha) settle();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    const render = version === CAPTCHA_VERSIONS.V3 ? encodeURIComponent(siteKey) : 'explicit';
    // `hl=ar` so the badge and any challenge speak the site's language.
    script.src = `https://www.google.com/recaptcha/api.js?render=${render}&hl=ar`;
    script.addEventListener('load', settle, { once: true });
    script.addEventListener('error', () => {
      // Let a later attempt retry rather than caching the failure
      // for the life of the page.
      loadPromise = null;
      reject(new Error('reCAPTCHA script failed to load'));
    });
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Render a widget and return its id. v2 only — v3 has no widget.
 *
 * `container` must be in the document: Google measures it, and a
 * detached node renders a zero-size widget that never resolves.
 *
 * `compact` picks Google's narrow-column variant (164x144 instead of
 * 304x78). It exists because the checkbox widget DOES NOT REFLOW —
 * it is a fixed-width cross-origin iframe, so a column narrower than
 * it produces horizontal scroll rather than a wrapped widget. The
 * footer signup sits in a ~206px column and needs it; the contact
 * page has a full column and does not.
 */
export function renderWidget(api, { container, siteKey, version, compact, onToken, onExpired }) {
  return api.render(container, {
    sitekey: siteKey,
    size:
      version === CAPTCHA_VERSIONS.V2_INVISIBLE ? 'invisible' : compact ? 'compact' : 'normal',
    badge: 'bottomright',
    theme: 'dark',
    callback: onToken,
    'expired-callback': onExpired,
    'error-callback': onExpired,
  });
}

/* ── Telling "not ticked yet" apart from "genuinely broken" ─────
   A visitor who has not ticked the box has made an ordinary mistake
   and needs a prompt; a visitor whose script was blocked by an
   extension has hit a fault and needs a different sentence. Both
   arrive at the form's `catch` as an Error, so the reason travels on
   a `code` property rather than in a message the caller would have
   to string-match. */

export const CAPTCHA_INCOMPLETE = 'captcha-incomplete';

/** An expected failure: the widget is fine, the visitor has not used it. */
export function captchaIncompleteError() {
  const error = new Error('captcha not completed');
  error.code = CAPTCHA_INCOMPLETE;
  return error;
}

/** Did `getToken()` reject because the box is simply not ticked? */
export function isCaptchaIncomplete(error) {
  return error?.code === CAPTCHA_INCOMPLETE;
}

export default {
  captchaEnabled,
  captchaVersion,
  loadRecaptcha,
  renderWidget,
  captchaIncompleteError,
  isCaptchaIncomplete,
  CAPTCHA_INCOMPLETE,
};
