/* ================================================================
   MEDIA LIBRARY (Dashboard spec §7)

   "Central location to upload and reuse images across pages,
   avoiding duplicate uploads. Every image requires an alt text
   field."

   Bytes live in Storage, the index lives in `public.media`, and
   every consumer stores a `media.id` rather than a URL — which is
   what makes "where is this file used" a query instead of a guess.
   ================================================================ */

import { db, unwrap, withActor, currentUserId, toAppError } from './db.js';
import { MEDIA_BUCKET, TABLES } from '@utils/constants.js';

const MEDIA_COLUMNS =
  'id, bucket, path, file_name, mime_type, size_bytes, width, height, alt_text, created_at, uploaded_by';

export async function listMedia() {
  return unwrap(
    await db().from(TABLES.MEDIA).select(MEDIA_COLUMNS).order('created_at', { ascending: false }),
  );
}

/** One row, for a field that only knows an id. */
export async function getMedia(id) {
  if (!id) return null;
  return unwrap(await db().from(TABLES.MEDIA).select(MEDIA_COLUMNS).eq('id', id).maybeSingle());
}

/** Public URL for a stored object. The bucket is public by design. */
export function mediaUrl(media) {
  if (!media?.path) return '';
  const { data } = db()
    .storage.from(media.bucket || MEDIA_BUCKET)
    .getPublicUrl(media.path);
  return data?.publicUrl ?? '';
}

/**
 * Storage object keys are ASCII.
 *
 * Arabic file names are the norm here and they are kept — in
 * `file_name`, which is what the library displays. The KEY is
 * transliterated away to `[a-z0-9._-]` because the object key ends
 * up in a URL, in a `_redirects` line and in a CDN cache key, and a
 * percent-encoded Arabic path in those places is a debugging tax
 * with no upside. A name that has nothing ASCII left is replaced by
 * the timestamp prefix alone.
 */
function objectKey(fileName) {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = (dot > 0 ? fileName.slice(dot + 1) : '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const stem =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'file';

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const unique = Math.random().toString(36).slice(2, 8);

  return `${folder}/${stem}-${Date.now().toString(36)}${unique}${ext ? `.${ext}` : ''}`;
}

/**
 * Intrinsic dimensions, read in the browser before the upload.
 *
 * Worth the few milliseconds: `width`/`height` on the row is what
 * lets a consumer reserve space for an image and avoid a layout
 * shift. Anything that is not a raster image — SVG, PDF — has no
 * intrinsic pixel size worth storing, and failure here is not an
 * upload failure.
 */
async function readDimensions(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return {};
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return size;
  } catch {
    return {};
  }
}

/**
 * Upload one file and index it.
 *
 * Order matters and is the reverse of deletion: the object goes up
 * first, then the row. If the row insert fails the object is removed
 * again, because a file with no row is invisible to the library —
 * unreachable storage nobody will ever clean up.
 */
export async function uploadMedia(file, { altText = '' } = {}) {
  const client = db();
  const path = objectKey(file.name || 'file');
  const dimensions = await readDimensions(file);

  const { error: uploadError } = await client.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    cacheControl: '31536000',
    upsert: false,
  });
  if (uploadError) throw toAppError(uploadError);

  const uploaded_by = await currentUserId();

  const { data, error } = await client
    .from(TABLES.MEDIA)
    .insert({
      bucket: MEDIA_BUCKET,
      path,
      file_name: file.name || path,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size ?? 0,
      alt_text: altText,
      ...dimensions,
      ...(uploaded_by ? { uploaded_by, updated_by: uploaded_by } : {}),
    })
    .select(MEDIA_COLUMNS)
    .single();

  if (error) {
    await client.storage.from(MEDIA_BUCKET).remove([path]);
    throw toAppError(error);
  }

  return data;
}

export async function updateMedia(id, patch) {
  return unwrap(
    await db()
      .from(TABLES.MEDIA)
      .update(await withActor(patch))
      .eq('id', id)
      .select(MEDIA_COLUMNS)
      .single(),
  );
}

/**
 * Delete the object, then the row — in that order.
 *
 * A foreign key cannot reach into Storage, so this is two calls no
 * matter what. Doing them this way round means a half-failure leaves
 * a visible row pointing at a missing file, which someone will
 * notice and can retry; the other order leaves bytes nobody can see
 * or bill for.
 */
export async function deleteMedia(media) {
  const client = db();
  const { error } = await client.storage.from(media.bucket || MEDIA_BUCKET).remove([media.path]);
  if (error) throw toAppError(error);

  unwrap(await client.from(TABLES.MEDIA).delete().eq('id', media.id).select('id'));
}

/**
 * Where every file is used, as one map keyed by media id.
 *
 * Five small queries instead of a per-card lookup: the library shows
 * usage on every tile, and N cards × 5 requests is a screen that
 * takes seconds to settle. Every reference is a real foreign key,
 * which is the entire reason this can be asked at all.
 */
export async function mediaUsage() {
  const client = db();

  const [fields, pages, items, ogItems, testimonials] = await Promise.all([
    client.from(TABLES.PAGE_FIELDS).select('media_id, key, page_id').not('media_id', 'is', null),
    client.from(TABLES.PAGES).select('og_image_id, title').not('og_image_id', 'is', null),
    client
      .from(TABLES.COLLECTION_ITEMS)
      .select('cover_media_id, title')
      .not('cover_media_id', 'is', null),
    client
      .from(TABLES.COLLECTION_ITEMS)
      .select('og_image_id, title')
      .not('og_image_id', 'is', null),
    client
      .from(TABLES.TESTIMONIALS)
      .select('photo_media_id, person_name')
      .not('photo_media_id', 'is', null),
  ]);

  const usage = new Map();
  const add = (id, label) => {
    if (!id) return;
    if (!usage.has(id)) usage.set(id, []);
    usage.get(id).push(label);
  };

  for (const row of fields.data ?? []) add(row.media_id, `حقل: ${row.key}`);
  for (const row of pages.data ?? []) add(row.og_image_id, `صورة مشاركة: ${row.title}`);
  for (const row of items.data ?? []) add(row.cover_media_id, `غلاف: ${row.title}`);
  for (const row of ogItems.data ?? []) add(row.og_image_id, `صورة مشاركة: ${row.title}`);
  for (const row of testimonials.data ?? []) add(row.photo_media_id, `شهادة: ${row.person_name}`);

  return usage;
}

/** "2.4 MB" — Western digits, per the brand rule. */
export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
