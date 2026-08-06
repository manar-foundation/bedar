import { EyeOff } from 'lucide-react';

import { Card, Input, Switch, Textarea } from '@components/ui';
import { env } from '@utils/env.js';
import { cn } from '@utils/cn.js';

import { ImageField } from './ImageField.jsx';

/* ================================================================
   SEO block (Dashboard spec §5) — identical for a page and for a
   collection item, so it is one component and not two that drift.

   The single switch is the part worth reading twice: "Exclude from
   sitemap / noindex — a single switch that both adds a noindex tag
   and removes the page from the sitemap simultaneously". Two
   switches is exactly how a page ends up noindexed and still
   submitted for crawling, which is the worst of both.

   The counters are advisory. Search engines truncate on pixel width,
   not on character count, and Arabic glyph widths are not Latin
   ones — so an over-length title is flagged in amber and never
   blocked.
   ================================================================ */

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

export function SeoSection({ values, onChange, path, schemaType, disabled = false }) {
  const title = values.seo_title ?? '';
  const description = values.seo_description ?? '';

  return (
    <Card className="gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ink">تحسين محركات البحث</h2>
        {schemaType ? (
          <span className="rounded-full bg-sunken px-3 py-1 text-xs text-ink-muted">
            نوع البيانات المنظّمة: <span className="ltr-run font-medium">{schemaType}</span>
          </span>
        ) : null}
      </div>

      <Textarea
        label="عنوان الصفحة في نتائج البحث"
        rows={2}
        value={title}
        disabled={disabled}
        onChange={(event) => onChange({ seo_title: event.target.value })}
        hint="يظهر كعنوان أزرق في نتائج البحث وفي تبويب المتصفح."
      />
      <Counter value={title.length} limit={TITLE_LIMIT} />

      <Textarea
        label="الوصف في نتائج البحث"
        rows={3}
        value={description}
        disabled={disabled}
        onChange={(event) => onChange({ seo_description: event.target.value })}
        hint="جملة أو جملتان تُقنعان بالضغط على النتيجة."
      />
      <Counter value={description.length} limit={DESCRIPTION_LIMIT} />

      {/* A live snippet, because a description reads differently in a
          textarea than it does in a result list. */}
      <div className="flex flex-col gap-1 rounded-md border border-subtle bg-sunken p-4">
        <span className="ltr-run truncate text-xs text-ink-muted">
          {env.siteUrl}
          {path ?? ''}
        </span>
        <span className="truncate text-base font-medium text-info-700">
          {title || 'عنوان الصفحة'}
        </span>
        <span className="line-clamp-2 text-sm leading-relaxed text-ink-secondary">
          {description || 'الوصف الذي سيظهر أسفل العنوان في نتائج البحث.'}
        </span>
      </div>

      <Input
        label="الرابط الأساسي (Canonical)"
        dir="ltr"
        value={values.canonical_url ?? ''}
        disabled={disabled}
        onChange={(event) => onChange({ canonical_url: event.target.value })}
        hint="اتركه فارغاً ما لم يكن هذا المحتوى منشوراً على رابط آخر أيضاً."
      />

      <ImageField
        label="صورة المشاركة (OG Image)"
        hint="تظهر عند مشاركة الرابط على وسائل التواصل. المقاس المفضّل 1200×630."
        mediaId={values.og_image_id}
        altText={values.og_alt ?? ''}
        disabled={disabled}
        altLabel="وصف صورة المشاركة"
        onChange={({ mediaId }) => onChange({ og_image_id: mediaId })}
      />

      <div className="flex items-start gap-3 rounded-md border border-subtle p-3">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <Switch
            label="إخفاء من محركات البحث"
            checked={Boolean(values.is_hidden_from_search)}
            disabled={disabled}
            onChange={(event) => onChange({ is_hidden_from_search: event.target.checked })}
          />
          <p className="text-xs leading-relaxed text-ink-muted">
            مفتاح واحد يضيف <span className="ltr-run">noindex</span> ويستبعد الصفحة من ملف
            <span className="ltr-run"> sitemap.xml</span> في الوقت نفسه.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Counter({ value, limit }) {
  const over = value > limit;
  return (
    <p className={cn('-mt-3 text-xs', over ? 'font-medium text-warning-700' : 'text-ink-muted')}>
      <span className="ltr-run">
        {value} / {limit}
      </span>
      {over ? ' — أطول من المُوصى به، قد يُقتطع في نتائج البحث.' : ''}
    </p>
  );
}

export default SeoSection;
