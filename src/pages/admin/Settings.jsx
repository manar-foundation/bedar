import { useEffect, useMemo, useState } from 'react';
import { Lock, Plus, Settings as SettingsIcon, Trash2 } from 'lucide-react';

import { AdminPage, DataState, IconAction, SaveBar } from '@components/admin';
import { Button, Card, Input, Switch } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { canEditSetting, listSettings, updateSetting } from '@services/settingsService.js';
import { updateOwnName } from '@services/usersService.js';
import { SETTINGS_KEYS } from '@utils/constants.js';

/* ================================================================
   SETTINGS (Dashboard spec §6, §12)

   The organisation block is entered ONCE here and applied site-wide
   as Organization schema — never duplicated per page. That is the
   whole of §6's organisation half: per-page schema is generated from
   the content type and is not editable anywhere in this dashboard.

   The consent banner is required regardless of visitor location:
   Manar is a Netherlands-registered NGO, so GDPR applies. The policy
   pages it links to are ordinary pages, created like any other.
   ================================================================ */

const KEYS = [SETTINGS_KEYS.ORGANIZATION, SETTINGS_KEYS.SOCIAL, SETTINGS_KEYS.CONSENT];

function readValues(rows) {
  return {
    [SETTINGS_KEYS.ORGANIZATION]: rows.get(SETTINGS_KEYS.ORGANIZATION)?.value ?? {},
    [SETTINGS_KEYS.SOCIAL]: rows.get(SETTINGS_KEYS.SOCIAL)?.value ?? [],
    [SETTINGS_KEYS.CONSENT]: rows.get(SETTINGS_KEYS.CONSENT)?.value ?? {},
  };
}

