import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@components/ui';

/* ================================================================
   The unsaved-changes bar.

   Every editor screen in the dashboard is a form over a row that
   somebody else may also be editing, so nothing autosaves: an editor
   decides when their half-written paragraph becomes the live site.
   This bar is what makes "unsaved" visible instead of implied.

   It also arms `beforeunload` while dirty. That covers closing the
   tab, which React Router cannot; in-app navigation is covered by
   the router's own blocker where a screen needs it.
   ================================================================ */

export function SaveBar({ dirty, saving, onSave, onReset, label = 'حفظ التغييرات', hint }) {
  useEffect(() => {
    if (!dirty) return undefined;

    const warn = (event) => {
      event.preventDefault();
      // Browsers ignore the string and show their own wording; the
      // assignment is still what marks the event as handled.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <AnimatePresence>
      {dirty ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="sticky bottom-4 z-30 mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-300/40 bg-[var(--glass-bg)] px-4 py-3 shadow-e4 backdrop-blur-xl"
        >
          <p className="flex items-center gap-2.5 text-sm font-medium text-ink">
            {/* A pulsing dot, not an icon: the bar's whole job is to
                keep saying "still unsaved" while an editor keeps
                typing, and a static glyph stops being seen. */}
            <span aria-hidden="true" className="relative inline-flex size-2 shrink-0">
              <span className="absolute inset-0 rounded-full bg-warning-500 opacity-70 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-warning-500" />
            </span>
            {hint ?? 'لديك تغييرات غير محفوظة.'}
          </p>
          <div className="flex items-center gap-2">
            {onReset ? (
              <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
                تجاهل
              </Button>
            ) : null}
            <Button size="sm" onClick={onSave} loading={saving} disabled={saving}>
              {label}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default SaveBar;
