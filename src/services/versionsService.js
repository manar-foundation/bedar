/* ================================================================
   VERSION HISTORY (Dashboard spec §10)

   "Version history on content edits, separate from the code-level
   Git history."

   The history is written by an AFTER trigger on every versioned
   table, so it cannot have holes in it — the dashboard does not get
   to forget. This service only reads it, and restores from it.

   RESTORING APPENDS. It writes the snapshot back over the current
   row, which fires the same trigger and records a new version. The
   history is never rewritten; a restore that erased the state it
   replaced would be the one edit nobody could undo.
   ================================================================ */

import { db, unwrap, withActor } from './db.js';
import { TABLES } from '@utils/constants.js';

const VERSION_COLUMNS =
  'id, entity_type, entity_id, entity_label, version, action, created_at, created_by_email, note';

/** Arabic names for the versioned tables, for the history screen. */
export const ENTITY_LABELS = {
  pages: 'صفحة',
  page_fields: 'حقل محتوى',
  collection_items: 'عنصر مجموعة',
  testimonials: 'شهادة',
  faq_items: 'سؤال شائع',
  navigation_items: 'عنصر تنقل',
  site_settings: 'إعداد',
};

/**
 * How to write a snapshot back.
 *
 *   pk      the conflict target — `site_settings` is keyed by name,
 *           everything else by id.
 *   strip   columns the database owns. GENERATED ALWAYS columns
 *           (`pages.schema_type`, `navigation_items.is_group`) are
 *           rejected outright on write, and `pages.path` is derived
 *           from parent + slug by trigger, so restoring a stale one
 *           would be overwritten a moment later anyway.
 *
 * `updated_at` / `updated_by` are stripped everywhere: the restore
 * is a new edit by whoever performed it, not a re-run of the old one.
 */
const RESTORE = {
  pages: { pk: 'id', strip: ['schema_type', 'path'] },
  page_fields: { pk: 'id', strip: [] },
  collection_items: { pk: 'id', strip: [] },
  testimonials: { pk: 'id', strip: [] },
  faq_items: { pk: 'id', strip: [] },
  navigation_items: { pk: 'id', strip: ['is_group'] },
  site_settings: { pk: 'key', strip: [] },
};

export const RESTORABLE = Object.keys(RESTORE);

export async function listVersions({ entityType = null, limit = 60 } = {}) {
  let query = db()
    .from(TABLES.VERSIONS)
    .select(VERSION_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityType) query = query.eq('entity_type', entityType);
  return unwrap(await query);
}

/** Every version of one row, newest first — the timeline in the drawer. */
export async function listEntityVersions(entityType, entityId) {
  return unwrap(
    await db()
      .from(TABLES.VERSIONS)
      .select(`${VERSION_COLUMNS}, snapshot`)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('version', { ascending: false }),
  );
}

export async function getVersion(id) {
  return unwrap(
    await db().from(TABLES.VERSIONS).select(`${VERSION_COLUMNS}, snapshot`).eq('id', id).single(),
  );
}

/**
 * Write a snapshot back over the live row.
 *
 * An upsert and not an update, because the version being restored
 * may be the one recorded just before a delete — in which case there
 * is no row left to update and the point of keeping the snapshot was
 * to be able to bring it back.
 */
export async function restoreVersion(version) {
  const config = RESTORE[version.entity_type];
  if (!config) {
    throw new Error('لا يمكن استرجاع هذا النوع من السجلات.');
  }

  const row = { ...version.snapshot };
  for (const column of [...config.strip, 'updated_at', 'updated_by']) delete row[column];

  return unwrap(
    await db()
      .from(version.entity_type)
      .upsert(await withActor(row), { onConflict: config.pk })
      .select(config.pk)
      .single(),
  );
}

/**
 * Retention. Unbounded history on a table that also stores article
 * bodies grows forever for no editorial benefit — nobody restores
 * the 300th previous version of the homepage hero.
 *
 * Admin-only, enforced inside the function itself.
 */
export async function pruneVersions(keep = 50) {
  return unwrap(await db().rpc('prune_content_versions', { keep }));
}
