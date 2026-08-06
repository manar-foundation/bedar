import { forwardRef, useId } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   CHECKBOX — a real <input type="checkbox">, visually replaced.

   The input is `sr-only` rather than `opacity-0` stretched over the
   box: it stays in the accessibility tree and in the tab order, and
   because the box is a sibling it can be styled from
   `peer-checked:` / `peer-focus-visible:` with no React state at
   all. The design-system source tracks `checked` in JS and drops
   the focus ring entirely, which makes it unusable by keyboard.
   ================================================================ */

export const Checkbox = forwardRef(function Checkbox(
  { label, description, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        aria-describedby={descriptionId}
        className="peer sr-only"
        {...rest}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'mt-0.5 inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-xs border-[1.5px] border-[var(--field-border)] bg-field text-white',
          'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          'peer-checked:border-action-primary peer-checked:bg-action-primary',
          'peer-focus-visible:shadow-focus',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          // The tick is a DESCENDANT of this label, not a sibling of
          // the input, so `peer-checked:` has to be applied here and
          // reach down. `peer-checked:scale-100` on the icon itself
          // would never match — peer variants only see siblings.
          '[&_svg]:scale-0 [&_svg]:opacity-0 peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100',
        )}
      >
        <Check
          className="size-3 transition-[transform,opacity] duration-(--dur-fast) ease-(--ease-standard)"
          strokeWidth={3}
          aria-hidden="true"
        />
      </label>

      {label || description ? (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col gap-0.5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label ? <span className="text-sm text-ink">{label}</span> : null}
          {description ? (
            <span id={descriptionId} className="text-xs text-ink-muted">
              {description}
            </span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
});

export default Checkbox;
