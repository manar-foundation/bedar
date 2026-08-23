import { useEffect } from 'react';

import { useContent } from '@context/ContentContext.jsx';
import { env } from '@utils/env.js';

/* ================================================================
   SITE INTEGRATIONS — the half of §5 that was missing.

   The dashboard has had these four fields for a while
   (`/admin/integrations`). Nothing read them. This component is what
   turns them into behaviour:

     Google Tag Manager           the official snippet, on every page
     Search Console verification  <meta name="google-site-verification">
     Head code                    injected into <head>
     Footer code                  injected before </body>

   "It must be possible to edit or delete the Container ID from the
    dashboard at any time" and "all settings must be editable from
    the dashboard with no programming intervention" — so every value
    here comes from `ContentContext`, which reads `site_settings` and
    re-reads it when a save happens. There is one env fallback,
    `VITE_GTM_CONTAINER_ID`, for a deploy that wants the container
    fixed before anyone signs into the dashboard.

   MOUNTED ON THE PUBLIC SHELL ONLY
   ----------------------------------------------------------------
   `PublicLayout`, not `App`. §5 says "all pages of the SITE"; the
   dashboard is not the site. Loading GTM there would file an
   editor's afternoon of content edits as site traffic and skew every
   report the container feeds.

   YES, THIS EXECUTES ADMINISTRATOR-SUPPLIED CODE
   ----------------------------------------------------------------
   That is the requirement, in as many words: "the fields must
   support JavaScript and HTML, such as scripts and the code of
   analytics and tracking tools", and "must not be shown to visitors
   as text inside the page, but executed in the places designated for
   them". So this is not an accidental injection sink — it is a
   deliberate one, and it is gated accordingly:

     · `site_settings.integrations` is `min_role = 'admin'`, enforced
       in SQL by the `site_settings: write by row role` policy, which
       composes the role check with `has_required_aal()` — so writing
       it requires an ADMIN who has presented a second factor.
     · An editor cannot reach it at all; the Integrations screen
       disables the form rather than hiding it.

   It is the same trust boundary Webflow, WordPress and Shopify put
   around their own custom-code fields, and the reason `RichText`
   goes the other way for article bodies: an EDITOR authors those,
   and an editor is not trusted with script.
   ================================================================ */

/**
 * Containers installed on this page load.
 *
 * GTM is install-once and cannot be uninstalled: removing the script
 * element does not unload the container, its listeners or its
 * `dataLayer` hooks. So a changed id takes effect on the next full
 * page load rather than swapping live — the alternative is two
 * containers firing at once and every event counted twice.
 */
const installedContainers = new Set();

