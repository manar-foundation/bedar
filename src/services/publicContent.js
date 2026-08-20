/* ================================================================
   PUBLIC CONTENT — live read of published rows, for the public site.

   The dashboard writes to Supabase; the public site needs to SEE
   what was published without a rebuild. That is what this module
   does — and it does it WITHOUT importing `@supabase/supabase-js`.

   Why plain `fetch` against PostgREST instead of the client:
   ----------------------------------------------------------------
   CLAUDE.md's hard rule is "keep `@supabase/supabase-js` (~53 kB
   gzipped) out of the public bundle" — no public visitor
   authenticates. Reading data does not need the client at all:
   Supabase exposes every table over PostgREST, and the anon key is
   public by design (RLS gates it). So a ~1 kB `fetch` wrapper reads
   published rows directly, the auth/realtime client never ships to a
   visitor, and `grep -c supabase dist/index.html` stays 0.

   Only `state = 'published'` rows come back, enforced twice: the
   query filters on it, AND the RLS policy `… public read published`
   only exposes published rows to `anon` (migration 0006). An editor
   flipping an item back to draft removes it from the public site on
   the next load with no code change.

   Everything here degrades to `null`/`[]` on any failure so the
   caller can fall back to the local seed — the site must stay up if
   Supabase is unreachable.
   ================================================================ */

import { env, hasSupabase } from '@utils/env.js';

const REST_URL = `${env.supabaseUrl}/rest/v1`;

/**
 * One PostgREST GET. `no-store` so a hard refresh always re-reads the
 * database rather than a stale disk-cached response — the whole point
 * is that a just-published item shows up on reload.
 */
async function rest(path) {
  const res = await fetch(`${REST_URL}/${path}`, {
    headers: {
      apikey: env.supabaseAnonKey,
      authorization: `Bearer ${env.supabaseAnonKey}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase REST ${res.status}`);
  return res.json();
}

/* Path shape per collection, mirroring the seed in `content/site.js`.
   Programs keep whatever `path` the row carries (the migrated site is
   split across /program and /programs); this is only the fallback for
   an item saved with an empty path. */
function defaultHref(collection, slug) {
  const base = collection === 'articles' ? 'blog' : collection === 'news' ? 'news' : 'programs';
  return `/${base}/${slug}`;
}

/**
 * Public URL for a stored object, built by hand.
 *
 * The `media` bucket is public (migration 0002), so its objects are
 * served at a stable, unauthenticated path — no client and no signed
 * URL needed. This mirrors what `mediaService.mediaUrl` produces via
 * `storage.getPublicUrl`, without pulling that module (and the client
 * it imports) into the public bundle.
 */
export function storageUrl(media) {
  if (!media?.path) return '';
  return `${env.supabaseUrl}/storage/v1/object/public/${media.bucket || 'media'}/${media.path}`;
}

/** DB row → the shape the listing pages and cards already expect. */
function mapItem(row) {
  return {
    id: row.id,
    slug: row.slug,
    href: row.path || defaultHref(row.collection, row.slug),
    title: row.title,
    excerpt: row.excerpt ?? '',
    category: row.category ?? '',
    // Programs only; harmless (undefined) on articles/news.
    status: row.program_status ?? undefined,
    date: row.published_at ?? row.updated_at ?? null,
    tags: row.tags ?? [],
    author: row.author ?? '',
    // Cover image, resolved from the embedded `media` row. Empty
    // string when the item has no cover — the card then falls back to
    // its spiral placeholder.
    image: storageUrl(row.cover),
    imageAlt: row.cover?.alt_text ?? '',
    seo:
      row.seo_title || row.seo_description
        ? { title: row.seo_title || undefined, description: row.seo_description || undefined }
        : undefined,
    state: row.state,
  };
}

// `cover:media!cover_media_id(…)` embeds the cover's storage row over
// the foreign key. The `!cover_media_id` hint is required because
// `collection_items` has TWO foreign keys into `media` (cover + OG
// image) and PostgREST cannot otherwise tell which to follow.
const ITEM_FIELDS =
  'id,collection,slug,path,title,excerpt,category,tags,author,program_status,' +
  'seo_title,seo_description,published_at,updated_at,state,' +
  'cover:media!cover_media_id(bucket,path,alt_text)';

/**
 * Every published article / news / program, grouped by collection.
 *
 * `body` is deliberately NOT selected here — same reasoning that
 * keeps `collection-bodies.js` out of `ContentContext`: this runs on
 * every page, and no listing needs the long-form text. Detail pages
 * pull one body on demand via `fetchItemBody`.
 */
export async function fetchCollections() {
  const rows = await rest(
    `collection_items?state=eq.published&select=${ITEM_FIELDS}` +
      `&order=published_at.desc.nullslast`,
  );
  const grouped = { programs: [], articles: [], news: [] };
  for (const row of rows) {
    if (grouped[row.collection]) grouped[row.collection].push(mapItem(row));
  }
  return grouped;
}

/** Published testimonials → { id, quote, author, role, image, imageAlt }. */
export async function fetchTestimonials() {
  const rows = await rest(
    'testimonials?state=eq.published' +
      '&select=id,quote,person_name,person_title,photo:media!photo_media_id(bucket,path,alt_text)' +
      '&order=position.asc',
  );
  return rows.map((row) => ({
    id: row.id,
    quote: row.quote,
    author: row.person_name,
    role: row.person_title ?? '',
    // Dashboard-uploaded portrait, resolved from Storage. Empty when
    // none — the carousel then falls back to the bundled expert photo
    // (matched by name) or the person's initial.
    image: storageUrl(row.photo),
    imageAlt: row.photo?.alt_text ?? '',
  }));
}

/**
 * Published services → the shape the homepage band and /services
 * already render.
 *
 * `key` is carried through because it is what the bundled artwork is
 * keyed by: a row with no uploaded image resolves to the photograph
 * and the line icon that ship with the build, so introducing this
 * table did not require re-uploading seven photographs.
 */
export async function fetchServices() {
  const rows = await rest(
    'services?state=eq.published' +
      '&select=id,key,title,description,icon,image_alt,' +
      'image:media!image_media_id(bucket,path,alt_text)' +
      '&order=position.asc',
  );
  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description ?? '',
    icon: row.icon ?? '',
    image: storageUrl(row.image),
    imageAlt: row.image_alt || row.image?.alt_text || '',
  }));
}

