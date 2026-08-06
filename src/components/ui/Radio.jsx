import { forwardRef, useId } from 'react';

import { cn } from '@utils/cn.js';

/**
 * Radio — same sr-only-input + peer-styled-box technique as
 * <Checkbox>, so keyboard focus and the checked state are both real
 * CSS states rather than React bookkeeping.
 *
 * Group several with a shared `name` inside a <fieldset> with a
 * <legend>; a radio group with no legend has no accessible name.
 */
export const Radio = forwardRef(function Radio(
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
        type="radio"
        aria-describedby={descriptionId}
        className="peer sr-only"
        {...rest}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'mt-0.5 inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[var(--field-border)] bg-field',
          'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          'peer-checked:border-action-primary',
          'peer-focus-visible:shadow-focus',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          '[&_span]:scale-0 peer-checked:[&_span]:scale-100',
        )}
      >
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-action-primary transition-transform duration-(--dur-fast) ease-(--ease-standard)"
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

export default Radio;
