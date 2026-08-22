import { useEffect, useMemo, useState } from 'react';
import { Check, Download, Inbox, Mail, RotateCcw, Search, Trash2 } from 'lucide-react';

import { AdminPage, ConfirmDialog, DataState, IconAction } from '@components/admin';
import { Badge, Button, Card, Input, Modal, Table, Tabs } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  deleteSubmission,
  exportCsv,
  listSubmissions,
  setHandled,
} from '@services/submissionsService.js';
import { FORM_KEYS, FORM_LABELS, ROLES } from '@utils/constants.js';
import { formatDateTime } from '@utils/format.js';

/* ================================================================
   FORM SUBMISSIONS — the inbox (client notes §2)

   "Add a section to the dashboard to manage all the requests and
    data arriving from the following forms: the contact form, the
    newsletter subscription form. Every request sent through these
    forms must be saved in the database and made available to the
    administrator through a TABLE inside the dashboard, STATING WHICH
    FORM the request was sent through."

   Which is this screen, and the shape of it is dictated by that
   sentence: one table, every submission in it, and the form each one
   came through as a column — plus a tab per form, because "manage"
   is not "read" and the two lists are answered by different people.

   WHY THE ROWS ARE READ-ONLY EXCEPT FOR ONE SWITCH
   ----------------------------------------------------------------
   A submission is a record of what a member of the public actually
   sent. Editing it would make the record a draft of itself. The one
   mutable thing is whether it has been dealt with — an inbox nobody
   can clear is a list that only grows, and after a month nobody
   opens it.

   Deleting is admin-only (RLS says so too) because it destroys the
   only copy of someone's enquiry — the email is a notification and
   may have been filtered or bounced.
   ================================================================ */

const TABS = [
  { value: '', label: 'الكل' },
  { value: FORM_KEYS.CONTACT, label: FORM_LABELS[FORM_KEYS.CONTACT] },
  { value: FORM_KEYS.NEWSLETTER, label: FORM_LABELS[FORM_KEYS.NEWSLETTER] },
];

const PAGE_SIZE = 50;

const FORM_TONES = {
  [FORM_KEYS.CONTACT]: 'brand',
  [FORM_KEYS.NEWSLETTER]: 'accent',
};

export default function Submissions() {
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const [form, setForm] = useState('');
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null); // the row shown in the detail dialog
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload, setData } = useAsyncData(
    () =>
      listSubmissions({ formKey: form || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    `${form}:${page}`,
  );

  useEffect(() => {
    document.title = 'طلبات النماذج | لوحة تحكم بدار';
  }, []);

  // Memoised because `?? []` would hand `useMemo` below a new array
  // on every render and defeat it.
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.total ?? 0;

  /* Search is client-side, over the page that is already loaded.
     A server-side `ilike` across five columns would be the right
     answer for a table of a hundred thousand rows; this one holds a
     contact form's worth, and a filter that needs no round trip is
     the one an administrator will actually use. */
  const term = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!term) return rows;
    return rows.filter((row) =>
      [row.name, row.email, row.phone, row.subject, row.message]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [rows, term]);

  /** Patch one row in place — a re-read would lose the scroll position. */
  const replaceRow = (updated) =>
    setData((current) => ({
      ...current,
      rows: (current?.rows ?? []).map((row) => (row.id === updated.id ? updated : row)),
    }));

  const toggleHandled = async (row) => {
    setBusy(true);
    try {
      const updated = await setHandled(row.id, !row.is_handled);
      replaceRow(updated);
      if (open?.id === row.id) setOpen(updated);
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteSubmission(pendingDelete.id);
      setPendingDelete(null);
      setOpen(null);
      toast.success('تم حذف الطلب.');
      reload();
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const csv = await exportCsv(form || undefined);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bedar-${form || 'all'}-submissions.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'created_at',
      header: 'التاريخ',
      render: (row) => (
        <span className="ltr-run whitespace-nowrap text-ink-secondary">
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      // The column §2 asks for by name.
      key: 'form_key',
      header: 'النموذج',
      render: (row) => (
        <Badge tone={FORM_TONES[row.form_key] ?? 'neutral'}>
          {FORM_LABELS[row.form_key] ?? row.form_key}
        </Badge>
      ),
    },
    {
      key: 'who',
      header: 'المُرسِل',
      render: (row) => (
        <span className="flex min-w-0 flex-col">
          {row.name ? <span className="truncate font-medium text-ink">{row.name}</span> : null}
          <span className="ltr-run truncate text-xs text-ink-muted">{row.email || '—'}</span>
        </span>
      ),
    },
    {
      key: 'summary',
      header: 'الموضوع',
      render: (row) => (
        <span className="line-clamp-2 max-w-md text-ink-secondary">
          {row.subject ||
            row.message ||
            (row.form_key === FORM_KEYS.NEWSLETTER ? 'اشتراك في النشرة' : '—')}
        </span>
      ),
    },
    {
      key: 'state',
      header: 'الحالة',
      render: (row) =>
        row.is_handled ? (
          <Badge tone="success">تمت المعالجة</Badge>
        ) : (
          <Badge tone="warning">جديد</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      align: 'end',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconAction label="عرض التفاصيل" icon={Search} onClick={() => setOpen(row)} />
          <IconAction
            label={row.is_handled ? 'إرجاع إلى الجديد' : 'تحديد كمعالَج'}
            icon={row.is_handled ? RotateCcw : Check}
            disabled={busy}
            onClick={() => toggleHandled(row)}
          />
          {isAdmin ? (
            <IconAction
              label="حذف الطلب"
              icon={Trash2}
              danger
              onClick={() => setPendingDelete(row)}
            />
          ) : null}
        </div>
      ),
    },
  ];

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminPage
      wide
      eyebrow="المحتوى"
      icon={Inbox}
      title="طلبات النماذج"
      description="كل ما يصل من نموذج التواصل ونموذج الاشتراك في النشرة البريدية، محفوظاً في قاعدة البيانات."
      actions={
        <Button variant="secondary" size="sm" onClick={download} disabled={busy || !rows.length}>
          <Download className="size-4" aria-hidden="true" />
          تصدير CSV
        </Button>
      }
    >
      <Tabs
        tabs={TABS}
        value={form}
        onChange={(value) => {
          setForm(value);
          setPage(0);
        }}
        idPrefix="submissions-tab"
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          label="بحث"
          labelHidden
          placeholder="ابحث بالاسم أو البريد أو نص الرسالة"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon={<Search />}
          fieldClassName="min-w-64 max-w-md flex-1"
        />
        <p className="text-xs text-ink-muted">
          إجمالي الطلبات: <span className="ltr-run font-medium">{total}</span>
        </p>
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!loading && !error && rows.length === 0}
        emptyMessage="لا توجد طلبات بعد. يظهر هنا كل ما يُرسَل من نماذج الموقع."
      >
        <div className="flex flex-col gap-4">
          <Table
            columns={columns}
            rows={visible}
            getRowKey={(row) => row.id}
            caption="طلبات النماذج"
            empty="لا توجد نتائج مطابقة لبحثك."
          />

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
              >
                الأحدث
              </Button>
              <span className="text-xs text-ink-muted">
                صفحة <span className="ltr-run">{page + 1}</span> من{' '}
                <span className="ltr-run">{pageCount}</span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                الأقدم
              </Button>
            </div>
          ) : null}
        </div>
      </DataState>

      <SubmissionDialog
        row={open}
        onClose={() => setOpen(null)}
        onToggle={() => toggleHandled(open)}
        busy={busy}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        busy={busy}
        title="حذف الطلب"
      >
        سيُحذف هذا الطلب نهائياً ولا يمكن استرجاعه. الرسالة المُرسَلة بالبريد ليست نسخة احتياطية —
        قد تكون قد فُلترت أو حُذفت.
      </ConfirmDialog>
    </AdminPage>
  );
}

