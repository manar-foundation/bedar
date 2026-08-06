import { forwardRef, useId } from 'react';

import { cn } from '@utils/cn.js';

/* ================================================================
   SWITCH — an on/off toggle that applies immediately (a checkbox is
   for "include this when I submit"; a switch is for "do this now").

   RTL: the knob travels toward the inline END when on. The design
   system source animates `left`, which moves it the wrong way in
   RTL. `translate-x-*` is physical too, so it is stated per
   direction with `rtl:` / `ltr:` — exactly the case CLAUDE.md calls
   out.
   ================================================================ */

export const Switch = forwardRef(function Switch({ label, id, className, ...rest }, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        {...rest}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-neutral-300 p-0.5',
          'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          'peer-checked:bg-action-primary',
          'peer-focus-visible:shadow-focus',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          // Knob travel — leftward in RTL, rightward in LTR.
          'peer-checked:[&_span]:rtl:-translate-x-4 peer-checked:[&_span]:ltr:translate-x-4',
        )}
      >
        <span
          aria-hidden="true"
          className="size-4 rounded-full bg-white shadow-e1 transition-transform duration-(--dur-fast) ease-(--ease-standard)"
        />
      </label>
      {label ? (
        <label
          htmlFor={inputId}
          className="cursor-pointer text-sm text-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      ) : null}
    </div>
  );
});

export default Switch;
