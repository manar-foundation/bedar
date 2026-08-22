-- ================================================================
-- 0012 · SEO SETTINGS (client notes §6, §7, §8)
--
-- Three requirements land on `site_settings`, and none of them needs
-- a new table — they need one new KEY and one changed flag:
--
--   §6  the Organization schema must be generated FROM dashboard
--       values rather than from constants in the code. The
--       `organization` row already exists and already holds five of
--       those fields; what it lacked was somewhere to put the rest
--       (address, telephone, description, founding date, the schema
--       type itself). It is a jsonb blob, so that is a seed change,
--       not a schema change — see `src/content/site.js`.
--
--   §7  `robots.txt` must be editable from the dashboard and served
--       at /robots.txt.
--
--   §8  a sitemap at /sitemap.xml, generated from published content
--       and honouring each page's "exclude from sitemap" switch.
--
-- §7 and §8 are one concern — "what we tell crawlers" — so they get
-- one row: `seo`. It is PUBLIC because `api/robots.js` and
-- `api/sitemap.js` read it over PostgREST with the anon key, and
-- because robots.txt is by definition a document served to anyone
-- who asks for it.
--
-- Adding a settings KEY is a migration and not a dashboard action —
-- the code reads these keys by name (see the note at the foot of
-- migration 0007), which is why this file exists at all.
-- ================================================================

insert into public.site_settings (key, description, is_public, min_role) values
  (
    'seo',
    'إعدادات SEO العامة: محتوى ملف robots.txt وخيارات خريطة الموقع sitemap.xml (§7، §8)',
    true,
    'admin'
  )
on conflict (key) do nothing;

-- The default is a working robots.txt, not an empty box: an
-- unconfigured site must still answer /robots.txt with something
-- correct, and an administrator opening the field should see the
-- current rules rather than have to invent them. `%SITE_URL%` is
-- expanded by `api/robots.js` at request time so the Sitemap line is
-- right on every environment without being edited per deploy.
update public.site_settings
   set value = jsonb_build_object(
         'robotsTxt', E'User-agent: *\nAllow: /\n\nSitemap: %SITE_URL%/sitemap.xml\n',
         'sitemapEnabled', true,
         -- Paths the sitemap must never list even when a page row
         -- says published. The dashboard's own routes are the obvious
         -- case; `is_hidden_from_search` covers everything editorial.
         'sitemapExcludePaths', jsonb_build_array('/admin')
       )
 where key = 'seo'
   and value = '{}'::jsonb;

comment on column public.site_settings.is_public is
  'Readable by anon. The organisation block feeds the Organization schema, the captcha SITE key is public by definition, and the `seo` row is read by the robots.txt / sitemap.xml endpoints. Secrets are never stored in this table.';

-- ── One correction to `organization` ───────────────────────────
-- The original seed wrote `/src/assets/bedar-logo.svg` into
-- `organization.logo` — a Vite dev-server path for a file in the
-- source tree, which does not exist on a built site. It never
-- mattered while nothing read the value; now that §6's Organization
-- schema does, it would publish a 404 as the organisation's logo.
--
-- Cleared rather than repointed: the fingerprinted asset URL changes
-- on every build, so it cannot be stored. An empty value makes
-- `utils/schema.js` fall back to the bundled mark, and an
-- administrator can still paste a real uploaded URL over it.
update public.site_settings
   set value = jsonb_set(value, '{logo}', '""'::jsonb)
 where key = 'organization'
   and value->>'logo' like '/src/%';
