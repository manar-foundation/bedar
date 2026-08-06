import { useEffect, useState } from 'react';
import { ArrowLeft, Info, Pencil, Plus, Shuffle, Trash2 } from 'lucide-react';

import { AdminPage, ConfirmDialog, DataState, IconAction } from '@components/admin';
import { Badge, Button, Input, Modal, Select, Switch, Table } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  createRedirect,
  deleteRedirect,
  listRedirects,
  updateRedirect,
  validateRedirect,
} from '@services/redirectsService.js';
import { REDIRECT_CODES } from '@utils/constants.js';
import { formatDate } from '@utils/format.js';

/* ================================================================
   REDIRECTS MANAGER (Dashboard spec §8)

   Independent of any page edit, because redirects outlive the page
   that caused them: retiring a page entirely, or the
   bedar.webflow.io → bedar.org cutover, both need rows with no page
   to hang them off.

   Writes are admin-only in RLS. An editor sees the table — the rows
   explain why a URL behaves the way it does, which is useful to
   anyone — with the controls disabled rather than hidden, so the
   screen does not pretend the feature is missing.

   `source` matters: a row an editor caused by renaming a page is
   written by a database trigger, not typed by anyone, and the badge
   is what stops someone deleting one wondering where it came from.
   ================================================================ */

const BLANK = {
  from_path: '',
  to_path: '',
  status_code: 301,
  is_enabled: true,
  note: '',
};

export default function Redirects() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(listRedirects, 'redirects');
  const rows = data ?? [];

  useEffect(() => {
    document.title = 'إعادة التوجيه | لوحة تحكم بدار';
  }, []);

  const toggle = async (row) => {
    try {
      await updateRedirect(row.id, { is_enabled: !row.is_enabled });
      reload();
    } catch (caught) {
      toast.failure(caught);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteRedirect(pendingDelete.id);
      setPendingDelete(null);
      reload();
      toast.success('تم حذف التحويل.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'paths',
      header: 'التحويل',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="ltr-run font-medium text-ink">{row.from_path}</span>
          {/* In RTL "forward" is leftward, so the plain arrow already
              points from the old path to the new one. */}
          <ArrowLeft className="size-4 shrink-0 text-ink-muted" aria-label="إلى" />
          <span className="ltr-run text-ink-secondary">{row.to_path}</span>
        </div>
      ),
    },
    {
      key: 'status_code',
      header: 'الرمز',
      render: (row) => (
        <Badge tone={row.status_code === 301 ? 'brand' : 'neutral'} size="sm">
          <span className="ltr-run">{row.status_code}</span>
        </Badge>
      ),
    },
    {
      key: 'source',
      header: 'المصدر',
      render: (row) =>
        row.source === 'slug-change' ? (
          <Badge tone="info" size="sm">
            تلقائي
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            يدوي
          </Badge>
        ),
    },
    {
      key: 'is_enabled',
      header: 'مفعّل',
      render: (row) => (
        <Switch
          checked={row.is_enabled}
          disabled={!isAdmin}
          onChange={() => toggle(row)}
          label={`تفعيل التحويل من ${row.from_path}`}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'أُنشئ',
      render: (row) => <span className="text-xs text-ink-muted">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (row) =>
        isAdmin ? (
          <div className="flex items-center justify-end gap-1">
            <IconAction label="تحرير" icon={Pencil} onClick={() => setEditing(row)} />
            <IconAction label="حذف" icon={Trash2} danger onClick={() => setPendingDelete(row)} />
          </div>
        ) : null,
    },
  ];

  return (
    <AdminPage
      wide
      eyebrow="الموقع"
      icon={Shuffle}
      title="إعادة التوجيه"
      description="تحويل الروابط القديمة إلى الجديدة — عند تغيير رابط صفحة، أو إيقاف صفحة، أو نقل زائر قادم من الموقع القديم."
      actions={
        isAdmin ? (
          <Button onClick={() => setEditing(BLANK)}>
            <Plus className="size-4" aria-hidden="true" />
            تحويل جديد
          </Button>
        ) : null
      }
    >
      {!isAdmin ? (
        <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          إضافة التحويلات وتعديلها متاحة للمديرين فقط: تحويل خاطئ يُخرج رابطاً حياً من الموقع دون أن
          يظهر ذلك لمن أنشأه. التحويلات التي تنشأ تلقائياً عند تغييرك لرابط صفحة لا تحتاج إلى هذه
          الصلاحية.
        </p>
      ) : null}

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={rows.length === 0}
        emptyMessage="لا توجد تحويلات بعد. تغيير رابط أي صفحة سيضيف تحويلاً تلقائياً هنا."
      >
        <Table columns={columns} rows={rows} caption="قائمة التحويلات" />
      </DataState>

      <RedirectDialog
        record={editing}
        existing={rows}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        busy={busy}
        title="حذف التحويل"
      >
        بعد الحذف سيُرجع المسار{' '}
        <span className="ltr-run font-medium">{pendingDelete?.from_path}</span> صفحة 404 بدل تحويل
        الزائر.
      </ConfirmDialog>
    </AdminPage>
  );
}

