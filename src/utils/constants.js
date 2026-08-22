/* ================================================================
   Shared enums and literals. Keep values in sync with the Supabase
   schema (Phase 4) — these strings are stored in the database.
   ================================================================ */

/** Publish state, per Dashboard spec §2 and §10. */
export const PUBLISH_STATE = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
};

/** Content collections, per Dashboard spec §3.2. */
export const COLLECTIONS = {
  ARTICLES: 'articles',
  NEWS: 'news',
  /** Article-shaped like the two above — same table, `collection = 'programs'`. */
  PROGRAMS: 'programs',
  TESTIMONIALS: 'testimonials',
  FAQ: 'faq',
  /** Its own table (migration 0010), not `collection_items` — but it
   *  is edited as a collection, so it lives on the same screen. */
  SERVICES: 'services',
};

/** Arabic labels for the admin sidebar / breadcrumbs. */
export const COLLECTION_LABELS = {
  [COLLECTIONS.ARTICLES]: 'المقالات',
  [COLLECTIONS.NEWS]: 'الأخبار',
  [COLLECTIONS.PROGRAMS]: 'البرامج',
  [COLLECTIONS.TESTIMONIALS]: 'آراء وشهادات',
  [COLLECTIONS.FAQ]: 'الأسئلة الشائعة',
  [COLLECTIONS.SERVICES]: 'الخدمات',
};

/**
 * Which tab on /programs an item belongs to. Programs only — the
 * column is nullable because the concept is meaningless for an
 * article. Values match the `collection_items_program_status` CHECK.
 */
export const PROGRAM_STATUS_LABELS = {
  past: 'سابق',
  current: 'حالي',
  upcoming: 'قادم',
};

export const PROGRAM_STATUS_OPTIONS = Object.entries(PROGRAM_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

/** Role-based access, per Dashboard spec §9. */
export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
};

/**
 * Table names, in one place. Every query in the dashboard goes
 * through these — a renamed table then breaks in one file instead of
 * thirty, and grep answers "what touches page_fields".
 */
export const TABLES = {
  PROFILES: 'profiles',
  PAGES: 'pages',
  PAGE_FIELDS: 'page_fields',
  COLLECTION_ITEMS: 'collection_items',
  TESTIMONIALS: 'testimonials',
  FAQ_ITEMS: 'faq_items',
  SERVICES: 'services',
  NAVIGATION: 'navigation_items',
  SETTINGS: 'site_settings',
  MEDIA: 'media',
  REDIRECTS: 'redirects',
  VERSIONS: 'content_versions',
  FORM_SUBMISSIONS: 'form_submissions',
};

/**
 * The forms whose submissions are stored and listed (client note ٢),
 * and whose success event is named in the dashboard (note ٣).
 *
 * The values are the `form_kind` enum in SQL — they are written to
 * the database by `api/contact.js` and `api/newsletter.js`.
 */
export const FORM_KINDS = {
  CONTACT: 'contact',
  NEWSLETTER: 'newsletter',
};

export const FORM_KIND_LABELS = {
  [FORM_KINDS.CONTACT]: 'نموذج التواصل',
  [FORM_KINDS.NEWSLETTER]: 'الاشتراك في النشرة',
};

/** Storage bucket for the media library (Dashboard spec §7). */
export const MEDIA_BUCKET = 'media';

/**
 * `site_settings` keys. The rows are created by migration 0007 and
 * only ever updated — the code reads them by name, so inventing a
 * key from the dashboard would produce a setting nothing reads.
 */
export const SETTINGS_KEYS = {
  ORGANIZATION: 'organization',
  SOCIAL: 'social',
  HEADER_CTA: 'header_cta',
  FOOTER: 'footer',
  INTEGRATIONS: 'integrations',
  CAPTCHA: 'captcha',
  CONSENT: 'consent',
  FORMS: 'forms',
  /** robots.txt body + sitemap knobs (client notes ٧, ٨). */
  SEO: 'seo',
};

/* ── Two-factor authentication (Dashboard spec §13) ─────────────
   Supabase calls the two assurance levels aal1 (password) and aal2
   (password + a verified factor). `MFA_REQUIRED` is the client half
   of the rule enforced in SQL by `public.has_required_aal()`: a user
   with no factor may reach the enrolment screen and nothing else,
   and once they have one, every write demands aal2.

   It is a constant and not a setting because a dashboard toggle for
   "require 2FA" is a toggle for "stop requiring 2FA", which is not a
   decision this project wants to leave one click away. ─────────── */
export const AAL = {
  PASSWORD: 'aal1',
  MFA: 'aal2',
};

export const MFA_REQUIRED = true;

/** The only admin route reachable before a factor is enrolled. */
export const MFA_SETUP_PATH = '/admin/security';

/** Schema.org type per content type, per Dashboard spec §6. */
export const SCHEMA_TYPES = {
  ARTICLE: 'Article',
  BLOG_POSTING: 'BlogPosting',
  FAQ_PAGE: 'FAQPage',
  BREADCRUMB_LIST: 'BreadcrumbList',
  WEB_PAGE: 'WebPage',
};

/** Redirect status codes, per Dashboard spec §8. 301 is the default
 *  but the field is a real choice — never hardcode it. */
export const REDIRECT_CODES = [
  { value: 301, label: '301 — دائم' },
  { value: 302, label: '302 — مؤقت' },
];

/**
 * FALLBACK dataLayer event names (Dashboard spec §4.1).
 *
 * These are no longer the names that fire. Client note ٣ is explicit:
 * "يجب ألّا يكون اسم الـ Event ثابتًا داخل الكود، بل يتم جلبه من
 * إعدادات لوحة التحكم لكل نموذج بشكل مستقل" — so the live name comes
 * from `integrations.formEvents.<form>` and these are only what the
 * site falls back to when that setting is empty (an unseeded project,
 * or Supabase unconfigured). Keeping them means turning the setting
 * on is a change of NAME, never a change from silence to sound.
 *
 * Either way the push happens ONLY on a confirmed success — never on
 * click, and never before the submission is stored.
 */
export const DATALAYER_EVENTS = {
  [FORM_KINDS.CONTACT]: 'form_submission',
  [FORM_KINDS.NEWSLETTER]: 'newsletter_submission',
};

/** Site language. Arabic-only — multilingual is out of scope (§14). */
export const SITE_LANG = 'ar';
export const SITE_DIR = 'rtl';
