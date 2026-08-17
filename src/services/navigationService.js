/* ================================================================
   NAVBAR + FOOTER (Dashboard spec §3.1)

   "Fully editable from the dashboard; changes apply across the
   entire site immediately on save. Not tied to any single page."

   One flat table, two locations, one level of nesting. A row with no
   `href` is a group — a header dropdown or a footer column — which
   is what `Navbar` already branches on, so a new dropdown is a row
   and not a code change.
   ================================================================ */

import { db, mutate, unwrap, withActor } from './db.js';
import { publish } from './contentSync.js';
import { TABLES } from '@utils/constants.js';
import { slugify } from '@utils/format.js';

const NAV_COLUMNS =
  'id, location, key, parent_id, label, href, position, is_visible, opens_in_new_tab, is_group, updated_at';

export const NAV_LOCATIONS = { HEADER: 'header', FOOTER: 'footer' };

export async function listNavigation(location) {
  return unwrap(
    await db()
      .from(TABLES.NAVIGATION)
      .select(NAV_COLUMNS)
      .eq('location', location)
      .order('position', { ascending: true }),
  );
}

/** Flat rows → the two-level tree the editor renders. */
export function toTree(rows = []) {
  const roots = rows.filter((row) => !row.parent_id);
  return roots.map((row) => ({
    ...row,
    children: rows
      .filter((child) => child.parent_id === row.id)
      .sort((a, b) => a.position - b.position),
  }));
}

/**
 * `key` is the stable identifier the seed script upserts on, so a
 * dashboard-created row needs one too — otherwise a re-seed would
 * duplicate it. Derived from the label, deduplicated against what is
 * already in that location, and never changed afterwards.
 */
export function proposeKey(label, existingKeys = []) {
  const base = slugify(label) || 'item';
  if (!existingKeys.includes(base)) return base;
  let suffix = 2;
  while (existingKeys.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function createNavItem(patch) {
  return mutate(
    TABLES.NAVIGATION,
    db().from(TABLES.NAVIGATION).insert(await withActor(patch)).select(NAV_COLUMNS).single(),
  );
}

export async function updateNavItem(id, patch) {
  return mutate(
    TABLES.NAVIGATION,
    db().from(TABLES.NAVIGATION).update(await withActor(patch)).eq('id', id).select(NAV_COLUMNS).single(),
  );
}

/** Children cascade — the foreign key is `on delete cascade`. */
export async function deleteNavItem(id) {
  await mutate(TABLES.NAVIGATION, db().from(TABLES.NAVIGATION).delete().eq('id', id).select('id'));
}

/** Move one item within its own level. Positions are rewritten dense. */
export async function saveOrder(rows) {
  const client = db();
  let moved = 0;

  for (const [index, row] of rows.entries()) {
    if (row.position === index) continue;
    unwrap(
      await client
        .from(TABLES.NAVIGATION)
        .update({ position: index })
        .eq('id', row.id)
        .select('id'),
    );
    moved += 1;
  }

  // One announcement for the whole reorder rather than one per row —
  // the site re-reads the navigation once, not once per moved item.
  if (moved) publish(TABLES.NAVIGATION);
}
