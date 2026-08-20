/* ================================================================
   SERVICES (Dashboard spec §3.2)

   The seven services, as an ordered, publishable collection —
   migration 0010 for why they are a table of their own rather than
   fields on the services page.

   Shaped exactly like the testimonials half of `collectionsService`:
   short records, edited in a dialog, reordered with the shared
   `reorder` helper. Reordering is deliberately NOT reimplemented
   here — one renumbering routine, one announcement per drag.

   `key` is write-once. It is the join between a row and its bundled
   photograph/icon, so the create call derives it from the title and
   `updateService` refuses to carry it: an editor renaming a service
   should get a new title, not a service whose artwork silently
   disappeared.
   ================================================================ */

import { db, mutate, unwrap, withActor } from './db.js';
import { TABLES } from '@utils/constants.js';

const SERVICE_COLUMNS =
  'id, key, title, description, icon, image_media_id, image_alt, position, state, updated_at';

/** Every service, drafts included, in render order. */
export async function listServices() {
  return unwrap(
    await db().from(TABLES.SERVICES).select(SERVICE_COLUMNS).order('position', { ascending: true }),
  );
}

export async function createService(patch) {
  return mutate(
    TABLES.SERVICES,
    db()
      .from(TABLES.SERVICES)
      .insert(await withActor(patch))
      .select(SERVICE_COLUMNS)
      .single(),
  );
}

/**
 * Update one service.
 *
 * `key` and `id` are stripped rather than trusted: the dialog does
 * not offer them, so their presence in a patch would be a bug, and
 * silently writing a new key would orphan the row's artwork.
 */
export async function updateService(id, patch) {
  const { key: _key, id: _id, ...safe } = patch;
  return mutate(
    TABLES.SERVICES,
    db()
      .from(TABLES.SERVICES)
      .update(await withActor(safe))
      .eq('id', id)
      .select(SERVICE_COLUMNS)
      .single(),
  );
}

export async function deleteService(id) {
  await mutate(TABLES.SERVICES, db().from(TABLES.SERVICES).delete().eq('id', id).select('id'));
}
