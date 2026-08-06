import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   The header every dashboard screen starts with: an optional back
   link, a title with its icon, one line of explanation, and the
   screen's actions — closed by a hairline rule that fades out along
   the reading direction.

   The icon is not decoration. Twelve screens share one layout, and
   the mark in the header is the fastest confirmation that a save
   landed you where you meant to be; it repeats the glyph from the
   navigation rail, so the two read as the same place.

   `<ArrowRight>` is the BACK arrow here and that is not a bug. The
   icon names are directional and the site is RTL: back points the
   way the reader came from, which is rightward. `.mirror-rtl` is for
   LTR-drawn icons whose names are *not* directional, and applying it
   to a named arrow flips it the wrong way twice.
   ================================================================ */

export function AdminPage({
  title,
  description,
  eyebrow,
  icon: Icon,
  back,
  actions,
  children,
  className,
  wide = false,
}) {
  return (
    <section
      className={cn('flex w-full flex-col gap-6', wide ? '' : 'mx-auto max-w-5xl', className)}
    >
      <header className="flex flex-col gap-4">
        {back ? (
          <Link
            to={back.to}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted no-underline transition-colors duration-(--dur-fast) hover:text-brand-600"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            {Icon ? (
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring ring-inset"
              >
                <Icon className="size-5" />
              </span>
            ) : null}

            <div className="flex min-w-0 flex-col gap-1.5">
              {eyebrow ? (
                <span className="text-[11px] font-semibold tracking-[0.12em] text-brand-500 uppercase">
                  {eyebrow}
                </span>
              ) : null}
              <h1 className="text-2xl font-bold text-ink">{title}</h1>
              {description ? (
                <p className="max-w-2xl text-sm leading-relaxed text-ink-secondary">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>

        <hr className="admin-rule" />
      </header>

      {children}
    </section>
  );
}

export default AdminPage;
