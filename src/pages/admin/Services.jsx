import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HeartHandshake,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  AdminPage,
  ConfirmDialog,
  DataState,
  IconAction,
  ImageField,
  StateBadge,
  STATE_OPTIONS,
} from '@components/admin';
import { Button, Card, Input, Modal, Select, Textarea } from '@components/ui';
import { SERVICE_ICON_OPTIONS, serviceIcon } from '@content/serviceIcons.js';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from '@services/servicesService.js';
import { reorder } from '@services/collectionsService.js';
import { cn } from '@utils/cn.js';
import { TABLES } from '@utils/constants.js';
import { slugify } from '@utils/format.js';

/* ================================================================
   SERVICES (Dashboard spec §3.2)

   The seven services, edited here rather than in code. They render
   in two places — the homepage band and /services — from one record
   each, so this screen owns the title, the description, the mark on
   the homepage card, the photograph on the services page, the order
   and the publish state.

   A DIALOG, NOT A ROUTE. Same call as testimonials and FAQ: five
   fields and no long-form body do not deserve their own URL, a
   loading state and a back button. Articles get a route because they
   have a block editor behind them; a service does not.

   ORDER IS THE SITE'S ORDER. The arrows write `position`, which is
   what both pages sort on, so the list on this screen is a preview
   of the band. `reorder` is shared with collections — one
   renumbering routine and one refetch announcement per move.

   NO KEY FIELD, ON PURPOSE. `services.key` joins a row to the
   artwork bundled with the build, so it is generated once and never
   edited: renaming it would silently strip a service of its
   photograph and its icon. The dialog shows it, read-only, so it is
   visible rather than magic.
   ================================================================ */

/** Description text is long; the list shows the first line of it. */
const SUMMARY_LENGTH = 150;

/**
 * A key for a new service: ASCII, unique against what is on screen.
 *
 * `slugify` keeps Arabic letters — correct for a URL slug on an
 * Arabic site, wrong for this column, which is constrained to
 * `^[a-z0-9]+(-[a-z0-9]+)*$` because it is matched against the
 * bundled asset maps. An Arabic title therefore has nothing usable
 * to derive from and falls back to a generated identifier.
 *
 * The uniqueness pass is a courtesy, not the guarantee: the unique
 * constraint on the column is. Two editors creating "التدريب" in the
 * same second still get a clean 23505 with an Arabic message.
 */
function nextKey(title, taken) {
  const base =
    slugify(title)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `service-${Date.now().toString(36)}`;

  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/**
 * A service's mark in the tinted disc the dashboard uses for icons.
 *
 * Takes the RESOLVED component as a prop — the `icon: Icon` shape
 * `IconAction` already uses — rather than resolving it itself. A
 * component-valued local created in a component body trips
 * `react-hooks/static-components`, and it is right to in general:
 * a locally-created component remounts on every render. These marks
 * are module-level lucide components, so passing one down is both
 * correct and the way the rest of the dashboard does it.
 */
function ServiceMark({ icon: Icon, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring ring-inset',
        className,
      )}
    >
      {Icon ? <Icon className="size-5" strokeWidth={1.75} /> : null}
    </span>
  );
}

