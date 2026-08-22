/* ================================================================
   SITE CONTENT SEED — navbar, footer, global settings.

   Infrastructure spec §3: "The navbar, footer, and things like the
   homepage 'latest articles' section must be built as content
   collections/data (not hardcoded text)". This file is that data.

   It is the LOCAL SEED. From Phase 4 onward the same shapes are
   served from Supabase and this file becomes the fallback used when
   the backend is unreachable, plus the fixture the publish pipeline
   writes into the repo (Phase 6). Keep the shapes stable — the
   dashboard editors are built against them.

   Every Arabic string below is VERBATIM from https://bedar.webflow.io/
   (header + footer DOM, read 2026-08-04). Do not "improve" the
   wording here — the migration contract is a like-for-like move.
   ================================================================ */

/**
 * Primary header navigation. Order is the render order.
 *
 * The live navbar is not a flat list: "منصة بدار" is a hover/click
 * dropdown that is NOT itself a link (Webflow `w-dropdown-toggle`,
 * no href), and its two children are the only entries under it.
 * `تواصل معنا` is deliberately absent — on the live site it is the
 * turquoise CTA button, not a nav link. See `headerCta` below.
 *
 * Shape: a `children` array marks a group. Items without `children`
 * are plain links. Groups have no `href` by design; the dashboard
 * nav editor (Phase 5) treats the two as separate item types.
 */
export const navigation = [
  { id: 'home', label: 'الرئيسية', href: '/' },
  {
    id: 'bedar-platform',
    label: 'منصة بدار',
    children: [
      { id: 'about', label: 'من نحن', href: '/about' },
      {
        id: 'social-entrepreneurship',
        label: 'بدار والريادة المجتمعية',
        href: '/social-entrepreneurship',
      },
    ],
  },
  { id: 'programs', label: 'البرامج', href: '/programs' },
  { id: 'services', label: 'الخدمات', href: '/services' },
  { id: 'blog', label: 'المدونة', href: '/blog' },
  { id: 'news', label: 'الأخبار', href: '/news' },
];

/** Header CTA. Text and link are separate fields — Dashboard spec §2. */
export const headerCta = {
  label: 'تواصل معنا',
  href: '/contact-us',
};

/**
 * The breadcrumb trail for an interior page, built from the NAVIGATION
 * rather than from a per-page string.
 *
 * `PageHero` opens every page that is not the homepage with a trail,
 * and a breadcrumb's label is the same word the header uses for that
 * page — so reading it out of `navigation` is what keeps the two in
 * step. Renaming "الخدمات" in the dashboard renames it in the trail on
 * the same publish; a second copy in `pages.js` would be a second
 * place to forget.
 *
 * `fallback` is for pages that are not in the navigation at all (the
 * contact page is the header CTA, not a nav link — see the note above
 * `headerCta`) and for a page that is renamed out of the nav later.
 * The trail degrades to just "الرئيسية" rather than rendering an
 * empty crumb.
 */
export function breadcrumbsFor(href, fallback) {
  const label = findNavLabel(navigation, href) ?? fallback;
  const trail = [{ label: 'الرئيسية', href: '/' }];
  if (label) trail.push({ label });
  return trail;
}

/** Depth-first lookup — nav items nest one level (Dashboard spec §3.1). */
function findNavLabel(items, href) {
  for (const item of items) {
    if (item.href === href) return item.label;
    const nested = item.children ? findNavLabel(item.children, href) : null;
    if (nested) return nested;
  }
  return null;
}

export const footer = {
  /**
   * Brand blurb. On the live site the whole sentence is one link to
   * the parent foundation, so it is stored as label + href rather
   * than as prose with a link spliced into it.
   */
  tagline: {
    label: 'بدار إحدى منصات مؤسسة منار للمشاركة المجتمعية',
    href: 'https://www.manar.org/ar',
  },

  /** Footer link columns. */
  columns: [
    {
      id: 'main-menu',
      title: 'القائمة الرئيسية',
      links: [
        { id: 'about', label: 'من نحن', href: '/about' },
        {
          id: 'social-entrepreneurship',
          label: 'بدار والريادة المجتمعية',
          href: '/social-entrepreneurship',
        },
        { id: 'programs', label: 'البرامج', href: '/programs' },
        { id: 'services', label: 'الخدمات', href: '/services' },
        { id: 'news', label: 'الأخبار', href: '/news' },
        { id: 'contact', label: 'تواصل معنا', href: '/contact-us' },
      ],
    },
  ],

  /**
   * Latest articles block. Rendered from the `articles` collection at
   * runtime — these three are only the seed. A newly published
   * article must appear here with no code change (Infra spec §3).
   */
  latestArticles: {
    title: 'أحدث المقالات',
    collection: 'articles',
    limit: 3,
    seed: [
      {
        id: 'stages-of-idea-generation',
        title: 'مراحل توليد الفكرة',
        href: '/blog/stages-of-idea-generation',
      },
      {
        id: 'an-idea-equals-profits',
        title: 'الفكرة تساوي الأرباح',
        href: '/blog/an-idea-equals-profits',
      },
      { id: 'refining-ideas', title: 'تنقية الأفكار', href: '/blog/refining-ideas' },
    ],
  },

  /**
   * Newsletter signup. Every string is an editable field — Dashboard
   * spec §4 requires form copy, success and error states to be
   * dashboard-controlled, never hardcoded in JSX.
   */
  newsletter: {
    title: 'النشرة البريدية',
    placeholder: 'johndo@gmail.com',
    submitLabel: 'اشتراك',
    pendingLabel: 'انتظر قليلاً..',
    successMessage: 'شكراً لاشتراككم بالنشرة البريدية',
    errorMessage: 'حدث خطأ ما.. يرجى المحاولة مرة أخرى',
  },

  /** Bottom bar. `{year}` is substituted at render time. */
  legal: 'كافة الحقوق محفوظة © منصة بدار للريادة المجتمعية {year}',

  /** Agency credit — links out, verbatim including the Latin name. */
  credit: {
    prefix: 'تصميم وتطوير',
    label: 'شركة Threems',
    href: 'https://www.threems.co.uk/ar',
  },
};

