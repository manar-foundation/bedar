/* ================================================================
   UTM TRACKING — one module, whole site.

   1. CAPTURE   utm_source / medium / campaign / content / term are
                read from the address bar and kept in first-party
                cookies for 30 days, so they survive navigation to
                pages whose URL no longer carries them.
   2. LAST TOUCH  one cookie PER parameter. A new visit that carries
                only `utm_source` overwrites only `utm_source`; the
                rest keep their values. A URL with no UTM at all
                writes nothing.
   3. FORWARD   a single delegated listener on `document` finds any
                link to Zoho Forms at click time and merges the
                stored values into its query string. No button is
                touched or marked — a link added tomorrow, from the
                dashboard or in code, is covered automatically, and
                it keeps opening wherever it already opened (new tab).

   CONSENT
   ----------------------------------------------------------------
   The cookies are written only while consent is not refused. The
   site has no banner yet, so "not refused" is the default; the
   banner (or a CMP) should call `setTrackingConsent(false)` on
   refusal, which also deletes whatever is stored. While consent is
   refused the values are held in memory for the current page only,
   so a visitor who declined still registers normally and is never
   tracked across pages.

   No dependencies: this ships in the public bundle.
   ================================================================ */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

const COOKIE_PREFIX = 'bedar_';
const MAX_AGE_DAYS = 30;
const MAX_VALUE_LENGTH = 256;
const CONSENT_KEY = 'bedar_tracking_consent';

/** Zoho Forms hosts: forms.zohopublic.eu, forms.zoho.com, zfrmz.com … */
const ZOHO_HOST = /(^|\.)(zohopublic|zfrmz)\.[a-z.]+$|(^|\.)forms\.zoho\.[a-z.]+$/i;

/** Held in memory when cookies are refused or unavailable. */
const memory = {};

/* ------------------------------ consent ----------------------- */

export function hasTrackingConsent() {
  try {
    return window.localStorage.getItem(CONSENT_KEY) !== 'denied';
  } catch {
    return true;
  }
}

/** Call from a consent banner. `false` also clears stored UTM data. */
export function setTrackingConsent(granted) {
  try {
    window.localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    /* storage unavailable — consent defaults apply */
  }
  if (!granted) clearUtm();
}

/* ------------------------------ cookies ----------------------- */

function readCookie(name) {
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return '';
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return '';
  }
}

function writeCookie(name, value, days) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = days > 0 ? Math.round(days * 86400) : 0;
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function clampValue(raw) {
  return String(raw ?? '').trim().slice(0, MAX_VALUE_LENGTH);
}

/* ------------------------------ capture ----------------------- */

/**
 * Store the UTM parameters present in `search`; leave the others
 * alone. Returns the keys that were updated.
 */
export function captureUtm(search = window.location.search) {
  const params = new URLSearchParams(search);
  const consent = hasTrackingConsent();
  const updated = [];

  for (const key of UTM_KEYS) {
    const value = clampValue(params.get(key));
    if (!value) continue;
    memory[key] = value;
    if (consent) writeCookie(COOKIE_PREFIX + key, value, MAX_AGE_DAYS);
    updated.push(key);
  }
  return updated;
}

/** The stored attribution, only the keys that have a value. */
export function getStoredUtm() {
  const out = {};
  const consent = hasTrackingConsent();
  for (const key of UTM_KEYS) {
    const value = (consent && readCookie(COOKIE_PREFIX + key)) || memory[key] || '';
    if (value) out[key] = value;
  }
  return out;
}

export function clearUtm() {
  for (const key of UTM_KEYS) {
    delete memory[key];
    writeCookie(COOKIE_PREFIX + key, '', 0);
  }
}

/* ------------------------------ forwarding -------------------- */

export function isZohoFormsUrl(url) {
  return (
    url instanceof URL &&
    (url.protocol === 'https:' || url.protocol === 'http:') &&
    ZOHO_HOST.test(url.hostname)
  );
}

/**
 * `href` with the stored UTM values merged in. Parameters already on
 * the URL win (an editor may have pinned one on purpose), everything
 * else is preserved, and values are encoded by `URLSearchParams`.
 * Returns `href` unchanged when there is nothing to add.
 */
export function withUtm(href, stored = getStoredUtm()) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return href;
  }
  if (!isZohoFormsUrl(url)) return href;

  let changed = false;
  for (const [key, value] of Object.entries(stored)) {
    if (url.searchParams.has(key)) continue;
    url.searchParams.set(key, value);
    changed = true;
  }
  return changed ? url.toString() : href;
}

/** Rewrite one anchor in place, if it points at Zoho Forms. */
function decorateAnchor(anchor) {
  const href = anchor.getAttribute('href');
  if (!href) return;
  const next = withUtm(href);
  if (next !== href) anchor.setAttribute('href', next);
}

function anchorFromEvent(event) {
  const target = event.target;
  return target instanceof Element ? target.closest('a[href]') : null;
}

/* ------------------------------ install ----------------------- */

let installed = false;

/**
 * Capture the landing URL and install the global link decorator.
 * Idempotent. Rewriting happens on every way a link can be opened —
 * click, middle-click, context menu, keyboard focus — so
 * "open in new tab" from the menu carries the values too.
 */
export function initUtmTracking() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  captureUtm();

  const handler = (event) => {
    const anchor = anchorFromEvent(event);
    if (anchor) decorateAnchor(anchor);
  };
  for (const type of ['click', 'auxclick', 'contextmenu', 'pointerdown', 'focusin']) {
    document.addEventListener(type, handler, true);
  }
}
