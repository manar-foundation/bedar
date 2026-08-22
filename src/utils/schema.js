/* ================================================================
   ORGANIZATION SCHEMA — the site-wide JSON-LD node, built from the
   dashboard's own settings (client notes §6).

   "The Organization Schema data must rely on the values saved in the
    dashboard, and NOT on fixed data inside the code."

   So there is not one organisation fact in this file. Every value is
   read from the `settings` object `ContentContext` resolves from the
   `organization` and `social` rows of `site_settings` — the rows the
   "إعدادات SEO" screen writes. The only literals here are
   schema.org's own vocabulary (`@context`, `@type`, `sameAs`), which
   are the format, not the data.

   EMPTY MEANS ABSENT. A field the administrator has not filled in is
   omitted from the output rather than emitted as `""`. An empty
   string is not "unknown" to a validator — it is a declared, invalid
   value, and it is the usual reason a Rich Results test fails on a
   form that looks fine.

   SEPARATE FROM THE COMPONENT that renders it (`SiteSchema.jsx`) so
   the dashboard can call it too: the settings screen previews the
   exact JSON-LD these values produce, and a preview built by the
   same function cannot drift from the output.
   ================================================================ */

import logoUrl from '@assets/bedar-logo.svg';
import { env } from './env.js';

/** schema.org types offered for the organisation (see Settings). */
export const ORGANIZATION_TYPES = [
  { value: 'Organization', label: 'Organization — منظمة' },
  { value: 'NGO', label: 'NGO — منظمة غير حكومية' },
  { value: 'EducationalOrganization', label: 'EducationalOrganization — منظمة تعليمية' },
  { value: 'NonprofitOrganization', label: 'NonprofitOrganization — منظمة غير ربحية' },
];

const TYPE_VALUES = new Set(ORGANIZATION_TYPES.map((type) => type.value));

/** Trimmed, or `undefined` — never `''`. See the header. */
function clean(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || undefined;
}

/**
 * A path that only resolves on the Vite dev server.
 *
 * The original seed wrote `/src/assets/bedar-logo.svg` into
 * `organization.logo`. That is a module path in the source tree, not
 * a URL on a built site, and emitting it as the organisation's logo
 * publishes a 404 into the structured data — worse than no logo,
 * because a validator reports a broken REQUIRED property. So a
 * STORED value of that shape is treated as unset and the bundled
 * mark is used instead. Migration 0012 clears it at the source too;
 * this is the guard that also covers someone pasting one in.
 *
 * It applies only to the stored setting. The bundled asset's own URL
 * legitimately looks like this in development, where it resolves —
 * in a build it is `/assets/bedar-logo-<hash>.svg`.
 */
function isSourcePath(value) {
  return String(value ?? '').startsWith('/src/');
}

/** Absolute URL for a path, against the site's own origin. */
function absolute(value, origin) {
  const path = clean(value);
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  try {
    return new URL(path, origin).toString();
  } catch {
    return undefined;
  }
}

/** Drop every key whose value is `undefined` or an empty object. */
function compact(object) {
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length) out[key] = value;
      continue;
    }
    if (typeof value === 'object') {
      const nested = compact(value);
      // `@type` alone is an empty node dressed up as a filled one.
      if (Object.keys(nested).filter((key) => key !== '@type').length) out[key] = nested;
      continue;
    }
    out[key] = value;
  }
  return out;
}

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
  const origin = clean(settings?.url) || siteUrl;
  const type = TYPE_VALUES.has(settings?.schemaType) ? settings.schemaType : 'Organization';

  const address = settings?.address ?? {};
  const social = Array.isArray(settings?.social) ? settings.social : [];

  return compact({
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${origin.replace(/\/+$/, '')}/#organization`,
    name: clean(settings?.name),
    legalName: clean(settings?.legalName),
    alternateName: clean(settings?.alternateName),
    description: clean(settings?.description),
    url: origin,
    // The bundled mark is the fallback so the node is valid before
    // anyone uploads one — `logo` is required for a rich result.
    logo:
      (isSourcePath(settings?.logo) ? undefined : absolute(settings?.logo, origin)) ??
      absolute(logoUrl, origin),
    email: clean(settings?.email),
    telephone: clean(settings?.telephone),
    foundingDate: clean(settings?.foundingDate),
    address: {
      '@type': 'PostalAddress',
      streetAddress: clean(address.streetAddress),
      addressLocality: clean(address.addressLocality),
      addressRegion: clean(address.addressRegion),
      postalCode: clean(address.postalCode),
      addressCountry: clean(address.addressCountry),
    },
    // `sameAs` is what ties the social accounts to the organisation
    // in a knowledge panel — the same rows the footer renders.
    sameAs: social.map((account) => clean(account?.href)).filter(Boolean),
  });
}
