/* ================================================================
   SUPABASE OVER REST — the server-side half, for the `api/` handlers.

   The same idea as `src/services/publicContent.js` (plain `fetch`
   against PostgREST, no `@supabase/supabase-js`) and for a stronger
   reason here: these modules run in the Vercel serverless runtime,
   where a 53 kB dependency is cold-start latency on every request
   and buys nothing — there is no auth session and no realtime
   socket to manage.

   TWO KEYS, TWO JOBS
   ----------------------------------------------------------------
   anon          reads public rows. Used for `site_settings` (the
                 robots.txt body), `pages` and `collection_items`
                 (the sitemap). RLS already limits it to published
                 rows, so nothing here needs privilege.

   service-role  writes `form_submissions`. That table has NO anon
                 policy at all — deliberately: an anon INSERT policy
                 would be an unauthenticated write endpoint into the
                 project's database, reachable by anyone with the
                 anon key that ships in the bundle. The write lives
                 behind these functions instead, after the captcha
                 and honeypot checks.

   The service-role key BYPASSES EVERY RLS POLICY. It is read from
   the environment, it is never prefixed `VITE_` (that prefix
   publishes a variable to every visitor), and nothing under `src/`
   may import this file — Vite never sees `lib/`, which is why it
   lives here and not there.
   ================================================================ */

/**
 * The project URL.
 *
 * `SUPABASE_URL` first, then the `VITE_` copy: a Vercel project has
 * the VITE_ variables set already (the browser bundle needs them),
 * and serverless functions can read any variable regardless of
 * prefix. Accepting both means the deploy does not have to duplicate
 * a value that is public anyway.
 */
function projectUrl() {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
}

function anonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

/** Can this runtime read published content? */
export function canRead() {
  return Boolean(projectUrl() && anonKey());
}

/** Can this runtime write a submission? */
export function canWrite() {
  return Boolean(projectUrl() && serviceKey());
}

async function request(path, { method = 'GET', key, body, headers = {} } = {}) {
  const url = `${projectUrl()}/rest/v1/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const error = new Error(`Supabase REST ${res.status}: ${detail}`);
    error.status = res.status;
    error.detail = detail;
    throw error;
  }
  // 201/204 from an insert with `return=minimal` has no body.
  return res.json().catch(() => null);
}

/** A published-content read with the anon key. */
export function selectPublic(path) {
  if (!canRead()) throw new Error('Supabase is not configured for reads');
  return request(path, { key: anonKey() });
}

/** One `site_settings` row's value, or `null`. */
export async function readSetting(key) {
  const rows = await selectPublic(
    `site_settings?key=eq.${encodeURIComponent(key)}&is_public=is.true&select=value&limit=1`,
  );
  return rows?.[0]?.value ?? null;
}

/**
 * Insert with the service-role key.
 *
 * `Prefer: return=representation` so the caller can log the new id;
 * `resolution=merge-duplicates` is passed by the newsletter endpoint,
 * where re-submitting the same address must update the existing row
 * rather than fail on the unique index.
 */
export function insertRow(table, row, { onConflict, merge = false } = {}) {
  if (!canWrite()) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  const query = onConflict ? `${table}?on_conflict=${encodeURIComponent(onConflict)}` : table;
  return request(query, {
    method: 'POST',
    key: serviceKey(),
    body: [row],
    headers: {
      prefer: `return=representation${merge ? ',resolution=merge-duplicates' : ''}`,
    },
  });
}

export default { canRead, canWrite, selectPublic, readSetting, insertRow };
