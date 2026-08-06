import { cn } from '@utils/cn.js';

/* ================================================================
   BADGE — a status pill. Read-only by definition; if it can be
   dismissed or removed it is a <Tag>, not a badge.

   Tones stay inside the teal family per the design system: the
   semantic hues are deliberately muted so a "success" chip never
   reads as a different brand.
   ================================================================ */

const tones = {
  neutral: 'bg-neutral-100 text-neutral-700',
  brand: 'bg-brand-100 text-brand-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  info: 'bg-info-100 text-info-700',
};

export function Badge({ children, tone = 'neutral', size = 'md', dot = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold leading-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        tones[tone] ?? tones.neutral,
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default Badge;
