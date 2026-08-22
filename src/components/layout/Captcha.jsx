import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

/* ================================================================
   CAPTCHA — the visitor's half of client note ٤.

   "تفعيل Google reCAPTCHA على جميع النماذج الموجودة في الموقع لمنع
    الرسائل والطلبات الآلية … يجب تطبيق التحقق على جميع النماذج قبل
    قبول الطلب أو حفظه في قاعدة البيانات."

   THE SPLIT
   ----------------------------------------------------------------
   This component only ever OBTAINS a token. It does not decide
   anything: the token is sent with the submission and verified on
   the server (`lib/captcha.js`), before the row is written and
   before the mail is sent. A captcha that the browser judges is not
   a captcha — a script simply does not run the widget.

   The SECRET key is therefore not here, not in the bundle, and not
   in `site_settings` (which is world-readable by design). It is a
   Vercel environment variable read by the endpoint. The SITE key is
   public by definition and comes from the dashboard.

   v2 AND v3
   ----------------------------------------------------------------
   A reCAPTCHA site key does not say which product it belongs to, and
   guessing wrong produces a form nobody can submit. So `version` is
   a dashboard setting:

     v2  renders a checkbox. The token exists once the visitor has
         ticked it, so `getToken` returns what the widget already
         holds and the submit button waits for nothing.
     v3  renders nothing. `getToken` runs `grecaptcha.execute` at
         SUBMIT time, because a v3 token expires after two minutes —
         minting one on page load and using it when the visitor
         finishes typing is the classic way to fail verification on
         every long message.

   NO PROVIDER CONFIGURED = NO CAPTCHA. `useCaptcha` returns a
   `getToken` that resolves to `''`, the endpoint sees no token, and
   its own config read tells it none was required. The site works
   with the feature switched off, which is what an empty provider in
   the dashboard means.
   ================================================================ */

/** Script URL and global name per provider. All three are drop-ins. */
const PROVIDERS = {
  recaptcha: {
    global: 'grecaptcha',
    src: (siteKey, version) =>
      version === 'v3'
        ? `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
        : 'https://www.google.com/recaptcha/api.js?render=explicit',
  },
  hcaptcha: {
    global: 'hcaptcha',
    src: () => 'https://js.hcaptcha.com/1/api.js?render=explicit',
  },
  turnstile: {
    global: 'turnstile',
    src: () => 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  },
};

/* One <script> per provider for the whole page, however many forms
   mount. A second copy of the reCAPTCHA script re-registers its
   globals and silently breaks the first widget. */
const loaders = new Map();

function loadScript(provider, siteKey, version) {
  const config = PROVIDERS[provider];
  if (!config) return Promise.reject(new Error(`unknown captcha provider: ${provider}`));

  const cacheKey = `${provider}:${version}`;
  if (loaders.has(cacheKey)) return loaders.get(cacheKey);

  const promise = new Promise((resolve, reject) => {
    if (window[config.global]) {
      resolve(window[config.global]);
      return;
    }
    const script = document.createElement('script');
    script.src = config.src(siteKey, version);
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window[config.global]);
    script.onerror = () => reject(new Error('captcha script failed to load'));
    document.head.appendChild(script);
  });

  loaders.set(cacheKey, promise);
  return promise;
}

/**
 * The captcha slot for a form.
 *
 * Renders the v2 checkbox, or nothing at all for v3 / no provider.
 * The parent gets a `getToken()` through the ref and calls it inside
 * its submit handler — see `ContactForm`.
 */
export const Captcha = forwardRef(function Captcha({ captcha, className }, ref) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const apiRef = useRef(null);
  const instanceId = useId();
  const [failed, setFailed] = useState(false);

  const provider = captcha?.provider ?? '';
  const siteKey = captcha?.siteKey ?? '';
  const version = captcha?.version === 'v3' ? 'v3' : 'v2';
  const enabled = Boolean(provider && siteKey && PROVIDERS[provider]);
  const invisible = version === 'v3';

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    loadScript(provider, siteKey, version)
      .then((api) => {
        if (cancelled || !api) return;
        apiRef.current = api;
        if (invisible || !containerRef.current) return;

        // `ready` is reCAPTCHA's "the widget code is parsed" hook;
        // hCaptcha and Turnstile expose their render synchronously,
        // so the callback shape is normalised here.
        const render = () => {
          if (cancelled || widgetRef.current !== null || !containerRef.current) return;
          try {
            widgetRef.current = api.render(containerRef.current, {
              sitekey: siteKey,
              // The forms sit on `.surface-dark`; the light widget on
              // deep teal is a white slab in the middle of the band.
              theme: 'dark',
              hl: 'ar',
            });
          } catch {
            // Almost always "a key of the wrong version" — the form
            // must not become unsubmittable because of it.
            if (!cancelled) setFailed(true);
          }
        };

        if (typeof api.ready === 'function') api.ready(render);
        else render();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, provider, siteKey, version, invisible, instanceId]);

  const getToken = useCallback(async () => {
    if (!enabled || failed) return '';
    const api = apiRef.current ?? (await loadScript(provider, siteKey, version).catch(() => null));
    if (!api) return '';

    if (invisible) {
      // Minted at submit time: a v3 token lives two minutes.
      return new Promise((resolve) => {
        api.ready(() => {
          api
            .execute(siteKey, { action: 'submit' })
            .then((token) => resolve(token ?? ''))
            .catch(() => resolve(''));
        });
      });
    }

    if (widgetRef.current === null) return '';
    try {
      return api.getResponse(widgetRef.current) ?? '';
    } catch {
      return '';
    }
  }, [enabled, failed, invisible, provider, siteKey, version]);

  /** Called after a submit so the next one needs a fresh tick. */
  const reset = useCallback(() => {
    if (!enabled || invisible || widgetRef.current === null) return;
    try {
      apiRef.current?.reset(widgetRef.current);
    } catch {
      /* the widget is gone; nothing to reset */
    }
  }, [enabled, invisible]);

  useImperativeHandle(ref, () => ({ getToken, reset, required: enabled && !failed }), [
    getToken,
    reset,
    enabled,
    failed,
  ]);

  if (!enabled || invisible) return null;

  return (
    <div className={className}>
      <div ref={containerRef} />
      {failed ? (
        <p role="status" className="text-xs text-warning-500">
          تعذّر تحميل أداة التحقق. يمكنك المتابعة، وسيتم التحقق من الطلب عند الإرسال.
        </p>
      ) : null}
    </div>
  );
});

export default Captcha;
