import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   ACCORDION — collapsible list. Backs the FAQ collection
   (`COLLECTIONS.FAQ`, Dashboard spec §3.2) and any long block of
   supporting copy on a marketing page.

   Built on real <button aria-expanded> headers rather than
   <details>/<summary>: Framer Motion cannot animate a `<details>`
   open/close, and `<summary>` markers are notoriously inconsistent
   to style across engines.

   `allowMultiple` decides whether this is a set of independent
   toggles or a single-open accordion. Default is single-open, which
   is what an FAQ wants.

   TWO VARIANTS
   ----------------------------------------------------------------
   • `variant="cards"` (default) — each row is its own rounded card
     with a gap between them, which is how On Consult builds its FAQ.
     On a page made of floating cards, a single hard-edged box with
     internal divider lines is the one element that looks like a
     table, and it was the heaviest thing on the homepage.
   • `variant="boxed"` — the original single bordered box with
     dividers. Kept for a dense list inside a narrow column, where
     eight separate cards would be more edges than content.

   The icon is a Plus rotated to an ×. It is non-directional, so it
   is identical in RTL — no mirroring involved.
   ================================================================ */

export function Accordion({
  items = [],
  allowMultiple = false,
  defaultOpen = [],
  variant = 'cards',
  className,
}) {
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpen));
  const cards = variant === 'cards';

  const toggle = (id) => {
    setOpenIds((current) => {
      const next = new Set(allowMultiple ? current : []);
      if (current.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className={cn(
        cards
          ? 'flex flex-col gap-3'
          : 'divide-y divide-subtle rounded-lg border border-subtle bg-surface',
        className,
      )}
    >
      {items.map((item) => {
        const open = openIds.has(item.id);
        return (
          <div
            key={item.id}
            className={cn(
              cards && [
                'panel-quiet overflow-hidden transition-[border-color,background-color] duration-(--dur-base) ease-(--ease-standard)',
                open ? 'border-brand-300/35' : 'hover:border-brand-300/25',
              ],
            )}
          >
            <h3>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={open}
                aria-controls={`accordion-panel-${item.id}`}
                id={`accordion-header-${item.id}`}
                className={cn(
                  'flex w-full items-center justify-between gap-4 text-start text-base font-semibold text-ink transition-colors duration-(--dur-fast) focus-visible:outline-none focus-visible:shadow-focus sm:text-lg',
                  cards ? 'px-6 py-6 sm:px-8' : 'px-6 py-5 hover:bg-[var(--state-hover-tint)]',
                )}
              >
                <span>{item.question ?? item.title}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tint-brand text-brand-600 ring-1 ring-tint-brand-ring transition-colors duration-(--dur-fast) dark:text-brand-200',
                    open && 'bg-brand-500 text-white ring-brand-500 dark:text-white',
                  )}
                >
                  <Plus
                    className={cn(
                      'size-4 transition-transform duration-(--dur-base) ease-(--ease-standard)',
                      open && 'rotate-45',
                    )}
                  />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  key="panel"
                  id={`accordion-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`accordion-header-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      'text-[0.95rem] leading-relaxed text-ink-secondary',
                      cards ? 'px-6 pb-7 sm:px-8' : 'px-6 pb-6',
                    )}
                  >
                    {item.answer ?? item.content}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default Accordion;
