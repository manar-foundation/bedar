import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Folders, Pencil, Plus, Star, Trash2 } from 'lucide-react';

import {
  AdminPage,
  ConfirmDialog,
  DataState,
  IconAction,
  ImageField,
  StateBadge,
  STATE_OPTIONS,
} from '@components/admin';
import { Badge, Button, Card, Input, Modal, Select, Table, Textarea } from '@components/ui';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  createFaq,
  createItem,
  createTestimonial,
  deleteFaq,
  deleteItem,
  deleteTestimonial,
  isArticleShaped,
  listFaq,
  listItems,
  listTestimonials,
  reorder,
  updateFaq,
  updateTestimonial,
} from '@services/collectionsService.js';
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from '@services/servicesService.js';
import { SERVICE_ICON_OPTIONS, serviceIcon } from '@content/serviceIcons.js';
import { cn } from '@utils/cn.js';
import { COLLECTION_LABELS, COLLECTIONS, PROGRAM_STATUS_LABELS, TABLES } from '@utils/constants.js';
import { formatDate, slugify } from '@utils/format.js';

/* ================================================================
   COLLECTIONS (Dashboard spec §3.2)

   One route, six collections, two shapes:

   · articles / news / programs are article-shaped and share a table
     with a discriminator, so they share this list and the editor
     behind it.
   · testimonials, FAQ and services are short records with no body
     and no URL. They are edited in a dialog right here — a
     few-field record does not deserve a route, a loading state and
     a back button.

   SERVICES ARE A TAB, NOT A SIDEBAR SCREEN (client, Aug 2026)
   ----------------------------------------------------------------
   They shipped first as their own `/admin/services` route with its
   own rail entry, and the client looked for them here — which is
   the right instinct: this screen is where repeated, card-shaped
   content is managed, and a service is exactly that. The standalone
   route now redirects to this tab so the old URL still resolves.

   They are the one tab NOT backed by `collection_items`: services
   have their own table (migration 0010) because they carry an icon,
   an image and an order that the article shape has nowhere to put.
   That is a storage detail, not an editorial one, so it does not
   leak into where the editor goes to find them.
   ================================================================ */

const TABS = [
  COLLECTIONS.ARTICLES,
  COLLECTIONS.NEWS,
  COLLECTIONS.PROGRAMS,
  COLLECTIONS.SERVICES,
  COLLECTIONS.TESTIMONIALS,
  COLLECTIONS.FAQ,
];

const NEW_LABEL = {
  [COLLECTIONS.ARTICLES]: 'مقال جديد',
  [COLLECTIONS.NEWS]: 'خبر جديد',
  [COLLECTIONS.PROGRAMS]: 'برنامج جديد',
  [COLLECTIONS.SERVICES]: 'خدمة جديدة',
  [COLLECTIONS.TESTIMONIALS]: 'شهادة جديدة',
  [COLLECTIONS.FAQ]: 'سؤال جديد',
};