export default function Services() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(listServices, 'services');
  const items = data ?? [];

  useEffect(() => {
    document.title = 'الخدمات | لوحة تحكم بدار';
  }, []);

  const move = async (index, delta) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await reorder(
        TABLES.SERVICES,
        next.map((item) => item.id),
        items,
      );
      reload();
    } catch (caught) {
      toast.failure(caught);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteService(pendingDelete.id);
      setPendingDelete(null);
      reload();
      toast.success('تم حذف الخدمة.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPage
      wide
      eyebrow="المحتوى"
      icon={HeartHandshake}
      title="الخدمات"
      description="الخدمات التي تعرضها الصفحة الرئيسية وصفحة الخدمات. الترتيب هنا هو ترتيب ظهورها، وأي تعديل يُحفظ يظهر في الموقع مباشرة."
      actions={
        <Button variant="secondary" size="sm" href="/services" target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" aria-hidden="true" />
          معاينة
        </Button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs leading-relaxed text-ink-secondary">
          لكل خدمة أيقونة تظهر في الصفحة الرئيسية، وصورة تظهر في صفحة الخدمات. الخدمات السبع الأصلية
          لها صورة وأيقونة جاهزتان في التصميم، فلا حاجة لرفع صورة إلا إذا أردت استبدالها.
        </p>
        <Button onClick={() => setEditing({})}>
          <Plus className="size-4" aria-hidden="true" />
          خدمة جديدة
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyMessage="لا توجد خدمات بعد."
      >
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => {
            return (
              <li key={item.id}>
                <Card className="gap-3" padded={false}>
                  <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      {/* The mark as it will be drawn on the homepage
                          card — the fastest way to check that the icon
                          picked in the dialog is the one meant. */}
                      <ServiceMark icon={serviceIcon(item)} />

                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        <p className="text-xs leading-relaxed text-ink-muted">
                          {item.description.length > SUMMARY_LENGTH
                            ? `${item.description.slice(0, SUMMARY_LENGTH)}…`
                            : item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <StateBadge state={item.state} />
                      <IconAction
                        label="تحريك لأعلى"
                        icon={ChevronUp}
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                      />
                      <IconAction
                        label="تحريك لأسفل"
                        icon={ChevronDown}
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                      />
                      <IconAction label="تحرير" icon={Pencil} onClick={() => setEditing(item)} />
                      <IconAction
                        label="حذف"
                        icon={Trash2}
                        danger
                        onClick={() => setPendingDelete(item)}
                      />
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </DataState>

      <ServiceDialog
        record={editing}
        position={items.length}
        takenKeys={new Set(items.map((item) => item.key))}
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
        title="حذف الخدمة"
      >
        ستُحذف خدمة «{pendingDelete?.title}» من الصفحة الرئيسية ومن صفحة الخدمات نهائياً. لإخفائها
        مؤقتاً بدل حذفها، غيّر حالتها إلى «غير منشور».
      </ConfirmDialog>
    </AdminPage>
  );
}

function ServiceDialog({ record, position, takenKeys, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  // Render-phase seeding, as everywhere else in the dashboard: the
  // dialog opens on the record it was given, never on a frame of the
  // previous one. See CLAUDE.md — an effect here trips
  // `react-hooks/set-state-in-effect`.
  const [source, setSource] = useState(null);
  if (record !== source) {
    setSource(record);
    setForm(
      record
        ? {
            title: record.title ?? '',
            description: record.description ?? '',
            icon: record.icon ?? '',
            image_media_id: record.image_media_id ?? null,
            image_alt: record.image_alt ?? '',
            state: record.state ?? 'published',
          }
        : null,
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (record?.id) {
        await updateService(record.id, form);
      } else {
        await createService({ ...form, key: nextKey(form.title, takenKeys), position });
      }
      toast.success('تم الحفظ.');
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
      title={record?.id ? 'تحرير الخدمة' : 'خدمة جديدة'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button form="service-form" type="submit" loading={busy} disabled={busy}>
            حفظ
          </Button>
        </>
      }
    >
      {form ? (
        <form id="service-form" onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="اسم الخدمة"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />

          <Textarea
            label="وصف الخدمة"
            rows={6}
            required
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            hint="يظهر كاملاً في البطاقة، فاكتبه بالطول الذي تريد قراءته على الموقع."
          />

          {/* Select + live preview: the option labels name what the
              mark DEPICTS, and the disc beside them is the check. */}
          <div className="flex items-end gap-3">
            <Select
              label="الأيقونة"
              fieldClassName="flex-1"
              // A real, selectable "default" option rather than
              // `placeholder`, which renders a DISABLED one: an editor
              // who picks a mark must be able to go back to the
              // service's own default, and a disabled option is a
              // one-way door.
              options={[{ value: '', label: 'الأيقونة الافتراضية' }, ...SERVICE_ICON_OPTIONS]}
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
              hint="تظهر في بطاقة الخدمة على الصفحة الرئيسية."
            />
            <ServiceMark
              className="mb-7"
              icon={serviceIcon({ icon: form.icon, key: record?.key })}
            />
          </div>

          <ImageField
            label="صورة الخدمة"
            hint="تظهر في صفحة الخدمات. اتركها فارغة لاستخدام الصورة المرفقة بالتصميم."
            mediaId={form.image_media_id}
            altText={form.image_alt}
            onChange={({ mediaId, altText }) =>
              setForm({ ...form, image_media_id: mediaId, image_alt: altText })
            }
          />

          <Select
            label="حالة النشر"
            options={STATE_OPTIONS}
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value })}
          />

          {record?.key ? (
            <p className="rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
              المعرّف البرمجي: <span className="ltr-run font-medium">{record.key}</span> — يربط
              الخدمة بصورتها وأيقونتها المرفقتين بالتصميم، ولا يمكن تغييره.
            </p>
          ) : (
            <p className="rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
              الخدمة الجديدة لا صورة جاهزة لها في التصميم، فاختر لها صورة من مكتبة الوسائط لتظهر
              بطاقتها مكتملة في صفحة الخدمات.
            </p>
          )}
        </form>
      ) : null}
    </Modal>
  );
}