function RedirectDialog({ record, existing, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const [source, setSource] = useState(null);
  if (record !== source) {
    setSource(record);
    setForm(record ? { ...BLANK, ...record } : null);
  }

  const validation = form ? validateRedirect(form, existing, record?.id ?? null) : null;

  const submit = async (event) => {
    event.preventDefault();
    if (!validation?.ok) return;

    setBusy(true);
    try {
      const patch = {
        from_path: form.from_path.trim(),
        to_path: form.to_path.trim(),
        status_code: Number(form.status_code),
        is_enabled: form.is_enabled,
        note: form.note,
      };
      if (record?.id) await updateRedirect(record.id, patch);
      else await createRedirect(patch);
      toast.success('تم حفظ التحويل.');
      onSaved();
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(record)}
      onClose={onClose}
      title={record?.id ? 'تحرير التحويل' : 'تحويل جديد'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            form="redirect-form"
            type="submit"
            loading={busy}
            disabled={busy || !validation?.ok}
          >
            حفظ
          </Button>
        </>
      }
    >
      {form ? (
        <form id="redirect-form" onSubmit={submit} className="flex flex-col gap-4">
          {record?.source === 'slug-change' ? (
            <p className="rounded-md bg-info-100 px-3 py-2 text-xs leading-relaxed text-info-700">
              أُنشئ هذا التحويل تلقائياً عند تغيير مسار صفحة أو عنصر. تعديله ممكن، لكن الأصل أن
              يُترك كما هو.
            </p>
          ) : null}

          <Input
            label="المسار القديم"
            dir="ltr"
            required
            value={form.from_path}
            onChange={(event) => setForm({ ...form, from_path: event.target.value })}
            error={validation.errors.from_path}
            hint="المسار كما يظهر بعد اسم النطاق، مثل /old-page"
          />

          <Input
            label="المسار الجديد"
            dir="ltr"
            required
            value={form.to_path}
            onChange={(event) => setForm({ ...form, to_path: event.target.value })}
            error={validation.errors.to_path}
            hint="مسار داخلي يبدأ بـ / أو عنوان كامل يبدأ بـ https://"
          />

          {validation.warning ? (
            <p className="rounded-md bg-warning-100 px-3 py-2 text-xs leading-relaxed text-warning-700">
              {validation.warning}
            </p>
          ) : null}

          <Select
            label="رمز الحالة"
            value={String(form.status_code)}
            onChange={(event) => setForm({ ...form, status_code: Number(event.target.value) })}
            options={REDIRECT_CODES.map((code) => ({
              value: String(code.value),
              label: code.label,
            }))}
            hint="301 دائم ويُحفظ في ذاكرة المتصفح — استخدم 302 للتحويلات المؤقتة."
          />

          <Input
            label="ملاحظة"
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            hint="سبب التحويل، ليعرف من يراجعه لاحقاً لماذا أُضيف."
          />

          <Switch
            label="مفعّل"
            checked={form.is_enabled}
            onChange={(event) => setForm({ ...form, is_enabled: event.target.checked })}
          />
        </form>
      ) : null}
    </Modal>
  );
}
