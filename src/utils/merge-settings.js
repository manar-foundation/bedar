// Relative, not `@content/…`: the Vite aliases do not exist in the
// Vercel serverless runtime, and `api/html.js` imports this module to
// build the SAME settings object the browser builds.
import { siteSettings } from '../content/site.js';

/* ================================================================
   SETTINGS MERGE — one implementation, two runtimes.

   `site_settings` holds one jsonb blob per concern and the seed in
   `content/site.js` is the floor under all of them: a key the
   database has no value for keeps its seeded copy instead of going
   blank. `ContentContext` has always done this for the browser.

   `api/html.js` now needs the identical object, because it emits the
   Organization JSON-LD into the served HTML while `SiteSchema` emits
   it again from the browser. If the two merged differently the
   crawler that executes JavaScript and the crawler that does not
   would read two different organisations off the same page — a
   different `@type`, a description present in one and missing from
   the other. So the merge lives here and both call it.
   ================================================================ */

/**
 * `patch` over `base`, recursing into plain objects only.
 *
 * Arrays REPLACE rather than merge element-wise: a social-accounts
 * list with one row removed has to come out with one row removed,
 * not with the seed's row resurrected underneath it.
 */
export function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch ?? base;
  if (!base || typeof base !== 'object' || Array.isArray(base)) return patch;

  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = key in base ? deepMerge(base[key], value) : value;
  }
  return out;
}

/**
 * The site settings object, seed floor plus whatever the database
 * has.
 *
 * @param settings the `site_settings` rows keyed by `key`, or null
 */
export function mergeSettings(settings) {
  if (!settings) return siteSettings;
  return deepMerge(siteSettings, {
    ...settings.organization,
    ...(settings.social ? { social: settings.social } : {}),
    ...(settings.integrations ? { integrations: settings.integrations } : {}),
    ...(settings.captcha ? { captcha: settings.captcha } : {}),
    ...(settings.consent ? { consent: settings.consent } : {}),
    // robots.txt content + sitemap options (client notes §7, §8).
    // The site itself does not render these — `api/robots.js` and
    // `api/sitemap.js` read the same row server-side — but the
    // dashboard reads them through ContentContext, so they merge
    // here like every other blob.
    ...(settings.seo ? { seo: settings.seo } : {}),
  });
}

export default { deepMerge, mergeSettings };
