import { useId } from 'react';

import { cn } from '@utils/cn.js';

/* ================================================================
   FIELD — the label / hint / error scaffold every form control
   shares, plus the id and aria wiring that goes with it.

   The design-system sources repeat this block in Input, Textarea and
   Select, and none of them connect the hint or the error to the
   control. A red line of text under an input is not an error message
   to a screen reader unless `aria-describedby` points at it — so
   that wiring lives here, once, and every control gets it.

   Usage — Field owns the ids and hands them back:

     <Field label="البريد الإلكتروني" error={error}>
       {(props) => <input {...props} />}
     </Field>
   ================================================================ */

export function Field({
  label,
  hint,
  error,
  required = false,
  id,
  className,
  children,
  labelHidden = false,
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  // The error replaces the hint visually, so only ever describe the
  // control by the message that is actually on screen.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const controlProps = {
    id: fieldId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    required: required || undefined,
  };

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label ? (
        <label
          htmlFor={fieldId}
          className={cn('text-[13px] font-semibold text-ink', labelHidden && 'sr-only')}
        >
          {label}
          {required ? (
            <span className="ms-1 text-error-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {typeof children === 'function' ? children(controlProps) : children}

      {error ? (
        <p id={errorId} className="text-xs font-medium text-error-500">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default Field;
