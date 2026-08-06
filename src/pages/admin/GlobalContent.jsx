import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { AdminPage, ConfirmDialog, DataState, IconAction, SaveBar } from '@components/admin';
import { Badge, Button, Card, Input, Modal, Switch, Tabs, Textarea } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import {
  NAV_LOCATIONS,
  createNavItem,
  deleteNavItem,
  listNavigation,
  proposeKey,
  saveOrder,
  toTree,
  updateNavItem,
} from '@services/navigationService.js';
import { canEditSetting, listSettings, updateSetting } from '@services/settingsService.js';
import { SETTINGS_KEYS } from '@utils/constants.js';

/* ================================================================
   GLOBAL CONTENT (Dashboard spec §3.1)

   "Navbar and footer are global elements, always visible for
   editing, never page-specific… changes apply across the entire site
   immediately on save."

   The navigation is a two-level tree in one table. A row with no
   `href` is a GROUP — a header dropdown or a footer column — and
   that is the whole mechanism: `Navbar` branches on whether an item
   has children, so a new dropdown is a row here and not a code
   change. Depth is capped at two by a database trigger, because a
   third level has no menu component to render it and no mobile
   drawer that could.
   ================================================================ */

const TABS = [
  { value: 'header', label: 'قائمة الهيدر' },
  { value: 'footer', label: 'أعمدة الفوتر' },
  { value: 'copy', label: 'نصوص الفوتر' },
];

export default function GlobalContent() {
  const [tab, setTab] = useState('header');

  useEffect(() => {
    document.title = 'الهيدر والفوتر | لوحة تحكم بدار';
  }, []);

  return (
    <AdminPage
      wide
      eyebrow="المحتوى"
      icon={Globe}
      title="الهيدر والفوتر"
      description="عناصر تظهر في كل صفحات الموقع. أي تعديل هنا يُطبَّق على الموقع كاملاً فور الحفظ."
    >
      <Tabs tabs={TABS} value={tab} onChange={setTab} idPrefix="global-tab" />

      {tab === 'header' ? (
        <div role="tabpanel" id="panel-header" aria-labelledby="global-tab-header">
          <NavigationEditor location={NAV_LOCATIONS.HEADER} />
        </div>
      ) : null}

      {tab === 'footer' ? (
        <div role="tabpanel" id="panel-footer" aria-labelledby="global-tab-footer">
          <NavigationEditor location={NAV_LOCATIONS.FOOTER} />
        </div>
      ) : null}

      {tab === 'copy' ? (
        <div role="tabpanel" id="panel-copy" aria-labelledby="global-tab-copy">
          <FooterCopyEditor />
        </div>
      ) : null}
    </AdminPage>
  );
}

/* ── Navigation tree ────────────────────────────────────────── */

const GROUP_NOUN = {
  [NAV_LOCATIONS.HEADER]: 'قائمة منسدلة',
  [NAV_LOCATIONS.FOOTER]: 'عمود',
};

