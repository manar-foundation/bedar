import { useCallback, useEffect, useRef, useState } from 'react';

import { CAPTCHA_VERSIONS } from '@utils/constants.js';
import {
  captchaEnabled,
  captchaIncompleteError,
  captchaVersion,
  loadRecaptcha,
  renderWidget,
} from '@utils/recaptcha.js';

/* ================================================================
   useCaptcha — one form's reCAPTCHA, from settings to token.

   Both public forms use it identically (client notes §4: "apply the
   verification to every form"), so the awkward parts — lazy script
   loading, the v2 callback that arrives out of band, resetting a
   spent token — are solved once here rather than twice in two
   components.

   CONTRACT

     const captcha = useCaptcha(settings.captcha);

     <div ref={captcha.mount} />             // sized only for v2 checkbox
     const token = await captcha.getToken(); // '' when not configured

   CHECKBOX IS THE DEFAULT FLAVOUR (client notes §4, revised): the
   visitor sees "أنا لست برنامج روبوت" inside every public form and
   ticks it before pressing send. `captcha.visible` says whether the
   widget occupies layout, and `captcha.solved` tracks the tick, so a
   form can prompt for it instead of failing opaquely.

   `mount` is a CALLBACK ref, not the ref object — Google needs the
   node, but a component must not read `.current` while it renders
   (`react-hooks/refs` enforces that, and it is right to: a DOM node
   is not render data). It is not NAMED `ref` for the same reason —
   that rule reads the name, and a `.ref` property in JSX looks
   exactly like the mistake it exists to catch.

   `getToken()` RESOLVES WITH '' when no captcha is configured, and
   REJECTS when one is configured but could not produce a token. The
   difference matters: the first is a site that has not switched
   captcha on yet and must keep working, the second is a visitor the
   form should not submit for. The server applies the same rule from
   the other side — with `RECAPTCHA_SECRET_KEY` set it REQUIRES a
   valid token, so the pair fails closed once configured.
   ================================================================ */

/** How long to wait for the v2 callback before giving up. */
const TOKEN_TIMEOUT_MS = 30_000;

export function useCaptcha(captcha, { compact = false } = {}) {
  const container = useRef(null);
  const widgetId = useRef(null);
  const apiRef = useRef(null);
  /** Resolver for the v2 callback, which arrives outside the promise. */
  const pending = useRef(null);

  const enabled = captchaEnabled(captcha);
  const version = captchaVersion(captcha);
  const siteKey = captcha?.siteKey ?? '';

  // Surfaced so a form can say "التحقق غير متاح" instead of failing
  // with no explanation when the script is blocked.
  const [failed, setFailed] = useState(false);

  /* Whether the checkbox currently holds a response. Google reports
     the tick and its expiry through callbacks, so this is the only
     way a React tree can know — `getResponse` is a poll, not a
     subscription, and reading it during render would be a side
     effect. Used to clear a "tick the box" prompt the moment the
     visitor does, rather than making them press send to find out. */
  const [solved, setSolved] = useState(false);

  /* The node Google renders into. A state value and not just a ref,
     because the checkbox effect below has to RUN when the element
     appears — a ref assignment does not re-run an effect, and the
     widget would then never render on the first paint. */
  const [node, setNode] = useState(null);
  const mount = useCallback((element) => {
    container.current = element;
    setNode(element);
  }, []);

  /* The checkbox flavour is the one that has to be on screen before
     the visitor submits, so it renders as soon as the form mounts.
     The invisible one is rendered on demand inside `getToken`, which
     is what keeps the script off pages nobody interacts with. */
  useEffect(() => {
    if (!enabled || version !== CAPTCHA_VERSIONS.V2_CHECKBOX) return undefined;

    if (!node) return undefined;

    let active = true;
    loadRecaptcha({ siteKey, version })
      .then((api) => {
        if (!active || widgetId.current !== null) return;
        apiRef.current = api;
        widgetId.current = renderWidget(api, {
          container: node,
          siteKey,
          version,
          compact,
          onToken: () => setSolved(true),
          // Both an expiry (~2 minutes) and a widget error land here.
          // Either way the response is gone and the box needs ticking
          // again, which is exactly what `solved: false` says.
          onExpired: () => setSolved(false),
        });
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [enabled, siteKey, version, node, compact]);

  const getToken = useCallback(async () => {
    if (!enabled) return '';

    const api = apiRef.current ?? (await loadRecaptcha({ siteKey, version }));
    apiRef.current = api;

    if (version === CAPTCHA_VERSIONS.V3) {
      // The action is what a GA4 / GTM report groups the score by,
      // and what the server asserts the token was minted for.
      return api.execute(siteKey, { action: 'submit' });
    }

    if (version === CAPTCHA_VERSIONS.V2_CHECKBOX) {
      /* The token already exists or it does not — there is nothing to
         execute and nothing to wait for. An empty response means the
         box was never ticked, or the tick expired while the visitor
         was still typing; both are the visitor's to fix, so this is
         the TYPED error and not a generic failure. Nothing is posted,
         so there is no insert and no event. */
      const token = widgetId.current !== null ? api.getResponse(widgetId.current) : '';
      if (!token) {
        setSolved(false);
        throw captchaIncompleteError();
      }
      return token;
    }

    /* v2 invisible. The token arrives through the widget's callback,
       not from `execute`, so the promise is resolved from outside —
       `pending` is that bridge. The widget is created once and reset
       between submissions, because a token may only be redeemed once
       and a second `execute` on a spent widget resolves instantly
       with the stale one. */
    if (widgetId.current === null) {
      if (!container.current) throw new Error('captcha container missing');
      widgetId.current = renderWidget(api, {
        container: container.current,
        siteKey,
        version,
        compact,
        onToken: (token) => pending.current?.resolve(token),
        onExpired: () => pending.current?.reject(new Error('captcha expired')),
      });
    } else {
      api.reset(widgetId.current);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.current = null;
        reject(new Error('captcha timed out'));
      }, TOKEN_TIMEOUT_MS);

      const finish = (fn) => (value) => {
        clearTimeout(timer);
        pending.current = null;
        fn(value);
      };
      pending.current = { resolve: finish(resolve), reject: finish(reject) };

      try {
        api.execute(widgetId.current);
      } catch (error) {
        clearTimeout(timer);
        pending.current = null;
        reject(error);
      }
    });
  }, [enabled, siteKey, version, compact]);

  /** Clear a spent response so the next submission mints a new one. */
  const reset = useCallback(() => {
    if (widgetId.current !== null && apiRef.current) apiRef.current.reset(widgetId.current);
    setSolved(false);
  }, []);

  return {
    enabled,
    version,
    failed,
    /** v2 checkbox only: is the box ticked right now? */
    solved,
    /** Callback ref for the element Google renders the widget into. */
    mount,
    getToken,
    reset,
    /** True when the widget occupies layout and must be rendered. */
    visible: enabled && version === CAPTCHA_VERSIONS.V2_CHECKBOX,
  };
}

export default useCaptcha;