export default function Settings() {
  const toast = useToast();
  const { role, profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsyncData(() => listSettings(KEYS), 'settings');

  const [loaded, setLoaded] = useState(null);
  const [form, setForm] = useState(null);
  if (data && data !== loaded) {
    setLoaded(data);
    setForm(readValues(data));
  }

  const baseline = useMemo(() => (loaded ? readValues(loaded) : null), [loaded]);
  const dirty = Boolean(form && baseline) && JSON.stringify(form) !== JSON.stringify(baseline);
  const editable = Boolean(loaded && canEditSetting(loaded.get(SETTINGS_KEYS.ORGANIZATION), role));

  useEffect(() => {
    document.title = 'الإعدادات | لوحة تحكم بدار';
  }, []);

  const setOrganization = (patch) =>
    setForm((current) => ({
      ...current,
      organization: { ...current.organization, ...patch },
    }));

  const setConsent = (patch) =>
    setForm((current) => ({ ...current, consent: { ...current.consent, ...patch } }));

  const save = async () => {
    setSaving(true);
    try {
      for (const key of KEYS) {
        if (JSON.stringify(form[key]) !== JSON.stringify(baseline[key])) {
          await updateSetting(key, form[key]);
        }
      }
      reload();
      toast.success('تم حفظ الإعدادات.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage
      eyebrow="الإدارة"
      icon={SettingsIcon}
      title="الإعدادات"
      description="بيانات المنصة التي تُدخل مرة واحدة وتُطبَّق على الموقع كاملاً."
    >
      {!editable ? (
        <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          بيانات المنصة وإعدادات الخصوصية للمديرين فقط. يمكنك تعديل اسمك المعروض من البطاقة في أسفل
          الصفحة.
        </p>
      ) : null}

      <DataState loading={loading} error={error} onRetry={reload} empty={!form}>
        {form ? (
          <div className="flex flex-col gap-5">
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">بيانات المنصة</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُستخدم في بيانات Organization المنظّمة التي تقرأها محركات البحث، وتُدخل هنا مرة
                واحدة بدل تكرارها في كل صفحة.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="الاسم المختصر"
                  disabled={!editable}
                  value={form.organization.name ?? ''}
                  onChange={(event) => setOrganization({ name: event.target.value })}
                />
                <Input
                  label="الاسم الرسمي"
                  disabled={!editable}
                  value={form.organization.legalName ?? ''}
                  onChange={(event) => setOrganization({ legalName: event.target.value })}
                />
                <Input
                  label="العنوان الإلكتروني للموقع"
                  dir="ltr"
                  disabled={!editable}
                  value={form.organization.url ?? ''}
                  onChange={(event) => setOrganization({ url: event.target.value.trim() })}
                />
                <Input
                  label="البريد الإلكتروني"
                  dir="ltr"
                  disabled={!editable}
                  value={form.organization.email ?? ''}
                  onChange={(event) => setOrganization({ email: event.target.value.trim() })}
                />
                <Input
                  label="رابط الشعار"
                  dir="ltr"
                  disabled={!editable}
                  value={form.organization.logo ?? ''}
                  onChange={(event) => setOrganization({ logo: event.target.value.trim() })}
                  fieldClassName="sm:col-span-2"
                />
              </div>
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">حسابات التواصل الاجتماعي</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تظهر في الفوتر، وتُدرج ضمن بيانات Organization كحسابات رسمية للمنصة.
              </p>

              <ul className="flex flex-col gap-3">
                {(form.social ?? []).map((account, index) => (
                  <li
                    key={account.id ?? index}
                    className="flex flex-col gap-3 rounded-md border border-subtle p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink-muted">
                        {account.label || `حساب ${index + 1}`}
                      </span>
                      {editable ? (
                        <IconAction
                          label="حذف الحساب"
                          icon={Trash2}
                          danger
                          onClick={() =>
                            setForm({
                              ...form,
                              social: form.social.filter((_, position) => position !== index),
                            })
                          }
                        />
                      ) : null}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['label', 'المنصة', 'rtl'],
                        ['handle', 'المعرّف', 'ltr'],
                        ['href', 'الرابط', 'ltr'],
                      ].map(([key, label, dir]) => (
                        <Input
                          key={key}
                          label={label}
                          dir={dir}
                          disabled={!editable}
                          value={account[key] ?? ''}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              social: form.social.map((item, position) =>
                                position === index ? { ...item, [key]: event.target.value } : item,
                              ),
                            })
                          }
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>

              {editable ? (
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setForm({
                        ...form,
                        social: [
                          ...(form.social ?? []),
                          {
                            id: `account-${(form.social ?? []).length + 1}`,
                            label: '',
                            handle: '',
                            href: '',
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    إضافة حساب
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">الموافقة على ملفات تعريف الارتباط</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                مؤسسة منار مسجَّلة في هولندا، فتطبَّق اللائحة الأوروبية على الزوّار جميعاً بغضّ
                النظر عن بلدهم.
              </p>

              <Switch
                label="إظهار شريط الموافقة"
                checked={Boolean(form.consent.enabled)}
                disabled={!editable}
                onChange={(event) => setConsent({ enabled: event.target.checked })}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="رابط سياسة الخصوصية"
                  dir="ltr"
                  disabled={!editable}
                  value={form.consent.privacyPolicyHref ?? ''}
                  onChange={(event) => setConsent({ privacyPolicyHref: event.target.value.trim() })}
                />
                <Input
                  label="رابط سياسة ملفات تعريف الارتباط"
                  dir="ltr"
                  disabled={!editable}
                  value={form.consent.cookiePolicyHref ?? ''}
                  onChange={(event) => setConsent({ cookiePolicyHref: event.target.value.trim() })}
                />
              </div>
            </Card>

            <AccountCard profile={profile} />

            <SaveBar
              dirty={dirty}
              saving={saving}
              onSave={save}
              onReset={() => setForm(baseline)}
            />
          </div>
        ) : null}
      </DataState>
    </AdminPage>
  );
}

/**
 * Own display name — the one thing on this screen an editor may
 * always change. It saves on its own rather than through the shared
 * bar, because it writes to `profiles` and not to `site_settings`.
 */
function AccountCard({ profile }) {
  const toast = useToast();
  const [name, setName] = useState(null);
  const [busy, setBusy] = useState(false);

  const [source, setSource] = useState(null);
  if (profile !== source) {
    setSource(profile);
    setName(profile?.full_name ?? '');
  }

  const save = async () => {
    setBusy(true);
    try {
      await updateOwnName(profile.id, name.trim());
      toast.success('تم حفظ الاسم.');
    } catch (caught) {
      toast.failure(caught);
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return null;

  return (
    <Card className="gap-5">
      <h2 className="text-base font-bold text-ink">حسابي</h2>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="الاسم المعروض"
          value={name ?? ''}
          onChange={(event) => setName(event.target.value)}
          fieldClassName="min-w-56 max-w-80 flex-1"
          hint={`البريد المرتبط بالحساب: ${profile.email}`}
        />
        <Button
          size="sm"
          onClick={save}
          loading={busy}
          disabled={busy || name === profile.full_name}
        >
          حفظ الاسم
        </Button>
      </div>
    </Card>
  );
}
