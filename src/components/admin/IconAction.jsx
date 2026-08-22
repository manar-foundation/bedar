import { cn } from '@utils/cn.js';

/* ================================================================
   A square icon-only control for a row's inline actions — move,
   edit, delete. Every list screen in the dashboard uses it, so the
   hit area, the disabled treatment and the danger tint are decided
   once.

   `aria-label` AND `title`: the label is what a screen reader
   announces, the title is what a sighted user gets on hover. An
   icon-only button with neither is a button with no name.

   It used to live inside `BlockEditor.jsx`, which was retired when
   the row-per-paragraph body editor was replaced by
   `RichTextEditor.jsx` (client notes §1).
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
