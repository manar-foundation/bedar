import { createClient } from '@supabase/supabase-js';

import { env, hasSupabase } from '@utils/env.js';

/**
 * The single Supabase client for the whole app.
 *
 * `null` until a project is configured (Phase 4). Every caller must
 * handle that — `hasSupabase` is the guard. This keeps the public
 * site fully buildable and previewable off local seed content before
 * the backend exists, instead of throwing at module load.
 *
 * Only the anon key is ever used here. It is public by design and
 * safe in the bundle *because* RLS is on for every table; the
 * service-role key must never appear in client code.
 */
export const supabase = hasSupabase
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'bedar.auth',
      },
      // `cache: 'no-store'` on every request, for the same reason
      // `publicContent.js` sets it on its plain-fetch reader: PostgREST
      // sends no cache-control headers, so a list GET can be served from
      // the browser's disk cache and show STALE rows. That is invisible
      // during normal editing — a create/edit/delete reloads the same
      // list the mutation just changed — but it bites when a row is
      // changed on ANOTHER screen: restoring a deleted item from the
      // version history writes it back, yet returning to its section
      // rendered the cached list without it until a hard refresh. A
      // no-op for auth (its calls are POSTs, never cached); it only
      // makes reads always re-read the database.
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    })
  : null;

/** Throw a clear error instead of `Cannot read properties of null`. */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase غير مهيأ. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY إلى ملف .env',
    );
  }
  return supabase;
}

export { hasSupabase };
export default supabase;
