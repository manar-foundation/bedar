/* ================================================================
   READING `site_settings` FROM A SERVERLESS FUNCTION.

   The endpoints in `api/` need three things the dashboard owns:
   whether a captcha is required (note ٤), the robots.txt body
   (note ٧), and the sitemap knobs (note ٨). All three are rows in
   `site_settings` with `is_public = true`, so they are readable over
   PostgREST with the ANON key — the same key and the same read path
   the public site already uses (`services/publicContent.js`).

   NO SERVICE-ROLE KEY. It bypasses every RLS policy in the project,
   and this repo's rule is that it never leaves the seed script
   (README, "Environment variables"). Everything these functions do
   is legal for `anon` under a policy written for it:

     read   `site_settings where is_public`   (migration 0007)
     read   published pages / collection_items (0005, 0006)
     write  `form_submissions`, insert only    (0011)

   ENV. `SUPABASE_URL` / `SUPABASE_ANON_KEY` without the VITE_ prefix
   are read first so the functions can be configured independently;
   the VITE_ copies are accepted as a fallback because they hold the
   same two public values and are already set in Vercel for the
   browser build. Neither is a secret.
   ================================================================ */

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  return { url: url.replace(/\/+$/, ''), anonKey, configured: Boolean(url && anonKey) };
}

/** One PostgREST GET with the anon key. Returns `null` on any failure. */
export async function restGet(path, { headers = {} } = {}) {
  const { url, anonKey, configured } = supabaseConfig();
  if (!configured) return null;

  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
        accept: 'application/json',
        ...headers,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** One PostgREST POST with the anon key. Throws so the caller can log. */
export async function restPost(path, body) {
  const { url, anonKey, configured } = supabaseConfig();
  if (!configured) throw new Error('Supabase is not configured for the API functions');

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
      // Insert-only under RLS: asking for the row back would need a
      // SELECT policy for anon, and there deliberately is not one.
      prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${detail}`);
  }
}

/**
 * One settings blob by key, or `{}`.
 *
 * Callers treat a missing row and an unconfigured backend the same
 * way — with their own default — so nothing here throws.
 */
export async function getSetting(key) {
  const rows = await restGet(
    `site_settings?key=eq.${encodeURIComponent(key)}&is_public=is.true&select=value&limit=1`,
  );
  const value = rows?.[0]?.value;
  return value && typeof value === 'object' ? value : {};
}
