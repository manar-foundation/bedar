import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, FileText, Info } from 'lucide-react';

import {
  AdminPage,
  DataState,
  FieldEditor,
  SaveBar,
  SeoSection,
  StateBadge,
  StateSelect,
  groupFields,
} from '@components/admin';
import { Button, Card, Input, Select, Tabs } from '@components/ui';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  getPage,
  listPageFields,
  listPages,
  savePageFields,
  updatePage,
} from '@services/pagesService.js';
import { formatDate } from '@utils/format.js';

/* ================================================================
   PAGE EDITOR (Dashboard spec §2, §5, §6)

   Three tabs over one row and its content fields:

     المحتوى           the developer-defined fields, grouped by section
     تحسين محركات البحث the SEO block
     الإعدادات          URL, parent, publish state

   Nothing autosaves. A page is live copy that two people may be
   editing, so the moment a half-written sentence becomes the public
   site is a decision an editor makes, not a debounce timer.
   ================================================================ */

const TABS = [
  { value: 'content', label: 'المحتوى' },
  { value: 'seo', label: 'تحسين محركات البحث' },
  { value: 'settings', label: 'الإعدادات' },
];

/** The only columns this screen may write. */
const PAGE_COLUMNS = [
  'title',
  'slug',
  'parent_id',
  'state',
  'seo_title',
  'seo_description',
  'canonical_url',
  'og_image_id',
  'is_hidden_from_search',
];

const NULLABLE = new Set(['parent_id', 'og_image_id']);

function buildForm({ page, fields }) {
  return {
    page: Object.fromEntries(
      PAGE_COLUMNS.map((key) => [key, page[key] ?? (NULLABLE.has(key) ? null : '')]),
    ),
    fields: Object.fromEntries(
      fields.map((field) => [
        field.id,
        { value: field.value, media_id: field.media_id, alt_text: field.alt_text },
      ]),
    ),
  };
}

const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

