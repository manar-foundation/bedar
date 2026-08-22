import { useEffect, useMemo, useState } from 'react';
import { Info, Lock, Plug } from 'lucide-react';

import { AdminPage, DataState, SaveBar } from '@components/admin';
import { Card, Input, Select, Textarea } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { canEditSetting, listSettings, updateSetting } from '@services/settingsService.js';
import { DATALAYER_EVENTS, FORM_KINDS, SETTINGS_KEYS } from '@utils/constants.js';

/* ================================================================
   INTEGRATIONS & CUSTOM CODE (Dashboard spec §11, §4 —
   client notes ٣, ٤, ٥)

   Everything on this screen changes how the site BEHAVES rather than
   what it says, so every row here is `min_role = 'admin'` in SQL and
   the forms are disabled — not hidden — for an editor. Hiding them
   would make an editor think the feature does not exist and ask for
   it to be built.

   WHAT NOTE ٥ ADDED
   ----------------------------------------------------------------
   The four fields (GTM, Search Console, head code, footer code) were
   already here and already saved. What was missing is that NOTHING
   READ THEM — the values sat in the database and never reached a
   page. `components/layout/SiteHead.jsx` is the other half, and it
   is what makes saving a Container ID actually install GTM on every
   page, and clearing it actually remove it.

   WHAT NOTE ٣ ADDED
   ----------------------------------------------------------------
   The event name per form. It used to be a constant in the bundle
   (`DATALAYER_EVENTS`), which is precisely what the note forbids.
   The constants survive as the FALLBACK for an empty field, so
   turning the setting on changes a name rather than starting the
   tracking from silence.

   THE CAPTCHA SECRET KEY IS STILL DELIBERATELY ABSENT.
   `site_settings` is readable by anonymous visitors (the
   organisation block feeds the Organization schema and the captcha
   SITE key is public by definition), so a secret stored here would
   be a secret published on the website. It belongs in the Vercel
   function environment, next to `lib/captcha.js`, which is the only
   code that verifies a token. Client note ٤ says the same thing.
   ================================================================ */

const KEYS = [SETTINGS_KEYS.INTEGRATIONS, SETTINGS_KEYS.CAPTCHA, SETTINGS_KEYS.FORMS];

const CAPTCHA_PROVIDERS = [
  { value: '', label: 'بدون حماية' },
  { value: 'recaptcha', label: 'Google reCAPTCHA' },
  { value: 'hcaptcha', label: 'hCaptcha' },
  { value: 'turnstile', label: 'Cloudflare Turnstile' },
];

const CAPTCHA_VERSIONS = [
  { value: 'v2', label: 'v2 — مربّع تحقق يضغطه الزائر' },
  { value: 'v3', label: 'v3 — تحقق خفي بالنقاط' },
];

