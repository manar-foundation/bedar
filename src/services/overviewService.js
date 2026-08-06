/* ================================================================
   The dashboard landing screen's numbers.

   Every count is a `head: true` request — Postgres returns the count
   in a header and no rows at all, so the summary costs a handful of
   tiny requests instead of pulling every article body down to run
   `.length` in the browser.
   ================================================================ */

import { db, unwrap } from './db.js';
import { COLLECTIONS, PUBLISH_STATE, TABLES } from '@utils/constants.js';

async function count(table, refine = (query) => query) {
  const { count: total, error } = await refine(
    db().from(table).select('id', { count: 'exact', head: true }),
  );
  if (error) throw error;
  return total ?? 0;
}

export async function loadOverview() {
  const [
    pages,
    draftPages,
    articles,
    news,
    programs,
    draftItems,
    media,
    missingAlt,
    redirects,
    recent,
  ] = await Promise.all([
    count(TABLES.PAGES),
    count(TABLES.PAGES, (query) => query.neq('state', PUBLISH_STATE.PUBLISHED)),
    count(TABLES.COLLECTION_ITEMS, (query) => query.eq('collection', COLLECTIONS.ARTICLES)),
    count(TABLES.COLLECTION_ITEMS, (query) => query.eq('collection', COLLECTIONS.NEWS)),
    count(TABLES.COLLECTION_ITEMS, (query) => query.eq('collection', COLLECTIONS.PROGRAMS)),
    count(TABLES.COLLECTION_ITEMS, (query) => query.neq('state', PUBLISH_STATE.PUBLISHED)),
    count(TABLES.MEDIA),
    count(TABLES.MEDIA, (query) => query.eq('alt_text', '').like('mime_type', 'image/%')),
    count(TABLES.REDIRECTS, (query) => query.eq('is_enabled', true)),
    db()
      .from(TABLES.VERSIONS)
      .select('id, entity_type, entity_label, action, created_at, created_by_email')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  return {
    pages,
    draftPages,
    articles,
    news,
    programs,
    draftItems,
    media,
    missingAlt,
    redirects,
    recent: unwrap(recent),
  };
}
