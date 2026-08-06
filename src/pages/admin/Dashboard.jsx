import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Folders,
  Globe,
  History,
  Image,
  Settings as SettingsIcon,
  Shuffle,
} from 'lucide-react';

import { DataState } from '@components/admin';
import { Badge } from '@components/ui';
import { Spiral } from '@components/ui/Spiral.jsx';
import { useAuth } from '@context/AuthContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { loadOverview } from '@services/overviewService.js';
import { ENTITY_LABELS } from '@services/versionsService.js';
import { formatDate, formatNumber } from '@utils/format.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   The landing screen.

   Deliberately not an analytics dashboard — in-dashboard reporting
   is out of scope for v1 (spec §14) and GA4 already does it better.
   What is here is editorial state: what is waiting to be published,
   what is missing alt text, and what changed recently. Those are the
   questions an editor opens this tool with.

   The screen answers them in three moves, top to bottom: who you are
   and what you can do next (the band), the size of the site in four
   numbers (the tiles), then the two lists worth acting on. It does
   not use `AdminPage` — the band IS the header here, and stacking a
   plain title above it would be the same greeting twice.
   ================================================================ */

const ACTION_LABELS = { insert: 'أنشأ', update: 'عدّل', delete: 'حذف' };

const ACTION_TONES = {
  insert: 'bg-success-500',
  update: 'bg-brand-400',
  delete: 'bg-error-500',
};