export default function CollectionsList() {
  const { collection = COLLECTIONS.ARTICLES } = useParams();

  useEffect(() => {
    document.title = `${COLLECTION_LABELS[collection] ?? 'المجموعات'} | لوحة تحكم بدار`;
  }, [collection]);

  return (
    <AdminPage
      wide
      eyebrow="المحتوى"
      icon={Folders}
      title="المجموعات"
      description="المحتوى المتكرّر: المقالات والأخبار والبرامج والخدمات وآراء المستفيدين والأسئلة الشائعة. نشر عنصر هنا يُظهره في الموقع دون أي تعديل برمجي."
    >
      <nav aria-label="المجموعات" className="flex flex-wrap gap-1 border-b border-default">
        {TABS.map((value) => (
          <Link
            key={value}
            to={`/admin/collections/${value}`}
            aria-current={value === collection ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm no-underline transition-[color,border-color] duration-(--dur-fast) ${
              value === collection
                ? 'border-action-primary font-semibold text-ink'
                : 'border-transparent font-medium text-ink-secondary hover:text-ink'
            }`}
          >
            {COLLECTION_LABELS[value]}
          </Link>
        ))}
      </nav>

      {isArticleShaped(collection) ? (
        <ArticleList collection={collection} />
      ) : collection === COLLECTIONS.SERVICES ? (
        <ServiceList />
      ) : collection === COLLECTIONS.TESTIMONIALS ? (
        <TestimonialList />
      ) : (
        <FaqList />
      )}
    </AdminPage>
  );
}

/* ── Articles / news / programs ─────────────────────────────── */

function ArticleList({ collection }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [state, setState] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(() => listItems(collection), collection);
  const items = (data ?? []).filter((item) => !state || item.state === state);

  const remove = async () => {
    setBusy(true);
    try {
      await deleteItem(pendingDelete.id);
      setPendingDelete(null);
      reload();
      toast.success('تم حذف العنصر.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'العنوان',
      render: (item) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/collections/${collection}/${item.id}`}
              className="font-semibold text-ink no-underline transition-colors duration-(--dur-fast) hover:text-brand-600"
            >
              {item.title}
            </Link>
            {item.is_featured ? (
              <Star className="size-3.5 fill-current text-accent-500" aria-label="مميّز" />
            ) : null}
          </div>
          <span className="ltr-run text-xs text-ink-muted">{item.path}</span>
        </div>
      ),
    },
    { key: 'state', header: 'الحالة', render: (item) => <StateBadge state={item.state} /> },
    {
      key: 'category',
      header: collection === COLLECTIONS.PROGRAMS ? 'المرحلة' : 'التصنيف',
      render: (item) =>
        collection === COLLECTIONS.PROGRAMS ? (
          item.program_status ? (
            <Badge tone="brand" size="sm">
              {PROGRAM_STATUS_LABELS[item.program_status] ?? item.program_status}
            </Badge>
          ) : null
        ) : (
          <span className="text-xs text-ink-secondary">{item.category || '—'}</span>
        ),
    },
    {
      key: 'published_at',
      header: 'تاريخ النشر',
      render: (item) => (
        <span className="text-xs text-ink-muted">{formatDate(item.published_at) || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/admin/collections/${collection}/${item.id}`}
            aria-label={`تحرير ${item.title}`}
            className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted no-underline transition-colors duration-(--dur-fast) hover:bg-[var(--state-hover-tint)] hover:text-ink"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Link>
          <IconAction
            label={`حذف ${item.title}`}
            icon={Trash2}
            danger
            onClick={() => setPendingDelete(item)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select
          label="الحالة"
          labelHidden
          value={state}
          onChange={(event) => setState(event.target.value)}
          options={[{ value: '', label: 'كل الحالات' }, ...STATE_OPTIONS]}
          fieldClassName="w-44"
        />
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden="true" />
          {NEW_LABEL[collection]}
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyMessage="لا توجد عناصر في هذه المجموعة بعد."
        emptyAction={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {NEW_LABEL[collection]}
          </Button>
        }
      >
        <Table columns={columns} rows={items} caption={COLLECTION_LABELS[collection]} />
      </DataState>

      <CreateItemDialog
        open={creating}
        collection={collection}
        existing={data ?? []}
        onClose={() => setCreating(false)}
        onCreated={(item) => navigate(`/admin/collections/${collection}/${item.id}`)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        busy={busy}
        title="حذف العنصر"
      >
        سيُحذف «{pendingDelete?.title}» نهائياً من الموقع. الروابط التي تشير إليه ستُرجع صفحة 404 —
        إن كان الرابط منشوراً في مكان آخر، أضف تحويلاً من قسم إعادة التوجيه قبل الحذف.
      </ConfirmDialog>
    </>
  );
}

/**
 * New items are created with a title and a slug and nothing else,
 * then opened in the full editor. Asking for the body in a dialog
 * would be a second, worse editor; asking for nothing at all would
 * leave untitled rows behind every time someone clicks and changes
 * their mind.
 */
function CreateItemDialog({ open, collection, existing, onClose, onCreated }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);

  const proposed = slug || slugify(title);
  const clash = existing.some((item) => item.slug === proposed);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const item = await createItem(collection, { title: title.trim(), slug: proposed });
      toast.success('أُنشئ العنصر كمسودة.');
      setTitle('');
      setSlug('');
      onClose();
      onCreated(item);
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={NEW_LABEL[collection]}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            form="create-item"
            type="submit"
            loading={busy}
            disabled={busy || !title.trim() || !proposed || clash}
          >
            إنشاء ومتابعة التحرير
          </Button>
        </>
      }
    >
      <form id="create-item" onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="العنوان"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <Input
          label="الرابط (Slug)"
          dir="ltr"
          value={proposed}
          onChange={(event) => setSlug(event.target.value.trim())}
          error={clash ? 'يوجد عنصر بهذا الرابط في المجموعة نفسها.' : undefined}
          hint="يُشتق من العنوان تلقائياً، ويمكن تعديله الآن قبل النشر."
        />
        <p className="text-xs leading-relaxed text-ink-muted">
          يُنشأ العنصر كمسودة، فلن يظهر في الموقع قبل تغيير حالته إلى «منشور».
        </p>
      </form>
    </Modal>
  );
}

/* ── Testimonials ───────────────────────────────────────────── */

function TestimonialList() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(listTestimonials, 'testimonials');
  const items = data ?? [];

  const move = async (index, delta) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await reorder(
        TABLES.TESTIMONIALS,
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
      await deleteTestimonial(pendingDelete.id);
      setPendingDelete(null);
      reload();
      toast.success('تم حذف الشهادة.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditing({})}>
          <Plus className="size-4" aria-hidden="true" />
          {NEW_LABEL[COLLECTIONS.TESTIMONIALS]}
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyMessage="لا توجد شهادات بعد."
      >
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li key={item.id}>
              <Card className="gap-3" padded={false}>
                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-col gap-2">
                    <p className="text-sm leading-relaxed text-ink">«{item.quote}»</p>
                    <p className="text-xs text-ink-muted">
                      {item.person_name}
                      {item.person_title ? ` — ${item.person_title}` : ''}
                    </p>
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
          ))}
        </ul>
      </DataState>

      <TestimonialDialog
        record={editing}
        position={items.length}
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
        title="حذف الشهادة"
      >
        ستُحذف شهادة «{pendingDelete?.person_name}» من الموقع نهائياً.
      </ConfirmDialog>
    </>
  );
}

function TestimonialDialog({ record, position, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  // Same render-phase seeding as the page editor: the dialog opens on
  // the record it was given, never on the previous one.
  const [source, setSource] = useState(null);
  if (record !== source) {
    setSource(record);
    setForm(
      record
        ? {
            quote: record.quote ?? '',
            person_name: record.person_name ?? '',
            person_title: record.person_title ?? '',
            photo_media_id: record.photo_media_id ?? null,
            photo_alt: record.photo_alt ?? '',
            state: record.state ?? 'published',
          }
        : null,
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (record?.id) await updateTestimonial(record.id, form);
      else await createTestimonial({ ...form, position });
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
      title={record?.id ? 'تحرير الشهادة' : 'شهادة جديدة'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button form="testimonial-form" type="submit" loading={busy} disabled={busy}>
            حفظ
          </Button>
        </>
      }
    >
      {form ? (
        <form id="testimonial-form" onSubmit={submit} className="flex flex-col gap-4">
          <Textarea
            label="نص الشهادة"
            rows={4}
            required
            value={form.quote}
            onChange={(event) => setForm({ ...form, quote: event.target.value })}
          />
          <Input
            label="الاسم"
            required
            value={form.person_name}
            onChange={(event) => setForm({ ...form, person_name: event.target.value })}
          />
          <Input
            label="الصفة أو الجهة"
            value={form.person_title}
            onChange={(event) => setForm({ ...form, person_title: event.target.value })}
          />
          <ImageField
            label="صورة الشخص"
            mediaId={form.photo_media_id}
            altText={form.photo_alt}
            onChange={({ mediaId, altText }) =>
              setForm({ ...form, photo_media_id: mediaId, photo_alt: altText })
            }
          />
          <Select
            label="حالة النشر"
            options={STATE_OPTIONS}
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value })}
          />
        </form>
      ) : null}
    </Modal>
  );
}

/* ── FAQ ────────────────────────────────────────────────────── */

function FaqList() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(listFaq, 'faq');
  const items = data ?? [];

  const move = async (index, delta) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await reorder(
        TABLES.FAQ_ITEMS,
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
      await deleteFaq(pendingDelete.id);
      setPendingDelete(null);
      reload();
      toast.success('تم حذف السؤال.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-ink-secondary">
          ترتيب الأسئلة هنا هو ترتيب ظهورها في الموقع، وهي أيضاً مصدر بيانات
          <span className="ltr-run"> FAQPage </span>
          المنظّمة في أي صفحة تعرضها.
        </p>
        <Button onClick={() => setEditing({})}>
          <Plus className="size-4" aria-hidden="true" />
          {NEW_LABEL[COLLECTIONS.FAQ]}
        </Button>
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyMessage="لا توجد أسئلة بعد."
      >
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li key={item.id}>
              <Card className="gap-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">{item.question}</h3>
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
                <p className="text-sm leading-relaxed text-ink-secondary">{item.answer}</p>
              </Card>
            </li>
          ))}
        </ol>
      </DataState>

      <FaqDialog
        record={editing}
        position={items.length}
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
        title="حذف السؤال"
      >
        سيُحذف السؤال «{pendingDelete?.question}» من الموقع ومن البيانات المنظّمة.
      </ConfirmDialog>
    </>
  );
}

function FaqDialog({ record, position, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const [source, setSource] = useState(null);
  if (record !== source) {
    setSource(record);
    setForm(
      record
        ? {
            question: record.question ?? '',
            answer: record.answer ?? '',
            state: record.state ?? 'published',
          }
        : null,
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (record?.id) await updateFaq(record.id, form);
      else await createFaq({ ...form, position });
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
      title={record?.id ? 'تحرير السؤال' : 'سؤال جديد'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button form="faq-form" type="submit" loading={busy} disabled={busy}>
            حفظ
          </Button>
        </>
      }
    >
      {form ? (
        <form id="faq-form" onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="السؤال"
            required
            value={form.question}
            onChange={(event) => setForm({ ...form, question: event.target.value })}
          />
          <Textarea
            label="الإجابة"
            rows={5}
            required
            value={form.answer}
            onChange={(event) => setForm({ ...form, answer: event.target.value })}
          />
          <Select
            label="حالة النشر"
            options={STATE_OPTIONS}
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value })}
          />
        </form>
      ) : null}
    </Modal>
  );
}

/* ── Services ───────────────────────────────────────────────── */

/** Description text is long; the list shows the first line of it. */
const SERVICE_SUMMARY_LENGTH = 150;

/**
 * A key for a new service: ASCII, unique against what is on screen.
 *
 * `services.key` joins a row to the artwork bundled with the build —
 * the photo map in `pages/public/Services.jsx` and the icon allowlist
 * in `content/serviceIcons.js` — so it is generated once and never
 * edited. Renaming it would silently strip a service of its
 * photograph and its mark.
 *
 * `slugify` keeps Arabic letters, which is right for a URL slug on an
 * Arabic site and wrong for this column: it is constrained to
 * `^[a-z0-9]+(-[a-z0-9]+)*$`. An Arabic title therefore has nothing
 * usable to derive from and falls back to a generated identifier.
 *
 * The uniqueness pass is a courtesy, not the guarantee — the unique
 * constraint on the column is. Two editors creating "التدريب" in the
 * same second still get a clean 23505 with an Arabic message.
 */
function nextServiceKey(title, taken) {
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
 * `react-hooks/static-components`, and it is right to in general: a
 * locally-created component remounts on every render. These marks
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

function ServiceList() {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(listServices, 'services');
  const items = data ?? [];

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
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs leading-relaxed text-ink-secondary">
          الترتيب هنا هو ترتيب ظهور الخدمات في الصفحة الرئيسية وفي صفحة الخدمات. الخدمات السبع
          الأصلية لها صورة وأيقونة جاهزتان في التصميم، فلا حاجة لرفع صورة إلا إذا أردت استبدالها.
        </p>
        <Button onClick={() => setEditing({})}>
          <Plus className="size-4" aria-hidden="true" />
          {NEW_LABEL[COLLECTIONS.SERVICES]}
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
          {items.map((item, index) => (
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
                        {item.description.length > SERVICE_SUMMARY_LENGTH
                          ? `${item.description.slice(0, SERVICE_SUMMARY_LENGTH)}…`
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
          ))}
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
    </>
  );
}

function ServiceDialog({ record, position, takenKeys, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  // Same render-phase seeding as the two dialogs above.
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
        await createService({
          ...form,
          key: nextServiceKey(form.title, takenKeys),
          position,
        });
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
