import { canRead, selectPublic } from '../lib/supabase-rest.js';
import { siteOrigin } from '../lib/site-url.js';
import { injectIntoShell } from '../lib/head-injection.js';
import { mergeSettings } from '../src/utils/merge-settings.js';

/* ================================================================
   THE DOCUMENT — every HTML route is served from here.

   WHY A FUNCTION AND NOT THE STATIC SHELL
   ----------------------------------------------------------------
   Search Console's "HTML tag" verification is performed by a fetcher
   that reads the raw response and does not execute JavaScript. The
   site is a React SPA, so a `<meta name="google-site-verification">`
   written by `SiteIntegrations` after mount is correct in every
   inspector and invisible to the one client that has to see it. The
   property could never be verified that way.

   The same applies, more weakly, to the Organization JSON-LD and to
   anything an administrator pastes into the custom-code fields: they
   work when JavaScript runs, and every audit tool that reads source
   reports them missing.

   So the shell is served through here, and the values are written in
   before the response leaves the server. They still come from
   `site_settings` — the dashboard is still the only place any of it
   is edited (client notes §5, §6). Only the TIMING changed.

   THE BROWSER STILL DOES ITS HALF
   ----------------------------------------------------------------
   This is not server rendering of the app — it is head injection.
   `SiteIntegrations` and `SiteSchema` still run, and they now find
   the server's markers (`data-bedar-gtm`, `data-bedar-injected`,
   `data-bedar-code`, the schema's `id`, and the `bedar-injected-code`
   state block) and ADOPT what is already there instead of adding a
   second copy. That is what keeps an administrator's analytics
   snippet from firing twice, and it is why the markers in
   `lib/head-injection.js` are not decoration.

   IT MUST NOT BE ABLE TO FAIL
   ----------------------------------------------------------------
   This handler serves the whole site. A database that is slow,
   unreachable or misconfigured must cost the visitor the injected
   tags and nothing else — so every read is wrapped, and the shell is
   returned unmodified rather than a 500. The only unrecoverable case
   is not being able to fetch the shell at all, which cannot happen
   on a deployment the build produced.

   ROUTING. `vercel.json` rewrites every non-asset, non-API path here
   and the build emits the shell as `shell.html` rather than
   `index.html` — a file named `index.html` is matched by the
   platform's filesystem check BEFORE rewrites are considered, so `/`
   would bypass this function entirely and the homepage is precisely
   the page Search Console fetches.
   ================================================================ */

/** Not an error — the one route that must not be injected into. */
class SkipInjection extends Error {}

/** The built shell, cached for the life of the warm instance. */
let shellCache = null;

async function loadShell(origin) {
  if (shellCache) return shellCache;

  // Fetched from the deployment's own CDN rather than read off disk:
  // the build output is uploaded as static assets, and which of them
  // are visible to a function's filesystem is a platform detail this
  // does not need to depend on.
  for (const path of ['/shell.html', '/index.html']) {
    try {
      const res = await fetch(`${origin}${path}`);
      if (!res.ok) continue;
      const html = await res.text();
      if (!html.includes('</head>')) continue;
      shellCache = html;
      return html;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/** The public settings blobs, keyed as in `site_settings`. */
async function loadSettings() {
  if (!canRead()) return null;
  const rows = await selectPublic('site_settings?is_public=is.true&select=key,value');
  const out = {};
  for (const row of rows ?? []) out[row.key] = row.value;
  return out;
}

/**
 * The bundled logo's built URL, which the schema needs as its
 * fallback and only the build knows — the filename is fingerprinted
 * and changes on every deploy, so it cannot live in the database.
 * The build writes it into the shell; see the plugin in
 * `vite.config.js`.
 */
function logoFromShell(html) {
  const match = html.match(/<meta\s+name="bedar-logo"\s+content="([^"]+)"/i);
  return match ? match[1] : '';
}

/**
 * The dashboard is not the site.
 *
 * `SiteIntegrations` is mounted on `PublicLayout` and deliberately
 * not on the admin shell: loading the container there files an
 * editor's afternoon of content edits as site traffic and skews
 * every report it feeds. Injecting from the server would reintroduce
 * exactly that, on every dashboard page load, so `/admin` gets the
 * shell untouched — no tag manager, no custom code, no publisher
 * schema on a screen no crawler should be reading anyway.
 */
function isDashboard(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default async function handler(req, res) {
  const origin = siteOrigin(req);
  const shell = await loadShell(origin);

  if (!shell) {
    console.error('document: the built shell could not be fetched from', origin);
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return res.status(500).send('Site shell unavailable\n');
  }

  const pathname = (() => {
    try {
      return new URL(req.url, origin).pathname;
    } catch {
      return '/';
    }
  })();

  let html = shell;
  try {
    if (isDashboard(pathname)) throw new SkipInjection();
    const settings = mergeSettings(await loadSettings());
    html = injectIntoShell(shell, settings, {
      origin,
      fallbackLogo: logoFromShell(shell),
    });
  } catch (err) {
    // The page still works: the browser half injects everything from
    // the same settings a moment later. What is lost is only what a
    // non-executing fetcher would have seen.
    if (!(err instanceof SkipInjection)) {
      console.error('document: serving the shell without injection —', err.message);
    }
  }

  res.setHeader('content-type', 'text/html; charset=utf-8');
  // Short shared cache so an edit in the dashboard shows up quickly,
  // with a long stale window so no visitor ever waits on a cold
  // function or a slow settings read. The browser is told not to
  // hold its own copy — the CDN is the cache here, and a returning
  // visitor should get the current tags.
  res.setHeader('cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400');
  return res.status(200).send(html);
}