/** The two forms note ٣ asks for a separate event setting on. */
const FORM_EVENTS = [
  {
    key: FORM_KINDS.CONTACT,
    label: 'نموذج تواصل معنا',
    example: 'contact_form_submit',
  },
  {
    key: FORM_KINDS.NEWSLETTER,
    label: 'نموذج الاشتراك في النشرة البريدية',
    example: 'newsletter_signup',
  },
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

  const setEvent = (formKey, value) =>
    setForm((current) => ({
      ...current,
      integrations: {
        ...current.integrations,
        formEvents: { ...(current.integrations.formEvents ?? {}), [formKey]: value },
      },
    }));

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

  const captchaVersion = form?.captcha?.version === 'v3' ? 'v3' : 'v2';

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
                hint="عند الحفظ يُركَّب كود Google Tag Manager تلقائياً في كل صفحات الموقع بالطريقة الرسمية. أفرغ الحقل لإزالته."
              />

              <Input
                label="رمز تحقق Search Console"
                dir="ltr"
                disabled={!editable}
                value={form.integrations.searchConsoleVerification ?? ''}
                onChange={(event) =>
                  set('integrations', { searchConsoleVerification: event.target.value.trim() })
                }
                hint="قيمة الوسم google-site-verification فقط، بلا وسم HTML — تُضاف داخل <head> في كل الصفحات."
              />
            </Card>

            {/* ── Note ٣ ─────────────────────────────────────────
                One field per form, and the note is explicit that the
                name must not live in the code. The hint says WHEN it
                fires, because "after success" is the half of the
                requirement a settings field cannot express. */}
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">أحداث النماذج (Events)</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                اسم الحدث الذي يُطلق إلى dataLayer بعد نجاح إرسال النموذج وحفظ بياناته — لا عند
                الضغط على زر الإرسال. تُستخدم هذه الأسماء في Google Analytics و Google Tag Manager
                لتتبّع التحويلات.
              </p>

              {FORM_EVENTS.map((entry) => (
                <Input
                  key={entry.key}
                  label={`اسم الحدث — ${entry.label}`}
                  dir="ltr"
                  placeholder={entry.example}
                  disabled={!editable}
                  value={form.integrations.formEvents?.[entry.key] ?? ''}
                  onChange={(event) => setEvent(entry.key, event.target.value.trim())}
                  hint={
                    form.integrations.formEvents?.[entry.key]
                      ? undefined
                      : `اتركه فارغاً لاستخدام الاسم الافتراضي: ${DATALAYER_EVENTS[entry.key]}`
                  }
                />
              ))}
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">أكواد مخصّصة</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُحفظ كما تُدخل تماماً وتُنفَّذ في موضعها على كل صفحات الموقع — لا تظهر كنص للزائر.
                أكواد GoHighLevel الخاصة بصفحة برنامج معيّن ليست من هنا — توضع داخل الصفحة نفسها
                بالتنسيق مع فريق التطوير.
              </p>

              <Textarea
                label="كود الرأس (Head)"
                dir="ltr"
                rows={5}
                disabled={!editable}
                value={form.integrations.headCode ?? ''}
                onChange={(event) => set('integrations', { headCode: event.target.value })}
                className="font-mono text-xs"
                hint="يُحقن داخل وسم <head>."
              />

              <Textarea
                label="كود التذييل (Footer)"
                dir="ltr"
                rows={5}
                disabled={!editable}
                value={form.integrations.footerCode ?? ''}
                onChange={(event) => set('integrations', { footerCode: event.target.value })}
                className="font-mono text-xs"
                hint="يُحقن قبل إغلاق وسم </body>."
              />

              <p className="flex items-start gap-2 rounded-md bg-warning-100 px-4 py-3 text-xs leading-relaxed text-warning-700">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                هذان الحقلان ينفّذان أي شيفرة تُدخل فيهما على كل صفحات الموقع. راجع الكود قبل الحفظ،
                ولا تلصق إلا ما تعرف مصدره.
              </p>
            </Card>

            {/* ── Note ٤ ───────────────────────────────────────── */}
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">الحماية من السبام (CAPTCHA)</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                يُطبَّق على جميع نماذج الموقع: نموذج التواصل والاشتراك في النشرة. يتم التحقق من
                الرمز في الخادم قبل قبول الطلب أو حفظه في قاعدة البيانات.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="المزوّد"
                  disabled={!editable}
                  value={form.captcha.provider ?? ''}
                  onChange={(event) => set('captcha', { provider: event.target.value })}
                  options={CAPTCHA_PROVIDERS}
                  hint="اترك «بدون حماية» لتعطيل التحقق على كل النماذج."
                />

                <Select
                  label="الإصدار"
                  disabled={!editable || !form.captcha.provider}
                  value={captchaVersion}
                  onChange={(event) => set('captcha', { version: event.target.value })}
                  options={CAPTCHA_VERSIONS}
                  hint="مفتاح v2 لا يعمل مع إعداد v3 والعكس — اختر الإصدار الذي أُنشئ به المفتاح."
                />
              </div>

              <Input
                label="مفتاح الموقع (Site Key)"
                dir="ltr"
                disabled={!editable || !form.captcha.provider}
                value={form.captcha.siteKey ?? ''}
                onChange={(event) => set('captcha', { siteKey: event.target.value.trim() })}
                hint="المفتاح العام الذي يظهر في صفحة الموقع."
              />

              {captchaVersion === 'v3' ? (
                <Input
                  label="الحد الأدنى للنقاط"
                  dir="ltr"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  disabled={!editable || !form.captcha.provider}
                  value={form.captcha.minScore ?? '0.5'}
                  onChange={(event) => set('captcha', { minScore: event.target.value })}
                  hint="يرفض الخادم أي طلب تقلّ نقاطه عن هذا الحد. القيمة الافتراضية 0.5."
                  fieldClassName="max-w-56"
                />
              ) : null}

              <p className="flex items-start gap-2 rounded-md bg-warning-100 px-4 py-3 text-xs leading-relaxed text-warning-700">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  المفتاح السري (Secret Key) لا يُحفظ هنا. هذه الإعدادات قابلة للقراءة من متصفّح أي
                  زائر، فالمفتاح السري يوضع في متغيّرات البيئة على الخادم باسم{' '}
                  <span className="ltr-run font-medium">RECAPTCHA_SECRET_KEY</span> مع الشيفرة التي
                  تتحقق منه.
                </span>
              </p>
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">نصوص نموذج التواصل</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُحفظ كل الطلبات الواردة في قاعدة البيانات وتظهر في شاشة «طلبات النماذج»، وتُرسل
                نسخة إلى بريد المنصة.
              </p>

              <Input
                label="وجهة إضافية (Endpoint)"
                dir="ltr"
                disabled={!editable}
                value={form.forms.contact?.endpoint ?? ''}
                onChange={(event) =>
                  set('forms', {
                    contact: { ...form.forms.contact, endpoint: event.target.value.trim() },
                  })
                }
                hint="اختياري — رابط استقبال إضافي مثل GoHighLevel."
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