function installGtm(containerId) {
  if (!containerId || installedContainers.has(containerId)) return;
  if (document.querySelector(`script[data-bedar-gtm="${CSS.escape(containerId)}"]`)) return;
  installedContainers.add(containerId);

  // The official snippet, written with DOM calls instead of pasted
  // as a string. `dataLayer` is seeded BEFORE the loader so the
  // events `utils/analytics.js` may already have queued survive.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.dataset.bedarGtm = containerId;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);

  // The <noscript> half of Google's snippet. A visitor with
  // JavaScript disabled is not going to run any of the above, but
  // Tag Assistant checks for it and so do most audit tools.
  const noscript = document.createElement('noscript');
  noscript.dataset.bedarGtm = containerId;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

/** Keep exactly one meta tag with this name, or none. */
function syncMeta(name, content) {
  const selector = `meta[name="${name}"]`;
  const existing = document.head.querySelector(selector);

  if (!content) {
    if (existing?.dataset.bedarInjected) existing.remove();
    return;
  }
  if (existing) {
    existing.setAttribute('content', content);
    return;
  }
  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  meta.setAttribute('content', content);
  meta.dataset.bedarInjected = 'true';
  document.head.appendChild(meta);
}

/**
 * The source currently injected in each slot.
 *
 * Module scope, not component state, because the point is to survive
 * a REMOUNT: `PublicLayout` returns a different root element once the
 * content read settles (the loader branch is a fragment, the real
 * shell a div), so React unmounts this component and mounts a fresh
 * one — with the same settings and therefore the same dependency
 * values. Without this map the injection ran a second time there, and
 * an administrator's analytics snippet fired twice on every visit
 * that painted the cached snapshot first: two pageviews, two
 * conversions, from one visitor.
 */
const injectedCode = new Map();

/**
 * Adopt whatever `api/html.js` already wrote into the document.
 *
 * The server injects the same two slots from the same settings, and
 * records the exact source it used in `bedar-injected-code`. Seeding
 * the map from that is what makes the first client pass a NO-OP: the
 * markup is already on the page and its scripts have already run, so
 * re-injecting would execute an administrator's analytics snippet a
 * second time on the first paint of every visit.
 *
 * Comparing the SOURCE, not just "the server injected something", is
 * deliberate. The document is cached at the edge for a minute; if the
 * administrator saves a change inside that window the browser reads
 * the new settings while the HTML still carries the old code, and the
 * mismatch is what makes the client replace it.
 */
let adoptedFromServer = false;

function adoptServerInjection() {
  if (adoptedFromServer) return;
  adoptedFromServer = true;

  const state = document.getElementById('bedar-injected-code');
  if (!state) return;
  try {
    const parsed = JSON.parse(state.textContent);
    for (const slot of ['head', 'footer']) {
      if (typeof parsed[slot] === 'string') injectedCode.set(slot, parsed[slot]);
    }
  } catch {
    // A malformed marker just means no adoption: the client injects
    // as it did before, which is correct, only redundant.
  }
}

/**
 * Clear a slot, in both of the shapes it can arrive in.
 *
 * The browser stamps `data-bedar-code` on every node it injects, so
 * those come out with one query. The SERVER cannot: it writes the
 * administrator's markup verbatim, and adding an attribute to their
 * tags would mean parsing and re-serialising the very code we promise
 * to keep byte-for-byte. It brackets the run with two empty marker
 * elements instead, so removing it means sweeping everything BETWEEN
 * them — the markers alone would leave the code itself on the page
 * and the next injection would be a second copy.
 */
function removeSlot(slot) {
  const start = document.querySelector(`[data-bedar-code="${slot}"][data-bedar-code-edge="start"]`);

  if (start) {
    const doomed = [start];
    let closed = false;
    for (let node = start.nextSibling; node; node = node.nextSibling) {
      doomed.push(node);
      if (
        node.nodeType === 1 &&
        node.getAttribute('data-bedar-code') === slot &&
        node.getAttribute('data-bedar-code-edge') === 'end'
      ) {
        closed = true;
        break;
      }
    }
    // Only sweep the span once its END marker has actually been seen.
    // An unterminated run would otherwise take the rest of <head>
    // with it, which is a blank site rather than a stale tag.
    for (const node of closed ? doomed : [start]) node.remove();
  }

  for (const node of document.querySelectorAll(`[data-bedar-code="${slot}"]`)) node.remove();
}

/**
 * Inject an administrator's raw markup into `target`.
 *
 * Parsed with DOMParser rather than assigned to `innerHTML`:
 * DOMParser builds an inert document, so nothing runs until we
 * choose to move it — which matters because we then rebuild every
 * <script> deliberately. A script element created by `innerHTML` (or
 * cloned from a parsed document) NEVER executes; the browser only
 * runs one it saw inserted as a fresh element. Rebuilding is what
 * makes "must be executed in the places designated for them" true.
 */
function injectCode(code, target, slot) {
  adoptServerInjection();
  const source = typeof code === 'string' ? code : '';
  // Nothing is removed on unmount, so a slot that already carries
  // this exact source is already correct — and re-injecting it would
  // re-execute its scripts. The marker check is the safety net: if
  // the nodes went away, inject again rather than trust the map.
  const present = Boolean(document.querySelector(`[data-bedar-code="${slot}"]`));
  if (injectedCode.get(slot) === source && (present || !source.trim())) return;

  // Remove the previous generation first, so an edit replaces rather
  // than stacks. Scripts already executed cannot be undone — the
  // marker is what stops a THIRD copy appearing on the next save.
  removeSlot(slot);
  injectedCode.set(slot, source);
  if (!source.trim()) return;

  const parsed = new DOMParser().parseFromString(
    `<!doctype html><html><head>${source}</head><body></body></html>`,
    'text/html',
  );
  // Anything the parser refused to keep in <head> (a bare <div>, a
  // stray text node) lands in <body> — take both, in order.
  const nodes = [...parsed.head.childNodes, ...parsed.body.childNodes];

  for (const node of nodes) {
    let adopted;
    if (node.nodeName === 'SCRIPT') {
      adopted = document.createElement('script');
      for (const { name, value } of node.attributes) adopted.setAttribute(name, value);
      adopted.text = node.textContent;
    } else {
      adopted = document.importNode(node, true);
    }
    if (adopted.nodeType === 1) adopted.dataset.bedarCode = slot;
    target.appendChild(adopted);
  }
}

export function SiteIntegrations() {
  const { settings } = useContent();
  const integrations = settings?.integrations ?? {};

  const containerId = (integrations.gtmContainerId || env.gtmContainerId || '').trim();
  const verification = (integrations.searchConsoleVerification || '').trim();
  const headCode = integrations.headCode ?? '';
  const footerCode = integrations.footerCode ?? '';

  useEffect(() => {
    installGtm(containerId);
  }, [containerId]);

  useEffect(() => {
    syncMeta('google-site-verification', verification);
  }, [verification]);

  useEffect(() => {
    injectCode(headCode, document.head, 'head');
  }, [headCode]);

  useEffect(() => {
    injectCode(footerCode, document.body, 'footer');
  }, [footerCode]);

  // Renders nothing: everything it does happens in <head> and at the
  // end of <body>, which is where §5 asks for it.
  return null;
}

export default SiteIntegrations;
