import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

import { cn } from '@utils/cn.js';

const ToastContext = createContext(null);

/**
 * Save confirmations and failures for the dashboard.
 *
 * Mounted inside the admin branch only. It is here in `context/`
 * rather than in `components/admin/` for one boring reason: a module
 * that exports both a provider and its hook trips
 * `react-refresh/only-export-components`, and that rule is switched
 * off for this directory precisely because context files are shaped
 * this way.
 *
 * The region is `aria-live="polite"` and not `assertive`: a "تم
 * الحفظ" that interrupts a screen reader mid-sentence is worse than
 * one that waits its turn. Failures are also announced politely,
 * because the failing control keeps focus and the message is next to
 * it — assertive is for something the user cannot see coming.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'success') => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      // Errors stay twice as long: they are usually a sentence, and
      // a sentence that vanishes in three seconds is a sentence the
      // reader has to reproduce the failure to see again.
      window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),
      /** Accepts an Error — services throw Arabic-messaged ones. */
      failure: (error) =>
        push(
          typeof error === 'string' ? error : (error?.message ?? 'تعذّر تنفيذ العملية.'),
          'error',
        ),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        // Clear of the sticky save bar, which parks at bottom-4 and
        // is ~52px tall. A confirmation that lands on top of the
        // button you just pressed hides the thing it is confirming.
        className="pointer-events-none fixed inset-x-0 bottom-20 z-200 flex flex-col items-center gap-2 p-4"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className={cn(
                'pointer-events-auto flex max-w-lg items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-e3',
                toast.tone === 'error'
                  ? 'bg-error-100 text-error-700'
                  : 'bg-success-100 text-success-700',
              )}
            >
              {toast.tone === 'error' ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              )}
              <p className="leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="إغلاق التنبيه"
                className="-me-1 shrink-0 rounded-md p-1 opacity-60 transition-opacity duration-(--dur-fast) hover:opacity-100"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

export default ToastContext;
