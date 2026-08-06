import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Smartphone, Trash2 } from 'lucide-react';

import { AdminPage } from '@components/admin';
import { Badge, Button, Card, Input, Modal } from '@components/ui';
import { useAuth } from '@context/AuthContext.jsx';
import { formatDate } from '@utils/format.js';

/**
 * Two-factor authentication (Dashboard spec §13).
 *
 * The only admin screen reachable before a factor is enrolled — see
 * `RequireAuth`. A user with no factor lands here and cannot go
 * anywhere else, which is what "2FA for dashboard access" means in
 * practice: not a suggestion in the settings screen.
 *
 * TOTP only. An authenticator app costs nothing per login, needs no
 * phone number and no SMS deliverability in the several countries
 * this team works from, and is not defeated by a SIM swap.
 *
 * The QR code comes back from Supabase as an SVG data URI, so it is
 * rendered as an <img> with no QR library in the bundle. The secret
 * is shown next to it because a QR code is unusable on the phone
 * that is displaying it.
 */
export default function Security() {
  const { factors, hasMfa, startEnrollment, confirmEnrollment, removeFactor, user } = useAuth();

  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  useEffect(() => {
    document.title = 'الأمان والتحقق بخطوتين | لوحة تحكم بدار';
  }, []);

  const begin = async () => {
    setError('');
    setBusy(true);
    try {
      setEnrollment(await startEnrollment(`bedar-${Date.now()}`));
    } catch (caught) {
      setError(caught?.message ?? 'تعذّر بدء التسجيل. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await confirmEnrollment({ factorId: enrollment.factorId, code });
      setEnrollment(null);
      setCode('');
    } catch (caught) {
      setCode('');
      setError(caught?.message ?? 'الرمز غير صحيح أو انتهت صلاحيته. جرّب الرمز التالي.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setError('');
    setBusy(true);
    try {
      await removeFactor(pendingRemoval.id);
      setPendingRemoval(null);
    } catch (caught) {
      setError(caught?.message ?? 'تعذّر إزالة التطبيق.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPage
      className="max-w-3xl"
      eyebrow="الإدارة"
      icon={ShieldCheck}
      title="الأمان والتحقق بخطوتين"
      description="الدخول إلى لوحة التحكم يتطلّب التحقق بخطوتين. سجّل تطبيق مصادقة على هاتفك، وسيُطلب منك رمز مكوّن من 6 أرقام عند كل تسجيل دخول."
    >
      {!hasMfa ? (
        <div className="flex items-start gap-3 rounded-md bg-warning-100 px-4 py-3 text-warning-700">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            لم تُفعّل التحقق بخطوتين بعد. لن تتمكّن من الوصول إلى بقية أقسام لوحة التحكم قبل إكمال
            التسجيل.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-md bg-error-100 px-4 py-3 text-sm text-error-700">
          {error}
        </p>
      ) : null}

      {/* ── Enrolled apps ─────────────────────────────────────── */}
      <Card className="gap-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-ink">تطبيقات المصادقة</h2>
          {hasMfa ? (
            <Badge tone="success" size="sm">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              مفعّل
            </Badge>
          ) : (
            <Badge tone="warning" size="sm">
              غير مفعّل
            </Badge>
          )}
        </div>

        {factors.length ? (
          <ul className="flex flex-col gap-2">
            {factors.map((factor) => (
              <li
                key={factor.id}
                className="flex items-center justify-between gap-4 rounded-md border border-subtle px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Smartphone className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      <span className="ltr-run">{factor.friendly_name || 'تطبيق مصادقة'}</span>
                    </p>
                    <p className="text-xs text-ink-muted">
                      سُجّل في {formatDate(factor.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingRemoval(factor)}
                  aria-label="إزالة تطبيق المصادقة"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  إزالة
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-secondary">لا يوجد تطبيق مصادقة مسجَّل على هذا الحساب.</p>
        )}

        {!enrollment ? (
          <div>
            <Button onClick={begin} disabled={busy}>
              {hasMfa ? 'تسجيل تطبيق إضافي' : 'تفعيل التحقق بخطوتين'}
            </Button>
          </div>
        ) : null}
      </Card>

      {/* ── Enrolment ─────────────────────────────────────────── */}
      {enrollment ? (
        <Card className="gap-5">
          <h2 className="text-base font-bold text-ink">امسح الرمز بتطبيق المصادقة</h2>

          <ol className="flex list-decimal flex-col gap-2 ps-5 text-sm leading-relaxed text-ink-secondary">
            <li>
              افتح تطبيق مصادقة مثل <span className="ltr-run">Google Authenticator</span> أو{' '}
              <span className="ltr-run">Microsoft Authenticator</span> أو{' '}
              <span className="ltr-run">1Password</span>.
            </li>
            <li>امسح الرمز أدناه، أو أدخل المفتاح يدوياً.</li>
            <li>أدخل الرمز المكوّن من 6 أرقام الذي يعرضه التطبيق لتأكيد التسجيل.</li>
          </ol>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {enrollment.qrCode ? (
              // The QR itself must not be mirrored — it is machine
              // readable artwork, not layout.
              <img
                src={enrollment.qrCode}
                alt="رمز الاستجابة السريعة لتسجيل تطبيق المصادقة"
                className="size-44 shrink-0 rounded-md border border-subtle bg-white p-2"
              />
            ) : null}

            <div className="flex w-full min-w-0 flex-col gap-2">
              <p className="text-[13px] font-semibold text-ink">أو أدخل هذا المفتاح يدوياً</p>
              <code className="ltr-run block overflow-x-auto rounded-md bg-sunken px-3 py-2 text-xs tracking-wider text-ink select-all">
                {enrollment.secret}
              </code>
              <p className="text-xs leading-relaxed text-ink-muted">
                الحساب: <span className="ltr-run">{user?.email}</span>
              </p>
            </div>
          </div>

          <form onSubmit={confirm} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input
              label="رمز التحقق"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              dir="ltr"
              className="text-center tracking-[0.3em]"
              fieldClassName="sm:max-w-48"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || code.length < 6}>
                {busy ? 'جارٍ التأكيد…' : 'تأكيد التسجيل'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEnrollment(null);
                  setCode('');
                  setError('');
                }}
                disabled={busy}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Modal
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        title="إزالة تطبيق المصادقة"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingRemoval(null)} disabled={busy}>
              تراجع
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              {busy ? 'جارٍ الإزالة…' : 'إزالة'}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-secondary">
          بإزالة التطبيق الأخير سيعود حسابك إلى كلمة المرور وحدها، وستُطالب بتسجيل تطبيق جديد قبل
          استخدام لوحة التحكم مرة أخرى.
        </p>
      </Modal>
    </AdminPage>
  );
}
