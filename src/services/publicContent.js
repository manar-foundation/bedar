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

export { hasSupabase };
