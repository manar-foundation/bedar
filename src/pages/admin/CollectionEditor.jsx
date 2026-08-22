import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Folders, Star, Trash2 } from 'lucide-react';

import {
  AdminPage,
  ConfirmDialog,
  DataState,
  ImageField,
  RichTextEditor,
  SaveBar,
  SeoSection,
  StateBadge,
  StateSelect,
} from '@components/admin';
import { Button, Card, Input, Select, Switch, Tabs, Tag, Textarea } from '@components/ui';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { deleteItem, getItem, updateItem } from '@services/collectionsService.js';
import {
  COLLECTION_LABELS,
  COLLECTIONS,
  PROGRAM_STATUS_OPTIONS,
  SCHEMA_TYPES,
} from '@utils/constants.js';
import { formatDate, readingTime } from '@utils/format.js';
import { blocksToPlainText } from '@utils/richtext.js';

/* ================================================================
   ARTICLE / NEWS / PROGRAM EDITOR (Dashboard spec §3.2, §5, §6)

   The "featured" switch here only ever sets `is_featured = true`.
   Un-marking the previous one is a BEFORE trigger in the database,
   not a second write from this screen: two editors promoting two
   different articles at the same moment is exactly the race a
   client-side swap loses, and the result would be a homepage with
   two highlights or none.
   ================================================================ */

const TABS = [
  { value: 'content', label: 'المحتوى' },
  { value: 'seo', label: 'تحسين محركات البحث' },
  { value: 'settings', label: 'الإعدادات' },
];

const COLUMNS = [
  'title',
  'slug',
  'path',
  'excerpt',
  'body',
  'cover_media_id',
  'cover_alt',
  'author',
  'category',
  'tags',
  'program_status',
  'is_featured',
  'state',
  'published_at',
  'seo_title',
  'seo_description',
  'canonical_url',
  'og_image_id',
  'is_hidden_from_search',
];

const NULLABLE = new Set(['cover_media_id', 'og_image_id', 'program_status', 'published_at']);

function buildForm(item) {
  return Object.fromEntries(
    COLUMNS.map((key) => {
      const value = item[key];
      if (value != null) return [key, value];
      return [key, NULLABLE.has(key) ? null : key === 'body' || key === 'tags' ? [] : ''];
    }),
  );
}

const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

/** Article vs BlogPosting is a judgement call; news reads as Article. */
function schemaTypeFor(collection) {
  return collection === COLLECTIONS.ARTICLES ? SCHEMA_TYPES.BLOG_POSTING : SCHEMA_TYPES.ARTICLE;
}

