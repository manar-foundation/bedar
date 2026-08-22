-- ================================================================
-- 0012 · SEO SETTINGS — robots.txt, sitemap and the Organization
--        schema, all owned by the dashboard.
--        (Client notes ٦ ٧ ٨, Aug 2026)
--
-- Three requirements land in one row because they are one screen:
--
--   ٦  the Organization schema must be GENERATED FROM THE SAVED
--      VALUES, not from constants in the bundle. The values already
--      live in the `organization` row — what was missing is anything
--      that reads them and emits `<script type="application/ld+json">`
--      (`components/layout/SiteHead.jsx` now does), and the fields
--      schema.org actually wants: a description, a phone, an address,
--      a founding date. Those are new keys inside the existing jsonb
--      blob, so they need no column and no migration — but the
--      DEFAULTS do, or an unseeded project renders an empty schema.
--
--   ٧  robots.txt must be a text field in the dashboard, served at
--      /robots.txt. `api/robots.js` reads this row.
--
--   ٨  sitemap.xml must be generated from published content, minus
--      anything flagged `is_hidden_from_search`. `api/sitemap.js`
--      reads the tables directly; what lives here is the handful of
--      knobs an editor is allowed over it (change frequency hints,
--      whether the sitemap is announced in robots.txt).
--
-- WHY A NEW KEY AND NOT MORE FIELDS ON `organization`
-- ----------------------------------------------------------------
-- `organization` is the schema.org record: name, logo, contact. A
-- robots.txt body is not part of the organisation, and the two are
-- edited on the same screen but saved independently — one row per
-- concern is the pattern this table already uses (migration 0007),
-- and it means editing robots.txt does not rewrite the schema.
-- ================================================================

insert into public.site_settings (key, value, description, is_public, min_role) values
  (
    'seo',
    jsonb_build_object(
      -- The literal body served at /robots.txt. Empty means "serve
      -- the built-in default", which is the permissive one below —
      -- an empty robots.txt is legal but reads as a mistake, and a
      -- MISSING one is safer than a blank one an editor cleared by
      -- accident.
      'robotsTxt', E'User-agent: *\nAllow: /\n',
      -- Append `Sitemap: <site>/sitemap.xml` to whatever the field
      -- holds. Kept separate from the text so an editor rewriting
      -- their rules cannot silently drop the sitemap line.
      'robotsIncludeSitemap', true,
      -- Hints written into every <url> entry. Advisory to crawlers,
      -- but Search Console reports them, so they are editable.
      'sitemapChangefreq', 'weekly',
      'sitemapPriority', '0.7'
    ),
    'محتوى ملف robots.txt وإعدادات خريطة الموقع sitemap.xml (ملاحظات العميل ٧ و ٨)',
    true,
    'admin'
  )
on conflict (key) do nothing;

-- ── Defaults for the schema fields added in note ٦ ─────────────
--
-- `||` merges right over left, so this fills the keys that are
-- missing and leaves anything already entered in the dashboard
-- exactly as it is. Re-runnable, like every other statement here.
update public.site_settings
   set value = jsonb_build_object(
         'name',          '',
         'legalName',     '',
         'alternateName', '',
         'url',           '',
         'logo',          '',
         'email',         '',
         'description',   '',
         'telephone',     '',
         'foundingDate',  '',
         'addressLocality', '',
         'addressRegion',   '',
         'addressCountry',  '',
         'streetAddress',   '',
         'postalCode',      ''
       ) || value
 where key = 'organization';

-- ── Per-form analytics events (note ٣) ─────────────────────────
--
-- The event name fired after a SUCCESSFUL submission, one per form.
-- It lives in `integrations` and not in `forms` for one reason: the
-- browser has to read it to fire it, and `forms` is the single row
-- seeded with `is_public = false` (migration 0007), so RLS withholds
-- it from anon. `integrations` is already the public "how the site
-- reports itself" blob — GTM container, Search Console — and this is
-- the same kind of value.
--
-- The names below are the previous HARDCODED constants
-- (`DATALAYER_EVENTS` in utils/constants.js), seeded here so the
-- behaviour is unchanged on day one and then editable. The client's
-- requirement is that the name must not be fixed in the code, which
-- is exactly what moving it here achieves.
update public.site_settings
   set value = jsonb_build_object(
         'gtmContainerId',            '',
         'searchConsoleVerification', '',
         'headCode',                  '',
         'footerCode',                '',
         'formEvents', jsonb_build_object(
           'contact',    'form_submission',
           'newsletter', 'newsletter_submission'
         )
       ) || value
 where key = 'integrations';

-- An `integrations` row that predates this migration has no
-- `formEvents` key at all; the merge above only fills TOP-LEVEL keys,
-- so a row that already carried the other four would keep missing it.
update public.site_settings
   set value = value || jsonb_build_object(
         'formEvents', jsonb_build_object(
           'contact',    'form_submission',
           'newsletter', 'newsletter_submission'
         )
       )
 where key = 'integrations'
   and not (value ? 'formEvents');

-- ── Captcha (note ٤) ───────────────────────────────────────────
--
-- The site key is public by definition and belongs here; the SECRET
-- key does not and never will — this row is `is_public`, so anything
-- in it is readable by every visitor. The secret lives in the Vercel
-- environment next to `lib/captcha.js`, which is the only code that
-- verifies a token.
--
-- `version` exists because a reCAPTCHA site key does not say which
-- product it belongs to: v2 renders a checkbox the visitor clicks,
-- v3 runs invisibly and returns a score. Guessing wrong produces a
-- form that cannot be submitted at all, so it is a setting.
update public.site_settings
   set value = jsonb_build_object(
         'provider',  '',
         'siteKey',   '',
         'version',   'v2',
         'minScore',  '0.5'
       ) || value
 where key = 'captcha';
