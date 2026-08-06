import { forwardRef } from 'react';

import { Field } from './Field.jsx';
import { fieldChrome, fieldTone } from './fieldStyles.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   INPUT — single-line text field, 40px, 10px radius.

   The optional icon sits at the INLINE START (right in RTL) and the
   padding that clears it is `ps-11`, a logical utility. The design
   system source hardcodes `padding: 0 14px 0 40px`, which puts the
   gap on the left — correct in LTR, wrong here, and the icon ends up
   sitting on top of the text.
   ================================================================ */

export const Input = forwardRef(function Input(
  { label, hint, error, required, icon, id, className, fieldClassName, labelHidden, ...rest },
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
        <div className="relative flex items-center">
          {icon ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute start-3.5 inline-flex text-ink-muted [&_svg]:size-4"
            >
              {icon}
            </span>
          ) : null}
          <input
            ref={ref}
            className={cn(
              fieldChrome,
              fieldTone(Boolean(error)),
              'h-10 px-3.5 text-sm',
              icon && 'ps-11',
              className,
            )}
            {...props}
            {...rest}
          />
        </div>
      )}
    </Field>
  );
});

export default Input;
