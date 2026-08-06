import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Image, Search, Trash2, Upload } from 'lucide-react';

import { AdminPage, ConfirmDialog, DataState, MediaThumb } from '@components/admin';
import { Badge, Button, Card, Input, Modal, Textarea } from '@components/ui';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  deleteMedia,
  formatBytes,
  listMedia,
  mediaUrl,
  mediaUsage,
  updateMedia,
  uploadMedia,
} from '@services/mediaService.js';
import { formatDate } from '@utils/format.js';

/* ================================================================
   MEDIA LIBRARY (Dashboard spec §7)

   "Central location to upload and reuse images across pages,
   avoiding duplicate uploads. Every image requires an alt text
   field."

   Two things this screen takes seriously:

   · Missing alt text is surfaced as a count at the top, not left to
     be discovered file by file. It is the one accessibility defect
     a content dashboard is directly responsible for.
   · Deleting shows where the file is used FIRST. Every reference is
     a real foreign key (`media_id`, `cover_media_id`, `og_image_id`,
     `photo_media_id`), so "used in 3 places" is a fact here rather
     than a guess — and deleting anyway leaves those references NULL
     rather than dangling.
   ================================================================ */

export default function MediaLibrary() {
  const toast = useToast();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(null);

  const { data, loading, error, reload } = useAsyncData(async () => {
    const [items, usage] = await Promise.all([listMedia(), mediaUsage()]);
    return { items, usage };
  }, 'media');

  useEffect(() => {
    document.title = 'مكتبة الوسائط | لوحة تحكم بدار';
  }, []);

  const items = data?.items ?? [];
  const usage = data?.usage ?? new Map();
  const term = query.trim().toLowerCase();
  const rows = term
    ? items.filter(
        (item) =>
          item.file_name.toLowerCase().includes(term) || item.alt_text.toLowerCase().includes(term),
      )
    : items;

  const missingAlt = items.filter((item) => !item.alt_text && item.mime_type.startsWith('image/'));

  const upload = async (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      for (const file of files) await uploadMedia(file);
      reload();
      toast.success(files.length === 1 ? 'تم رفع الملف.' : `تم رفع ${files.length} ملفات.`);
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteMedia(pendingDelete);
      setPendingDelete(null);
      reload();
      toast.success('تم حذف الملف.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = async (item) => {
    try {
      await navigator.clipboard.writeText(mediaUrl(item));
      setCopied(item.id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.failure('تعذّر نسخ الرابط. انسخه يدوياً من نافذة التفاصيل.');
    }
  };

  return (
    <AdminPage
      wide
      eyebrow="المحتوى"
      icon={Image}
      title="مكتبة الوسائط"
      description="مكان واحد لرفع الصور وإعادة استخدامها في كل الصفحات — الصورة تُرفع مرة وتُستخدم في كل مكان."
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="sr-only"
            onChange={(event) => upload(event.target.files)}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            loading={uploading}
            disabled={uploading}
          >
            <Upload className="size-4" aria-hidden="true" />
            رفع ملفات
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          label="بحث"
          labelHidden
          placeholder="ابحث بالاسم أو بالنص البديل"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon={<Search />}
          fieldClassName="min-w-56 max-w-80 flex-1"
        />
        <span className="ltr-run text-xs text-ink-muted">
          {items.length} ملف ·{' '}
          {formatBytes(items.reduce((sum, item) => sum + Number(item.size_bytes || 0), 0))}
        </span>
      </div>

      {missingAlt.length ? (
        <p className="flex items-start gap-2 rounded-md bg-warning-100 px-4 py-3 text-sm text-warning-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="leading-relaxed">
            <span className="ltr-run font-semibold">{missingAlt.length}</span> صورة بلا نص بديل.
            النص البديل هو ما يقرأه المستخدمون عبر قارئات الشاشة، واتركه فارغاً فقط إذا كانت الصورة
            زخرفية بحتة.
          </span>
        </p>
      ) : null}

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={rows.length === 0}
        emptyMessage={
          items.length === 0
            ? 'المكتبة فارغة. ارفع أول صورة من الزر أعلاه.'
            : 'لا توجد نتائج مطابقة للبحث.'
        }
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((item) => {
            const used = usage.get(item.id) ?? [];
            return (
              <li key={item.id}>
                <Card padded={false} className="h-full gap-0 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="block w-full focus-visible:outline-none focus-visible:shadow-focus"
                    aria-label={`تفاصيل ${item.file_name}`}
                  >
                    <MediaThumb media={item} className="rounded-none" />
                  </button>

                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="truncate text-xs font-semibold text-ink" title={item.file_name}>
                      {item.file_name}
                    </p>
                    <p className="ltr-run text-[11px] text-ink-muted">
                      {formatBytes(item.size_bytes)}
                      {item.width ? ` · ${item.width}×${item.height}` : ''}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {item.alt_text ? (
                        <Badge tone="success" size="sm">
                          نص بديل ✓
                        </Badge>
                      ) : (
                        <Badge tone="warning" size="sm">
                          بدون نص بديل
                        </Badge>
                      )}
                      {used.length ? (
                        <Badge tone="neutral" size="sm">
                          مستخدمة <span className="ltr-run">{used.length}</span>
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          غير مستخدمة
                        </Badge>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-1 pt-1">
                      <Button variant="ghost" size="sm" onClick={() => copyUrl(item)}>
                        {copied === item.id ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <Copy className="size-4" aria-hidden="true" />
                        )}
                        {copied === item.id ? 'نُسخ' : 'الرابط'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDelete(item)}>
                        <Trash2 className="size-4 text-error-500" aria-hidden="true" />
                        <span className="sr-only">حذف {item.file_name}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </DataState>

      <MediaDetails
        media={editing}
        usage={editing ? (usage.get(editing.id) ?? []) : []}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        busy={busy}
        title="حذف الملف"
      >
        <p>سيُحذف «{pendingDelete?.file_name}» من التخزين نهائياً.</p>
        {pendingDelete && (usage.get(pendingDelete.id)?.length ?? 0) > 0 ? (
          <p className="mt-3 rounded-md bg-warning-100 px-3 py-2 text-warning-700">
            هذا الملف مستخدم في{' '}
            <span className="ltr-run font-semibold">{usage.get(pendingDelete.id).length}</span>{' '}
            موضع: {usage.get(pendingDelete.id).join('، ')}. بعد الحذف ستصبح تلك المواضع بلا صورة.
          </p>
        ) : null}
      </ConfirmDialog>
    </AdminPage>
  );
}

/**
 * The details dialog is where alt text is actually written. It shows
 * the public URL as selectable text next to the copy button, because
 * `navigator.clipboard` is unavailable on an insecure origin and a
 * copy button that silently does nothing is worse than none.
 */
function MediaDetails({ media, usage, onClose, onSaved }) {
  const toast = useToast();
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);

  const [source, setSource] = useState(null);
  if (media !== source) {
    setSource(media);
    setAlt(media?.alt_text ?? '');
  }

  const save = async () => {
    setBusy(true);
    try {
      await updateMedia(media.id, { alt_text: alt });
      toast.success('تم حفظ النص البديل.');
      onSaved();
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(media)}
      onClose={onClose}
      title="تفاصيل الملف"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            إغلاق
          </Button>
          <Button onClick={save} loading={busy} disabled={busy}>
            حفظ
          </Button>
        </>
      }
    >
      {media ? (
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="w-full shrink-0 sm:w-64">
            <MediaThumb media={media} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Textarea
              label="النص البديل"
              rows={3}
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              hint="صف ما تُظهره الصورة لمن لا يراها. اتركه فارغاً إذا كانت زخرفية بحتة."
            />

            <dl className="flex flex-col gap-1.5 text-xs text-ink-secondary">
              <Row label="الاسم">{media.file_name}</Row>
              <Row label="النوع">
                <span className="ltr-run">{media.mime_type}</span>
              </Row>
              <Row label="الحجم">
                <span className="ltr-run">{formatBytes(media.size_bytes)}</span>
              </Row>
              {media.width ? (
                <Row label="الأبعاد">
                  <span className="ltr-run">
                    {media.width}×{media.height}
                  </span>
                </Row>
              ) : null}
              <Row label="تاريخ الرفع">{formatDate(media.created_at)}</Row>
              <Row label="مواضع الاستخدام">
                {usage.length ? usage.join('، ') : 'غير مستخدم بعد'}
              </Row>
            </dl>

            <code className="ltr-run block overflow-x-auto rounded-md bg-sunken px-3 py-2 text-[11px] text-ink select-all">
              {mediaUrl(media)}
            </code>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-semibold text-ink-muted">{label}:</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
