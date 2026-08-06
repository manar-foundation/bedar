/* ================================================================
   Shared form-control chrome — one source of truth for field
   borders, focus ring and disabled treatment across Input,
   Textarea, Select and the footer newsletter field.

   Kept out of `Field.jsx` on purpose: a module that exports both a
   component and plain constants defeats React Fast Refresh, and
   ESLint's `react-refresh/only-export-components` flags exactly
   this. Constants live here, components stay in .jsx files.
   ================================================================ */

export const fieldChrome =
  'w-full rounded-md border bg-field text-ink placeholder:text-ink-muted ' +
  'transition-[border-color,box-shadow] duration-(--dur-fast) ease-(--ease-standard) ' +
  'focus:outline-none focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-[var(--field-bg-disabled)] disabled:text-ink-disabled';

/** Border + focus ring, switched by validity. */
export const fieldTone = (hasError) =>
  hasError
    ? 'border-error-500 focus:border-error-500 focus:shadow-[0_0_0_4px_rgb(177_69_69/0.20)]'
    : 'border-[var(--field-border)] focus:border-focus focus:shadow-focus';
