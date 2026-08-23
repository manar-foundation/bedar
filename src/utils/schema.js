/* ================================================================
   ORGANIZATION SCHEMA — the browser's binding of the shared builder.

   The logic lives in `organization-schema.js`, which is deliberately
   free of anything Vite-specific so `api/html.js` can import it too
   and put the SAME node into the HTML a crawler is served. This file
   supplies the two values only the bundle knows:

     logoUrl    the fingerprinted URL of the bundled mark, which
                changes on every build and therefore cannot be stored
                in the database
     env.siteUrl  the origin to resolve against when the dashboard's
                organisation URL is blank

   Kept as `@utils/schema.js` because `SiteSchema` and the settings
   screen already import it under that name, and because the callers
   should not have to know where the logo comes from.
   ================================================================ */

import logoUrl from '@assets/bedar-logo.svg';
import { buildOrganizationSchema as build } from './organization-schema.js';
import { env } from './env.js';

export { ORGANIZATION_TYPES } from './organization-schema.js';

/**
 * The Organization node for these settings.
 *
 * Exported so the dashboard can show the administrator the exact
 * JSON-LD their values produce — §6 asks for the schema to be
 * correct and readable by search engines, and the fastest way to
 * make that checkable is to put the output on the screen where the
 * input is.
 */
export function buildOrganizationSchema(settings, siteUrl = env.siteUrl) {
  return build(settings, { siteUrl, fallbackLogo: logoUrl });
}
