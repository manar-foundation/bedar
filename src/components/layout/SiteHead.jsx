import { useEffect } from 'react';

import { useContent } from '@context/ContentContext.jsx';
import { env } from '@utils/env.js';
import { injectHtml, setJsonLd, setMeta } from '@utils/injectHtml.js';
import { organizationSchema, websiteSchema } from '@utils/schema.js';

/* ================================================================
   EVERYTHING THE DASHBOARD PUTS IN THE DOCUMENT.
   (Client notes ٥ and ٦)

   Mounted once, in `PublicLayout`. Four jobs:

     GTM                 the official container snippet, on every
                         page, from a Container ID typed in the
                         dashboard — "عند إضافة الـ Container ID
                         وحفظه، يجب تفعيل كود Google Tag Manager
                         تلقائيًا على جميع صفحات الموقع وفق طريقة
                         التركيب الرسمية لـ Google".
     Search Console      the verification meta, in <head>.
     Head / Footer code  admin-authored snippets, executed in place.
     Organization schema JSON-LD built from the saved settings.

   THE PUBLIC SITE ONLY. It renders inside `PublicLayout`, not in
   `App`, so none of it loads in `/admin` — an editor should not be
   generating analytics traffic while working, and a stray snippet
   that breaks the page should never take the dashboard down with it.

   REMOVAL IS PART OF THE REQUIREMENT. "يجب أن يكون بالإمكان تعديل
   أو حذف الـ Container ID من لوحة التحكم في أي وقت" — so every
   effect returns a cleanup that removes exactly what it added, and
   clearing a field in the dashboard removes its snippet on the next
   settings read rather than at the next deploy.

   WHY IT IS ALL IN EFFECTS, NOT IN JSX
   ----------------------------------------------------------------
   These nodes belong in <head> and at the end of <body>, which is
   outside this component's tree. React 18 has no head hoisting (that
   is React 19), and a <script> React renders into the body does not
   execute anyway — see `utils/injectHtml.js`.
   ================================================================ */

/**
 * Google's own container snippet, verbatim from their install page.
 * Kept as a template rather than hand-rolled: this is the code their
 * documentation says to paste, and Tag Assistant checks for it.
 */
function gtmSnippet(containerId) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`;
}

/**
 * A container id has a fixed shape. Checked because the value is
 * interpolated into the snippet above, and because "GTM-XXXXXXX"
 * (the placeholder) or a pasted whole `<script>` tag would otherwise
 * produce a broken request on every page load.
 */
function validContainerId(value) {
  return /^GTM-[A-Z0-9]{4,}$/i.test(String(value ?? '').trim());
}

export default function SiteHead() {
  const { settings } = useContent();

  const integrations = settings?.integrations ?? {};
  // The dashboard wins; the build-time env var is the fallback for a
  // project whose settings row has not been filled in yet.
  const containerId = String(integrations.gtmContainerId || env.gtmContainerId || '').trim();
  const verification = String(integrations.searchConsoleVerification ?? '').trim();
  const headCode = String(integrations.headCode ?? '');
  const footerCode = String(integrations.footerCode ?? '');

  /* ── Google Tag Manager ─────────────────────────────────────── */
  useEffect(() => {
    if (!validContainerId(containerId)) return undefined;

    // The queue exists before the container loads, so an event fired
    // in the meantime (a fast form submit) is delivered, not lost.
    window.dataLayer = window.dataLayer || [];

    const script = document.createElement('script');
    script.setAttribute('data-bedar-gtm', containerId);
    script.text = gtmSnippet(containerId);
    document.head.appendChild(script);

    // The <noscript> half of Google's snippet. It does nothing for a
    // visitor with JavaScript, and Tag Assistant reports its absence
    // as an incomplete install.
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    return () => {
      script.remove();
      noscript.remove();
    };
  }, [containerId]);

  /* ── Search Console verification ────────────────────────────── */
  useEffect(() => setMeta('google-site-verification', verification), [verification]);

  /* ── Custom code ────────────────────────────────────────────── */
  useEffect(() => injectHtml(headCode, document.head, 'head-code'), [headCode]);
  useEffect(() => injectHtml(footerCode, document.body, 'footer-code'), [footerCode]);

  /* ── Structured data ────────────────────────────────────────── */
  useEffect(() => setJsonLd('organization', organizationSchema(settings)), [settings]);
  useEffect(() => setJsonLd('website', websiteSchema(settings)), [settings]);

  return null;
}
