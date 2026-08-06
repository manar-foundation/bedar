import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   BREADCRUMBS — trail to the current page.

   The separator is a plain <ChevronLeft>, unmirrored. In RTL the
   trail runs right-to-left, so "onward" already points left and the
   left-pointing glyph is the correct one — adding `.mirror-rtl`
   would flip it back to wrong. (CLAUDE.md, icon rules.)

   The last crumb is the current page: rendered as text with
   `aria-current="page"`, never as a link to where you already are.
   ================================================================ */

export function Breadcrumbs({ items = [], className }) {
  return (
    <nav aria-label="مسار التنقل" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.href ?? item.label} className="inline-flex items-center gap-1.5">
              {last || !item.href ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn(last ? 'font-semibold text-ink' : 'text-ink-secondary')}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-ink-secondary no-underline transition-colors duration-(--dur-fast) hover:text-brand-600"
                >
                  {item.label}
                </Link>
              )}

              {last ? null : (
                <ChevronLeft className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