export default function CollectionEditor() {
  const { collection, id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('content');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

  const { data, loading, error, reload } = useAsyncData(() => getItem(id), id);

  const [loaded, setLoaded] = useState(null);
  const [form, setForm] = useState(null);
  if (data && data !== loaded) {
    setLoaded(data);
    setForm(buildForm(data));
  }

  const baseline = useMemo(() => (loaded ? buildForm(loaded) : null), [loaded]);
  const dirty = Boolean(form && baseline) && changed(form, baseline);

  useEffect(() => {
    document.title = data?.title ? `${data.title} | لوحة تحكم بدار` : 'تحرير عنصر | لوحة تحكم بدار';
  }, [data]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const patch = Object.fromEntries(
        COLUMNS.filter((key) => changed(form[key], baseline[key])).map((key) => [key, form[key]]),
      );
      if (Object.keys(patch).length) await updateItem(id, patch);
      // The path is rewritten by trigger when the slug changes, and a
      // rename also writes a 301 — so re-read rather than assume.
      reload();
      toast.success('تم حفظ التغييرات.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await deleteItem(id);
      toast.success('تم حذف العنصر.');
      navigate(`/admin/collections/${collection}`, { replace: true });
    } catch (caught) {
      toast.failure(caught);
      setSaving(false);
    }
  };

  // Reading time counts every word the reader sees, whichever block
  // shape it is stored in — `blocksToPlainText` folds the legacy
  // `{ text }` blocks and the current run arrays into one string.
  const bodyWords = useMemo(() => blocksToPlainText(form?.body ?? []), [form]);

  return (
    <AdminPage
      wide
      back={{
        to: `/admin/collections/${collection}`,
        label: COLLECTION_LABELS[collection] ?? 'المجموعة',
      }}
      icon={Folders}
      title={loaded?.title ?? 'تحرير عنصر'}
      actions={
        loaded ? (
          <>
            <StateBadge state={loaded.state} size="md" />
            <Button
              variant="secondary"
              size="sm"
              href={loaded.path}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              معاينة
            </Button>
          </>
        ) : null
      }
    >
      <DataState loading={loading} error={error} onRetry={reload} empty={!loaded}>
        {form && loaded ? (
          <>
            <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="item-tab" />

            {tab === 'content' ? (
              <div
                role="tabpanel"
                id="panel-content"
                aria-labelledby="item-tab-content"
                className="flex flex-col gap-5"
              >
                <Card className="gap-5">
                  <Input
                    label="العنوان"
                    value={form.title}
                    onChange={(event) => set({ title: event.target.value })}
                  />

                  <Textarea
                    label="المقتطف"
                    rows={3}
                    value={form.excerpt}
                    onChange={(event) => set({ excerpt: event.target.value })}
                    hint="يظهر في بطاقة العنصر في صفحات القوائم وفي الفوتر."
                  />

                  <ImageField
                    label="صورة الغلاف"
                    mediaId={form.cover_media_id}
                    altText={form.cover_alt}
                    onChange={({ mediaId, altText }) =>
                      set({ cover_media_id: mediaId, cover_alt: altText })
                    }
                  />
                </Card>

                <Card className="gap-4">
                  {/* ONE field for the whole body — headings,
                      paragraphs, images, quotes and lists written in
                      place (client notes §1). It still saves the block
                      array `collection_items.body` has always held;
                      see the header of `utils/richtext.js`. */}
                  <RichTextEditor
                    label="نص المقال"
                    value={form.body ?? []}
                    onChange={(body) => set({ body })}
                    hint="اكتب المقال كاملاً هنا. استخدم شريط الأدوات لإضافة العناوين والصور والاقتباسات والقوائم داخل النص نفسه."
                  />
                  <p className="text-xs text-ink-muted">
                    زمن القراءة التقريبي: <span className="ltr-run">{readingTime(bodyWords)}</span>{' '}
                    دقيقة
                  </p>
                </Card>
              </div>
            ) : null}

            {tab === 'seo' ? (
              <div role="tabpanel" id="panel-seo" aria-labelledby="item-tab-seo">
                <SeoSection
                  values={form}
                  path={loaded.path}
                  schemaType={schemaTypeFor(collection)}
                  onChange={set}
                />
              </div>
            ) : null}

            {tab === 'settings' ? (
              <div
                role="tabpanel"
                id="panel-settings"
                aria-labelledby="item-tab-settings"
                className="flex flex-col gap-5"
              >
                <Card className="gap-5">
                  <h2 className="text-base font-bold text-ink">النشر</h2>

                  <StateSelect value={form.state} onChange={(state) => set({ state })} />

                  <Input
                    label="تاريخ النشر"
                    type="date"
                    dir="ltr"
                    value={(form.published_at ?? '').slice(0, 10)}
                    onChange={(event) =>
                      set({
                        published_at: event.target.value
                          ? new Date(event.target.value).toISOString()
                          : null,
                      })
                    }
                    hint="يُملأ تلقائياً عند أول نشر، ويمكن تعديله لترتيب القائمة."
                    fieldClassName="max-w-64"
                  />

                  <div className="flex items-start gap-3 rounded-md border border-subtle p-3">
                    <Star className="mt-0.5 size-4 shrink-0 text-accent-500" aria-hidden="true" />
                    <div className="flex flex-col gap-1">
                      <Switch
                        label="عنصر مميّز"
                        checked={Boolean(form.is_featured)}
                        onChange={(event) => set({ is_featured: event.target.checked })}
                      />
                      <p className="text-xs leading-relaxed text-ink-muted">
                        تمييز هذا العنصر يُلغي تمييز العنصر السابق في المجموعة نفسها تلقائياً — عنصر
                        مميّز واحد فقط في كل مجموعة.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="gap-5">
                  <h2 className="text-base font-bold text-ink">التصنيف والرابط</h2>

                  <Input
                    label="الرابط (Slug)"
                    dir="ltr"
                    value={form.slug}
                    onChange={(event) => set({ slug: event.target.value.trim() })}
                    hint="تغييره يُنشئ تحويل 301 من الرابط القديم تلقائياً."
                  />

                  <Input
                    label="المسار الكامل"
                    dir="ltr"
                    value={form.path}
                    onChange={(event) => set({ path: event.target.value.trim() })}
                    hint="اتركه كما هو ما لم يكن للعنصر مسار مختلف عن بقية المجموعة."
                  />

                  {collection === COLLECTIONS.PROGRAMS ? (
                    <Select
                      label="مرحلة البرنامج"
                      value={form.program_status ?? ''}
                      onChange={(event) => set({ program_status: event.target.value || null })}
                      options={[{ value: '', label: 'غير محدّدة' }, ...PROGRAM_STATUS_OPTIONS]}
                      hint="تحدّد التبويب الذي يظهر فيه البرنامج في صفحة البرامج."
                    />
                  ) : (
                    <>
                      <Input
                        label="التصنيف"
                        value={form.category}
                        onChange={(event) => set({ category: event.target.value })}
                      />
                      <Input
                        label="الكاتب"
                        value={form.author}
                        onChange={(event) => set({ author: event.target.value })}
                      />
                    </>
                  )}

                  <TagsField
                    tags={form.tags ?? []}
                    draft={tagDraft}
                    onDraft={setTagDraft}
                    onChange={(tags) => set({ tags })}
                  />

                  <div className="flex flex-col gap-1 rounded-md bg-sunken px-4 py-3 text-xs text-ink-secondary">
                    <span>
                      الرابط الحالي: <span className="ltr-run font-medium">{loaded.path}</span>
                    </span>
                    <span>آخر تعديل: {formatDate(loaded.updated_at)}</span>
                  </div>
                </Card>

                <Card className="gap-4">
                  <h2 className="text-base font-bold text-error-700">حذف العنصر</h2>
                  <p className="text-sm leading-relaxed text-ink-secondary">
                    الحذف نهائي. إن كان الرابط منشوراً في مكان آخر، أضف تحويلاً من قسم إعادة التوجيه
                    أولاً حتى لا يصطدم الزائر بصفحة 404.
                  </p>
                  <div>
                    <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                      حذف نهائي
                    </Button>
                  </div>
                </Card>
              </div>
            ) : null}

            <SaveBar
              dirty={dirty}
              saving={saving}
              onSave={save}
              onReset={() => setForm(baseline)}
            />

            <ConfirmDialog
              open={confirmDelete}
              onClose={() => setConfirmDelete(false)}
              onConfirm={remove}
              busy={saving}
              title="حذف العنصر"
            >
              سيُحذف «{loaded.title}» نهائياً من الموقع.
            </ConfirmDialog>
          </>
        ) : null}
      </DataState>
    </AdminPage>
  );
}

/**
 * Tags are a `text[]` column, so they are edited as chips rather
 * than as a comma-separated string that has to be parsed back.
 * Enter commits; the draft never becomes a tag on its own.
 */
function TagsField({ tags, draft, onDraft, onChange }) {
  const commit = () => {
    const value = draft.trim();
    if (!value || tags.includes(value)) {
      onDraft('');
      return;
    }
    onChange([...tags, value]);
    onDraft('');
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        label="الوسوم"
        value={draft}
        onChange={(event) => onDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        hint="اكتب الوسم ثم اضغط Enter."
      />
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Tag
              key={tag}
              tone="brand"
              onRemove={() => onChange(tags.filter((item) => item !== tag))}
            >
              {tag}
            </Tag>
          ))}
        </div>
      ) : null}
    </div>
  );
}
