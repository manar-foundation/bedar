import { useId, useState } from 'react';
import { Paperclip, Upload, X } from 'lucide-react';

import { cn } from '@utils/cn.js';
import { formatNumber } from '@utils/format.js';

/* ================================================================
   FILE UPLOAD — drop zone + picker. Backs the dashboard media
   library (Dashboard spec §5).

   The drop zone is a <label> wrapping a real, focusable (sr-only)
   file input rather than a <div onClick>. That is the whole
   accessibility story in one structural choice: the control is in
   the tab order, Enter and Space open the picker, and the browser
   announces it as a file input. Drag-and-drop stays a pure
   enhancement on top.

   `dragDepth` is a counter, not a boolean: dragging over a child
   element fires `dragleave` on the parent, so a boolean flickers the
   highlight off every time the pointer crosses the inner icon.
   ================================================================ */

export function FileUpload({
  label = 'اسحب الملف إلى هنا أو اضغط للاختيار',
  hint,
  accept,
  multiple = true,
  files = [],
  onChange,
  onRemove,
  className,
  id,
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [dragDepth, setDragDepth] = useState(0);
  const dragging = dragDepth > 0;

  const emit = (list) => {
    if (onChange) onChange(Array.from(list ?? []));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="peer sr-only"
        onChange={(event) => emit(event.target.files)}
      />

      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragDepth((depth) => depth + 1);
        }}
        onDragLeave={() => setDragDepth((depth) => Math.max(0, depth - 1))}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragDepth(0);
          emit(event.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed px-6 py-7 text-center',
          'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          'peer-focus-visible:shadow-focus',
          dragging
            ? 'border-action-primary bg-[var(--state-hover-tint)]'
            : 'border-[var(--field-border)] bg-field hover:border-brand-300',
        )}
      >
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-ink">{label}</span>
        {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
      </label>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={file.name ?? index}
              className="flex items-center gap-2 rounded-sm bg-sunken px-2.5 py-1.5 text-xs text-ink"
            >
              <Paperclip className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="truncate">{file.name}</span>
              {typeof file.size === 'number' ? (
                <span className="ms-auto shrink-0 text-ink-muted">
                  {/* Western digits, always — formatNumber passes
                      ar-u-nu-latn so this never renders ٠-٩. */}
                  <span className="ltr-run">{formatNumber(Math.ceil(file.size / 1024))}</span> KB
                </span>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(file, index)}
                  aria-label={`إزالة ${file.name}`}
                  className="shrink-0 rounded-full p-0.5 text-ink-muted transition-colors duration-(--dur-fast) hover:text-ink focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default FileUpload;
