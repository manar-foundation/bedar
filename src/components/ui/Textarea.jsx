import { forwardRef } from 'react';

import { Field } from './Field.jsx';
import { fieldChrome, fieldTone } from './fieldStyles.js';
import { cn } from '@utils/cn.js';

/**
 * Multi-line text field.
 *
 * `resize-y` only: horizontal resizing lets a user drag the control
 * wider than its RTL column and break the page layout, and there is
 * never a reason to want it.
 */
export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, id, rows = 4, className, fieldClassName, labelHidden, ...rest },
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
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            fieldChrome,
            fieldTone(Boolean(error)),
            'resize-y px-3.5 py-2.5 text-sm leading-relaxed',
            className,
          )}
          {...props}
          {...rest}
        />
      )}
    </Field>
  );
});

export default Textarea;
