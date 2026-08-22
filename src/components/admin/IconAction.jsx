import { cn } from '@utils/cn.js';

/* ================================================================
   A square icon-only control for a row's affordances — reorder,
   remove, and the like.

   It lived in `BlockEditor.jsx` until client note ١ replaced that
   component with `RichTextEditor`; three other screens imported it
   from there, so it moved here rather than being dragged along by a
   file that no longer exists.

   Icon-only means the label IS the accessible name, so `aria-label`
   and `title` are both required and both take the same string — one
   for a screen reader, one for a pointer user who cannot tell a
   chevron from a caret.
   ================================================================ */

export function IconAction({ label, onClick, icon: Icon, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-(--dur-fast)',
        'hover:bg-[var(--state-hover-tint)] hover:text-ink focus-visible:outline-none focus-visible:shadow-focus',
        'disabled:pointer-events-none disabled:opacity-40',
        danger && 'hover:bg-error-100 hover:text-error-700',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

export default IconAction;
