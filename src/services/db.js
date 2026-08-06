/* ================================================================
   The shared plumbing every dashboard service sits on.

   NOTHING PUBLIC MAY IMPORT THIS FILE. It reaches
   `@services/supabaseClient.js`, which is ~53 kB gzipped of
   `@supabase/supabase-js`; the whole admin branch is lazily loaded
   for exactly that reason (see `layouts/AdminShell.jsx`). Import
   `hasSupabase` from `@utils/env.js` in anything the public site
   mounts.
   ================================================================ */

import { requireSupabase } from './supabaseClient.js';

/** The client, or a clear Arabic error instead of a null dereference. */
export function db() {
  return requireSupabase();
}

const ARABIC = /[؀-ۿ]/;

/**
 * Supabase errors arrive in English, and the useful half of them is a
 * Postgres SQLSTATE. The schema's own triggers already raise Arabic
 * (`لا يمكن إزالة آخر حساب مدير`), so an Arabic message is passed
 * through verbatim — it was written for this audience. Everything
 * else is mapped by code, and only then falls back to the raw text.
 */
export function toAppError(error) {
  if (!error) return null;
  if (error instanceof Error && error.__bedar) return error;

  const raw = String(error.message ?? '');
  const code = error.code ?? '';

  let message;
  if (ARABIC.test(raw)) {
    message = raw;
  } else if (code === '23505') {
    message = 'هذه القيمة مستخدمة بالفعل. اختر قيمة أخرى.';
  } else if (code === '23503') {
    message = 'العنصر مرتبط بعناصر أخرى ولا يمكن حذفه قبل فك الارتباط.';
  } else if (code === '23514' || code === '23502') {
    message = 'البيانات المُدخلة غير مقبولة. راجع الحقول المطلوبة.';
  } else if (code === '42501' || code === 'PGRST301' || error.status === 401) {
    // Both halves of `can_edit()` land here: a missing role and a
    // session that has not presented its second factor.
    message = 'ليست لديك صلاحية لتنفيذ هذا الإجراء، أو انتهت صلاحية الجلسة.';
  } else if (code === 'PGRST116') {
    // Zero rows where exactly one was expected. On a READ that means
    // deleted; on a WRITE it usually means RLS — a policy that hides
    // a row makes an UPDATE match nothing rather than raise 42501,
    // so this message has to cover both or it sends the reader
    // looking for a row that is sitting right there on their screen.
    message = 'العنصر غير موجود، أو ليست لديك صلاحية تعديله — تحقّق من تسجيل الدخول والصلاحية.';
  } else {
    message = raw || 'تعذّر تنفيذ العملية. حاول مرة أخرى.';
  }

  const wrapped = new Error(message);
  wrapped.__bedar = true;
  wrapped.cause = error;
  wrapped.code = code;
  return wrapped;
}

/** `{ data, error }` → data, or throw. Every service call goes through this. */
export function unwrap({ data, error }) {
  if (error) throw toAppError(error);
  return data;
}

/**
 * The signed-in user id, for the `updated_by` / `created_by` columns.
 *
 * Reads the locally cached session rather than calling `getUser()`,
 * which is a network round trip to the auth server. Attribution is a
 * bookkeeping column, not an authorisation decision — RLS re-derives
 * the actor from the JWT on the server side regardless of what is
 * written here.
 */
export async function currentUserId() {
  const { data } = await db().auth.getSession();
  return data?.session?.user?.id ?? null;
}

/** Stamp a write with its author. */
export async function withActor(patch) {
  const updated_by = await currentUserId();
  return updated_by ? { ...patch, updated_by } : patch;
}
