import { useEffect, useMemo, useState } from 'react';
import { Info, Lock, Plug, ShieldCheck } from 'lucide-react';

import { AdminPage, DataState, SaveBar } from '@components/admin';
import { Card, Input, Select, Textarea } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { useToast } from '@context/ToastContext.jsx';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { canEditSetting, listSettings, updateSetting } from '@services/settingsService.js';
import {
  CAPTCHA_VERSIONS,
  DATALAYER_EVENTS,
  FORM_KEYS,
  FORM_LABELS,
  SETTINGS_KEYS,
} from '@utils/constants.js';

/* ================================================================
   INTEGRATIONS & CUSTOM CODE (Dashboard spec §11, §4;
   client notes §3, §4, §5)

   Everything on this screen changes how the site BEHAVES rather than
   what it says, so every row here is `min_role = 'admin'` in SQL and
   the forms are disabled — not hidden — for an editor. Hiding them
   would make an editor think the feature does not exist and ask for
   it to be built.

   WHAT THESE FIELDS NOW DO
   ----------------------------------------------------------------
   They used to be stored and nothing else. Every one of them is now
   read at runtime:

     GTM id / verification / head / footer
                    `components/layout/SiteIntegrations.jsx`,
                    mounted on the public shell (§5)
     form events    `utils/analytics.js`, fired by each form on
                    CONFIRMED success (§3)
     captcha        `hooks/useCaptcha.js` in the browser and
                    `lib/recaptcha.js` on the server (§4)

   The captcha SECRET key is deliberately absent, and there is
   nowhere on this screen to type it. `site_settings` is readable by
   anonymous visitors (the organisation block feeds the Organization
   schema and the captcha SITE key is public by definition), so a
   secret stored here would be a secret published on the website. It
   belongs in `RECAPTCHA_SECRET_KEY` in the serverless environment,
   next to the code that verifies the token — which is exactly what
   the client's own note §4 asks for.
   ================================================================ */

const KEYS = [SETTINGS_KEYS.INTEGRATIONS, SETTINGS_KEYS.CAPTCHA, SETTINGS_KEYS.FORMS];

/* Only reCAPTCHA is implemented, so only reCAPTCHA is offered. The
   list used to carry hCaptcha and Turnstile, which stored a value
   that no code read — a setting that silently does nothing is worse
   than one that is missing, because it looks like protection. */
const CAPTCHA_PROVIDERS = [
  { value: '', label: 'بدون حماية' },
  { value: 'recaptcha', label: 'Google reCAPTCHA' },
];

