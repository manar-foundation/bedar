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

/**
 * The origin THIS REQUEST actually arrived on — never the configured
 * canonical one.
 *
 * `siteOrigin` answers "what is this site called", which is the right
 * question for a `<loc>` or a schema `@id`. It is the WRONG question
 * for "where do I fetch my own build output from", and confusing the
 * two took production down: `VITE_SITE_URL` is `https://bedar.org`,
 * the domain is not pointed at the deployment yet, and `api/html.js`
 * went looking for its own shell on a host that answers 404 to
 * everything. Both candidates failed and every page returned 500.
 *
 * So this function deliberately ignores the environment. The
 * forwarded headers are attacker-controllable in principle, which is
 * exactly why the result is only ever used to fetch our own asset
 * back — never to build a link a visitor is sent to.
 */
export function requestOrigin(req) {
  const headers = req?.headers ?? {};
  const host = String(headers['x-forwarded-host'] || headers.host || '')
    .split(',')[0]
    .trim();
  if (!host) return '';
  const proto = String(
    headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https'),
  )
    .split(',')[0]
    .trim();
  return `${proto}://${host}`.replace(/\/+$/, '');
}

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

export default { siteOrigin, requestOrigin };
