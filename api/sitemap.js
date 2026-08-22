import { getSetting, restGet } from '../lib/settings.js';
import { siteOrigin } from './robots.js';

/* ================================================================
   GET /sitemap.xml — client note ٨.

   "إنشاء XML Sitemap ديناميكية للموقع ومتاحة من خلال رابط ثابت …
    يجب أن تتحدث الـ Sitemap تلقائيًا بحسب المحتوى المنشور في
    الموقع، بحيث تتم إضافة وحذف وتحديث روابط الصفحات والمحتوى بشكل
    آلي. كما يجب مراعاة خيار استبعاد من Sitemap الموجود في إعدادات
    الصفحات."

   Three requirements, three mechanisms:

   AUTOMATIC     The file is generated per request from `pages` and
                 `collection_items`, so publishing an article adds
                 its URL and unpublishing removes it with no deploy
                 and no build step. `lastmod` comes from the row's
                 own `updated_at`.

   PUBLISHED     `state=eq.published`, enforced twice — the filter
                 here, and the RLS policies that only expose
                 published rows to `anon` (migrations 0005, 0006).
                 A draft can therefore never leak into the sitemap
                 even if this filter were dropped.

   EXCLUDED      `is_hidden_from_search=is.false`. That is the SAME
                 single switch the page and item editors already show
                 as "إخفاء من محركات البحث" — spec §2 made it one
                 control that both adds `noindex` and drops the URL
                 from here, because two switches is how a page ends
                 up noindexed and still submitted for crawling.

   ROUTES THAT ARE NOT ROWS
   ----------------------------------------------------------------
   `/programs/hackathon` renders from `content/hackathon.js` and the
   listing routes exist in `routes.jsx`, so a database that has not
   been seeded would produce a sitemap missing the site's main pages.
   `STATIC_PATHS` is the floor: every one is emitted unless a row
   already covers that path (a row's `lastmod` and its exclusion flag
   are better information), and unless a published row for the same
   path is hidden.
   ================================================================ */

/** Routes that always exist in `routes.jsx`. Deduped against rows. */
const STATIC_PATHS = [
  '/',
  '/about',
  '/social-entrepreneurship',
  '/services',
  '/programs',
  '/blog',
  '/news',
  '/contact-us',
];

/** XML text escaping. An & in a query string is the usual offender. */
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** W3C datetime, which is what `<lastmod>` wants. */
function lastmod(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** `/blog/x` → `https://bedar.org/blog/x`, with `/` staying bare. */
function absolute(origin, path) {
  const clean = String(path ?? '').trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  return `${origin}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method not allowed');
  }

  const origin = siteOrigin();
  const seo = await getSetting('seo');
  const changefreq = String(seo.sitemapChangefreq ?? 'weekly');
  const priority = String(seo.sitemapPriority ?? '0.7');

  const [pages, items] = await Promise.all([
    restGet(
      'pages?state=eq.published&is_hidden_from_search=is.false' +
        '&select=path,updated_at&order=position.asc',
    ),
    restGet(
      'collection_items?state=eq.published&is_hidden_from_search=is.false' +
        '&select=path,collection,slug,updated_at,published_at' +
        '&order=published_at.desc.nullslast',
    ),
  ]);

  /* A path a published row has EXCLUDED must not be re-added by the
     static floor. Read separately from the included rows, because
     "not in the included list" cannot tell "excluded" from "not in
     the database at all" — and the floor exists precisely for the
     second case. */
  const hidden = await restGet(
    'pages?state=eq.published&is_hidden_from_search=is.true&select=path',
  );
  const excluded = new Set((hidden ?? []).map((row) => row.path).filter(Boolean));

  const urls = new Map();

  const add = (path, updated) => {
    const clean = absolute(origin, path);
    if (!clean || urls.has(clean)) return;
    urls.set(clean, lastmod(updated));
  };

  for (const row of pages ?? []) add(row.path, row.updated_at);

  for (const row of items ?? []) {
    const path = row.path || defaultPath(row.collection, row.slug);
    add(path, row.updated_at ?? row.published_at);
  }

  // The floor, last, so a real row always wins on `lastmod`.
  for (const path of STATIC_PATHS) {
    if (excluded.has(path)) continue;
    add(path, null);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...urls.entries()]
      .map(
        ([url, modified]) =>
          `  <url>\n` +
          `    <loc>${escapeXml(url)}</loc>\n` +
          (modified ? `    <lastmod>${escapeXml(modified)}</lastmod>\n` : '') +
          `    <changefreq>${escapeXml(changefreq)}</changefreq>\n` +
          `    <priority>${escapeXml(priority)}</priority>\n` +
          `  </url>`,
      )
      .join('\n') +
    `\n</urlset>\n`;

  res.setHeader('content-type', 'application/xml; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=1800');
  return res.status(200).send(xml);
}

/** Mirrors `defaultHref` in services/publicContent.js. */
function defaultPath(collection, slug) {
  const base = collection === 'articles' ? 'blog' : collection === 'news' ? 'news' : 'programs';
  return `/${base}/${slug}`;
}
