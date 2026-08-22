import { getSetting } from '../lib/settings.js';

/* ================================================================
   GET /robots.txt — client note ٧.

   "يجب أن يتم إعتماد المحتوى المحفوظ في هذا الحقل كمحتوى ملف
    robots.txt الفعلي للموقع، والمتاح من خلال رابط في الموقع
    /robots.txt … دون الحاجة إلى تعديل الكود."

   So the file is not a file. `vercel.json` rewrites /robots.txt to
   this function, which serves whatever the dashboard's SEO screen
   has saved in `seo.robotsTxt`. Editing the field and saving is the
   whole deployment.

   WHY NOT A STATIC public/robots.txt
   ----------------------------------------------------------------
   Because then editing it would be a commit and a deploy, which is
   exactly what the requirement rules out. Note also that a file at
   `public/robots.txt` would WIN over this rewrite — if one is ever
   added, this endpoint silently stops being the source of truth.

   THE SITEMAP LINE
   ----------------------------------------------------------------
   Appended rather than typed into the field, and only when the field
   does not already carry one. `Sitemap:` is how Search Console
   discovers the file without a manual submission, and an editor
   rewriting their crawl rules should not be able to drop it by
   accident. The toggle exists for the case where they mean to.

   CACHING. Five minutes at the CDN with `stale-while-revalidate`:
   long enough that crawlers are not hitting the database, short
   enough that "I saved it and it is not live" is never true for
   more than a coffee.
   ================================================================ */

const FALLBACK = 'User-agent: *\nAllow: /\n';

/** The canonical origin, for the absolute Sitemap URL. */
export function siteOrigin() {
  const raw = process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://bedar.org';
  return raw.replace(/\/+$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method not allowed');
  }

  const seo = await getSetting('seo');

  // An empty saved value falls back to the permissive default rather
  // than serving a blank file. A blank robots.txt is legal and means
  // "allow everything", but it reads as a mistake to anyone who
  // opens it — and an editor who cleared the box by accident should
  // not silently ship one.
  const body = String(seo.robotsTxt ?? '').trim() || FALLBACK;

  const includeSitemap = seo.robotsIncludeSitemap !== false;
  const hasSitemapLine = /^\s*sitemap\s*:/im.test(body);

  const output =
    includeSitemap && !hasSitemapLine
      ? `${body.replace(/\s*$/, '')}\n\nSitemap: ${siteOrigin()}/sitemap.xml\n`
      : `${body.replace(/\s*$/, '')}\n`;

  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(output);
}
