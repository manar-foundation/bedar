/* ================================================================
   Environment access, in one place.

   Only `VITE_*` variables exist in the browser bundle. Server-side
   secrets (service-role key, GitHub token, Netlify build hook) are
   NEVER read here — they live in Supabase Edge Functions, which is
   the whole reason the publish pipeline in Phase 6 goes through an
   Edge Function rather than calling the GitHub API from the client.
   ================================================================ */

const raw = import.meta.env;

export const env = {
  supabaseUrl: raw.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: raw.VITE_SUPABASE_ANON_KEY ?? '',
  siteUrl: raw.VITE_SITE_URL ?? 'https://bedar.org',
  siteName: raw.VITE_SITE_NAME ?? 'بدار',
  gtmContainerId: raw.VITE_GTM_CONTAINER_ID ?? '',
  isDev: raw.DEV,
  isProd: raw.PROD,
};

/**
 * True once a Supabase project is wired up. Until Phase 4 lands this
 * is false, and the app runs entirely off the local seed content in
 * `src/content/` — so the public site is fully buildable and
 * previewable with no backend.
 */
export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export default env;
