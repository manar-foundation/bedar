import { useEffect, useState } from 'react';
import { History, Info, RotateCcw } from 'lucide-react';

import { AdminPage, ConfirmDialog, DataState } from '@components/admin';
import { Badge, Button, Modal, Select, Table } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  ENTITY_LABELS,
  getVersion,
  listVersions,
  pruneVersions,
  restoreVersion,
} from '@services/versionsService.js';
import { formatDate } from '@utils/format.js';

/* ================================================================
   VERSION HISTORY (Dashboard spec §10)

   "Version history on content edits, separate from the code-level
   Git history."

   Every row here was written by a database trigger, not by this
   dashboard — a history that depends on the client remembering to
   write it is a history with holes in it. It is also append-only:
   there is no INSERT or UPDATE policy on the table for anyone
   holding the anon key, because a rewritable audit log is not an
   audit log.

   Restoring APPENDS. Writing a snapshot back fires the same trigger
   and records a new version, so the state you replaced is still
   there — a restore that erased it would be the one edit nobody
   could undo.
   ================================================================ */

const ACTION_LABELS = { insert: 'إنشاء', update: 'تعديل', delete: 'حذف' };
const ACTION_TONES = { insert: 'success', update: 'info', delete: 'error' };

export default function VersionHistory() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [entityType, setEntityType] = useState('');
  const [inspecting, setInspecting] = useState(null);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pruning, setPruning] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () => listVersions({ entityType: entityType || null, limit: 100 }),
    `versions-${entityType}`,
  );

  const rows = data ?? [];

  useEffect(() => {
    document.title = 'سجل النسخ | لوحة تحكم بدار';
  }, []);

  const inspect = async (row) => {
    try {
      setInspecting(await getVersion(row.id));
    } catch (caught) {
      toast.failure(caught);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      await restoreVersion(pendingRestore);
      setPendingRestore(null);
      setInspecting(null);
      reload();
      toast.success('تم استرجاع النسخة، وسُجّلت كتعديل جديد في السجل.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  const prune = async () => {
    setPruning(true);
    try {
      const removed = await pruneVersions(50);
      reload();
      toast.success(`تم حذف ${removed ?? 0} نسخة قديمة.`);
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setPruning(false);
    }
  };

  const columns = [
    {
      key: 'entity_label',
      header: 'العنصر',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">{row.entity_label || 'بلا عنوان'}</span>
          <span className="text-xs text-ink-muted">
            {ENTITY_LABELS[row.entity_type] ?? row.entity_type}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'الإجراء',
      render: (row) => (
        <Badge tone={ACTION_TONES[row.action] ?? 'neutral'} size="sm">
          {ACTION_LABELS[row.action] ?? row.action}
        </Badge>
      ),
    },
    {
      key: 'version',
      header: 'النسخة',
      numeric: true,
      render: (row) => row.version,
    },
    {
      key: 'created_by_email',
      header: 'بواسطة',
      render: (row) => (
        <span className="ltr-run text-xs text-ink-secondary">{row.created_by_email || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'التاريخ',
      render: (row) => <span className="text-xs text-ink-muted">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => inspect(row)}>
          عرض
        </Button>
      ),
    },
  ];

  return (
    <AdminPage
      wide
      eyebrow="الموقع"
      icon={History}
      title="سجل النسخ"
      description="كل تعديل على المحتوى، ومن قام به، ومتى — مع إمكانية استرجاع أي نسخة سابقة."
      actions={
        isAdmin ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={prune}
            loading={pruning}
            disabled={pruning}
          >
            <History className="size-4" aria-hidden="true" />
            تنظيف النسخ القديمة
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="نوع العنصر"
          labelHidden
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          options={[
            { value: '', label: 'كل الأنواع' },
            ...Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label })),
          ]}
          fieldClassName="w-52"
        />
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={rows.length === 0}
        emptyMessage="لا توجد تعديلات مسجَّلة بعد."
      >
        <Table columns={columns} rows={rows} caption="سجل التعديلات" />
      </DataState>

      <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        هذا سجل المحتوى وليس سجل الشيفرة. التغييرات البرمجية لها تاريخها الخاص في المستودع، وهما
        سجلّان منفصلان عن قصد. الاسترجاع لا يمحو شيئاً — يُضيف نسخة جديدة فوق السجل.
      </p>

      <Modal
        open={Boolean(inspecting)}
        onClose={() => setInspecting(null)}
        title="محتوى النسخة"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInspecting(null)}>
              إغلاق
            </Button>
            <Button onClick={() => setPendingRestore(inspecting)}>
              <RotateCcw className="size-4 mirror-rtl" aria-hidden="true" />
              استرجاع هذه النسخة
            </Button>
          </>
        }
      >
        {inspecting ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-ink-muted">
              {ENTITY_LABELS[inspecting.entity_type] ?? inspecting.entity_type} ·{' '}
              <span className="ltr-run">نسخة {inspecting.version}</span> ·{' '}
              {formatDate(inspecting.created_at)}
            </p>
            {/* The raw snapshot, LTR because it is JSON. Rendering it
                as a form would be a second editor to keep in step
                with the real one; this is a diff-by-eye, not a
                workspace. */}
            <pre className="ltr-run max-h-96 overflow-auto rounded-md bg-sunken p-4 text-[11px] leading-relaxed text-ink">
              {JSON.stringify(inspecting.snapshot, null, 2)}
            </pre>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingRestore)}
        onClose={() => setPendingRestore(null)}
        onConfirm={restore}
        busy={busy}
        tone="primary"
        confirmLabel="استرجاع"
        title="استرجاع النسخة"
      >
        ستُكتب محتويات هذه النسخة فوق النسخة الحالية للعنصر «
        {pendingRestore?.entity_label || 'بلا عنوان'}». النسخة الحالية تبقى محفوظة في السجل، فيمكن
        التراجع عن الاسترجاع نفسه.
      </ConfirmDialog>
    </AdminPage>
  );
}