/**
 * One submission, in full.
 *
 * The table shows a summary because a message is three paragraphs
 * long; this is where it is actually read — and where the fields the
 * table has no column for (phone, the raw payload) live.
 */
function SubmissionDialog({ row, onClose, onToggle, busy }) {
  if (!row) return null;

  const fields = [
    ['النموذج', FORM_LABELS[row.form_key] ?? row.form_key],
    ['التاريخ', formatDateTime(row.created_at)],
    ['الاسم', row.name],
    ['البريد الإلكتروني', row.email],
    ['رقم الهاتف', row.phone],
    ['الموضوع', row.subject],
  ].filter(([, value]) => value);

  return (
    <Modal open onClose={onClose} title="تفاصيل الطلب" size="lg">
      <div className="flex flex-col gap-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
              <dd className="bidi-auto text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {row.message ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">الرسالة</span>
            <p className="rounded-md border border-subtle bg-sunken p-4 text-sm leading-relaxed whitespace-pre-wrap text-ink">
              {row.message}
            </p>
          </div>
        ) : null}

        <Card className="gap-2 bg-sunken">
          <span className="text-xs font-semibold text-ink-muted">بيانات تقنية</span>
          <p className="text-xs leading-relaxed text-ink-secondary">
            التحقق من reCAPTCHA:{' '}
            <span className="ltr-run">
              {row.captcha?.skipped
                ? 'لم يُفعَّل على هذا الإرسال'
                : row.captcha?.ok
                  ? `مقبول${typeof row.captcha.score === 'number' ? ` (${row.captcha.score})` : ''}`
                  : '—'}
            </span>
          </p>
          {row.user_agent ? (
            <p className="ltr-run text-[11px] leading-relaxed break-all text-ink-muted">
              {row.user_agent}
            </p>
          ) : null}
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          {row.email ? (
            <Button variant="secondary" size="sm" href={`mailto:${row.email}`}>
              <Mail className="size-4" aria-hidden="true" />
              الرد بالبريد
            </Button>
          ) : null}
          <Button size="sm" onClick={onToggle} loading={busy} disabled={busy}>
            {row.is_handled ? (
              <>
                <RotateCcw className="mirror-rtl size-4" aria-hidden="true" />
                إرجاع إلى الجديد
              </>
            ) : (
              <>
                <Check className="size-4" aria-hidden="true" />
                تحديد كمعالَج
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
