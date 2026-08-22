import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Lock, Plus, Search, Trash2 } from 'lucide-react';

import { AdminPage, DataState, IconAction, SaveBar } from '@components/admin';
import { Button, Card, Input, Select, Switch, Textarea } from '@components/ui';
import { ORGANIZATION_TYPES, buildOrganizationSchema } from '@utils/schema.js';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { canEditSetting, listSettings, updateSetting } from '@services/settingsService.js';
import { updateOwnName } from '@services/usersService.js';
import { SETTINGS_KEYS } from '@utils/constants.js';
import { env } from '@utils/env.js';

/* ================================================================
   SEO SETTINGS (Dashboard spec §6, §12; client notes §6, §7, §8)

   Renamed from "الإعدادات" per client notes §6 — this screen holds
   the site's general SEO settings, and the label now says so.

   §6 · EVERY SCHEMA VALUE IS EDITABLE HERE.
   The organisation block used to carry five fields, of which the
   schema itself was never generated — the values were stored and
   read by nothing. Now the block carries the whole Organization
   node, `components/layout/SiteSchema.jsx` renders it as JSON-LD on
   every public page, and the card below shows the exact output so
   what is generated is checkable from the screen that generates it.
   The organisation is entered ONCE here and applied site-wide; it is
   never duplicated per page. Per-page schema stays generated from
   the content type and is not editable anywhere (spec §6).

   §7 · robots.txt is a field, and `/robots.txt` serves it.
   §8 · the sitemap URL is shown here for pasting into Search
        Console; `/sitemap.xml` builds it from published content and
        honours each page's "استبعاد من محركات البحث" switch.

   The consent banner is required regardless of visitor location:
   Manar is a Netherlands-registered NGO, so GDPR applies. The policy
   pages it links to are ordinary pages, created like any other.
   ================================================================ */

const KEYS = [
  SETTINGS_KEYS.ORGANIZATION,
  SETTINGS_KEYS.SOCIAL,
  SETTINGS_KEYS.CONSENT,
  SETTINGS_KEYS.SEO,
];

const ADDRESS_FIELDS = [
  ['streetAddress', 'الشارع'],
  ['addressLocality', 'المدينة'],
  ['addressRegion', 'المحافظة / الولاية'],
  ['postalCode', 'الرمز البريدي'],
  ['addressCountry', 'الدولة (رمز ISO مثل NL)'],
];

