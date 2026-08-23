import { organizationSchemaJson } from '../src/utils/organization-schema.js';

/* ================================================================
   SERVER-SIDE HEAD INJECTION (client notes §5, §6)

   `components/layout/SiteIntegrations.jsx` already puts all of this
   into the DOM from the browser, and for GTM, the custom code and
   the JSON-LD that is enough — a tag manager is a script either way,
   and Googlebot renders JavaScript before reading structured data.

   IT IS NOT ENOUGH FOR SEARCH CONSOLE.
   ----------------------------------------------------------------
   Verification by "HTML tag" is checked by a fetcher that reads the
   raw response and does NOT execute JavaScript. A meta tag written
   by React after mount is invisible to it, so the client's own
   `<meta name="google-site-verification">` could never verify the
   property no matter how correct it looked in the inspector.

   So the document is served through `api/html.js`, which asks the
   database for the same `site_settings` rows the browser reads and
   writes the result into the HTML before it leaves the server. The
   values still come from the dashboard and nothing here is
   hardcoded — the only change is WHEN the injection happens.

   EVERYTHING EMITTED HERE CARRIES A MARKER
   ----------------------------------------------------------------
   `data-bedar-gtm`, `data-bedar-injected`, `data-bedar-code` and the
   schema's `id` are the same markers the browser half looks for, so
   it adopts what the server already sent instead of adding a second
   copy. `bedar-injected-code` records the exact custom-code source
   that was written, which is what lets the browser tell "already on
   the page" from "the administrator has since changed it".

   RAW MEANS RAW. The two custom-code fields are emitted verbatim —
   "the codes must be saved exactly as entered, without modifying
   their content". They are admin-only and 2FA-gated in SQL; see the
   header of `SiteIntegrations.jsx` for why that is the right trust
   boundary and not an oversight.
   ================================================================ */

/** Escape for use inside a double-quoted HTML attribute. */
function attr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape a JSON payload for embedding in a <script> element. */
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Markup for the end of `<head>`.
 *
 * @param settings       merged site settings (organization, social,
 *                       integrations)
 * @param options.origin absolute origin of this request, for schema
 *                       URLs
 * @param options.fallbackLogo  built URL of the bundled mark
 */
export function buildHeadMarkup(settings, { origin = '', fallbackLogo = '' } = {}) {
  const integrations = settings?.integrations ?? {};
  const parts = [];

  const verification = trimmed(integrations.searchConsoleVerification);
  if (verification) {
    // `data-bedar-injected` so the browser half will REMOVE this tag
    // if the administrator later clears the field.
    parts.push(
      `<meta name="google-site-verification" content="${attr(verification)}" data-bedar-injected="true">`,
    );
  }

  const containerId = trimmed(integrations.gtmContainerId);
  if (containerId) {
    // Google's official snippet. `dataLayer` is seeded before the
    // loader so anything queued survives, exactly as the browser
    // half does it.
    parts.push(
      `<script data-bedar-gtm="${attr(containerId)}">` +
        `window.dataLayer=window.dataLayer||[];` +
        `window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});` +
        `</script>`,
      `<script async data-bedar-gtm="${attr(containerId)}" ` +
        `src="https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}"></script>`,
    );
  }

  // Organization JSON-LD, from the same builder the browser uses.
  parts.push(
    `<script id="bedar-organization-schema" type="application/ld+json">` +
      `${organizationSchemaJson(settings, { siteUrl: origin, fallbackLogo })}` +
      `</script>`,
  );

  const headCode = integrations.headCode ?? '';
  const footerCode = integrations.footerCode ?? '';

  // What the browser half needs to know it is looking at its own
  // output. Emitted even when both fields are empty: "the server
  // injected nothing" is also a fact worth stating, and it stops the
  // client re-running an empty slot.
  parts.push(
    `<script id="bedar-injected-code" type="application/json">` +
      `${scriptJson({ head: headCode, footer: footerCode })}` +
      `</script>`,
  );

  if (headCode.trim()) parts.push(wrapSlot(headCode, 'head'));

  return parts.join('\n    ');
}

/** Markup for immediately after the opening `<body>` tag. */
export function buildBodyOpenMarkup(settings) {
  const containerId = trimmed(settings?.integrations?.gtmContainerId);
  if (!containerId) return '';
  // Google puts the <noscript> first in <body>. A visitor with
  // JavaScript off runs none of the above, but Tag Assistant checks
  // for it and so do most audit tools.
  return (
    `<noscript data-bedar-gtm="${attr(containerId)}">` +
    `<iframe src="https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}" ` +
    `height="0" width="0" style="display:none;visibility:hidden"></iframe>` +
    `</noscript>`
  );
}

/** Markup for immediately before `</body>`. */
export function buildBodyCloseMarkup(settings) {
  const footerCode = settings?.integrations?.footerCode ?? '';
  return footerCode.trim() ? wrapSlot(footerCode, 'footer') : '';
}

/**
 * Mark a raw custom-code slot so the browser half can find it.
 *
 * The code is NOT parsed or rewritten — it is bracketed by two empty
 * marker elements instead. Adding `data-bedar-code` to the author's
 * own tags would mean parsing and re-serialising their markup, which
 * is precisely the "saved and executed exactly as entered" promise
 * this feature makes.
 */
function wrapSlot(code, slot) {
  return (
    `<meta data-bedar-code="${slot}" data-bedar-code-edge="start">\n` +
    `${code}\n` +
    `<meta data-bedar-code="${slot}" data-bedar-code-edge="end">`
  );
}

/**
 * Write all of the above into the built shell.
 *
 * String surgery rather than a DOM parse: the shell is our own build
 * output with a known shape, and running an administrator's raw
 * script through a parser and back out is how "verbatim" stops being
 * true.
 */
export function injectIntoShell(html, settings, options) {
  const head = buildHeadMarkup(settings, options);
  const bodyOpen = buildBodyOpenMarkup(settings);
  const bodyClose = buildBodyCloseMarkup(settings);

  let out = html;

  if (head) out = out.replace('</head>', `  ${head}\n  </head>`);
  if (bodyOpen) out = out.replace(/<body([^>]*)>/i, (match) => `${match}\n    ${bodyOpen}`);
  if (bodyClose) out = out.replace('</body>', `    ${bodyClose}\n  </body>`);

  return out;
}

export default { buildHeadMarkup, buildBodyOpenMarkup, buildBodyCloseMarkup, injectIntoShell };
