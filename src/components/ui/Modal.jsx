import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { IconButton } from './IconButton.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   MODAL — 20px radius, e4 elevation, teal overlay.

   The design-system source handles Escape and an overlay click and
   stops there. A dialog that does not manage focus is a trap in the
   other direction: keyboard users tab straight out of it into the
   page behind, which is still scrollable and still clickable. So
   this adds the three things a dialog actually owes:

     1. a portal to <body>, so no ancestor's overflow/transform can
        clip or re-position a fixed overlay
     2. focus moved in on open, cycled inside while open, and
        restored to the trigger on close
     3. body scroll locked while open

   `aria-labelledby` points at the rendered title. When there is no
   title, pass `label` — a dialog with no accessible name is
   announced as just "dialog".
   ================================================================ */

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const widths = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
};

export function Modal({
  open,
  onClose,
  title,
  label,
  children,
  footer,
  size = 'md',
  closeLabel = 'إغلاق',
  className,
}) {
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes || nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  // Body scroll lock + focus handoff. One effect because they share
  // a lifetime: both start on open and must both unwind on close,
  // including when the modal unmounts while still open.
  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the panel itself rather than the first control: opening
    // a dialog on a destructive confirm should not put the cursor on
    // "delete" before the user has read the sentence above it.
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      const target = restoreFocusRef.current;
      if (target instanceof HTMLElement && document.contains(target)) target.focus();
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          onMouseDown={(event) => {
            // mousedown, not click: a click that STARTS inside the
            // panel and ends on the overlay (a text drag-select that
            // overshoots) must not dismiss the dialog.
            if (event.target === event.currentTarget) onClose?.();
          }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
        >
          <motion.div
            key="panel"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : label}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className={cn(
              'flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-xl bg-raised shadow-e4 focus:outline-none',
              widths[size] ?? widths.md,
              className,
            )}
          >
            {title ? (
              <header className="flex items-center justify-between gap-4 border-b border-subtle px-6 py-5">
                <h2 id={titleId} className="text-xl font-semibold text-ink">
                  {title}
                </h2>
                <IconButton label={closeLabel} size="sm" onClick={onClose}>
                  <X aria-hidden="true" />
                </IconButton>
              </header>
            ) : null}

            <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink">
              {children}
            </div>

            {footer ? (
              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-subtle bg-sunken px-6 py-4">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default Modal;
