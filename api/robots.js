import { readSetting } from '../lib/supabase-rest.js';
import { siteOrigin } from '../lib/site-url.js';

/* ================================================================
   GET /robots.txt  →  this handler (see the rewrite in vercel.json).

   CLIENT NOTES §7
   ----------------------------------------------------------------
   "Add a section inside the SEO settings to manage the robots.txt
    file… The content saved in this field must become the ACTUAL
    robots.txt of the site, available at /robots.txt, so the
    instructions can be changed entirely from the dashboard without
    touching the code."

   Which rules out the obvious implementation: a static file in
   `public/` is written at build time and cannot be edited from a
   dashboard. So the path is served by a function that reads the
   `seo` settings row on every request, and the file the crawler
   receives is literally the text in that field.

   `%SITE_URL%` is expanded to the origin the request arrived on.
   That is what lets the Sitemap line be correct on production and on
   every preview deploy from ONE stored value — see `lib/site-url.js`.

   FALLBACK. If the row is missing or Supabase is unreachable, the
   default below is served rather than a 500. A crawler that gets an
   error for robots.txt is entitled to treat the whole site as
   disallowed, so this endpoint must not be able to fail.
   ================================================================ */

const FALLBACK = 'User-agent: *\nAllow: /\n\nSitemap: %SITE_URL%/sitemap.xml\n';

export default async function handler(req, res) {
  const origin = siteOrigin(req);

  let body = FALLBACK;
  try {
    const seo = await readSetting('seo');
    const stored = typeof seo?.robotsTxt === 'string' ? seo.robotsTxt.trim() : '';
    if (stored) body = stored;
  } catch (err) {
    console.error('robots.txt: falling back to the default —', err.message);
  }

  const text = body.replace(/%SITE_URL%/g, origin);

  res.setHeader('content-type', 'text/plain; charset=utf-8');
  // Short cache with a long stale window: an edit in the dashboard
  // should take effect in minutes, but a crawler must never wait on
  // a cold function or a slow database read.
  res.setHeader('cache-control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400');
  return res.status(200).send(text.endsWith('\n') ? text : `${text}\n`);
}
