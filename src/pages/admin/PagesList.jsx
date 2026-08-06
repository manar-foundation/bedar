import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Info, Pencil, Search } from 'lucide-react';

import { AdminPage, DataState, StateBadge, STATE_OPTIONS } from '@components/admin';
import { Badge, Input, Select, Table } from '@components/ui';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { listPages } from '@services/pagesService.js';
import { formatDate } from '@utils/format.js';

/* ================================================================
   THE PAGES SCREEN (Dashboard spec §2)

   There is no "new page" button, and that is the specification
   rather than an unfinished corner: pages are built in code by the
   developer and the dashboard edits the content inside them. A row
   created here would be a URL with no component behind it — a 404
   that looks published in the very tool meant to prevent that.
   ================================================================ */

export default function PagesList() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');

  const { data, loading, error, reload } = useAsyncData(listPages, 'pages');

  useEffect(() => {
    document.title = 'الصفحات | لوحة تحكم بدار';
  }, []);

  const pages = data ?? [];
  const term = query.trim().toLowerCase();
  const rows = pages.filter(
    (page) =>
      (!state || page.state === state) &&
      (!term ||
        page.title.toLowerCase().includes(term) ||
        page.path.toLowerCase().includes(term) ||
        page.key.toLowerCase().includes(term)),
  );

  const columns = [
    {
      key: 'title',
      header: 'الصفحة',
      render: (page) => (
        <div className="flex flex-col gap-1">
          <Link
            to={`/admin/pages/${page.id}`}
            className="font-semibold text-ink no-underline transition-colors duration-(--dur-fast) hover:text-brand-600"
          >
            {page.title}
          </Link>
          <span className="ltr-run text-xs text-ink-muted">{page.path}</span>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'الحالة',
      render: (page) => <StateBadge state={page.state} />,
    },
    {
      key: 'seo',
      header: 'تحسين محركات البحث',
      render: (page) => <SeoHealth page={page} />,
    },
    {
      key: 'updated_at',
      header: 'آخر تعديل',
      render: (page) => (
        <span className="text-xs text-ink-muted">{formatDate(page.updated_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      render: (page) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/admin/pages/${page.id}`}
            aria-label={`تحرير ${page.title}`}
            className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted no-underline transition-colors duration-(--dur-fast) hover:bg-[var(--state-hover-tint)] hover:text-ink"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Link>
          <a
            href={page.path}
            target="_blank"
            rel="noreferrer"
            aria-label={`فتح ${page.title} في الموقع`}
            className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted no-underline transition-colors duration-(--dur-fast) hover:bg-[var(--state-hover-tint)] hover:text-ink"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      wide
      eyebrow="المحتوى"
      icon={FileText}
      title="الصفحات"
      description="محتوى كل صفحة، ورابطها، وحالة نشرها، وبيانات ظهورها في محركات البحث."
    >
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="بحث"
          labelHidden
          placeholder="ابحث باسم الصفحة أو رابطها"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon={<Search />}
          fieldClassName="min-w-56 max-w-80 flex-1"
        />
        <Select
          label="الحالة"
          labelHidden
          value={state}
          onChange={(event) => setState(event.target.value)}
          options={[{ value: '', label: 'كل الحالات' }, ...STATE_OPTIONS]}
          fieldClassName="w-44"
        />
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={rows.length === 0}
        emptyMessage={
          pages.length === 0
            ? 'لا توجد صفحات في قاعدة البيانات بعد. شغّل أمر الزرع لتحميل محتوى الموقع.'
            : 'لا توجد صفحات مطابقة للبحث.'
        }
      >
        <Table columns={columns} rows={rows} caption="صفحات الموقع" />
      </DataState>

      <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        الصفحات تُبنى برمجياً ولا تُضاف أو تُحذف من لوحة التحكم — ما يُحرَّر هنا هو محتواها ورابطها
        وبيانات ظهورها. لإضافة صفحة جديدة تواصل مع فريق التطوير.
      </p>
    </AdminPage>
  );
}

/**
 * The two SEO fields that are actually missing often enough to be
 * worth a column. Deliberately not a score out of a hundred: a
 * number invites optimising the number.
 */
function SeoHealth({ page }) {
  const missing = [];
  if (!page.seo_title) missing.push('العنوان');
  if (!page.seo_description) missing.push('الوصف');

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {page.is_hidden_from_search ? (
        <Badge tone="warning" size="sm">
          مخفية من البحث
        </Badge>
      ) : null}
      {missing.length ? (
        <Badge tone="neutral" size="sm">
          ينقصها {missing.join(' و')}
        </Badge>
      ) : (
        <Badge tone="success" size="sm">
          مكتملة
        </Badge>
      )}
    </div>
  );
}
