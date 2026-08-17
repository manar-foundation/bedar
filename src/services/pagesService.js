/* ================================================================
   PAGES + PAGE FIELDS (Dashboard spec §2, §5, §6)

   There is no createPage and no deletePage here, and that is the
   spec rather than an omission: "Each page is developed and
   implemented in code by the developer… the page structure/layout is
   not editable, only the content within it." A page row without a
   component behind it would be a URL that 404s, which is precisely
   the failure mode a content-only dashboard exists to prevent.

   What an editor may change: the content fields, the slug, the
   parent, the SEO block, the search-visibility switch, and the
   publish state.
   ================================================================ */

import { db, mutate, unwrap, withActor } from './db.js';
import { TABLES } from '@utils/constants.js';

const PAGE_COLUMNS =
  'id, key, title, slug, parent_id, path, position, seo_title, seo_description, ' +
  'canonical_url, og_image_id, is_hidden_from_search, renders_faq, schema_type, ' +
  'state, published_at, created_at, updated_at, updated_by';

export async function listPages() {
  return unwrap(
    await db().from(TABLES.PAGES).select(PAGE_COLUMNS).order('position', { ascending: true }),
  );
}

export async function getPage(id) {
  return unwrap(await db().from(TABLES.PAGES).select(PAGE_COLUMNS).eq('id', id).single());
}

/**
 * Content fields for one page, in the order the developer defined.
 *
 * `position` and not `key`: the fields are a walk of the page's own
 * content object, so their natural order is the order they appear on
 * the page. Alphabetical would scatter `hero.title` away from
 * `hero.subtitle`.
 */
export async function listPageFields(pageId) {
  return unwrap(
    await db()
      .from(TABLES.PAGE_FIELDS)
      .select(
        'id, page_id, key, label, help, type, value, media_id, alt_text, position, updated_at',
      )
      .eq('page_id', pageId)
      .order('position', { ascending: true }),
  );
}

export async function updatePage(id, patch) {
  return mutate(
    TABLES.PAGES,
    db().from(TABLES.PAGES).update(await withActor(patch)).eq('id', id).select(PAGE_COLUMNS).single(),
  );
}

export async function updatePageField(id, patch) {
  return mutate(
    TABLES.PAGE_FIELDS,
    db()
      .from(TABLES.PAGE_FIELDS)
      .update(await withActor(patch))
      .eq('id', id)
      .select('id, key, type, value, media_id, alt_text, updated_at')
      .single(),
  );
}

/**
 * Save several fields at once.
 *
 * Sequential and not `Promise.all`: each row fires the version
 * trigger, which reads `max(version)` before it writes. Parallel
 * writes to different rows are fine there — they have different
 * entity ids — but sequential keeps the failure story simple, and
 * "saved 3 of 9 fields" is a state an editor can actually read off
 * the screen. A dozen fields per page makes the round trips a
 * non-issue.
 */
export async function savePageFields(changes) {
  const saved = [];
  for (const { id, ...patch } of changes) {
    saved.push(await updatePageField(id, patch));
  }
  return saved;
}
