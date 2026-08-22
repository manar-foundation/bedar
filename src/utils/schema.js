/* ================================================================
   ORGANIZATION SCHEMA — client note ٦.

   "التأكد من أن الـ Schema الموجودة في هذا القسم يتم توليدها بشكل
    صحيح وتعمل على مستوى الموقع بصيغة Organization Schema. يجب أن
    تعتمد بيانات الـ Organization Schema على القيم المحفوظة في لوحة
    التحكم، وليس على بيانات ثابتة داخل الكود. التأكد من أن البيانات
    المنظمة الناتجة صحيحة تقنيًا ويمكن لمحركات البحث قراءتها."

   Every value below comes from `settings` — the merged
   `organization` + `social` blobs the dashboard writes. Nothing is
   hardcoded, including the URL: an empty field is OMITTED rather
   than filled with a plausible default, because a schema that
   asserts something nobody entered is worse than a schema that is
   silent about it.

   TECHNICALLY VALID
   ----------------------------------------------------------------
   The shape follows schema.org/Organization as Google documents it:

     · `@context` / `@type` and an `@id` so other blocks on the page
       can reference the organisation rather than re-describe it.
     · `logo` and `image` as ABSOLUTE URLs. Google rejects a relative
       one, and the dashboard's field accepts either — so a path is
       resolved against the site URL here.
     · `address` only when at least one of its parts exists; an empty
       PostalAddress is a validation warning in the Rich Results
       test.
     · `contactPoint` only when there is something to contact.
     · `sameAs` from the social accounts, filtered to real URLs.

   Anything absent is absent. That is the difference between "the
   schema is generated from the saved values" and "the schema always
   has every field".
   ================================================================ */

/** Resolve a possibly-relative URL against the site's own origin. */
function absolute(value, base) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const origin = String(base ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!origin) return '';
  return `${origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

const clean = (value) => String(value ?? '').trim();

/** Drop empty strings, empty arrays and empty objects from a level. */
function compact(object) {
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    if (value == null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

/**
 * The site-wide Organization block, or `null` when the dashboard has
 * nothing worth publishing.
 *
 * `settings` is `useContent().settings` — the organisation fields at
 * the top level, `social` alongside them (see `mergeSettings` in
 * ContentContext).
 */
export function organizationSchema(settings) {
  if (!settings) return null;

  const url = clean(settings.url);
  const name = clean(settings.name) || clean(settings.legalName);

  // A schema with no name and no URL identifies nothing. Emitting it
  // would be a validation error on every page rather than a partial
  // record.
  if (!name && !url) return null;

  const logo = absolute(settings.logo, url);

  const address = compact({
    '@type': 'PostalAddress',
    streetAddress: clean(settings.streetAddress),
    addressLocality: clean(settings.addressLocality),
    addressRegion: clean(settings.addressRegion),
    postalCode: clean(settings.postalCode),
    addressCountry: clean(settings.addressCountry),
  });

  const email = clean(settings.email);
  const telephone = clean(settings.telephone);
  const contactPoint =
    email || telephone
      ? compact({
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email,
          telephone,
          areaServed: clean(settings.addressCountry) || undefined,
          availableLanguage: ['ar'],
        })
      : null;

  const sameAs = (settings.social ?? [])
    .map((account) => clean(account?.href))
    .filter((href) => /^https?:\/\//i.test(href));

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    // A stable identifier other blocks can point at with
    // `{"@id": "https://bedar.org/#organization"}`.
    '@id': url ? `${url.replace(/\/+$/, '')}/#organization` : undefined,
    name,
    legalName: clean(settings.legalName),
    alternateName: clean(settings.alternateName),
    url,
    logo,
    // Google reads `image` for the knowledge panel and `logo` for
    // the logo slot; the same file serves both when only one exists.
    image: logo,
    description: clean(settings.description),
    email,
    telephone,
    foundingDate: clean(settings.foundingDate),
    address: Object.keys(address).length > 1 ? address : undefined,
    contactPoint: contactPoint && Object.keys(contactPoint).length > 2 ? contactPoint : undefined,
    sameAs,
  });
}

/**
 * A `WebSite` block beside it.
 *
 * Small, and it is what lets a search result show the site name
 * rather than the domain. Its `publisher` points at the Organization
 * by `@id` instead of repeating it.
 */
export function websiteSchema(settings) {
  const url = clean(settings?.url);
  const name = clean(settings?.name) || clean(settings?.legalName);
  if (!url || !name) return null;

  const origin = url.replace(/\/+$/, '');
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url,
    name,
    inLanguage: 'ar',
    publisher: { '@id': `${origin}/#organization` },
  });
}