export default function PageEditor() {
  const { id } = useParams();
  const toast = useToast();
  const [tab, setTab] = useState('content');
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsyncData(async () => {
    const [page, fields, allPages] = await Promise.all([
      getPage(id),
      listPageFields(id),
      listPages(),
    ]);
    return { page, fields, allPages };
  }, id);

  /* Render-phase reset rather than an effect. Seeding the form from
     an effect would render one frame of the previous page's values
     and is the exact pattern `react-hooks/set-state-in-effect`
     exists to prevent. `data` is a fresh object per load, so
     identity comparison is the reload signal. */
  const [loaded, setLoaded] = useState(null);
  const [form, setForm] = useState(null);
  if (data && data !== loaded) {
    setLoaded(data);
    setForm(buildForm(data));
  }

  const baseline = useMemo(() => (loaded ? buildForm(loaded) : null), [loaded]);
  const groups = useMemo(() => groupFields(loaded?.fields ?? []), [loaded]);

  useEffect(() => {
    document.title = data?.page
      ? `${data.page.title} | لوحة تحكم بدار`
      : 'تحرير صفحة | لوحة تحكم بدار';
  }, [data]);

  const dirty = Boolean(form && baseline) && changed(form, baseline);

  const setPageValue = (patch) =>
    setForm((current) => ({ ...current, page: { ...current.page, ...patch } }));

  const setFieldValue = (fieldId, patch) =>
    setForm((current) => ({
      ...current,
      fields: { ...current.fields, [fieldId]: { ...current.fields[fieldId], ...patch } },
    }));

  const save = async () => {
    setSaving(true);
    try {
      const pagePatch = Object.fromEntries(
        PAGE_COLUMNS.filter((key) => changed(form.page[key], baseline.page[key])).map((key) => [
          key,
          form.page[key],
        ]),
      );

      const fieldChanges = Object.entries(form.fields)
        .filter(([fieldId, value]) => changed(value, baseline.fields[fieldId]))
        .map(([fieldId, value]) => ({ id: fieldId, ...value }));

      if (Object.keys(pagePatch).length) await updatePage(id, pagePatch);
      if (fieldChanges.length) await savePageFields(fieldChanges);

      // Re-read instead of patching locally: renaming a slug rewrites
      // `path` in a trigger, and every child page's path with it.
      reload();
      toast.success('تم حفظ التغييرات.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setSaving(false);
    }
  };

  const page = loaded?.page;

  return (
    <AdminPage
      wide
      back={{ to: '/admin/pages', label: 'كل الصفحات' }}
      icon={FileText}
      title={page?.title ?? 'تحرير صفحة'}
      actions={
        page ? (
          <>
            <StateBadge state={page.state} size="md" />
            <Button variant="secondary" size="sm" href={page.path} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" />
              معاينة
            </Button>
          </>
        ) : null
      }
    >
      <DataState loading={loading} error={error} onRetry={reload} empty={!page}>
        {form && page ? (
          <>
            <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="page-tab" />

            {tab === 'content' ? (
              <div
                role="tabpanel"
                id="panel-content"
                aria-labelledby="page-tab-content"
                className="flex flex-col gap-5"
              >
                {groups.length === 0 ? (
                  <p className="rounded-md bg-sunken px-4 py-3 text-sm text-ink-secondary">
                    لا توجد حقول محتوى معرّفة لهذه الصفحة.
                  </p>
                ) : null}

                {groups.map((group) => (
                  <Card key={group.key} className="gap-5">
                    <h2 className="text-base font-bold text-ink">{group.label}</h2>
                    {group.fields.map((field) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        value={form.fields[field.id]?.value}
                        mediaId={form.fields[field.id]?.media_id}
                        altText={form.fields[field.id]?.alt_text}
                        onChange={(patch) => setFieldValue(field.id, patch)}
                      />
                    ))}
                  </Card>
                ))}
              </div>
            ) : null}

            {tab === 'seo' ? (
              <div role="tabpanel" id="panel-seo" aria-labelledby="page-tab-seo">
                <SeoSection
                  values={form.page}
                  path={page.path}
                  schemaType={page.schema_type}
                  onChange={setPageValue}
                />
              </div>
            ) : null}

            {tab === 'settings' ? (
              <div
                role="tabpanel"
                id="panel-settings"
                aria-labelledby="page-tab-settings"
                className="flex flex-col gap-5"
              >
                <Card className="gap-5">
                  <h2 className="text-base font-bold text-ink">الرابط والحالة</h2>

                  <Input
                    label="اسم الصفحة"
                    value={form.page.title}
                    onChange={(event) => setPageValue({ title: event.target.value })}
                    hint="يظهر في لوحة التحكم وفي مسار التنقل — وليس بالضرورة كعنوان داخل الصفحة."
                  />

                  <Input
                    label="الرابط (Slug)"
                    dir="ltr"
                    value={form.page.slug}
                    onChange={(event) => setPageValue({ slug: event.target.value.trim() })}
                    hint={
                      page.slug === ''
                        ? 'الصفحة الرئيسية — يبقى الرابط فارغاً لتظل على /'
                        : 'مقطع واحد بلا مسافات ولا شرطة مائلة. تغييره يُنشئ تحويل 301 من الرابط القديم تلقائياً.'
                    }
                  />

                  <Select
                    label="الصفحة الأم"
                    value={form.page.parent_id ?? ''}
                    onChange={(event) => setPageValue({ parent_id: event.target.value || null })}
                    options={[
                      { value: '', label: 'بدون صفحة أم' },
                      ...(loaded.allPages ?? [])
                        .filter((candidate) => candidate.id !== page.id)
                        .map((candidate) => ({ value: candidate.id, label: candidate.title })),
                    ]}
                    hint="اختيار صفحة أم يغيّر الرابط ويولّد بيانات BreadcrumbList تلقائياً."
                  />

                  <StateSelect
                    value={form.page.state}
                    onChange={(state) => setPageValue({ state })}
                  />

                  <div className="flex flex-col gap-1 rounded-md bg-sunken px-4 py-3 text-xs text-ink-secondary">
                    <span>
                      الرابط الحالي: <span className="ltr-run font-medium">{page.path}</span>
                    </span>
                    <span>
                      المعرّف البرمجي: <span className="ltr-run">{page.key}</span>
                    </span>
                    {page.published_at ? (
                      <span>نُشرت في {formatDate(page.published_at)}</span>
                    ) : null}
                  </div>
                </Card>

                <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
                  <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  تصميم الصفحة وترتيب أقسامها يُبنيان برمجياً، وما يُحرَّر هنا هو المحتوى داخل هذا
                  التصميم. لهذا لا يحتاج تعديل نص أو صورة إلى نشر جديد للشيفرة.
                </p>
              </div>
            ) : null}

            <SaveBar
              dirty={dirty}
              saving={saving}
              onSave={save}
              onReset={() => setForm(baseline)}
            />
          </>
        ) : null}
      </DataState>
    </AdminPage>
  );
}
