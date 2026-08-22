import { useEffect, useMemo, useState } from 'react';
import { Check, Download, Inbox, Mail, MailOpen, Phone, RefreshCw, Trash2 } from 'lucide-react';

import { AdminPage, ConfirmDialog, DataState, IconAction } from '@components/admin';
import { Badge, Button, Card, Input, Modal, Table, Tabs } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  deleteSubmission,
  listSubmissions,
  markRead,
  toCsv,
} from '@services/submissionsService.js';
import { FORM_KIND_LABELS, FORM_KINDS, ROLES } from '@utils/constants.js';
import { formatDate } from '@utils/format.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   FORM REQUESTS (client note ٢)

   "يجب حفظ جميع الطلبات المرسلة من خلال هذه النماذج في قاعدة
   البيانات وإتاحتها للمشرف من خلال جدول داخل لوحة التحكم، مع توضيح
   نوع النموذج الذي تم إرسال الطلب من خلاله."

   One table, both forms, with the form named on every row — that is
   the requirement, and the tabs are a filter over it rather than two
   separate screens, so "how many people contacted us this week"
   stays one number.

   WHY THE MESSAGE IS BEHIND A ROW CLICK
   ----------------------------------------------------------------
   A contact message is a paragraph; five of them in a table column
   turn a scannable list into a wall. The row carries who, when and
   from where — the triage information — and the message opens in a
   dialog with the reply link right there.

   READ STATE IS NOT A PUBLISH STATE. A request is read or it is not;
   it never appears on the site, so `StateBadge` and the publish
   vocabulary are deliberately absent.
   ================================================================ */

const TABS = [
  { value: 'all', label: 'الكل' },
  { value: FORM_KINDS.CONTACT, label: FORM_KIND_LABELS[FORM_KINDS.CONTACT] },
  { value: FORM_KINDS.NEWSLETTER, label: FORM_KIND_LABELS[FORM_KINDS.NEWSLETTER] },
];

/** How often an open inbox re-reads. Only while the tab is visible. */
const POLL_MS = 30_000;