/**
 * Global settings. Everything here becomes an editable field in the
 * "إعدادات SEO" screen (Dashboard spec §6, §11; client notes §5-§8)
 * and feeds the site-wide Organization schema — entered once, never
 * duplicated per page.
 *
 * THIS FILE IS THE SEED, NOT THE SOURCE. Once Supabase is wired up,
 * `site_settings` wins for every key here (see
 * `context/ContentContext.jsx` → `mergeSettings`). What is written
 * below is what an unconfigured project renders, and the starting
 * value the seed script loads into the database.
 */
export const siteSettings = {
  name: 'بدار',
  legalName: 'منصة بدار للريادة المجتمعية',
  url: 'https://bedar.org',
  logo: '/src/assets/bedar-logo.svg',
  email: 'info@bedar.org',

  /* ── Organization schema (client notes §6) ──────────────────────
     Every field below is emitted by `components/layout/SiteSchema.jsx`
     as JSON-LD, and every one of them is editable in the dashboard.
     Nothing about the organisation is written into the schema
     component itself — that is the requirement, and it is why blank
     values here are simply omitted from the output rather than
     rendered as empty strings. */

  /** schema.org type. `NGO` is a subtype of Organization and is the
   *  accurate one for Manar; the field is a choice because Bedar may
   *  later be described as an EducationalOrganization. */
  schemaType: 'NGO',
  alternateName: 'Bedar',
  description:
    'منصة بدار للريادة المجتمعية — نعمل على تمكين المبادرات المجتمعية وصناعة أثر مستدام.',
  telephone: '',
  foundingDate: '',
  address: {
    streetAddress: '',
    addressLocality: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: '',
  },

  /**
   * Footer contact rail. `label` is the platform name and `handle`
   * the account as displayed — both are shown on the live site, so
   * both are stored. Note the Facebook handle reads `@bedar.org`
   * while the URL points at `/bedarplatform`; that mismatch is on
   * the live site and is reproduced rather than silently corrected.
   */
  social: [
    {
      id: 'facebook',
      label: 'Facebook',
      handle: '@bedar.org',
      href: 'https://www.facebook.com/bedarplatform',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@bedarplatform',
      href: 'https://www.instagram.com/bedarplatform',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      handle: '@bedar-platform',
      href: 'https://www.linkedin.com/company/bedar-platform',
    },
    { id: 'x', label: 'X', handle: '@bedarplatform', href: 'https://x.com/bedarplatform' },
  ],

  /**
   * Injected site-wide by `components/layout/SiteIntegrations.jsx`
   * (Dashboard spec §11, client notes §5). Empty until configured.
   */
  integrations: {
    /** `GTM-XXXXXXX`. Installs the container on every public page. */
    gtmContainerId: '',
    /** The `content` value only, not the whole meta tag. */
    searchConsoleVerification: '',
    /** Injected into <head> / before </body>, verbatim. */
    headCode: '',
    footerCode: '',

    /**
     * The analytics event each form fires ON CONFIRMED SUCCESS
     * (client notes §3). Blank falls back to `DATALAYER_EVENTS`.
     * The name is a setting and not a constant precisely so it can
     * be matched to a GA4 / GTM conversion without a deploy.
     */
    formEvents: {
      contact: '',
      newsletter: '',
    },
  },

  /**
   * Captcha is configurable, never hardcoded — Dashboard spec §4,
   * client notes §4.
   *
   * The SITE key belongs in the page: it is transmitted to every
   * visitor by definition, and Google's own documentation publishes
   * it. The SECRET key is not here and is not in the database — it
   * lives in `RECAPTCHA_SECRET_KEY` on the server, next to
   * `lib/recaptcha.js`, which is the only code that uses it.
   */
  captcha: {
    provider: 'recaptcha',
    /** See `CAPTCHA_VERSIONS` — this key is a v2 *invisible* key. */
    version: 'v2-invisible',
    siteKey: '6LdAI5ItAAAAAGuHH_ZFmlVV7JTXjcKy3b4fFFh-',
  },

  /**
   * What the site tells crawlers (client notes §7, §8). Served by
   * `api/robots.js`; `%SITE_URL%` is expanded at request time so one
   * value is correct on production and on every preview deploy.
   */
  seo: {
    robotsTxt: 'User-agent: *\nAllow: /\n\nSitemap: %SITE_URL%/sitemap.xml\n',
    sitemapEnabled: true,
    sitemapExcludePaths: ['/admin'],
  },

  /** GDPR — Manar is a Netherlands-registered NGO (Dashboard spec §12). */
  consent: {
    enabled: true,
    privacyPolicyHref: '',
    cookiePolicyHref: '',
  },
};

export default { navigation, headerCta, footer, siteSettings };