function NavigationEditor({ location }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () => listNavigation(location),
    `nav-${location}`,
  );

  const rows = useMemo(() => data ?? [], [data]);
  const tree = useMemo(() => toTree(rows), [rows]);

  const move = async (siblings, index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= siblings.length) return;
    const next = [...siblings];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await saveOrder(next);
      reload();
    } catch (caught) {
      toast.failure(caught);
    }
  };

  const toggleVisible = async (item) => {
    try {
      await updateNavItem(item.id, { is_visible: !item.is_visible });
      reload();
    } catch (caught) {
      toast.failure(caught);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteNavItem(pendingDelete.id);
      setPendingDelete(null);
      reload();
      toast.success('تم الحذف.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs leading-relaxed text-ink-secondary">
          العنصر بلا رابط يصبح {GROUP_NOUN[location]} يضم العناصر تحته. الترتيب هنا هو الترتيب نفسه
          في الموقع.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing({ location, parent_id: null, href: '' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            رابط جديد
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing({ location, parent_id: null, href: null })}
          >
            <Plus className="size-4" aria-hidden="true" />
            {GROUP_NOUN[location]} جديدة
          </Button>
        </div>
      </div>

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={tree.length === 0}
        emptyMessage="لا توجد عناصر تنقل بعد."
      >
        <ul className="flex flex-col gap-3">
          {tree.map((item, index) => (
            <li key={item.id}>
              <Card className="gap-3">
                <NavRow
                  item={item}
                  onEdit={() => setEditing(item)}
                  onDelete={() => setPendingDelete(item)}
                  onToggle={() => toggleVisible(item)}
                  onUp={() => move(tree, index, -1)}
                  onDown={() => move(tree, index, 1)}
                  disableUp={index === 0}
                  disableDown={index === tree.length - 1}
                />

                {item.children.length || !item.href ? (
                  <ul className="flex flex-col gap-2 border-s border-subtle ps-4">
                    {item.children.map((child, childIndex) => (
                      <li key={child.id}>
                        <NavRow
                          item={child}
                          nested
                          onEdit={() => setEditing(child)}
                          onDelete={() => setPendingDelete(child)}
                          onToggle={() => toggleVisible(child)}
                          onUp={() => move(item.children, childIndex, -1)}
                          onDown={() => move(item.children, childIndex, 1)}
                          disableUp={childIndex === 0}
                          disableDown={childIndex === item.children.length - 1}
                        />
                      </li>
                    ))}

                    <li>
                      <button
                        type="button"
                        onClick={() => setEditing({ location, parent_id: item.id, href: '' })}
                        className="inline-flex items-center gap-2 rounded-md border border-dashed border-default px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors duration-(--dur-fast) hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:shadow-focus"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        رابط داخل «{item.label}»
                      </button>
                    </li>
                  </ul>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </DataState>

      <NavDialog
        record={editing}
        siblings={rows}
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
        title="حذف العنصر"
      >
        سيُحذف «{pendingDelete?.label}» من التنقل
        {pendingDelete && !pendingDelete.href ? ' مع كل الروابط التي بداخله' : ''}.
      </ConfirmDialog>
    </div>
  );
}

function NavRow({
  item,
  nested = false,
  onEdit,
  onDelete,
  onToggle,
  onUp,
  onDown,
  disableUp,
  disableDown,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={nested ? 'text-sm text-ink' : 'text-sm font-semibold text-ink'}>
          {item.label}
        </span>
        {item.href ? (
          <span className="ltr-run truncate text-xs text-ink-muted">{item.href}</span>
        ) : (
          <Badge tone="neutral" size="sm">
            مجموعة
          </Badge>
        )}
        {item.opens_in_new_tab ? (
          <ExternalLink className="size-3.5 text-ink-muted" aria-label="يفتح في تبويب جديد" />
        ) : null}
        {!item.is_visible ? (
          <Badge tone="warning" size="sm">
            مخفي
          </Badge>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <IconAction
          label={item.is_visible ? 'إخفاء' : 'إظهار'}
          icon={item.is_visible ? Eye : EyeOff}
          onClick={onToggle}
        />
        <IconAction label="تحريك لأعلى" icon={ChevronUp} onClick={onUp} disabled={disableUp} />
        <IconAction
          label="تحريك لأسفل"
          icon={ChevronDown}
          onClick={onDown}
          disabled={disableDown}
        />
        <IconAction label="تحرير" icon={Pencil} onClick={onEdit} />
        <IconAction label="حذف" icon={Trash2} danger onClick={onDelete} />
      </div>
    </div>
  );
}

function NavDialog({ record, siblings, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const [source, setSource] = useState(null);
  if (record !== source) {
    setSource(record);
    setForm(
      record
        ? {
            label: record.label ?? '',
            // A group is stored as href = NULL. The dialog keeps the
            // two apart with a boolean so an emptied text field does
            // not silently turn a link into a dropdown.
            isGroup: record.href === null,
            href: record.href ?? '',
            is_visible: record.is_visible ?? true,
            opens_in_new_tab: record.opens_in_new_tab ?? false,
          }
        : null,
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const patch = {
        label: form.label.trim(),
        href: form.isGroup ? null : form.href.trim(),
        is_visible: form.is_visible,
        opens_in_new_tab: form.isGroup ? false : form.opens_in_new_tab,
      };

      if (record.id) {
        await updateNavItem(record.id, patch);
      } else {
        const scope = siblings.filter((row) => row.location === record.location);
        await createNavItem({
          ...patch,
          location: record.location,
          parent_id: record.parent_id ?? null,
          key: proposeKey(
            patch.label,
            scope.map((row) => row.key),
          ),
          position: scope.filter((row) => row.parent_id === (record.parent_id ?? null)).length,
        });
      }

      toast.success('تم الحفظ.');
      onSaved();
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(record)}
      onClose={onClose}
      title={record?.id ? 'تحرير عنصر التنقل' : 'عنصر تنقل جديد'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            form="nav-form"
            type="submit"
            loading={busy}
            disabled={busy || !form?.label.trim() || (!form?.isGroup && !form?.href.trim())}
          >
            حفظ
          </Button>
        </>
      }
    >
      {form ? (
        <form id="nav-form" onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="النص الظاهر"
            required
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
          />

          {form.isGroup ? (
            <p className="rounded-md bg-sunken px-3 py-2 text-xs leading-relaxed text-ink-secondary">
              هذا العنصر مجموعة بلا رابط خاص به — يفتح ما بداخله فقط، تماماً كما تعمل «منصة بدار» في
              الموقع.
            </p>
          ) : (
            <>
              <Input
                label="الرابط"
                dir="ltr"
                required
                value={form.href}
                onChange={(event) => setForm({ ...form, href: event.target.value })}
                hint="مسار داخلي مثل /about أو عنوان كامل يبدأ بـ https://"
              />
              <Switch
                label="يفتح في تبويب جديد"
                checked={form.opens_in_new_tab}
                onChange={(event) => setForm({ ...form, opens_in_new_tab: event.target.checked })}
              />
            </>
          )}

          <Switch
            label="ظاهر في الموقع"
            checked={form.is_visible}
            onChange={(event) => setForm({ ...form, is_visible: event.target.checked })}
          />
        </form>
      ) : null}
    </Modal>
  );
}

/* ── Footer copy + header CTA ───────────────────────────────── */

const SETTING_KEYS = [SETTINGS_KEYS.HEADER_CTA, SETTINGS_KEYS.FOOTER];

function FooterCopyEditor() {
  const toast = useToast();
  const { role } = useAuth();
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () => listSettings(SETTING_KEYS),
    'footer-copy',
  );

  const [loaded, setLoaded] = useState(null);
  const [form, setForm] = useState(null);
  if (data && data !== loaded) {
    setLoaded(data);
    setForm({
      header_cta: data.get(SETTINGS_KEYS.HEADER_CTA)?.value ?? {},
      footer: data.get(SETTINGS_KEYS.FOOTER)?.value ?? {},
    });
  }

  const baseline = useMemo(
    () =>
      loaded
        ? {
            header_cta: loaded.get(SETTINGS_KEYS.HEADER_CTA)?.value ?? {},
            footer: loaded.get(SETTINGS_KEYS.FOOTER)?.value ?? {},
          }
        : null,
    [loaded],
  );

  const dirty = Boolean(form && baseline) && JSON.stringify(form) !== JSON.stringify(baseline);
  const editable = Boolean(loaded && canEditSetting(loaded.get(SETTINGS_KEYS.FOOTER), role));

  const setFooter = (patch) =>
    setForm((current) => ({ ...current, footer: { ...current.footer, ...patch } }));

  const save = async () => {
    setSaving(true);
    try {
      if (JSON.stringify(form.header_cta) !== JSON.stringify(baseline.header_cta)) {
        await updateSetting(SETTINGS_KEYS.HEADER_CTA, form.header_cta);
      }
      if (JSON.stringify(form.footer) !== JSON.stringify(baseline.footer)) {
        await updateSetting(SETTINGS_KEYS.FOOTER, form.footer);
      }
      reload();
      toast.success('تم حفظ النصوص.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataState loading={loading} error={error} onRetry={reload} empty={!form}>
      {form ? (
        <div className="flex flex-col gap-5">
          <Card className="gap-5">
            <h2 className="text-base font-bold text-ink">زر الهيدر</h2>
            <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
              النص والرابط حقلان منفصلان — تغيير وجهة الزر لا يستلزم إعادة كتابة نصه.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="نص الزر"
                disabled={!editable}
                value={form.header_cta.label ?? ''}
                onChange={(event) =>
                  setForm({
                    ...form,
                    header_cta: { ...form.header_cta, label: event.target.value },
                  })
                }
              />
              <Input
                label="رابط الزر"
                dir="ltr"
                disabled={!editable}
                value={form.header_cta.href ?? ''}
                onChange={(event) =>
                  setForm({ ...form, header_cta: { ...form.header_cta, href: event.target.value } })
                }
              />
            </div>
          </Card>

          <Card className="gap-5">
            <h2 className="text-base font-bold text-ink">تعريف الفوتر</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="النص"
                disabled={!editable}
                value={form.footer.tagline?.label ?? ''}
                onChange={(event) =>
                  setFooter({ tagline: { ...form.footer.tagline, label: event.target.value } })
                }
              />
              <Input
                label="الرابط"
                dir="ltr"
                disabled={!editable}
                value={form.footer.tagline?.href ?? ''}
                onChange={(event) =>
                  setFooter({ tagline: { ...form.footer.tagline, href: event.target.value } })
                }
              />
            </div>
          </Card>

          <Card className="gap-5">
            <h2 className="text-base font-bold text-ink">النشرة البريدية</h2>
            <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
              كل نص يظهر للزائر أثناء الاشتراك — بما فيه رسالتا النجاح والخطأ — يُحرَّر من هنا ولا
              يُكتب داخل الشيفرة.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['title', 'العنوان'],
                ['placeholder', 'النص التوضيحي في الحقل'],
                ['submitLabel', 'نص زر الاشتراك'],
                ['pendingLabel', 'النص أثناء الإرسال'],
                ['successMessage', 'رسالة النجاح'],
                ['errorMessage', 'رسالة الخطأ'],
              ].map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  disabled={!editable}
                  value={form.footer.newsletter?.[key] ?? ''}
                  onChange={(event) =>
                    setFooter({
                      newsletter: { ...form.footer.newsletter, [key]: event.target.value },
                    })
                  }
                />
              ))}
            </div>
          </Card>

          <Card className="gap-5">
            <h2 className="text-base font-bold text-ink">الشريط السفلي</h2>
            <Textarea
              label="نص الحقوق"
              rows={2}
              disabled={!editable}
              value={form.footer.legal ?? ''}
              onChange={(event) => setFooter({ legal: event.target.value })}
              hint="تُستبدل {year} بالسنة الحالية تلقائياً."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="نص ما قبل اسم الجهة"
                disabled={!editable}
                value={form.footer.credit?.prefix ?? ''}
                onChange={(event) =>
                  setFooter({ credit: { ...form.footer.credit, prefix: event.target.value } })
                }
              />
              <Input
                label="اسم الجهة"
                disabled={!editable}
                value={form.footer.credit?.label ?? ''}
                onChange={(event) =>
                  setFooter({ credit: { ...form.footer.credit, label: event.target.value } })
                }
              />
              <Input
                label="الرابط"
                dir="ltr"
                disabled={!editable}
                value={form.footer.credit?.href ?? ''}
                onChange={(event) =>
                  setFooter({ credit: { ...form.footer.credit, href: event.target.value } })
                }
              />
            </div>
          </Card>

          <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setForm(baseline)} />
        </div>
      ) : null}
    </DataState>
  );
}
