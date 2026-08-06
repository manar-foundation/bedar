import { X } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   TAG — a chip the user can act on: a selected filter, a keyword on
   an article, a category in the dashboard's collection editor.

   The remove affordance is a real <button> nested in the chip, so it
   is reachable by keyboard on its own. It carries an accessible name
   that names the tag being removed rather than a bare "Remove" —
   twelve identical "إزالة" buttons in a row are useless in a screen
   reader's element list.
   ================================================================ */

const tones = {
  neutral: 'border-default bg-neutral-50 text-ink dark:bg-neutral-800',
  brand: 'border-brand-200 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100',
};

export function Tag({ children, tone = 'neutral', onRemove, removeLabel, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        tones[tone] ?? tones.neutral,
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `إزالة ${typeof children === 'string' ? children : ''}`.trim()}
          className="-me-1 inline-flex items-center rounded-full p-0.5 text-current opacity-60 transition-opacity duration-(--dur-fast) hover:opacity-100 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

export default Tag;
