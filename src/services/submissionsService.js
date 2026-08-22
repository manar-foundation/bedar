/* ================================================================
   FORM SUBMISSIONS (client notes §2)

   Reads for the dashboard's "طلبات النماذج" screen. Nothing here
   INSERTS: submissions are written by the serverless functions in
   `api/` with the service-role key, because `form_submissions` has
   no anon write policy on purpose — see the migration's header.

   Same discipline as every other service module: `.from(TABLE)` is
   confined to this file, and every call goes through `db.js` so a
   PostgREST error becomes an Arabic message rather than an English
   SQLSTATE in a toast.
   ================================================================ */

import { db, mutate, unwrap } from './db.js';
import { TABLES } from '@utils/constants.js';

const COLUMNS =
  'id, form_key, name, email, phone, subject, message, payload, ' +
  'is_handled, handled_at, handled_by, user_agent, captcha, created_at';

/**
 * Submissions, newest first.
 *
 * @param {object}  options
 * @param {string=} options.formKey  restrict to one form
 * @param {number=} options.limit    page size (the screen paginates)
 * @param {number=} options.offset
 */
export async function listSubmissions({ formKey, limit = 50, offset = 0 } = {}) {
  let query = db()
    .from(TABLES.FORM_SUBMISSIONS)
    .select(COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (formKey) query = query.eq('form_key', formKey);

  const { data, error, count } = await query;
  if (error) return unwrap({ data, error });
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * How many of each form are waiting, for the tab counters and the
 * dashboard tile. `head: true` asks PostgREST for the count without
 * the rows — the screen only wants the number.
 */
export async function countUnhandled(formKey) {
  let query = db()
    .from(TABLES.FORM_SUBMISSIONS)
    .select('id', { count: 'exact', head: true })
    .eq('is_handled', false);

  if (formKey) query = query.eq('form_key', formKey);

  const { error, count } = await query;
  if (error) return unwrap({ data: null, error });
  return count ?? 0;
}

/**
 * Mark one submission handled, or put it back.
 *
 * `handled_at` and `handled_by` are NOT sent: they are stamped by the
 * `form_submissions_stamp_handled` trigger from `auth.uid()`. Writing
 * them here would let a client claim someone else did it, and would
 * be a second implementation of a rule the database already owns.
 */
export function setHandled(id, isHandled) {
  return mutate(
    TABLES.FORM_SUBMISSIONS,
    db()
      .from(TABLES.FORM_SUBMISSIONS)
      // No `withActor`: this table has no `updated_by`, and
      // `handled_by` is stamped by the trigger from `auth.uid()`.
      .update({ is_handled: isHandled })
      .eq('id', id)
      .select(COLUMNS)
      .single(),
  );
}

/** Delete one submission. Admins only — enforced by RLS. */
export function deleteSubmission(id) {
  return mutate(
    TABLES.FORM_SUBMISSIONS,
    db().from(TABLES.FORM_SUBMISSIONS).delete().eq('id', id).select('id').single(),
  );
}

/**
 * Every submission of one form as a CSV string, for export.
 *
 * Built in the browser from a full read rather than server-side: the
 * table is small (a contact form, not an event log), and a download
 * that needs no new endpoint is a download with no new attack
 * surface.
 *
 * Cells are quoted and internal quotes doubled per RFC 4180. The
 * leading apostrophe guard on `=`, `+`, `-` and `@` is deliberate —
 * without it a message beginning `=cmd|…` is a formula that Excel
 * executes when the export is opened.
 */
export async function exportCsv(formKey) {
  const { rows } = await listSubmissions({ formKey, limit: 1000 });

  const header = [
    'التاريخ',
    'النموذج',
    'الاسم',
    'البريد',
    'الهاتف',
    'الموضوع',
    'الرسالة',
    'تمت المعالجة',
  ];

  const cell = (value) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [
    header.map(cell).join(','),
    ...rows.map((row) =>
      [
        row.created_at,
        row.form_key,
        row.name,
        row.email,
        row.phone,
        row.subject,
        row.message,
        row.is_handled ? 'نعم' : 'لا',
      ]
        .map(cell)
        .join(','),
    ),
  ];

  // A BOM, so Excel opens the Arabic as UTF-8 instead of mojibake.
  return `\ufeff${lines.join('\r\n')}\r\n`;
}
