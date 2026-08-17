/* ================================================================
   CONTENT COLLECTIONS (Dashboard spec §3.2)

   Three article-shaped collections in one table with a
   discriminator (articles / news / programs), plus testimonials and
   FAQ, which are their own shapes.

   The "featured" swap is NOT implemented here. Marking an item
   featured un-marks the previous one in a BEFORE trigger, so this
   service just writes `is_featured = true` and lets the database do
   it — two editors clicking at the same moment is the case a
   client-side swap gets wrong.
   ================================================================ */

import { db, mutate, unwrap, withActor, currentUserId } from './db.js';
import { publish } from './contentSync.js';
import { COLLECTIONS, TABLES } from '@utils/constants.js';

const ITEM_LIST_COLUMNS =
  'id, collection, slug, path, title, excerpt, category, tags, author, program_status, ' +
  'is_featured, state, published_at, cover_media_id, updated_at';

const ITEM_COLUMNS = `${ITEM_LIST_COLUMNS}, body, cover_alt, seo_title, seo_description, canonical_url, og_image_id, is_hidden_from_search, created_at`;

/** The three collections that share `collection_items`. */
export const ARTICLE_SHAPED = [COLLECTIONS.ARTICLES, COLLECTIONS.NEWS, COLLECTIONS.PROGRAMS];

export function isArticleShaped(collection) {
  return ARTICLE_SHAPED.includes(collection);
}

/* ── Articles / news / programs ─────────────────────────────── */

export async function listItems(collection) {
  return unwrap(
    await db()
      .from(TABLES.COLLECTION_ITEMS)
      .select(ITEM_LIST_COLUMNS)
      .eq('collection', collection)
      // Nulls last so an unpublished draft sits at the top of the
      // list rather than at the bottom of a hundred published rows.
      .order('published_at', { ascending: false, nullsFirst: true }),
  );
}

export async function getItem(id) {
  return unwrap(
    await db().from(TABLES.COLLECTION_ITEMS).select(ITEM_COLUMNS).eq('id', id).single(),
  );
}

export async function createItem(collection, patch) {
  const created_by = await currentUserId();
  return mutate(
    TABLES.COLLECTION_ITEMS,
    db()
      .from(TABLES.COLLECTION_ITEMS)
      .insert({
        collection,
        state: 'draft',
        ...patch,
        ...(created_by ? { created_by, updated_by: created_by } : {}),
      })
      .select(ITEM_COLUMNS)
      .single(),
  );
}

export async function updateItem(id, patch) {
  return mutate(
    TABLES.COLLECTION_ITEMS,
    db()
      .from(TABLES.COLLECTION_ITEMS)
      .update(await withActor(patch))
      .eq('id', id)
      .select(ITEM_COLUMNS)
      .single(),
  );
}

export async function deleteItem(id) {
  await mutate(TABLES.COLLECTION_ITEMS, db().from(TABLES.COLLECTION_ITEMS).delete().eq('id', id).select('id'));
}

/* ── Testimonials ───────────────────────────────────────────── */

const TESTIMONIAL_COLUMNS =
  'id, quote, person_name, person_title, photo_media_id, photo_alt, position, state, updated_at';

export async function listTestimonials() {
  return unwrap(
    await db()
      .from(TABLES.TESTIMONIALS)
      .select(TESTIMONIAL_COLUMNS)
      .order('position', { ascending: true }),
  );
}

export async function createTestimonial(patch) {
  return mutate(
    TABLES.TESTIMONIALS,
    db().from(TABLES.TESTIMONIALS).insert(await withActor(patch)).select(TESTIMONIAL_COLUMNS).single(),
  );
}

export async function updateTestimonial(id, patch) {
  return mutate(
    TABLES.TESTIMONIALS,
    db()
      .from(TABLES.TESTIMONIALS)
      .update(await withActor(patch))
      .eq('id', id)
      .select(TESTIMONIAL_COLUMNS)
      .single(),
  );
}

export async function deleteTestimonial(id) {
  await mutate(TABLES.TESTIMONIALS, db().from(TABLES.TESTIMONIALS).delete().eq('id', id).select('id'));
}

/* ── FAQ ────────────────────────────────────────────────────── */

const FAQ_COLUMNS = 'id, question, answer, position, state, updated_at';

export async function listFaq() {
  return unwrap(
    await db().from(TABLES.FAQ_ITEMS).select(FAQ_COLUMNS).order('position', { ascending: true }),
  );
}

export async function createFaq(patch) {
  return mutate(
    TABLES.FAQ_ITEMS,
    db().from(TABLES.FAQ_ITEMS).insert(await withActor(patch)).select(FAQ_COLUMNS).single(),
  );
}

export async function updateFaq(id, patch) {
  return mutate(
    TABLES.FAQ_ITEMS,
    db().from(TABLES.FAQ_ITEMS).update(await withActor(patch)).eq('id', id).select(FAQ_COLUMNS).single(),
  );
}

export async function deleteFaq(id) {
  await mutate(TABLES.FAQ_ITEMS, db().from(TABLES.FAQ_ITEMS).delete().eq('id', id).select('id'));
}

/**
 * Reorder — write the new `position` of every row that moved.
 *
 * Positions are reassigned from 0 on each save rather than nudged,
 * because the list is a couple of dozen rows and a renumbering that
 * is always dense is one less thing to reason about. Rows whose
 * position did not change are skipped so the version history does
 * not fill up with no-op entries. (The trigger would drop them
 * anyway — it compares the whole row — but not sending them saves
 * the round trip.)
 */
export async function reorder(table, orderedIds, previous = []) {
  const client = db();
  const before = new Map(previous.map((row) => [row.id, row.position]));
  let moved = 0;

  for (const [index, id] of orderedIds.entries()) {
    if (before.get(id) === index) continue;
    unwrap(await client.from(table).update({ position: index }).eq('id', id).select('id'));
    moved += 1;
  }

  // One announcement for the whole reorder, not one per row: a
  // twenty-row drag would otherwise fire twenty refetches of the same
  // list. `mutate` is deliberately not used above for that reason.
  if (moved) publish(table);
}
