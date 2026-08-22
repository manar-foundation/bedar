import { canRead, readSetting, selectPublic } from '../lib/supabase-rest.js';
import { siteOrigin } from '../lib/site-url.js';

/* ================================================================
   GET /sitemap.xml  →  this handler (see the rewrite in vercel.json).

   CLIENT NOTES §8
   ----------------------------------------------------------------
   "Create a DYNAMIC XML sitemap available at a fixed URL such as
    /sitemap.xml. The sitemap must update automatically according to
    the content published on the site, so pages and content are
    added, removed and updated automatically. The 'exclude from
    sitemap' option in the page settings must be respected, so no
    page with that option enabled is added to the sitemap."

   Three requirements, three mechanisms:

   DYNAMIC     Built per request from `pages` and `collection_items`
               rather than generated at build time. Publishing an
               article changes the sitemap on the next crawl, with no
               deploy — which is the difference between "automatic"
               and "automatic if someone remembers to redeploy".

   PUBLISHED   `state = 'published'` is filtered in the query AND
               enforced by RLS for the anon key, so a draft cannot
               appear even if this query were wrong. Unpublishing an
               item removes its URL on the next read.

   EXCLUDED    `is_hidden_from_search` is the single switch the
               dashboard already exposes — the one that adds
               `noindex` AND drops the page from here (Dashboard spec
               §2, and the `pages` migration says the same). It is
               filtered on both tables. `seo.sitemapExcludePaths`
               covers anything else an administrator wants withheld.

   The sitemap is a document about the site's own URLs, so it never
   needs privilege: everything is read with the anon key.
   ================================================================ */

/** Routes that exist in code with no database row behind them. */
const STATIC_FALLBACK = [
  '/',
  '/about',
  '/social-entrepreneurship',
  '/programs',
  '/services',
  '/blog',
  '/news',
  '/contact-us',
];

/**
 * The canonical form of a stored path.
 *
 * Two of the migrated programmes are stored under the legacy
 * singular `/program/:slug`, which `vercel.json` 301s to the plural.
 * A sitemap that lists a URL which redirects is a sitemap that
 * wastes crawl budget and reports a warning in Search Console, so
 * the canonical target is listed instead of the stored path.
 */
function canonicalPath(path) {
  const value = String(path ?? '').trim();
  if (!value.startsWith('/')) return '';
  const plural = value.replace(/^\/program\//, '/programs/');
  // A trailing slash on anything but the root is a second URL for
  // the same page.
  return plural.length > 1 ? plural.replace(/\/+$/, '') : '/';
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** An absolute, percent-encoded, XML-safe `<loc>`. */
function loc(origin, path) {
  // Arabic slugs are legal here (`collection_items_slug_shape` only
  // forbids whitespace and slashes), and a sitemap must carry them
  // percent-encoded.
  return xmlEscape(encodeURI(`${origin}${path === '/' ? '' : path}`) || origin);
}

function isoDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export default async function handler(req, res) {
  const origin = siteOrigin(req);

  /** path → lastmod, deduplicated: a path may only appear once. */
  const urls = new Map();
  const add = (path, lastmod) => {
    const clean = canonicalPath(path);
    if (!clean) return;
    const existing = urls.get(clean);
    // Keep the most recent lastmod when two rows resolve to one URL.
    if (!existing || (lastmod && lastmod > existing)) urls.set(clean, lastmod || existing || '');
  };

  let excluded = [];
  let live = false;

  if (canRead()) {
    try {
      const seo = await readSetting('seo').catch(() => null);
      if (seo && seo.sitemapEnabled === false) {
        // An administrator has switched the sitemap off. Answer 404
        // rather than an empty <urlset>, which Search Console reads
        // as "every URL was removed".
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        return res.status(404).send('Sitemap disabled\n');
      }
      excluded = Array.isArray(seo?.sitemapExcludePaths) ? seo.sitemapExcludePaths : [];

      const [pages, items] = await Promise.all([
        selectPublic(
          'pages?state=eq.published&is_hidden_from_search=is.false' +
            '&select=path,updated_at&order=path.asc',
        ),
        selectPublic(
          'collection_items?state=eq.published&is_hidden_from_search=is.false' +
            '&select=path,updated_at,published_at&order=published_at.desc.nullslast',
        ),
      ]);

      for (const page of pages ?? []) add(page.path, isoDate(page.updated_at));
      for (const item of items ?? []) {
        add(item.path, isoDate(item.updated_at || item.published_at));
      }
      live = urls.size > 0;
    } catch (err) {
      console.error('sitemap: falling back to static routes —', err.message);
    }
  }

  // Nothing published, or nothing reachable. The site still has its
  // built-in routes, and a sitemap listing them beats a 500.
  if (!live) for (const path of STATIC_FALLBACK) add(path, '');

  const blocked = excluded.map((path) => canonicalPath(path)).filter(Boolean);

  const body = [...urls.entries()]
    // A prefix match, so excluding `/admin` also excludes everything
    // under it — which is how an administrator would expect a path
    // exclusion to behave.
    .filter(([path]) => !blocked.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)))
    .map(([path, lastmod]) => {
      const stamp = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${loc(origin, path)}</loc>${stamp}\n  </url>`;
    })
    .join('\n');

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${body}\n` +
    '</urlset>\n';

  res.setHeader('content-type', 'application/xml; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
