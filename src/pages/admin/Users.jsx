import { useEffect, useState } from 'react';
import { Info, ShieldCheck, UserPlus, Users as UsersIcon } from 'lucide-react';

import { AdminPage, ConfirmDialog, DataState } from '@components/admin';
import { Badge, Select, Switch, Table } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { listProfiles, updateProfile } from '@services/usersService.js';
import { ROLES } from '@utils/constants.js';
import { formatDate } from '@utils/format.js';

/* ================================================================
   USERS & PERMISSIONS (Dashboard spec §9)

   Two roles:

     مدير   everything — users, redirects, integrations, settings
     محرّر  content — pages, collections, media, navigation

   The role in this table is a rendering hint. `public.auth_role()`
   re-reads it from `profiles` on every single statement, so a user
   who is demoted while signed in loses access on their next write,
   not on their next login.

   THERE IS NO "INVITE" BUTTON, and there cannot be one here:
   creating an auth user requires the service-role key, which
   bypasses every RLS policy in the project and must never reach a
   browser bundle. Until Phase 6 adds an Edge Function that holds it
   server-side, accounts are created from the Supabase dashboard —
   and this screen says so instead of showing a button that fails.
   ================================================================ */

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: 'مدير' },
  { value: ROLES.EDITOR, label: 'محرّر' },
];

const ROLE_LABELS = { [ROLES.ADMIN]: 'مدير', [ROLES.EDITOR]: 'محرّر' };

export default function Users() {
  const toast = useToast();
  const { isAdmin, user } = useAuth();
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(listProfiles, 'users');
  const rows = data ?? [];

  useEffect(() => {
    document.title = 'المستخدمون | لوحة تحكم بدار';
  }, []);

  const apply = async (id, patch) => {
    try {
      await updateProfile(id, patch);
      reload();
      toast.success('تم تحديث الحساب.');
    } catch (caught) {
      // The database raises Arabic here: "لا يمكن إزالة آخر حساب
      // مدير", "لا يمكن تغيير الصلاحية إلا من قِبل مدير".
      toast.failure(caught);
      reload();
    }
  };

  const confirmDeactivate = async () => {
    setBusy(true);
    await apply(pending.id, { is_active: false });
    setPending(null);
    setBusy(false);
  };

  const columns = [
    {
      key: 'email',
      header: 'الحساب',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink">{row.full_name || 'بلا اسم معروض'}</span>
          <span className="ltr-run text-xs text-ink-muted">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'الصلاحية',
      render: (row) =>
        isAdmin ? (
          <Select
            label={`صلاحية ${row.email}`}
            labelHidden
            value={row.role}
            options={ROLE_OPTIONS}
            onChange={(event) => apply(row.id, { role: event.target.value })}
            fieldClassName="w-36"
          />
        ) : (
          <Badge tone={row.role === ROLES.ADMIN ? 'brand' : 'neutral'} size="sm">
            {ROLE_LABELS[row.role] ?? row.role}
          </Badge>
        ),
    },
    {
      key: 'is_active',
      header: 'نشط',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            label={`تفعيل حساب ${row.email}`}
            checked={row.is_active}
            disabled={!isAdmin}
            onChange={(event) =>
              event.target.checked ? apply(row.id, { is_active: true }) : setPending(row)
            }
          />
          {row.id === user?.id ? (
            <Badge tone="info" size="sm">
              أنت
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'أُضيف',
      render: (row) => <span className="text-xs text-ink-muted">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <AdminPage
      wide
      eyebrow="الإدارة"
      icon={UsersIcon}
      title="المستخدمون والصلاحيات"
      description="من يستطيع الدخول إلى لوحة التحكم وبأي صلاحية."
    >
      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={rows.length === 0}
        emptyMessage={
          isAdmin
            ? 'لا توجد حسابات ظاهرة.'
            : 'قائمة المستخدمين متاحة للمديرين فقط — هذه هي سياسة القراءة في قاعدة البيانات، لا خطأ في الصفحة.'
        }
      >
        <Table columns={columns} rows={rows} caption="حسابات لوحة التحكم" />
      </DataState>

      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
          <UserPlus className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          إضافة حساب جديد تتم من لوحة Supabase عبر دعوة بالبريد. إنشاء الحسابات من المتصفح يتطلّب
          مفتاحاً يتجاوز كل سياسات الحماية، ووجوده في صفحة ويب يعني أن الحماية كلها بلا معنى. الحساب
          الجديد يبدأ بصلاحية «محرّر» ويُرقّى من هنا.
        </p>

        <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          تعطيل الحساب هو الطريقة المعتمدة لسحب الصلاحية: تُغلق كل الأبواب فوراً دون حذف الحساب ودون
          أن يفقد ما كتبه صاحبه نسبته إليه.
        </p>

        <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          لا يمكن تعطيل آخر حساب مدير أو خفض صلاحيته — عيّن مديراً آخر أولاً. القاعدة مطبَّقة في
          قاعدة البيانات نفسها، لا في هذه الشاشة.
        </p>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={confirmDeactivate}
        busy={busy}
        confirmLabel="تعطيل الحساب"
        title="تعطيل الحساب"
      >
        سيفقد <span className="ltr-run font-medium">{pending?.email}</span> الوصول إلى لوحة التحكم
        فوراً. يبقى الحساب موجوداً ويمكن إعادة تفعيله في أي وقت.
      </ConfirmDialog>
    </AdminPage>
  );
}
