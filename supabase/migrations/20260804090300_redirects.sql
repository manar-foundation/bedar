-- ================================================================
-- 0004 · REDIRECTS MANAGER (Dashboard spec §8)
--
-- A standalone table, not a field on a page: redirects outlive the
-- page that caused them. Retiring a page entirely, or the
-- bedar.webflow.io → bedar.org cutover, both need rows here with no
-- page to hang them off.
--
-- Netlify serves these. The Phase 6 publish pipeline renders the
-- enabled rows into `_redirects` at build time, which is why the
-- shape below is exactly what that file needs and nothing more.
-- ================================================================

create table public.redirects (
  id          uuid primary key default gen_random_uuid(),
  from_path   text not null,
  to_path     text not null,

  -- 301 is the default, deliberately as a DEFAULT and not as a
  -- hardcoded value: Dashboard spec §8 requires the code to be a
  -- real editable field, because a temporary campaign redirect that
  -- gets cached permanently is not recoverable from the client side.
  status_code smallint not null default 301,

  is_enabled  boolean not null default true,
  note        text not null default '',

  -- 'slug-change' rows are written by the trigger that fires when an
  -- editor renames a page or a collection item. Kept distinct from
  -- manual entries so the dashboard can explain where a row it did
  -- not create came from.
  source      text not null default 'manual',

  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null,

  constraint redirects_from_path_shape check (from_path ~ '^/'),
  constraint redirects_to_path_shape   check (to_path ~ '^(/|https?://)'),
  constraint redirects_not_self        check (from_path <> to_path),
  constraint redirects_status_code     check (status_code in (301, 302)),
  constraint redirects_source          check (source in ('manual', 'slug-change')),
  unique (from_path)
);

comment on table public.redirects is
  'Old path → new path. Rendered into Netlify _redirects by the publish pipeline (Phase 6).';

create index redirects_enabled_idx on public.redirects (from_path) where is_enabled;

create trigger redirects_set_updated_at
  before update on public.redirects
  for each row execute function public.set_updated_at();

-- ── Slug-change automation ─────────────────────────────────────
--
-- Called from the pages and collection_items triggers. SECURITY
-- DEFINER because an editor may rename a page without holding
-- write access to the redirects table itself — the redirect is a
-- consequence of their edit, not an edit they are making.
--
-- If the new path already redirects somewhere (A→B, then B renamed
-- to C), the old row is repointed instead of left dangling, so a
-- chain never forms: Netlify resolves one hop and a stale chain is
-- an SEO own-goal.
create or replace function public.record_path_change(old_path text, new_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old_path is null or new_path is null or old_path = new_path then
    return;
  end if;

  -- The new path must not itself be a redirect source — clear that
  -- BEFORE repointing, not after. Otherwise renaming /a to /b while
  -- an old "/b → /a" row exists turns that row into "/b → /b" for
  -- the length of one statement, and the self-redirect check rejects
  -- the whole rename with an error about a table the editor has
  -- never heard of.
  delete from public.redirects where from_path = new_path;

  -- Anything that used to land on old_path now lands on new_path.
  update public.redirects
     set to_path = new_path, updated_at = now()
   where to_path = old_path;

  insert into public.redirects (from_path, to_path, status_code, source, note, created_by)
  values (
    old_path,
    new_path,
    301,
    'slug-change',
    'أُنشئ تلقائياً عند تغيير المسار',
    (select auth.uid())
  )
  on conflict (from_path) do update
    set to_path    = excluded.to_path,
        is_enabled = true,
        updated_at = now();
end;
$$;

-- ── RLS ────────────────────────────────────────────────────────

alter table public.redirects enable row level security;

-- Readable by anyone: the build reads them, and a redirect is public
-- information the moment it is served.
create policy "redirects: public read enabled"
  on public.redirects for select
  to anon, authenticated
  using (is_enabled);

create policy "redirects: staff read all"
  on public.redirects for select
  to authenticated
  using (public.is_editor());

-- Admin-only for manual changes. A wrong redirect takes a live URL
-- off the internet, and unlike a bad paragraph it is invisible to
-- whoever made it. Editors still get redirects for free when they
-- rename something — that path goes through the definer function
-- above, not through these policies.
create policy "redirects: admins write"
  on public.redirects for all
  to authenticated
  using (public.can_administer())
  with check (public.can_administer());

grant select on public.redirects to anon, authenticated;
grant insert, update, delete on public.redirects to authenticated;
