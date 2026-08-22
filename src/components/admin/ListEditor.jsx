import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

import { Input, Switch, Textarea } from '@components/ui';

import { IconAction } from './IconAction.jsx';

/* ================================================================
   Repeater for a `list` page field.

   The seeded lists are one of two shapes — an array of strings
   (`goals.items`) or an array of flat objects (`stats`,
   `sectors.items`, `audience.items`, `form.fields`) — and both are
   edited here with real labelled inputs.

   The shape is INFERRED from the data instead of declared, because
   the fields are a walk of the developer's own page object: adding a
   key to a card in code makes it appear here on the next seed, with
   no schema to update in two places.

   A value this editor cannot render as a control — a nested object,
   a list inside a list — falls back to a JSON box for that key
   alone, with parse errors shown inline. That is an escape hatch and
   not a feature: if the client starts needing it regularly, the page
   wants a purpose-built editor, not a better JSON box.
   ================================================================ */

const KEY_LABELS = {
  id: 'المعرّف',
  label: 'التسمية',
  title: 'العنوان',
  description: 'الوصف',
  text: 'النص',
  value: 'القيمة',
  href: 'الرابط',
  name: 'الاسم',
  type: 'النوع',
  placeholder: 'النص التوضيحي',
  required: 'مطلوب',
  icon: 'الأيقونة',
  image: 'الصورة',
  suffix: 'اللاحقة',
  autoComplete: 'الإكمال التلقائي',
  options: 'الخيارات',
};

const labelFor = (key) => KEY_LABELS[key] ?? key;

/** Union of keys across items, in first-seen order. */
function keysOf(items) {
  const keys = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    for (const key of Object.keys(item)) if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

function blankFrom(items) {
  const keys = keysOf(items);
  if (!keys.length) return '';
  const template = {};
  for (const key of keys) {
    const sample = items.find((item) => item && typeof item[key] !== 'undefined')?.[key];
    template[key] = typeof sample === 'number' ? 0 : typeof sample === 'boolean' ? false : '';
  }
  return template;
}

export function ListEditor({ items = [], onChange, label = 'العناصر', itemLabel = 'عنصر' }) {
  const list = Array.isArray(items) ? items : [];
  const objectShaped = list.some((item) => item && typeof item === 'object');

  const replace = (index, next) =>
    onChange(list.map((item, position) => (position === index ? next : item)));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(list.filter((_, position) => position !== index));

  const add = () => onChange([...list, objectShaped ? blankFrom(list) : '']);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        <span className="ltr-run text-xs text-ink-muted">{list.length}</span>
      </div>

      <ol className="flex flex-col gap-3">
        {list.map((item, index) => (
          <li
            key={index}
            className="flex flex-col gap-3 rounded-md border border-subtle bg-surface p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink-muted">
                {itemLabel} <span className="ltr-run">{index + 1}</span>
              </span>
              <div className="flex items-center gap-1">
                <IconAction
                  label="تحريك لأعلى"
                  icon={ChevronUp}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                />
                <IconAction
                  label="تحريك لأسفل"
                  icon={ChevronDown}
                  onClick={() => move(index, 1)}
                  disabled={index === list.length - 1}
                />
                <IconAction label="حذف" icon={Trash2} danger onClick={() => remove(index)} />
              </div>
            </div>

            {item && typeof item === 'object' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.keys(item).map((key) => (
                  <ValueControl
                    key={key}
                    label={labelFor(key)}
                    value={item[key]}
                    onChange={(next) => replace(index, { ...item, [key]: next })}
                  />
                ))}
              </div>
            ) : (
              <Textarea
                label={`${itemLabel} ${index + 1}`}
                labelHidden
                rows={2}
                value={String(item ?? '')}
                onChange={(event) => replace(index, event.target.value)}
              />
            )}
          </li>
        ))}
      </ol>

      <div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-default px-4 py-2 text-sm font-medium text-ink-secondary transition-colors duration-(--dur-fast) hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Plus className="size-4" aria-hidden="true" />
          إضافة {itemLabel}
        </button>
      </div>
    </div>
  );
}

/** One value inside a list item, rendered as the control its type deserves. */
function ValueControl({ label, value, onChange }) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center gap-3 pt-6">
        <Switch
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          label={label}
        />
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <Input
        label={label}
        type="number"
        dir="ltr"
        value={String(value)}
        onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
      />
    );
  }

  if (value && typeof value === 'object') {
    return <JsonControl label={label} value={value} onChange={onChange} />;
  }

  const text = String(value ?? '');
  return text.length > 80 ? (
    <Textarea
      label={label}
      rows={3}
      value={text}
      onChange={(event) => onChange(event.target.value)}
      fieldClassName="sm:col-span-2"
    />
  ) : (
    <Input label={label} value={text} onChange={(event) => onChange(event.target.value)} />
  );
}

/**
 * The escape hatch. Invalid JSON is reported and NOT propagated, so
 * a half-typed brace never becomes the saved value.
 */
function JsonControl({ label, value, onChange }) {
  return (
    <Textarea
      label={label}
      dir="ltr"
      rows={4}
      fieldClassName="sm:col-span-2"
      defaultValue={JSON.stringify(value, null, 2)}
      hint="بنية متقدّمة — تُحرّر بصيغة JSON."
      onBlur={(event) => {
        try {
          onChange(JSON.parse(event.target.value));
          event.target.setCustomValidity('');
        } catch {
          event.target.setCustomValidity('صيغة JSON غير صحيحة');
          event.target.reportValidity();
        }
      }}
    />
  );
}

export default ListEditor;