/** Published FAQ → { id, question, answer }. */
export async function fetchFaq() {
  const rows = await rest(
    'faq_items?state=eq.published&select=id,question,answer&order=position.asc',
  );
  return rows.map((row) => ({ id: row.id, question: row.question, answer: row.answer }));
}

/**
 * One item's long-form body, on demand, for a detail route.
 *
 * Returns the block array, or `null` when the slug has no published
 * body in the database — the caller then falls back to the static
 * `collection-bodies.js` seed. `collection` is the discriminator
 * ('articles' | 'news' | 'programs'), not the array.
 */
export async function fetchItemBody(collection, slug) {
  const rows = await rest(
    `collection_items?collection=eq.${collection}&slug=eq.${encodeURIComponent(slug)}` +
      '&state=eq.published&select=body&limit=1',
  );
  const body = rows[0]?.body;
  return Array.isArray(body) && body.length > 0 ? body : null;
}

/* ================================================================
   PAGE CONTENT — the fields the dashboard's page editor writes.

   This is the read that was missing. `page_fields` is a FLAT table
   of dotted keys ('hero.title', 'audience.items') carrying jsonb
   values, produced by walking the nested page objects in
   `content/pages.js` (see `scripts/seed-supabase.mjs`). Reading it
   back means walking that flattening in reverse.

   `pages.key` is the discriminator and matches the export name in
   `content/pages.js` only loosely — the table uses the URL-ish key
   ('contact-us', 'social-entrepreneurship') while the module uses a
   JS identifier ('contact', 'socialEntrepreneurship'). PAGE_KEYS
   below is that mapping, and it is the same list the seed script
   writes from.
   ================================================================ */

/** `pages.key` → the export name in `content/pages.js`. */
export const PAGE_KEYS = {
  home: 'home',
  about: 'about',
  'social-entrepreneurship': 'socialEntrepreneurship',
  services: 'servicesPage',
  programs: 'programsPage',
  blog: 'blogPage',
  news: 'newsPage',
  'contact-us': 'contact',
};

/**
 * Set `object.a.b.c = value`, creating the intermediate objects.
 *
 * Only ever called with keys this codebase generated, but it still
 * refuses `__proto__` / `constructor` / `prototype`: the keys arrive
 * over the network from a table editors can write to, and walking a
 * dotted path into an object is the textbook prototype-pollution
 * sink. A poisoned `Object.prototype` here would corrupt every
 * object in the running app, not just the page content.
 */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function setPath(target, dottedKey, value) {
  const parts = dottedKey.split('.');
  if (parts.some((part) => !part || UNSAFE_KEYS.has(part))) return;

  let node = target;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== 'object' || node[part] === null || Array.isArray(node[part])) {
      node[part] = {};
    }
    node = node[part];
  }
  node[parts.at(-1)] = value;
}

