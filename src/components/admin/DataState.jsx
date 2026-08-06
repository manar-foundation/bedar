import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

import { Button } from '@components/ui';
import { Spiral } from '@components/ui/Spiral.jsx';
import { hasSupabase } from '@utils/env.js';

/* ================================================================
   The three states every list screen has before it has rows, in one
   place so they read the same everywhere.

   The "no backend configured" case is a state of its own rather than
   an error: before `.env` has a project in it the dashboard is
   perfectly navigable and simply has nothing to show, and telling an
   editor "تعذّر الاتصال" for a missing environment variable sends
   them looking for a problem that is not theirs.
   ================================================================ */

export function DataState({ loading, error, empty, emptyMessage, emptyAction, onRetry, children }) {
  if (!hasSupabase) {
    return (
      <Shell tone="warning" icon={AlertTriangle}>
        <p className="text-sm leading-relaxed text-ink-secondary">
          لم تُضبط بيانات الاتصال بـ Supabase بعد، فلا يوجد محتوى ليُعرض هنا. أضف{' '}
          <code className="ltr-run rounded-xs bg-sunken px-1.5 py-0.5 text-xs">
            VITE_SUPABASE_URL
          </code>{' '}
          و{' '}
          <code className="ltr-run rounded-xs bg-sunken px-1.5 py-0.5 text-xs">
            VITE_SUPABASE_ANON_KEY
          </code>{' '}
          إلى ملف <code className="ltr-run">.env</code> ثم أعد تشغيل الخادم.
        </p>
      </Shell>
    );
  }

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-subtle bg-surface"
      >
        {/* The brand mark IS the spinner. It is the design system's
            ownable motif and it is already on screen in the rail, so
            a generic ring here would be a second visual language for
            the same second and a half. */}
        <span className="relative inline-flex size-16 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[var(--state-selected-tint)] motion-safe:animate-[emblem-breathe_2.4s_var(--ease-standard)_infinite]"
          />
          <Spiral
            className="size-8 text-brand-500 motion-safe:animate-[spiral-spin_1.6s_linear_infinite]"
            aria-hidden="true"
          />
        </span>
        <span className="text-sm text-ink-muted">جارٍ التحميل</span>
      </div>
    );
  }

  if (error) {
    return (
      <Shell tone="error" icon={AlertTriangle}>
        <p className="text-sm leading-relaxed text-ink-secondary">{error.message}</p>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden="true" />
            إعادة المحاولة
          </Button>
        ) : null}
      </Shell>
    );
  }

  if (empty) {
    return (
      <Shell tone="neutral" icon={Inbox}>
        <p className="text-sm leading-relaxed text-ink-secondary">
          {emptyMessage ?? 'لا توجد عناصر بعد.'}
        </p>
        {emptyAction}
      </Shell>
    );
  }

  return children;
}

function Shell({ tone, icon: Icon, children }) {
  // The icon sits in a tinted disc rather than floating on white —
  // the same treatment as the tile and page-header icons, so an
  // empty screen reads as part of the dashboard instead of as a
  // failure of it.
  const disc =
    tone === 'error'
      ? 'bg-tint-error text-tint-error-fg'
      : tone === 'warning'
        ? 'bg-tint-warning text-tint-warning-fg'
        : 'bg-tint-brand text-tint-brand-fg';

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border border-subtle bg-surface px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className={`inline-flex size-14 items-center justify-center rounded-full ${disc}`}
      >
        <Icon className="size-6" />
      </span>
      <div className="flex max-w-md flex-col items-center gap-4">{children}</div>
    </div>
  );
}

export default DataState;
