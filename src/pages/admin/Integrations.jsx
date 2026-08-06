import { useEffect, useMemo, useState } from 'react';
import { Info, Lock, Plug } from 'lucide-react';

import { AdminPage, DataState, SaveBar } from '@components/admin';
import { Card, Input, Select, Textarea } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { canEditSetting, listSettings, updateSetting } from '@services/settingsService.js';
import { DATALAYER_EVENTS, SETTINGS_KEYS } from '@utils/constants.js';

/* ================================================================
   INTEGRATIONS & CUSTOM CODE (Dashboard spec §11, §4)

   Everything on this screen changes how the site BEHAVES rather than
   what it says, so every row here is `min_role = 'admin'` in SQL and
   the forms are disabled — not hidden — for an editor. Hiding them
   would make an editor think the feature does not exist and ask for
   it to be built.

   The captcha SECRET key is deliberately absent. `site_settings` is
   readable by anonymous visitors (the organisation block feeds the
   Organization schema and the captcha SITE key is public by
   definition), so a secret stored here would be a secret published
   on the website. It belongs in the Netlify function environment /
   Supabase Vault, next to the code that verifies the token.
   ================================================================ */

const KEYS = [SETTINGS_KEYS.INTEGRATIONS, SETTINGS_KEYS.CAPTCHA, SETTINGS_KEYS.FORMS];

const CAPTCHA_PROVIDERS = [
  { value: '', label: 'بدون حماية' },
  { value: 'recaptcha', label: 'Google reCAPTCHA' },
  { value: 'hcaptcha', label: 'hCaptcha' },
  { value: 'turnstile', label: 'Cloudflare Turnstile' },
];