/**
 * Published page content, as `{ [contentExportName]: nestedObject }`.
 *
 * The returned objects are SPARSE — only the fields the database
 * actually has. `ContentContext` deep-merges them over the static
 * seed, so a page field the dashboard has never been told about
 * still renders its seeded value rather than `undefined`.
 *
 * `page_fields(...)` is a PostgREST embed over the `page_id` foreign
 * key, so this is one round trip rather than one per page. Draft
 * pages are excluded twice — by the filter and by RLS.
 */
export async function fetchPages() {
  const rows = await rest(
    'pages?state=eq.published&select=key,renders_faq,seo_title,seo_description,' +
      'page_fields(key,type,value,alt_text,media(bucket,path,alt_text))',
  );

  const pages = {};
  for (const row of rows) {
    const name = PAGE_KEYS[row.key];
    if (!name) continue; // A page row with no component behind it.

    const content = {};

    /* SEO is COLUMNS on `pages`, not rows in `page_fields` — the seed
       script skips the `seo` branch when it flattens for exactly that
       reason. Folding it back under the same `seo` key the seed uses
       is what lets `useSeo(page.seo)` stay unchanged in every route.
       Blank columns are left out so the merge keeps the seeded title
       rather than overwriting it with ''. */
    const seo = {};
    if (row.seo_title) seo.title = row.seo_title;
    if (row.seo_description) seo.description = row.seo_description;
    if (Object.keys(seo).length) content.seo = seo;

    for (const field of row.page_fields ?? []) {
      // An image field stores the resolved media row, not the value
      // column — mirroring how a collection cover is read above.
      const value = field.media
        ? { src: storageUrl(field.media), alt: field.alt_text ?? field.media.alt_text ?? '' }
        : field.value;
      if (value !== null && value !== undefined) setPath(content, field.key, value);
    }
    pages[name] = content;
  }
  return pages;
}

/* ================================================================
   NAVIGATION — header menu and footer columns.

   One flat table with a self-referencing `parent_id`; a row with no
   `href` is a group (a header dropdown or a footer column). Rebuilt
   here into the exact shapes `Navbar` and `Footer` already consume
   from `content/site.js`, so neither component changes.
   ================================================================ */

/**
 * `{ header: [...], footer: [...] }` in the `content/site.js` shape,
 * or `null` when the table has no visible rows.
 *
 * Invisible rows are filtered twice, same belt-and-braces as the
 * publish state: the query asks for `is_visible`, and the RLS policy
 * `navigation_items: public read visible` only exposes those to anon.
 */
export async function fetchNavigation() {
  const rows = await rest(
    'navigation_items?is_visible=is.true' +
      '&select=id,location,key,parent_id,label,href,position,opens_in_new_tab' +
      '&order=position.asc',
  );
  if (!rows.length) return null;

  const childrenOf = new Map();
  for (const row of rows) {
    if (!row.parent_id) continue;
    if (!childrenOf.has(row.parent_id)) childrenOf.set(row.parent_id, []);
    childrenOf.get(row.parent_id).push(row);
  }

  const toItem = (row) => {
    const children = childrenOf.get(row.id);
    return {
      id: row.key,
      label: row.label,
      ...(row.href ? { href: row.href } : {}),
      ...(row.opens_in_new_tab ? { external: true } : {}),
      // A group is a row with children. Keeping the key absent (not
      // an empty array) matters: `Navbar` branches on `item.children`
      // being truthy to decide dropdown vs. plain link.
      ...(children?.length ? { children: children.map(toItem) } : {}),
    };
  };

  const roots = (location) => rows.filter((row) => !row.parent_id && row.location === location);

  return {
    header: roots('header').map(toItem),
    // The footer wants `{ id, title, links }`, not `{ id, label, children }`.
    footer: roots('footer').map((row) => ({
      id: row.key,
      title: row.label,
      links: (childrenOf.get(row.id) ?? []).map(toItem),
    })),
  };
}

/**
 * Public settings blobs, keyed as in `site_settings` —
 * `organization`, `social`, `header_cta`, `footer`, `integrations`,
 * `captcha`, `consent`.
 *
 * `forms` is deliberately unreachable here: it is the only row
 * seeded with `is_public = false`, so RLS withholds it from anon.
 */
export async function fetchSettings() {
  const rows = await rest('site_settings?is_public=is.true&select=key,value');
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export { hasSupabase };
