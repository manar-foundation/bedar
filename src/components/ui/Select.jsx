import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

import { Field } from './Field.jsx';
import { fieldChrome, fieldTone } from './fieldStyles.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   SELECT — native <select> with the Bedar field chrome.

   Deliberately native, not a custom listbox: the platform control
   already gets RTL, keyboard type-ahead, mobile pickers and screen
   reader support right, and none of the dashboard's selects need
   multi-select, search or rich options. If one ever does, that is a
   separate Combobox component — not a rewrite of this one.

   The chevron sits at the inline END (left in RTL) and the padding
   that clears it is `pe-10`.
   ================================================================ */

export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    required,
    id,
    options = [],
    placeholder,
    className,
    fieldClassName,
    labelHidden,
    children,
    ...rest
  },
  ref,
) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      id={id}
      labelHidden={labelHidden}
      className={fieldClassName}
    >
      {(props) => (
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              fieldChrome,
              fieldTone(Boolean(error)),
              'h-10 cursor-pointer appearance-none ps-3.5 pe-10 text-sm',
              className,
            )}
            {...props}
            {...rest}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) =>
              typeof option === 'string' ? (
                <option key={option} value={option}>
                  {option}
                </option>
              ) : (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ),
            )}
            {children}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
        </div>
      )}
    </Field>
  );
});

export default Select;