/** Shortcuts to the screens an editor opens without being sent. */
const SHORTCUTS = [
  { to: '/admin/pages', label: 'الصفحات', icon: FileText },
  { to: '/admin/collections/articles', label: 'المجموعات', icon: Folders },
  { to: '/admin/media', label: 'الوسائط', icon: Image },
  { to: '/admin/global', label: 'الهيدر والفوتر', icon: Globe },
  { to: '/admin/redirects', label: 'إعادة التوجيه', icon: Shuffle },
  { to: '/admin/settings', label: 'الإعدادات', icon: SettingsIcon },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(loadOverview, 'overview');

  useEffect(() => {
    document.title = 'لوحة التحكم | بدار';
  }, []);

  const name = profile?.full_name || user?.email?.split('@')[0] || '';

  return (
    <div className="flex w-full flex-col gap-6">
      <WelcomeBand name={name} />

      <DataState loading={loading} error={error} onRetry={reload} empty={!data}>
        {data ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                to="/admin/pages"
                icon={FileText}
                label="الصفحات"
                value={data.pages}
                note={
                  data.draftPages ? `${formatNumber(data.draftPages)} غير منشورة` : 'جميعها منشورة'
                }
                tone={data.draftPages ? 'warning' : 'success'}
              />
              <StatTile
                to="/admin/collections/articles"
                icon={Folders}
                label="عناصر المجموعات"
                value={data.articles + data.news + data.programs}
                note={`${formatNumber(data.articles)} مقال · ${formatNumber(data.news)} خبر · ${formatNumber(data.programs)} برنامج`}
              />
              <StatTile
                to="/admin/media"
                icon={Image}
                label="ملفات الوسائط"
                value={data.media}
                note={
                  data.missingAlt
                    ? `${formatNumber(data.missingAlt)} بلا نص بديل`
                    : 'كل الصور موصوفة'
                }
                tone={data.missingAlt ? 'warning' : 'success'}
              />
              <StatTile
                to="/admin/redirects"
                icon={Shuffle}
                label="التحويلات المفعّلة"
                value={data.redirects}
                note="تُطبَّق على الروابط القديمة"
              />
            </div>

            {/* Recent edits get the wider column: it is the list an
                editor actually reads, and the shortcuts beside it are
                a fixed six that never need the room. */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel
                className="lg:col-span-2"
                icon={History}
                title="آخر التعديلات"
                action={{ to: '/admin/history', label: 'السجل الكامل' }}
              >
                {data.recent.length ? (
                  <ul className="flex flex-col">
                    {data.recent.map((entry) => (
                      <ActivityRow key={entry.id} entry={entry} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-6 text-sm text-ink-secondary">
                    لا توجد تعديلات مسجَّلة بعد.
                  </p>
                )}
              </Panel>

              <div className="flex flex-col gap-4">
                {data.draftItems ? <DraftsCallout count={data.draftItems} /> : null}

                <Panel icon={ArrowLeft} title="اختصارات">
                  <ul className="grid grid-cols-2 gap-2 p-4">
                    {SHORTCUTS.map(({ to, label, icon: Icon }) => (
                      <li key={to}>
                        <Link
                          to={to}
                          className="flex h-full flex-col gap-2 rounded-md border border-subtle bg-surface px-3 py-3 text-[13px] font-semibold text-ink no-underline transition-colors duration-(--dur-fast) hover:border-brand-300 hover:bg-[var(--state-hover-tint)] hover:text-brand-600"
                        >
                          <Icon className="size-4 text-brand-500" aria-hidden="true" />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </div>
          </div>
        ) : null}
      </DataState>
    </div>
  );
}

/* ================================================================
   The band. The only dark surface on the screen, carrying the same
   glow treatment as the site's hero — it is what makes the first
   thing an editor sees each morning feel like Bedar and not like a
   generic CMS. The spiral is the brand's ownable motif used as a
   watermark, which the design system explicitly calls for.
   ================================================================ */
function WelcomeBand({ name }) {
  return (
    <section className="admin-band px-6 py-7 sm:px-8 sm:py-9">
      <Spiral
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 -z-10 h-44 w-auto text-brand-200/10 ltr:-left-4 rtl:-right-4"
      />

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-brand-200/70 uppercase">
            {formatDate(new Date())}
          </span>
          <h1 className="text-2xl font-bold text-white sm:text-[28px]">
            {name ? `أهلاً ${name}` : 'أهلاً بك'}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-brand-100/75">
            هذه نظرة سريعة على محتوى الموقع وما ينتظر النشر. كل تعديل تحفظه هنا يظهر في الموقع بعد
            النشر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/pages"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-200 px-4 text-sm font-semibold text-brand-950 no-underline transition-colors duration-(--dur-fast) hover:bg-white hover:text-brand-950"
          >
            تحرير الصفحات
            {/* In RTL "forward" is leftward, so a next-CTA uses a
                plain ArrowLeft — no mirroring. */}
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/25 px-4 text-sm font-semibold text-white no-underline transition-colors duration-(--dur-fast) hover:border-white/50 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            معاينة الموقع
          </a>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   A metric tile. A whole-surface link rather than a card with a link
   inside it, so the number and the way to act on it are one tab stop
   with one target.
   ================================================================ */
function StatTile({ to, icon: Icon, label, value, note, tone = 'neutral' }) {
  return (
    <Link
      to={to}
      className="admin-tile flex flex-col gap-3 rounded-lg border border-subtle bg-surface p-5 no-underline shadow-e1"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-secondary">{label}</span>
        <span
          aria-hidden="true"
          className="inline-flex size-9 items-center justify-center rounded-md bg-tint-brand text-tint-brand-fg"
        >
          <Icon className="size-4" />
        </span>
      </div>

      <span className="ltr-run text-[2rem] leading-none font-bold text-ink">
        {formatNumber(value)}
      </span>

      <span
        className={cn(
          'text-xs leading-relaxed',
          tone === 'warning'
            ? 'font-medium text-tint-warning-fg'
            : tone === 'success'
              ? 'text-tint-success-fg'
              : 'text-ink-muted',
        )}
      >
        {note}
      </span>
    </Link>
  );
}

/** A card with a titled head strip — the dashboard's list surface. */
function Panel({ icon: Icon, title, action, children, className }) {
  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-subtle bg-surface shadow-e1',
        className,
      )}
    >
      <div className="admin-panel-head flex items-center justify-between gap-3 px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          {Icon ? <Icon className="size-4 text-brand-500" aria-hidden="true" /> : null}
          {title}
        </h2>
        {action ? (
          <Link
            to={action.to}
            className="text-[13px] font-semibold text-brand-600 no-underline hover:text-brand-700"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ActivityRow({ entry }) {
  return (
    <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-subtle px-5 py-3 last:border-b-0">
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          ACTION_TONES[entry.action] ?? 'bg-neutral-300',
        )}
      />
      <Badge tone="neutral" size="sm">
        {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}
      </Badge>
      <span className="bidi-auto min-w-0 truncate text-sm font-medium text-ink">
        {entry.entity_label || 'عنصر بلا عنوان'}
      </span>
      <span className="text-xs text-ink-muted">
        {ACTION_LABELS[entry.action] ?? entry.action}
        {entry.created_by_email ? ' — ' : ''}
        <span className="ltr-run">{entry.created_by_email}</span>
      </span>
      <span className="ms-auto shrink-0 text-xs text-ink-muted">
        {formatDate(entry.created_at)}
      </span>
    </li>
  );
}

function DraftsCallout({ count }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-tint-warning-border bg-tint-warning p-5">
      <h2 className="text-sm font-bold text-tint-warning-fg">بانتظار النشر</h2>
      <p className="text-[13px] leading-relaxed text-ink-secondary">
        لديك{' '}
        <span className="ltr-run font-semibold text-tint-warning-fg">{formatNumber(count)}</span>{' '}
        عنصراً في المجموعات لم يُنشر بعد. المسودة لا تظهر للزوّار ولا في خريطة الموقع.
      </p>
      <Link
        to="/admin/collections/articles"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-tint-warning-fg no-underline hover:text-tint-warning-fg hover:underline"
      >
        مراجعة المجموعات
        <ArrowLeft className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