function readValues(rows) {
  return {
    [SETTINGS_KEYS.ORGANIZATION]: rows.get(SETTINGS_KEYS.ORGANIZATION)?.value ?? {},
    [SETTINGS_KEYS.SOCIAL]: rows.get(SETTINGS_KEYS.SOCIAL)?.value ?? [],
    [SETTINGS_KEYS.CONSENT]: rows.get(SETTINGS_KEYS.CONSENT)?.value ?? {},
    [SETTINGS_KEYS.SEO]: rows.get(SETTINGS_KEYS.SEO)?.value ?? {},
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
    document.title = 'إعدادات SEO | لوحة تحكم بدار';
  }, []);

  const setOrganization = (patch) =>
    setForm((current) => ({
      ...current,
      organization: { ...current.organization, ...patch },
    }));

  const setAddress = (patch) =>
    setOrganization({ address: { ...(form.organization.address ?? {}), ...patch } });

  const setConsent = (patch) =>
    setForm((current) => ({ ...current, consent: { ...current.consent, ...patch } }));

  const setSeo = (patch) =>
    setForm((current) => ({ ...current, seo: { ...current.seo, ...patch } }));

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

  // The origin the public site is served from, for the robots.txt and
  // sitemap URLs shown below. The dashboard's organisation URL is the
  // authority; the build-time env var is the fallback.
  const siteUrl = (form?.organization?.url || env.siteUrl || '').replace(/\/+$/, '');

  return (
    <AdminPage
      eyebrow="الإدارة"
      icon={Search}
      title="إعدادات SEO"
      description="بيانات المنصة التي تقرأها محركات البحث، وملف robots.txt وخريطة الموقع — تُدخل مرة واحدة وتُطبَّق على الموقع كاملاً."
    >
      {!editable ? (
        <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          بيانات المنصة وإعدادات السيو والخصوصية للمديرين فقط. يمكنك تعديل اسمك المعروض من البطاقة
          في أسفل الصفحة.
        </p>
      ) : null}

      <DataState loading={loading} error={error} onRetry={reload} empty={!form}>
        {form ? (
          <div className="flex flex-col gap-5">
            {/* ── §6 · Organization schema ─────────────────────── */}
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">بيانات المنصة (Organization Schema)</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُستخدم في بيانات Organization المنظّمة التي تقرأها محركات البحث، وتُدخل هنا مرة
                واحدة بدل تكرارها في كل صفحة. كل حقل تتركه فارغاً يُحذف من البيانات المنظّمة بدل أن
                يُرسل فارغاً.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="نوع المنظمة (Schema Type)"
                  disabled={!editable}
                  value={form.organization.schemaType ?? 'Organization'}
                  onChange={(event) => setOrganization({ schemaType: event.target.value })}
                  options={ORGANIZATION_TYPES}
                />
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
                  label="اسم بديل (Alternate Name)"
                  disabled={!editable}
                  value={form.organization.alternateName ?? ''}
                  onChange={(event) => setOrganization({ alternateName: event.target.value })}
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
                  label="رقم الهاتف"
                  dir="ltr"
                  disabled={!editable}
                  value={form.organization.telephone ?? ''}
                  onChange={(event) => setOrganization({ telephone: event.target.value.trim() })}
                />
                <Input
                  label="تاريخ التأسيس"
                  type="date"
                  dir="ltr"
                  disabled={!editable}
                  value={form.organization.foundingDate ?? ''}
                  onChange={(event) => setOrganization({ foundingDate: event.target.value })}
                />
                <Input
                  label="رابط الشعار"
                  dir="ltr"
                  disabled={!editable}
                  value={form.organization.logo ?? ''}
                  onChange={(event) => setOrganization({ logo: event.target.value.trim() })}
                  hint="اتركه فارغاً لاستخدام شعار بدار المضمّن في الموقع."
                  fieldClassName="sm:col-span-2"
                />
                <Textarea
                  label="وصف المنصة"
                  rows={3}
                  disabled={!editable}
                  value={form.organization.description ?? ''}
                  onChange={(event) => setOrganization({ description: event.target.value })}
                  fieldClassName="sm:col-span-2"
                />
              </div>

              <fieldset className="flex flex-col gap-3 rounded-md border border-subtle p-3">
                <legend className="px-1 text-[13px] font-semibold text-ink">العنوان البريدي</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ADDRESS_FIELDS.map(([key, label]) => (
                    <Input
                      key={key}
                      label={label}
                      disabled={!editable}
                      value={form.organization.address?.[key] ?? ''}
                      onChange={(event) => setAddress({ [key]: event.target.value })}
                    />
                  ))}
                </div>
              </fieldset>

              <SchemaPreview settings={{ ...form.organization, social: form.social }} />
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">حسابات التواصل الاجتماعي</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تظهر في الفوتر، وتُدرج ضمن بيانات Organization في الحقل{' '}
                <span className="ltr-run">sameAs</span> كحسابات رسمية للمنصة.
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

            {/* ── §7 · robots.txt ──────────────────────────────── */}
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">ملف robots.txt</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                ما تُكتب هنا هو محتوى ملف <span className="ltr-run">robots.txt</span> الفعلي للموقع.
                يُقرأ عند كل طلب، فأي تعديل يظهر مباشرة بلا إعادة نشر.
              </p>

              <Textarea
                label="محتوى الملف"
                dir="ltr"
                rows={8}
                disabled={!editable}
                value={form.seo.robotsTxt ?? ''}
                onChange={(event) => setSeo({ robotsTxt: event.target.value })}
                className="font-mono text-xs"
                hint="يمكن استخدام %SITE_URL% وسيُستبدل تلقائياً بعنوان الموقع الحالي."
              />

              <UrlRow label="الملف المنشور" url={`${siteUrl}/robots.txt`} />
            </Card>

            {/* ── §8 · sitemap.xml ─────────────────────────────── */}
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">خريطة الموقع (Sitemap)</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُبنى تلقائياً من المحتوى المنشور: أي صفحة أو مقالة أو خبر أو برنامج يُنشر يُضاف
                رابطه، وأي عنصر يُحذف أو يعود مسودة يختفي منه. الصفحات المستبعدة من محركات البحث لا
                تُدرج فيه.
              </p>

              <Switch
                label="تفعيل خريطة الموقع"
                checked={form.seo.sitemapEnabled !== false}
                disabled={!editable}
                onChange={(event) => setSeo({ sitemapEnabled: event.target.checked })}
              />

              <UrlRow label="رابط الخريطة" url={`${siteUrl}/sitemap.xml`} />

              <Textarea
                label="مسارات مستبعدة إضافية"
                dir="ltr"
                rows={3}
                disabled={!editable}
                value={(form.seo.sitemapExcludePaths ?? []).join('\n')}
                onChange={(event) =>
                  setSeo({
                    sitemapExcludePaths: event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
                className="font-mono text-xs"
                hint="مسار واحد في كل سطر، يبدأ بـ /. يُستبعد المسار وكل ما تحته."
              />
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
 * A published URL, with a copy button and a link that opens it.
 *
 * §8 asks for the sitemap URL to be shown "clearly, so it is easy to
 * copy and use later in Google Search Console" — so copying it is a
 * button and not a select-and-drag.
 */
function UrlRow({ label, url }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the link is still selectable */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md bg-sunken px-4 py-3">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <code className="ltr-run min-w-0 flex-1 truncate text-xs text-ink">{url}</code>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? (
            <Check className="size-4 text-success-500" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? 'تم النسخ' : 'نسخ'}
        </Button>
        <Button variant="ghost" size="sm" href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" aria-hidden="true" />
          فتح
        </Button>
      </div>
    </div>
  );
}

/**
 * The exact JSON-LD these settings produce.
 *
 * Built with the SAME function the public site renders with, so the
 * preview cannot drift from the output — which is the point. §6 asks
 * for the generated structured data to be verifiably correct, and
 * the cheapest way to make that checkable is to put it next to the
 * fields that produce it.
 */
function SchemaPreview({ settings }) {
  const [open, setOpen] = useState(false);
  const json = useMemo(
    () => JSON.stringify(buildOrganizationSchema(settings), null, 2),
    [settings],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">
          البيانات المنظّمة الناتجة (JSON-LD)
        </span>
        <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? 'إخفاء' : 'عرض'}
        </Button>
      </div>
      {open ? (
        <pre
          dir="ltr"
          className="max-h-80 overflow-auto rounded-md border border-subtle bg-sunken p-4 text-left font-mono text-[11px] leading-relaxed text-ink-secondary"
        >
          {json}
        </pre>
      ) : null}
    </div>
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