const CAPTCHA_VERSION_OPTIONS = [
  { value: CAPTCHA_VERSIONS.V2_INVISIBLE, label: 'v2 — غير مرئي (Invisible)' },
  { value: CAPTCHA_VERSIONS.V2_CHECKBOX, label: 'v2 — مربّع الاختيار (Checkbox)' },
  { value: CAPTCHA_VERSIONS.V3, label: 'v3 — تقييم صامت (Score)' },
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

  /** One form's analytics event name (client notes §3). */
  const setEvent = (formKey, value) =>
    set('integrations', {
      formEvents: { ...(form.integrations.formEvents ?? {}), [formKey]: value },
    });

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
                hint="عند الحفظ يُركَّب كود Google Tag Manager تلقائياً على كل صفحات الموقع. اتركه فارغاً لإزالته. حاوية واحدة تكفي — تحليلات GA4 تُدار من داخلها."
              />

              <Input
                label="رمز تحقق Search Console"
                dir="ltr"
                disabled={!editable}
                value={form.integrations.searchConsoleVerification ?? ''}
                onChange={(event) =>
                  set('integrations', { searchConsoleVerification: event.target.value.trim() })
                }
                hint="قيمة الوسم google-site-verification فقط، بلا وسم HTML. تُضاف تلقائياً داخل <head> في كل الصفحات."
              />
            </Card>

            {/* ── §3 · one event name per form ─────────────────── */}
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">أحداث النماذج (Events)</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                اسم الحدث الذي يُطلَق إلى dataLayer بعد نجاح إرسال كل نموذج، لاستخدامه في Google
                Analytics / Google Tag Manager لتتبّع التحويلات. الاسم يُقرأ من هنا ولا يُكتب في
                الكود، فتغييره لا يحتاج إلى تعديل برمجي.
              </p>

              {[FORM_KEYS.CONTACT, FORM_KEYS.NEWSLETTER].map((formKey) => (
                <Input
                  key={formKey}
                  label={`حدث ${FORM_LABELS[formKey]}`}
                  dir="ltr"
                  placeholder={DATALAYER_EVENTS[formKey]}
                  disabled={!editable}
                  value={form.integrations.formEvents?.[formKey] ?? ''}
                  onChange={(event) => setEvent(formKey, event.target.value.trim())}
                  hint={`إذا تُرك فارغاً يُستخدم الاسم الافتراضي ${DATALAYER_EVENTS[formKey]}.`}
                />
              ))}

              <p className="flex items-start gap-2 rounded-md bg-info-100 px-4 py-3 text-xs leading-relaxed text-info-700">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  يُطلَق الحدث <strong>بعد</strong> نجاح الإرسال وحفظ البيانات فعلياً — لا عند الضغط
                  على زر الإرسال — حتى تعكس التقارير إرسالات حقيقية لا محاولات.
                </span>
              </p>
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">أكواد مخصّصة</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُحفظ كما تُدخل بلا تعديل، وتُنفَّذ في مكانها من الصفحة على كل صفحات الموقع — لا
                تظهر للزائر كنص.
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
                hint="يُحقن في نهاية الصفحة قبل إغلاق وسم </body>."
              />

              <p className="flex items-start gap-2 rounded-md bg-warning-100 px-4 py-3 text-xs leading-relaxed text-warning-700">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                هذان الحقلان يُنفّذان أي كود JavaScript تضعه فيهما على كل صفحات الموقع. الصلاحية
                للمديرين فقط، ولا تُلصق فيهما كوداً من مصدر لا تثق به.
              </p>
            </Card>

            {/* ── §4 · reCAPTCHA ───────────────────────────────── */}
            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">الحماية من السبام (CAPTCHA)</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                يُطبَّق على كل نماذج الموقع: نموذج التواصل ونموذج الاشتراك في النشرة البريدية.
              </p>

              <Select
                label="المزوّد"
                disabled={!editable}
                value={form.captcha.provider ?? ''}
                onChange={(event) => set('captcha', { provider: event.target.value })}
                options={CAPTCHA_PROVIDERS}
              />

              <Select
                label="الإصدار"
                disabled={!editable || !form.captcha.provider}
                value={form.captcha.version ?? CAPTCHA_VERSIONS.V2_INVISIBLE}
                onChange={(event) => set('captcha', { version: event.target.value })}
                options={CAPTCHA_VERSION_OPTIONS}
                hint="المفتاح المستخدم حالياً من نوع v2 غير مرئي. غيّر هذا الحقل فقط إذا استُبدل المفتاح بمفتاح من نوع آخر."
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
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  المفتاح السري (Secret Key) لا يُحفظ هنا ولا في قاعدة البيانات. هذه الإعدادات قابلة
                  للقراءة من المتصفح، فالمفتاح السري يوضع في متغيّر البيئة{' '}
                  <span className="ltr-run font-medium">RECAPTCHA_SECRET_KEY</span> على الخادم، مع
                  الشيفرة التي تتحقق من كل طلب قبل قبوله أو حفظه.
                </span>
              </p>
            </Card>

            <Card className="gap-5">
              <h2 className="text-base font-bold text-ink">نموذج التواصل</h2>
              <p className="-mt-3 text-xs leading-relaxed text-ink-muted">
                تُحفظ كل الطلبات في قاعدة البيانات وتظهر في قسم «طلبات النماذج»، وتُرسل نسخة إشعار
                بالبريد الإلكتروني. يمكن إضافة وجهة خارجية إضافية أدناه.
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
                hint="اختياري — رابط استقبال خارجي إن وُجد."
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
