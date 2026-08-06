import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { Button, Input } from '@components/ui';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { getMedia } from '@services/mediaService.js';

import { MediaPicker, MediaThumb } from './MediaPicker.jsx';

/* ================================================================
   An image slot: pick from the library, plus its alt text.

   Dashboard spec §2 and §7 — "Images, each with an alt text field".
   The alt text lives on the CONSUMER (page field, article cover, OG
   image), not only on the media row, because the same photograph is
   decorative in one place and load-bearing in another. The library's
   own alt text is the default that gets copied in when a file is
   first chosen.

   An empty alt is legal and stays legal: `alt=""` is the correct
   markup for a decorative image, and forcing text into it makes a
   screen reader announce filler. It is warned about, not blocked.
   ================================================================ */

export function ImageField({
  label = 'الصورة',
  hint,
  mediaId,
  altText = '',
  onChange,
  disabled = false,
  altLabel = 'النص البديل',
}) {
  const [picking, setPicking] = useState(false);

  const { data: media } = useAsyncData(() => getMedia(mediaId), mediaId ?? 'none');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {hint ? <span className="-mt-1 text-xs text-ink-muted">{hint}</span> : null}

      <div className="flex flex-wrap items-start gap-4 rounded-md border border-subtle bg-surface p-3">
        <div className="w-32 shrink-0">
          {media ? (
            <MediaThumb media={media} />
          ) : (
            <span className="flex aspect-4/3 w-full items-center justify-center rounded-xs border border-dashed border-default text-ink-muted">
              <ImagePlus className="size-5" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="flex min-w-56 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPicking(true)}
              disabled={disabled}
            >
              {media ? 'تغيير الصورة' : 'اختيار صورة'}
            </Button>
            {media ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange({ mediaId: null, altText: '' })}
              >
                <X className="size-4" aria-hidden="true" />
                إزالة
              </Button>
            ) : null}
            {media ? (
              <span className="truncate text-xs text-ink-muted">{media.file_name}</span>
            ) : null}
          </div>

          <Input
            label={altLabel}
            value={altText}
            disabled={disabled || !media}
            onChange={(event) =>
              onChange({ mediaId: mediaId ?? null, altText: event.target.value })
            }
            hint={
              media && !altText
                ? 'اتركه فارغاً فقط إذا كانت الصورة زخرفية بحتة.'
                : 'وصف مختصر لما تُظهره الصورة، يُقرأ لمستخدمي قارئات الشاشة.'
            }
          />
        </div>
      </div>

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        onSelect={(item) => onChange({ mediaId: item.id, altText: altText || item.alt_text || '' })}
      />
    </div>
  );
}

export default ImageField;
