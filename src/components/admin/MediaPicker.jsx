import { useRef, useState } from 'react';
import { ImageOff, Search, Upload } from 'lucide-react';

import { Button, Input, Modal } from '@components/ui';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { formatBytes, listMedia, mediaUrl, uploadMedia } from '@services/mediaService.js';
import { cn } from '@utils/cn.js';

import { DataState } from './DataState.jsx';

/* ================================================================
   Pick an image from the library, or upload one into it.

   Dashboard spec §7 asks for reuse over re-upload, so the picker
   opens on the library and treats uploading as the secondary path —
   the file input is there, but it is not the first thing on screen.

   An upload made here lands in the library like any other, with the
   alt text still empty; the media screen is where alt text is
   chased. The field that opened this picker asks for its own alt
   text separately, because the same photo can be decorative in one
   place and meaningful in another.
   ================================================================ */

export function MediaPicker({ open, onClose, onSelect, title = 'اختيار صورة' }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const { data, loading, error, reload, setData } = useAsyncData(
    () => (open ? listMedia() : Promise.resolve([])),
    open ? 'open' : 'closed',
  );

  const items = data ?? [];
  const term = query.trim().toLowerCase();
  const filtered = term
    ? items.filter(
        (item) =>
          item.file_name.toLowerCase().includes(term) || item.alt_text.toLowerCase().includes(term),
      )
    : items;

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadMedia(file));
      setData((current) => [...uploaded, ...(current ?? [])]);
      toast.success(files.length === 1 ? 'تم رفع الملف.' : `تم رفع ${files.length} ملفات.`);
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg" className="max-w-[880px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="بحث"
            labelHidden
            placeholder="ابحث بالاسم أو بالنص البديل"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon={<Search />}
            fieldClassName="min-w-56 flex-1"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            loading={uploading}
            disabled={uploading}
          >
            <Upload className="size-4" aria-hidden="true" />
            رفع ملف
          </Button>
        </div>

        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={filtered.length === 0}
          emptyMessage={
            items.length === 0
              ? 'مكتبة الوسائط فارغة. ارفع أول صورة من الزر أعلاه.'
              : 'لا توجد نتائج مطابقة لبحثك.'
          }
        >
          <ul className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group flex w-full flex-col gap-2 rounded-md border border-subtle bg-surface p-2 text-start transition-colors duration-(--dur-fast) hover:border-brand-300 hover:bg-sunken focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <MediaThumb media={item} />
                  <span className="truncate text-xs font-medium text-ink">{item.file_name}</span>
                  <span className="ltr-run text-[11px] text-ink-muted">
                    {formatBytes(item.size_bytes)}
                    {item.width ? ` · ${item.width}×${item.height}` : ''}
                  </span>
                  {!item.alt_text ? (
                    <span className="text-[11px] font-medium text-warning-700">بدون نص بديل</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </DataState>
      </div>
    </Modal>
  );
}

/**
 * The tile preview.
 *
 * `alt=""` on purpose: the file name is already rendered next to it
 * as text, so announcing the image as well would read the same thing
 * twice. The stored alt text describes the image where it is USED,
 * not here in the browser.
 */
export function MediaThumb({ media, className }) {
  const url = mediaUrl(media);
  const isImage = media?.mime_type?.startsWith('image/');

  if (!url || !isImage) {
    return (
      <span
        className={cn(
          'flex aspect-4/3 w-full items-center justify-center rounded-xs bg-sunken text-ink-muted',
          className,
        )}
      >
        <ImageOff className="size-5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn('aspect-4/3 w-full rounded-xs bg-sunken object-cover', className)}
    />
  );
}

export default MediaPicker;
