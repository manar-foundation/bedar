/* ================================================================
   USERS & PERMISSIONS (Dashboard spec §9)

   Role-based access so dashboard access can be shared across the
   ThreeMS / Manar team. Two roles, both defined in SQL:

     admin   everything, including users, redirects and integrations
     editor  content — pages, collections, media, navigation

   CREATING AN ACCOUNT IS NOT HERE, AND CANNOT BE.
   `auth.admin.inviteUserByEmail` requires the service-role key,
   which bypasses every RLS policy in the project and therefore must
   never be in a browser bundle. Inviting is done from the Supabase
   dashboard until Phase 6 adds an Edge Function that holds the key
   server-side; the screen says so rather than showing a button that
   cannot work.

   Deactivating is the intended way to revoke access: `auth_role()`
   returns NULL for an inactive profile, so every policy in the
   schema closes at once, and nothing they authored is orphaned.
   ================================================================ */

import { db, unwrap } from './db.js';
import { TABLES } from '@utils/constants.js';

const PROFILE_COLUMNS = 'id, email, full_name, role, is_active, last_seen_at, created_at';

export async function listProfiles() {
  return unwrap(
    await db()
      .from(TABLES.PROFILES)
      .select(PROFILE_COLUMNS)
      .order('created_at', { ascending: true }),
  );
}

/**
 * Role and activation changes are guarded twice in SQL: a trigger
 * rejects a non-admin changing either column, and a second one
 * refuses to demote or deactivate the last active admin. Both raise
 * Arabic, so their messages are shown to the user verbatim.
 */
export async function updateProfile(id, patch) {
  return unwrap(
    await db().from(TABLES.PROFILES).update(patch).eq('id', id).select(PROFILE_COLUMNS).single(),
  );
}

/** Own display name. Any signed-in user may change it. */
export async function updateOwnName(id, fullName) {
  return updateProfile(id, { full_name: fullName });
}
