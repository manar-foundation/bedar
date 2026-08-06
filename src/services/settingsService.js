/* ================================================================
   SITE SETTINGS (Dashboard spec §6, §11, §12, §4)

   Key/value blobs, one row per concern. There is no create and no
   delete: the code reads these keys by name, so inventing one from
   the dashboard would produce a setting nothing reads, and dropping
   one would break a read. Adding a key is a migration.

   `min_role` on each row is enforced in SQL — an editor may reword
   the footer, only an admin may change a GTM container id. The
   dashboard reads the same column so it can disable the form rather
   than let a save fail.
   ================================================================ */

import { db, unwrap, withActor } from './db.js';
import { ROLES, TABLES } from '@utils/constants.js';

const SETTING_COLUMNS = 'key, value, description, is_public, min_role, updated_at';

export async function listSettings(keys) {
  const query = db().from(TABLES.SETTINGS).select(SETTING_COLUMNS);
  const rows = unwrap(await (keys?.length ? query.in('key', keys) : query));
  return new Map(rows.map((row) => [row.key, row]));
}

export async function updateSetting(key, value) {
  return unwrap(
    await db()
      .from(TABLES.SETTINGS)
      .update(await withActor({ value }))
      .eq('key', key)
      .select(SETTING_COLUMNS)
      .single(),
  );
}

/** Client-side mirror of the row-level `min_role` policy. */
export function canEditSetting(row, role) {
  if (!row) return false;
  return row.min_role === ROLES.EDITOR
    ? role === ROLES.EDITOR || role === ROLES.ADMIN
    : role === ROLES.ADMIN;
}
