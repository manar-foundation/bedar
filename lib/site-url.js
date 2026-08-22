/* ================================================================
   THE SITE'S OWN ORIGIN, as seen from a serverless function.

   `robots.txt` and `sitemap.xml` both have to emit ABSOLUTE URLs,
   and both are served from the same code on three kinds of host:
   production, a Vercel preview deployment, and `vercel dev` on a
   laptop. Hardcoding `https://bedar.org` would make every preview
   deploy publish a sitemap pointing at production — which, if it
   were ever crawled, is a sitemap that lies.

   Resolution order, most trustworthy first:

     SITE_URL / VITE_SITE_URL   an explicit answer from the
                                environment. Always wins: it is the
                                only source that knows the canonical
                                domain when the site sits behind a
                                proxy or a custom domain alias.
     x-forwarded-host + proto   what the platform says this request
                                arrived on. Correct for previews.
     host                       plain, for `vercel dev`.

   The forwarded headers are attacker-controllable in principle, so
   they are used only to build the site's OWN links — never to build
   a redirect target or anything a visitor is sent to.
   ================================================================ */

/** `https://bedar.org` — no trailing slash. */
export function siteOrigin(req) {
  const configured = (process.env.SITE_URL || process.env.VITE_SITE_URL || '').trim();
  if (configured) return configured.replace(/\/+$/, '');

  const headers = req?.headers ?? {};
  const host = String(headers['x-forwarded-host'] || headers.host || 'bedar.org')
    .split(',')[0]
    .trim();
  const proto = String(
    headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https'),
  )
    .split(',')[0]
    .trim();

  return `${proto}://${host}`.replace(/\/+$/, '');
}

export default { siteOrigin };