export default function Integrations() {
  const toast = useToast();
  const { role } = useAuth();
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsyncData(() => listSettings(KEYS), 'integrations');

  const [loaded, setLoaded] = useState(null);
  const [form, setForm] = useState(null);
  if (data && data !== loaded) {
    setLoaded(data);
    setForm(readValues(data));
  }

  const baseline = useMemo(() => (loaded ? readValues(loaded) : null), [loaded]);
  const dirty = Boolean(form && baseline) && JSON.stringify(form) !== JSON.stringify(baseline);
  const editable = Boolean(loaded && canEditSetting(loaded.get(SETTINGS_KEYS.INTEGRATIONS), role));

  useEffect(() => {
    document.title = 'التكاملات | لوحة تحكم بدار';
  }, []);

  const set = (key, patch) =>
    setForm((current) => ({ ...current, [key]: { ...current[key], ...patch } }));

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
      eyebrow="الموقع"
      icon={Plug}
      title="التكاملات والأكواد"
      description="أدوات القياس والتحقق والأكواد التي تُحقن في كل صفحات الموقع."
    >
      {!editable ? (
        <p className="flex items-start gap-2 rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          هذه الإعدادات للمديرين فقط — فهي تغيّر سلوك الموقع كاملاً لا محتواه.
        </p>
      ) : null}

      <DataState loading={loading} error={error} onRetry={reload} empty={!form}>
        {form ? (
          <div className="flex flex-col gap-5">
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">القياس والتحقق</h2>

              <Input
                label="معرّف حاوية Google Tag Manager"
                dir="ltr"
                placeholder="GTM-XXXXXXX"
                disabled={!editable}
                value={form.integrations.gtmContainerId ?? ''}
                onChange={(event) =>
                  set('integrations', { gtmContainerId: event.target.value.trim() })
                }
                hint="حاوية واحدة تكفي — تحليلات GA4 تُدار من داخلها، لا من هنا."
              />

              <Input
                label="رمز تحقق Search Console"
                dir="ltr"
                disabled={!editable}
                value={form.integrations.searchConsoleVerification ?? ''}
                onChange={(event) =>
                  set('integrations', { searchConsoleVerification: event.target.value.trim() })
                }
                hint="قيمة الوسم google-site-verification فقط، بلا وسم HTML."
              />

              <p className="flex items-start gap-2 rounded-md bg-info-100 px-4 py-3 text-xs leading-relaxed text-info-700">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  يُرسل الموقع حدثي{' '}
                  <span className="ltr-run font-medium">{DATALAYER_EVENTS.FORM_SUBMISSION}</span> و{' '}
                  <span className="ltr-run font-medium">
                    {DATALAYER_EVENTS.NEWSLETTER_SUBMISSION}
                  </span>{' '}
                  إلى dataLayer عند نجاح الإرسال فعلياً — لا عند الضغط على الزر — حتى تعكس التقارير
                  إرسالات حقيقية لا محاولات.
                </span>
              </p>
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">أكواد مخصّصة</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُحقن في كل صفحات الموقع. أكواد GoHighLevel الخاصة بصفحة برنامج معيّن ليست من هنا —
                توضع داخل الصفحة نفسها بالتنسيق مع فريق التطوير.
              </p>

              <Textarea
                label="كود الرأس (Head)"
                dir="ltr"
                rows={5}
                disabled={!editable}
                value={form.integrations.headCode ?? ''}
                onChange={(event) => set('integrations', { headCode: event.target.value })}
                className="font-mono text-xs"
              />

              <Textarea
                label="كود التذييل (Footer)"
                dir="ltr"
                rows={5}
                disabled={!editable}
                value={form.integrations.footerCode ?? ''}
                onChange={(event) => set('integrations', { footerCode: event.target.value })}
                className="font-mono text-xs"
              />
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">الحماية من السبام</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                المزوّد قابل للتبديل من هنا، فتغييره لاحقاً لا يحتاج إلى تعديل برمجي.
              </p>

              <Select
                label="المزوّد"
                disabled={!editable}
                value={form.captcha.provider ?? ''}
                onChange={(event) => set('captcha', { provider: event.target.value })}
                options={CAPTCHA_PROVIDERS}
              />

              <Input
                label="مفتاح الموقع (Site Key)"
                dir="ltr"
                disabled={!editable || !form.captcha.provider}
                value={form.captcha.siteKey ?? ''}
                onChange={(event) => set('captcha', { siteKey: event.target.value.trim() })}
                hint="المفتاح العام الذي يظهر في صفحة الموقع."
              />

              <p className="flex items-start gap-2 rounded-md bg-warning-100 px-4 py-3 text-xs leading-relaxed text-warning-700">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                المفتاح السري لا يُحفظ هنا. هذه الإعدادات قابلة للقراءة من المتصفح، فالمفتاح السري
                يوضع في متغيّرات البيئة على الخادم مع الشيفرة التي تتحقق منه.
              </p>
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">نموذج التواصل</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                يُرسل النموذج إلى GoHighLevel مباشرة ولا تُخزَّن نسخة في لوحة التحكم — مصدر واحد
                للطلبات بدل مصدرين يتفاوتان.
              </p>

              <Input
                label="وجهة الإرسال (Endpoint)"
                dir="ltr"
                disabled={!editable}
                value={form.forms.contact?.endpoint ?? ''}
                onChange={(event) =>
                  set('forms', {
                    contact: { ...form.forms.contact, endpoint: event.target.value.trim() },
                  })
                }
                hint="رابط استقبال النموذج من GoHighLevel."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['submitLabel', 'نص زر الإرسال'],
                  ['pendingLabel', 'النص أثناء الإرسال'],
                  ['successMessage', 'رسالة النجاح'],
                  ['errorMessage', 'رسالة الخطأ'],
                ].map(([key, label]) => (
                  <Input
                    key={key}
                    label={label}
                    disabled={!editable}
                    value={form.forms.contact?.[key] ?? ''}
                    onChange={(event) =>
                      set('forms', {
                        contact: { ...form.forms.contact, [key]: event.target.value },
                      })
                    }
                  />
                ))}
              </div>

              <div className="rounded-md bg-sunken px-4 py-3 text-xs leading-relaxed text-ink-secondary">
                حقول النموذج نفسها تُعرَّف برمجياً:{' '}
                {(form.forms.contact?.fields ?? []).map((field) => field.label).join('، ') || '—'}
              </div>
            </Card>

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

function readValues(rows) {
  return {
    [SETTINGS_KEYS.INTEGRATIONS]: rows.get(SETTINGS_KEYS.INTEGRATIONS)?.value ?? {},
    [SETTINGS_KEYS.CAPTCHA]: rows.get(SETTINGS_KEYS.CAPTCHA)?.value ?? {},
    [SETTINGS_KEYS.FORMS]: rows.get(SETTINGS_KEYS.FORMS)?.value ?? {},
  };
}
