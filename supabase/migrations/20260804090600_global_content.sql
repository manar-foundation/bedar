-- ================================================================
-- 0007 · GLOBAL CONTENT — navbar, footer, settings
--        (Dashboard spec §3.1, §6, §11, §12)
--
-- Navbar and footer are not page content: they are edited in one
-- place and change everywhere (Infrastructure spec §3). Both live in
-- one table because they are the same shape — an ordered tree of
-- labelled links — and the dashboard renders the same editor twice.
-- ================================================================

create table public.navigation_items (
  id         uuid primary key default gen_random_uuid(),
  location   public.nav_location not null,

  -- Stable key mirroring `src/content/site.js` ids, so the seed is
  -- re-runnable and does not duplicate rows on a second pass.
  key        text not null,

  -- Groups nest one level: a header dropdown ("منصة بدار") or a
  -- footer column ("القائمة الرئيسية").
  parent_id  uuid references public.navigation_items (id) on delete cascade,

  label      text not null,

  -- NULL href marks a group. On the live site "منصة بدار" is a
  -- dropdown toggle with no href — a nav item is a group when it has
  -- children, and `Navbar` already branches on that, so the
  -- dashboard can add or remove one with no code change.
  href       text,

  position   integer not null default 0,
  is_visible boolean not null default true,
  opens_in_new_tab boolean not null default false,

  is_group   boolean generated always as (href is null) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,

  constraint navigation_items_not_own_parent check (parent_id is distinct from id),
  unique (location, key)
);

comment on table public.navigation_items is
  'Header and footer navigation. Editable from the dashboard, applied site-wide on save (Dashboard spec §3.1).';

create index navigation_items_render_idx
  on public.navigation_items (location, parent_id, position)
  where is_visible;

create trigger navigation_items_set_updated_at
  before update on public.navigation_items
  for each row execute function public.set_updated_at();

-- Two levels is the whole design. A third would need a menu
-- component that does not exist and a mobile drawer that cannot
-- render it, so it is rejected here rather than discovered later.
create or replace function public.navigation_items_depth_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_id is not null and exists (
    select 1 from public.navigation_items p
    where p.id = new.parent_id and p.parent_id is not null
  ) then
    raise exception 'التنقّل يدعم مستويين فقط' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger navigation_items_depth_guard
  before insert or update of parent_id on public.navigation_items
  for each row execute function public.navigation_items_depth_guard();

-- ── Settings ───────────────────────────────────────────────────
--
-- Key/value rather than one wide row: these are unrelated blobs
-- (organisation schema, integrations, captcha, consent, footer copy)
-- edited by different screens with different permissions, and a
-- single row would mean every save rewrites every setting.

create table public.site_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  description text not null default '',

  -- Readable by anon. The organisation block feeds the site-wide
  -- Organization schema and the captcha SITE key is public by
  -- definition; the captcha SECRET key is not stored here at all —
  -- it belongs in Supabase Vault / the Netlify function env, because
  -- anything in this table with is_public can be read by anyone.
  is_public   boolean not null default true,

  -- Who may edit this row. Footer copy is content; a GTM container
  -- id or a consent configuration is not.
  min_role    public.app_role not null default 'admin',

  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);

comment on table public.site_settings is
  'Global settings blobs. Values are seeded from src/content/site.js and edited from the dashboard.';

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- The registry of known settings. Values stay empty here — the seed
-- script fills them from `src/content/site.js` so the Arabic copy
-- has exactly one source.
insert into public.site_settings (key, description, is_public, min_role) values
  ('organization', 'اسم المنصة والشعار والعنوان وبيانات التواصل — يُدخل مرة واحدة ويُطبق على كامل الموقع (§6)', true,  'admin'),
  ('social',       'روابط حسابات التواصل الاجتماعي', true,  'admin'),
  ('header_cta',   'زر الدعوة لاتخاذ إجراء في الهيدر — نص ورابط منفصلان (§2)', true,  'editor'),
  ('footer',       'نصوص الفوتر: التعريف، النشرة البريدية، الحقوق، حقوق التصميم', true,  'editor'),
  ('integrations', 'معرّف حاوية Google Tag Manager، تحقق Search Console، أكواد الهيدر والفوتر (§11)', true,  'admin'),
  ('captcha',      'مزوّد الحماية من السبام ومفتاح الموقع — المفتاح السري لا يُخزَّن هنا (§4)', true,  'admin'),
  ('consent',      'شريط الموافقة على ملفات تعريف الارتباط وروابط سياسة الخصوصية (§12)', true,  'admin'),
  ('forms',        'وجهات نماذج GoHighLevel ونصوص حالات النجاح والخطأ (§4)', false, 'admin')
on conflict (key) do nothing;

-- ── RLS ────────────────────────────────────────────────────────

alter table public.navigation_items enable row level security;
alter table public.site_settings    enable row level security;

create policy "navigation_items: public read visible"
  on public.navigation_items for select
  to anon, authenticated
  using (is_visible);

create policy "navigation_items: staff read all"
  on public.navigation_items for select
  to authenticated
  using (public.is_editor());

create policy "navigation_items: editors write"
  on public.navigation_items for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy "site_settings: public read"
  on public.site_settings for select
  to anon, authenticated
  using (is_public);

create policy "site_settings: staff read all"
  on public.site_settings for select
  to authenticated
  using (public.is_editor());

-- Row-level permission: an editor may reword the footer, an admin
-- owns anything that changes how the site behaves.
create policy "site_settings: write by row role"
  on public.site_settings for update
  to authenticated
  using (
    public.has_required_aal()
    and case min_role
      when 'editor'::public.app_role then public.is_editor()
      else public.is_admin()
    end
  )
  with check (
    public.has_required_aal()
    and case min_role
      when 'editor'::public.app_role then public.is_editor()
      else public.is_admin()
    end
  );

-- Adding or removing a setting KEY is a schema change disguised as
-- data — the code reads these keys by name — so it goes through a
-- migration, not through the dashboard.
create policy "site_settings: admins insert"
  on public.site_settings for insert
  to authenticated
  with check (public.can_administer());

create policy "site_settings: admins delete"
  on public.site_settings for delete
  to authenticated
  using (public.can_administer());

grant select on public.navigation_items, public.site_settings to anon, authenticated;
grant insert, update, delete on public.navigation_items to authenticated;
grant insert, update, delete on public.site_settings to authenticated;
