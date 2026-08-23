/* ================================================================
   ORGANIZATION SCHEMA — the pure builder (client notes §6).

   "The Organization Schema data must rely on the values saved in the
    dashboard, and NOT on fixed data inside the code."

   So there is not one organisation fact in this file. Every value is
   read from the `settings` object resolved from the `organization`
   and `social` rows of `site_settings` — the rows the "إعدادات SEO"
   screen writes. The only literals here are schema.org's own
   vocabulary (`@context`, `@type`, `sameAs`), which are the format,
   not the data.

   WHY THIS IS SEPARATE FROM `schema.js`
   ----------------------------------------------------------------
   The same node is now built in TWO runtimes: the browser, where
   `SiteSchema` keeps it current after a dashboard edit, and the
   Vercel function in `api/html.js`, which puts it in the HTML the
   crawler is served. Nothing Vite-specific may appear here or the
   function cannot import it — no `import.meta.env`, no asset import.
   Both of those are injected by the caller instead, which is what
   `siteUrl` and `fallbackLogo` are for.

   The alternative was a second copy of this logic for the server,
   and a second copy is how the two outputs quietly stop agreeing.

   EMPTY MEANS ABSENT. A field the administrator has not filled in is
   omitted from the output rather than emitted as `""`. An empty
   string is not "unknown" to a validator — it is a declared, invalid
   value, and it is the usual reason a Rich Results test fails on a
   form that looks fine.
   ================================================================ */

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
 * STORED value of that shape is treated as unset and the fallback is
 * used instead. Migration 0012 clears it at the source too; this is
 * the guard that also covers someone pasting one in.
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
 * @param settings           the merged `organization` + `social` blobs
 * @param options.siteUrl    origin to resolve relative URLs against,
 *                           when the dashboard has no `url` of its own
 * @param options.fallbackLogo  logo URL to use when none is stored —
 *                           `logo` is required for a rich result, so
 *                           the node must not ship without one
 */
export function buildOrganizationSchema(settings, { siteUrl = '', fallbackLogo = '' } = {}) {
  const origin = clean(settings?.url) || siteUrl;
  const type = TYPE_VALUES.has(settings?.schemaType) ? settings.schemaType : 'Organization';

  const address = settings?.address ?? {};
  const social = Array.isArray(settings?.social) ? settings.social : [];

  return compact({
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${String(origin).replace(/\/+$/, '')}/#organization`,
    name: clean(settings?.name),
    legalName: clean(settings?.legalName),
    alternateName: clean(settings?.alternateName),
    description: clean(settings?.description),
    url: origin,
    logo:
      (isSourcePath(settings?.logo) ? undefined : absolute(settings?.logo, origin)) ??
      absolute(fallbackLogo, origin),
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

/**
 * The JSON-LD payload as a string, safe to place inside a
 * `<script type="application/ld+json">`.
 *
 * `</script>` inside a JSON string would close the element early.
 * `JSON.stringify` does not escape `<`, so it is escaped here — the
 * value is unchanged, `<` IS `<` to a JSON parser.
 */
export function organizationSchemaJson(settings, options) {
  return JSON.stringify(buildOrganizationSchema(settings, options), null, 2).replace(
    /</g,
    '\\u003c',
  );
}
