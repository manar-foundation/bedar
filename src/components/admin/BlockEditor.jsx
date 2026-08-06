import { ChevronDown, ChevronUp, Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, RichText, Select, Textarea } from '@components/ui';
import { cn } from '@utils/cn.js';

/* ================================================================
   Long-form body editor — a list of typed blocks, not an HTML box.

   This is the single most load-bearing decision in the dashboard:
   article bodies are stored as `[{type:'p', text:…}]` and rendered
   by `RichText` as real React elements. A WYSIWYG that produced an
   HTML string would have to be rendered back through
   `dangerouslySetInnerHTML`, and that makes every editor account an
   XSS vector. RLS does not help there — an editor is *authorised* to
   write; they just should not be able to write `<script>`.

   The cost is real and is accepted: no inline bold, no inline links
   inside a paragraph. The block types below are exactly what
   `RichText` renders and what the migrated Webflow content actually
   used, so nothing in the existing 40 kB of Arabic copy is lost.
   ================================================================ */

const BLOCK_TYPES = [
  { value: 'p', label: 'فقرة' },
  { value: 'h2', label: 'عنوان رئيسي' },
  { value: 'h3', label: 'عنوان فرعي' },
  { value: 'quote', label: 'اقتباس' },
  { value: 'ul', label: 'قائمة نقطية' },
];

const TYPE_LABEL = Object.fromEntries(BLOCK_TYPES.map((type) => [type.value, type.label]));

/** A list block keeps `items`; everything else keeps `text`. */
function emptyBlock(type) {
  return type === 'ul' ? { type, items: [''] } : { type, text: '' };
}

function convert(block, type) {
  if (type === block.type) return block;
  if (type === 'ul') {
    return { type, items: block.text ? block.text.split('\n').filter(Boolean) : [''] };
  }
  return { type, text: block.type === 'ul' ? (block.items ?? []).join('\n') : (block.text ?? '') };
}

export function BlockEditor({ blocks = [], onChange, label = 'المحتوى' }) {
  const [preview, setPreview] = useState(false);

  const replace = (index, next) =>
    onChange(blocks.map((block, position) => (position === index ? next : block)));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(blocks.filter((_, position) => position !== index));

  const add = (type) => onChange([...blocks, emptyBlock(type)]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        <div className="flex items-center gap-2">
          <span className="ltr-run text-xs text-ink-muted">{blocks.length}</span>
          <Button variant="ghost" size="sm" onClick={() => setPreview((value) => !value)}>
            <Eye className="size-4" aria-hidden="true" />
            {preview ? 'تحرير' : 'معاينة'}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="rounded-lg border border-subtle bg-surface p-6">
          {blocks.length ? (
            <RichText blocks={blocks} />
          ) : (
            <p className="text-sm text-ink-muted">لا يوجد محتوى بعد.</p>
          )}
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {blocks.map((block, index) => (
            <li
              key={index}
              className="flex flex-col gap-2 rounded-md border border-subtle bg-surface p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Select
                  label={`نوع الفقرة ${index + 1}`}
                  labelHidden
                  options={BLOCK_TYPES}
                  value={block.type ?? 'p'}
                  onChange={(event) => replace(index, convert(block, event.target.value))}
                  fieldClassName="w-40"
                />

                <div className="flex items-center gap-1">
                  <IconAction
                    label="تحريك لأعلى"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    icon={ChevronUp}
                  />
                  <IconAction
                    label="تحريك لأسفل"
                    onClick={() => move(index, 1)}
                    disabled={index === blocks.length - 1}
                    icon={ChevronDown}
                  />
                  <IconAction
                    label="حذف الفقرة"
                    onClick={() => remove(index)}
                    icon={Trash2}
                    danger
                  />
                </div>
              </div>

              {block.type === 'ul' ? (
                <Textarea
                  label={`عناصر القائمة ${index + 1}`}
                  labelHidden
                  rows={Math.max(3, (block.items ?? []).length)}
                  value={(block.items ?? []).join('\n')}
                  hint="عنصر واحد في كل سطر."
                  onChange={(event) =>
                    replace(index, { type: 'ul', items: event.target.value.split('\n') })
                  }
                />
              ) : (
                <Textarea
                  label={`${TYPE_LABEL[block.type] ?? 'فقرة'} ${index + 1}`}
                  labelHidden
                  rows={block.type === 'p' || block.type === 'quote' ? 4 : 2}
                  value={block.text ?? ''}
                  onChange={(event) => replace(index, { ...block, text: event.target.value })}
                />
              )}
            </li>
          ))}
        </ol>
      )}

      {preview ? null : (
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((type) => (
            <Button key={type.value} variant="secondary" size="sm" onClick={() => add(type.value)}>
              <Plus className="size-4" aria-hidden="true" />
              {type.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconAction({ label, onClick, icon: Icon, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-(--dur-fast)',
        'hover:bg-[var(--state-hover-tint)] hover:text-ink focus-visible:outline-none focus-visible:shadow-focus',
        'disabled:pointer-events-none disabled:opacity-40',
        danger && 'hover:bg-error-100 hover:text-error-700',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

export { IconAction };
export default BlockEditor;
