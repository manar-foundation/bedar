import { Input, Switch, Textarea } from '@components/ui';

import { RichTextEditor } from './RichTextEditor.jsx';
import { ImageField } from './ImageField.jsx';
import { ListEditor } from './ListEditor.jsx';
import { fieldLabel } from './fieldLabels.js';

/* ================================================================
   One content field, rendered as the control its declared type
   deserves (Dashboard spec §2).

   The types come from the `page_fields.type` CHECK constraint, and
   the two that matter most are the ones that are NOT free text:

   · `cta` is {label, href} — two separate fields, because the spec
     asks for button text and button link as separate fields, and
     because a link glued into a sentence cannot be re-pointed
     without retyping the sentence.
   · `richtext` is a block array, never an HTML string — even though
     it is now EDITED in a WYSIWYG box. See `utils/richtext.js` for
     how the one stays true while the other changed.
   ================================================================ */

export function FieldEditor({ field, value, mediaId, altText, onChange }) {
  const label = field.label || fieldLabel(field.key);
  const hint = field.help || undefined;

  switch (field.type) {
    case 'richtext':
      return (
        <RichTextEditor
          label={label}
          hint={hint}
          documentKey={field.id ?? field.key}
          value={Array.isArray(value) ? value : []}
          onChange={(blocks) => onChange({ value: blocks })}
        />
      );

    case 'list':
      return (
        <ListEditor
          label={label}
          items={Array.isArray(value) ? value : []}
          onChange={(items) => onChange({ value: items })}
        />
      );

    case 'image':
      return (
        <ImageField
          label={label}
          hint={hint}
          mediaId={mediaId}
          altText={altText ?? ''}
          onChange={({ mediaId: nextId, altText: nextAlt }) =>
            onChange({ media_id: nextId, alt_text: nextAlt })
          }
        />
      );

    case 'cta':
      return (
        <fieldset className="flex flex-col gap-3 rounded-md border border-subtle bg-surface p-3">
          <legend className="px-1 text-[13px] font-semibold text-ink">{label}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="نص الزر"
              value={value?.label ?? ''}
              onChange={(event) =>
                onChange({ value: { ...(value ?? {}), label: event.target.value } })
              }
            />
            <Input
              label="رابط الزر"
              dir="ltr"
              value={value?.href ?? ''}
              onChange={(event) =>
                onChange({ value: { ...(value ?? {}), href: event.target.value } })
              }
            />
          </div>
        </fieldset>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-3 py-1">
          <Switch
            label={label}
            checked={Boolean(value)}
            onChange={(event) => onChange({ value: event.target.checked })}
          />
        </div>
      );

    case 'number':
      return (
        <Input
          label={label}
          hint={hint}
          type="number"
          dir="ltr"
          value={value ?? ''}
          onChange={(event) =>
            onChange({ value: event.target.value === '' ? 0 : Number(event.target.value) })
          }
          fieldClassName="max-w-48"
        />
      );

    case 'url':
      return (
        <Input
          label={label}
          hint={hint}
          dir="ltr"
          value={value ?? ''}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      );

    case 'text':
    default: {
      const text = typeof value === 'string' ? value : String(value ?? '');
      // Long copy gets a box it can breathe in; a headline does not
      // need four rows of empty space under it.
      return text.length > 90 || text.includes('\n') ? (
        <Textarea
          label={label}
          hint={hint}
          rows={Math.min(10, Math.max(3, Math.ceil(text.length / 90)))}
          value={text}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      ) : (
        <Input
          label={label}
          hint={hint}
          value={text}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      );
    }
  }
}

export default FieldEditor;
