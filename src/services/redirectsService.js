/* ================================================================
   REDIRECTS MANAGER (Dashboard spec §8)

   Writes are admin-only in RLS. Editors still generate redirects
   for free by renaming a page — that path goes through a SECURITY
   DEFINER trigger, not through this service — which is why the
   screen shows `source` on every row: an editor has to be able to
   tell a row they caused from a row someone typed.
   ================================================================ */

import { db, unwrap, withActor, currentUserId } from './db.js';
import { TABLES } from '@utils/constants.js';

const REDIRECT_COLUMNS =
  'id, from_path, to_path, status_code, is_enabled, note, source, created_at, updated_at';

export async function listRedirects() {
  return unwrap(
    await db()
      .from(TABLES.REDIRECTS)
      .select(REDIRECT_COLUMNS)
      .order('created_at', { ascending: false }),
  );
}

export async function createRedirect(patch) {
  const created_by = await currentUserId();
  return unwrap(
    await db()
      .from(TABLES.REDIRECTS)
      .insert({
        source: 'manual',
        ...patch,
        ...(created_by ? { created_by, updated_by: created_by } : {}),
      })
      .select(REDIRECT_COLUMNS)
      .single(),
  );
}

export async function updateRedirect(id, patch) {
  return unwrap(
    await db()
      .from(TABLES.REDIRECTS)
      .update(await withActor(patch))
      .eq('id', id)
      .select(REDIRECT_COLUMNS)
      .single(),
  );
}

export async function deleteRedirect(id) {
  unwrap(await db().from(TABLES.REDIRECTS).delete().eq('id', id).select('id'));
}

/**
 * Client-side validation, matching the CHECK constraints exactly.
 *
 * The constraints are the real rule; this exists so the editor reads
 * "المسار القديم يجب أن يبدأ بـ /" under the field instead of a
 * Postgres constraint name after a failed round trip.
 */
export function validateRedirect({ from_path, to_path }, existing = [], id = null) {
  const errors = {};
  const from = String(from_path ?? '').trim();
  const to = String(to_path ?? '').trim();

  if (!from) errors.from_path = 'المسار القديم مطلوب';
  else if (!from.startsWith('/')) errors.from_path = 'يجب أن يبدأ المسار القديم بـ /';
  else if (existing.some((row) => row.id !== id && row.from_path === from))
    errors.from_path = 'يوجد تحويل لهذا المسار بالفعل';

  if (!to) errors.to_path = 'المسار الجديد مطلوب';
  else if (!/^(\/|https?:\/\/)/.test(to))
    errors.to_path = 'يجب أن يبدأ بـ / أو بعنوان كامل يبدأ بـ http';

  if (from && to && from === to) errors.to_path = 'لا يمكن تحويل المسار إلى نفسه';

  // A → B → C is one hop too many for Netlify, and a chain that
  // resolves at the second hop is an SEO own-goal. The database
  // repoints automatic rows to avoid this; a manual entry that
  // recreates it gets warned instead of silently accepted.
  const chained = existing.find((row) => row.id !== id && row.is_enabled && row.from_path === to);
  const warning = chained
    ? `المسار الجديد محوَّل بدوره إلى ${chained.to_path} — يُفضّل التحويل إلى الوجهة النهائية مباشرة.`
    : '';

  return { errors, warning, ok: Object.keys(errors).length === 0 };
}
