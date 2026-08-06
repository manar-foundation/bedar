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

   The icon is a Plus rotated to an ×. It is non-directional, so it
   is identical in RTL — no mirroring involved.
   ================================================================ */

export function Accordion({ items = [], allowMultiple = false, defaultOpen = [], className }) {
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpen));

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
      className={cn('divide-y divide-subtle rounded-lg border border-subtle bg-surface', className)}
    >
      {items.map((item) => {
        const open = openIds.has(item.id);
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={open}
                aria-controls={`accordion-panel-${item.id}`}
                id={`accordion-header-${item.id}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-base font-semibold text-ink transition-colors duration-(--dur-fast) hover:bg-[var(--state-hover-tint)] focus-visible:outline-none focus-visible:shadow-focus"
              >
                <span>{item.question ?? item.title}</span>
                <Plus
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 text-brand-500 transition-transform duration-(--dur-base) ease-(--ease-standard)',
                    open && 'rotate-45',
                  )}
                />
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
                  <div className="px-5 pb-5 text-sm leading-relaxed text-ink-secondary">
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
