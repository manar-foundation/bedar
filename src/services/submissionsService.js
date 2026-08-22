/* ================================================================
   FORM SUBMISSIONS (client note ٢)

   Every contact message and newsletter signup, as stored by the
   `api/` endpoints. Read-mostly: the dashboard lists them, marks
   them read, and deletes them. Nothing here creates one — a
   submission is created by a visitor, through the endpoint, with the
   anon key under the insert policy in migration 0011.

   `contentSync` is deliberately NOT notified on these writes.
   `mutate()` announces a change so the PUBLIC site re-reads its
   copy of the content; a submission is not content and no public
   page renders one, so publishing here would make every "mark as
   read" trigger a full content refetch in every open tab for
   nothing.
   ================================================================ */

import { db, unwrap, withActor } from './db.js';
import { TABLES } from '@utils/constants.js';

const COLUMNS =
  'id, form, name, email, phone, subject, message, payload, ' +
  'source_path, user_agent, is_read, created_at';

/** Newest first, optionally narrowed to one form. */
export async function listSubmissions({ form = null, limit = 200 } = {}) {
  let query = db()
    .from(TABLES.FORM_SUBMISSIONS)
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (form) query = query.eq('form', form);

  return unwrap(await query);
}

export async function markRead(id, isRead = true) {
  return unwrap(
    await db()
      .from(TABLES.FORM_SUBMISSIONS)
      .update(await withActor({ is_read: isRead }))
      .eq('id', id)
      .select(COLUMNS)
      .single(),
  );
}

/** Admin-only in RLS — an editor's delete comes back as zero rows. */
export async function deleteSubmission(id) {
  unwrap(await db().from(TABLES.FORM_SUBMISSIONS).delete().eq('id', id).select('id'));
}

/**
 * The listed rows as a CSV file, for the client's own follow-up.
 *
 * A BOM leads the file because Excel on Windows reads a UTF-8 CSV as
 * Windows-1256 without one, and the entire point of this export is
 * Arabic names and Arabic messages. `\r\n` for the same reason.
 */
export function toCsv(rows) {
  const header = [
    'التاريخ',
    'النموذج',
    'الاسم',
    'البريد الإلكتروني',
    'الهاتف',
    'الموضوع',
    'الرسالة',
    'الصفحة',
  ];

  const escape = (value) => {
    const text = String(value ?? '');
    // A leading =, +, - or @ makes a spreadsheet treat the cell as a
    // formula. Prefixing a quote is the standard defusal.
    const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${guarded.replace(/"/g, '""')}"`;
  };

  const lines = rows.map((row) =>
    [
      row.created_at,
      row.form,
      row.name,
      row.email,
      row.phone,
      row.subject,
      row.message,
      row.source_path,
    ]
      .map(escape)
      .join(','),
  );

  // The BOM is written as an escape, not as a literal: a raw BOM in
  // the source is invisible in a diff and ESLint rejects it outright.
  return `\uFEFF${[header.map(escape).join(','), ...lines].join('\r\n')}\r\n`;
}