export default function Submissions() {
  const toast = useToast();
  const { role } = useAuth();

  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload, setData } = useAsyncData(
    () => listSubmissions({ form: tab === 'all' ? null : tab }),
    tab,
  );

  useEffect(() => {
    document.title = 'طلبات النماذج | لوحة تحكم بدار';
  }, []);

  /* A new request arrives while this screen is open.

     `ContentContext`'s realtime stream is deliberately NOT the source
     here: it watches the tables the PUBLIC site renders, and
     `form_submissions` is not one — anon has no select policy on it
     at all, so a public visitor's socket could never carry it and
     adding it there would be a subscription that can only ever be
     empty. This screen polls for itself instead, and only while it is
     actually on screen. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const rows = useMemo(() => {
    const all = data ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return all;
    return all.filter((row) =>
      [row.name, row.email, row.phone, row.subject, row.message]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [data, query]);

  const unread = (data ?? []).filter((row) => !row.is_read).length;
  const isAdmin = role === ROLES.ADMIN;

  /** Mark read/unread, keeping the row on screen rather than refetching. */
  const toggleRead = async (row, next) => {
    try {
      const updated = await markRead(row.id, next);
      setData((current) =>
        (current ?? []).map((item) => (item.id === row.id ? { ...item, ...updated } : item)),
      );
      if (open?.id === row.id) setOpen((current) => ({ ...current, is_read: next }));
    } catch (caught) {
      toast.failure(caught);
    }
  };

  /* Opening a request IS reading it, so the flag follows the act
     rather than asking the editor to also press a button. */
  const openRow = (row) => {
    setOpen(row);
    if (!row.is_read) toggleRead(row, true);
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteSubmission(confirmDelete.id);
      setData((current) => (current ?? []).filter((item) => item.id !== confirmDelete.id));
      if (open?.id === confirmDelete.id) setOpen(null);
      setConfirmDelete(null);
      toast.success('تم حذف الطلب.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  /* Client-side download of what is currently listed — filters
     included, because "export" almost always means "export what I am
     looking at". No endpoint is involved: the rows are already here. */
  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bedar-form-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'form',
      header: 'النموذج',
      render: (row) => (
        <Badge tone={row.form === FORM_KINDS.CONTACT ? 'brand' : 'info'}>
          {FORM_KIND_LABELS[row.form] ?? row.form}
        </Badge>
      ),
    },
    {
      key: 'sender',
      header: 'المُرسِل',
      render: (row) => (
        <button
          type="button"
          onClick={() => openRow(row)}
          className="flex flex-col items-start gap-0.5 text-start"
        >
          <span className={cn('text-sm', row.is_read ? 'text-ink' : 'font-bold text-ink')}>
            {row.name || row.email}
          </span>
          <span className="ltr-run text-xs text-ink-muted">{row.email}</span>
        </button>
      ),
    },
    {
      key: 'subject',
      header: 'الموضوع',
      render: (row) => (
        <button
          type="button"
          onClick={() => openRow(row)}
          className="line-clamp-2 max-w-80 text-start text-sm text-ink-secondary"
        >
          {row.subject || row.message || '—'}
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'التاريخ',
      render: (row) => <span className="text-xs text-ink-muted">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'إجراءات',
      align: 'end',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconAction
            label={row.is_read ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
            icon={row.is_read ? MailOpen : Mail}
            onClick={() => toggleRead(row, !row.is_read)}
          />
          {isAdmin ? (
            <IconAction
              label="حذف الطلب"
              icon={Trash2}
              danger
              onClick={() => setConfirmDelete(row)}
            />
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      wide
      eyebrow="الموقع"
      icon={Inbox}
      title="طلبات النماذج"
      description="كل ما يصل من نموذج التواصل ومن الاشتراك في النشرة البريدية، محفوظاً في قاعدة البيانات."
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={reload} loading={loading}>
            <RefreshCw className="size-4" aria-hidden="true" />
            تحديث
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!rows.length}>
            <Download className="size-4" aria-hidden="true" />
            تصدير CSV
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="submissions-tab" />
        {unread ? (
          <Badge tone="accent">
            <span className="ltr-run">{unread}</span> غير مقروء
          </Badge>
        ) : null}
      </div>

      <Input
        label="بحث"
        labelHidden
        placeholder="ابحث بالاسم أو البريد أو نص الرسالة"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fieldClassName="max-w-96"
      />

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!loading && !error && !(data ?? []).length}
        emptyMessage="لم يصل أي طلب بعد. ستظهر هنا رسائل نموذج التواصل واشتراكات النشرة فور إرسالها."
      >
        <Table
          columns={columns}
          rows={rows}
          caption="طلبات النماذج"
          empty="لا توجد نتائج مطابقة للبحث."
        />
      </DataState>

      <SubmissionDialog
        row={open}
        onClose={() => setOpen(null)}
        onToggleRead={(next) => toggleRead(open, next)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        busy={busy}
        title="حذف الطلب"
      >
        سيُحذف الطلب الوارد من «{confirmDelete?.name || confirmDelete?.email}» نهائياً. هذا سجلّ
        تواصل من شخص حقيقي — تأكّد أنه لم يعد مطلوباً قبل الحذف.
      </ConfirmDialog>
    </AdminPage>
  );
}

/**
 * One request, in full.
 *
 * The reply button is a `mailto:` rather than an in-dashboard
 * composer: replying from the organisation's own inbox keeps the
 * thread where the rest of its correspondence lives, and a composer
 * here would need a sending domain, a signature and a sent-items
 * folder that nothing else in this project has.
 */
function SubmissionDialog({ row, onClose, onToggleRead }) {
  if (!row) return null;

  const subject = row.subject ? `رد: ${row.subject}` : 'رد على رسالتك إلى منصة بدار';
  const rows = [
    ['النموذج', FORM_KIND_LABELS[row.form] ?? row.form],
    ['الاسم', row.name],
    ['البريد الإلكتروني', row.email],
    ['رقم الهاتف', row.phone],
    ['الموضوع', row.subject],
    ['التاريخ', formatDate(row.created_at)],
    ['الصفحة', row.source_path],
  ].filter(([, value]) => value);

  return (
    <Modal open onClose={onClose} title="تفاصيل الطلب" size="lg">
      <div className="flex flex-col gap-5">
        <Card className="gap-3 bg-sunken">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="text-xs text-ink-muted">{label}</dt>
                <dd
                  className="text-sm text-ink"
                  // Emails, phone numbers and paths are Latin runs
                  // inside an Arabic page; `bidi-auto` keeps each one
                  // reading in its own direction.
                  dir="auto"
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {row.message ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-ink">الرسالة</h3>
            <p className="rounded-lg border border-subtle bg-surface p-4 text-sm leading-relaxed whitespace-pre-line text-ink-secondary">
              {row.message}
            </p>
          </div>
        ) : null}

        <ExtraFields payload={row.payload} />

        <div className="flex flex-wrap items-center gap-2">
          {row.email ? (
            <Button
              size="sm"
              variant="accent"
              href={`mailto:${row.email}?subject=${encodeURIComponent(subject)}`}
            >
              <Mail className="size-4" aria-hidden="true" />
              الرد بالبريد
            </Button>
          ) : null}
          {row.phone ? (
            <Button size="sm" variant="secondary" href={`tel:${row.phone}`}>
              <Phone className="size-4" aria-hidden="true" />
              اتصال
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => onToggleRead(!row.is_read)}>
            <Check className="size-4" aria-hidden="true" />
            {row.is_read ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Anything the form posted that has no column of its own.
 *
 * The contact form's fields are dashboard-editable copy, so a field
 * added there tomorrow arrives in `payload` and would otherwise be
 * received and silently dropped from view. The known keys are the
 * ones already shown above.
 */
const KNOWN_KEYS = new Set([
  'Name-7',
  'Email-7',
  'Phone-7',
  'Company-7',
  'Message-7',
  'email',
  '_honeypot',
  'captchaToken',
  'sourcePath',
]);

function ExtraFields({ payload }) {
  const extra = Object.entries(payload ?? {}).filter(
    ([key, value]) => !KNOWN_KEYS.has(key) && value !== '' && value != null,
  );
  if (!extra.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">حقول إضافية</h3>
      <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-subtle bg-surface p-4 sm:grid-cols-2">
        {extra.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-0.5">
            <dt className="ltr-run text-xs text-ink-muted">{key}</dt>
            <dd className="text-sm text-ink" dir="auto">
              {String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
