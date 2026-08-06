-- ================================================================
-- 0005 · PAGES (Dashboard spec §2, §5, §6)
--
-- A page's LAYOUT is code and stays code — the visual page builder
-- is explicitly out of scope for v1 (spec §14). What lives here is
-- the content inside that layout, plus its URL, SEO and publish
-- state.
--
-- Two tables and not one: a page has a fixed set of attributes
-- (slug, SEO, state) and a developer-defined set of content fields
-- that differs per page. Columns for the first, rows for the second.
-- ================================================================

create table public.pages (
  id          uuid primary key default gen_random_uuid(),

  -- Stable identifier the code uses to find its own page row
  -- ('home', 'about', 'services'). Never changes; unlike `slug`, it
  -- is not user-facing and renaming it would orphan a component.
  key         text not null unique,

  title       text not null,

  -- Editable, per spec §2. Renaming writes a 301 automatically —
  -- see the trigger below.
  slug        text not null,

  -- Optional parent folder / subpage grouping (spec §2). Drives both
  -- the URL and the BreadcrumbList schema (spec §6).
  parent_id   uuid references public.pages (id) on delete restrict,

  -- Maintained by trigger from parent + slug. Stored rather than
  -- computed on read because it is the join key for redirects and
  -- for the sitemap, and because a recursive CTE on every page load
  -- to answer "what is this page's URL" is a strange thing to pay
  -- for on a site with a dozen pages.
  path        text not null default '',

  position    integer not null default 0,

  -- SEO (spec §5). `og_image_id` points at the media library rather
  -- than holding a URL, so a re-uploaded image updates everywhere.
  seo_title        text not null default '',
  seo_description  text not null default '',
  canonical_url    text not null default '',
  og_image_id      uuid references public.media (id) on delete set null,

  -- Spec §2: ONE switch that both adds noindex and drops the page
  -- from the sitemap. Two switches is how a page ends up noindexed
  -- but still submitted for crawling.
  is_hidden_from_search boolean not null default false,

  -- Spec §6: per-page schema is auto-generated, never hand-written.
  -- The generated column below is the whole implementation for
  -- pages; article-type schema comes from collection_items, which
  -- knows its own type.
  renders_faq boolean not null default false,
  schema_type text generated always as (
    case
      when renders_faq then 'FAQPage'
      when parent_id is not null then 'BreadcrumbList'
      else 'WebPage'
    end
  ) stored,

  state        public.publish_state not null default 'draft',
  published_at timestamptz,

  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null,

  -- Empty slug is legal for exactly one page: the root. Everything
  -- else must be a single segment — no slashes (that is what
  -- `parent_id` is for) and no whitespace.
  constraint pages_slug_shape check (slug !~ '[[:space:]/]'),
  constraint pages_not_own_parent check (parent_id is distinct from id),
  unique (parent_id, slug)
);

comment on table public.pages is
  'One row per page built in code. Content-only editing: structure is not editable (Dashboard spec §14).';
comment on column public.pages.is_hidden_from_search is
  'Single switch — adds noindex AND removes the page from sitemap.xml (Dashboard spec §2).';

create unique index pages_path_key on public.pages (path);
create index pages_state_idx on public.pages (state);

-- ── URL maintenance ────────────────────────────────────────────

create or replace function public.pages_apply_path()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_path text := '';
  ancestor    uuid;
  hops        integer := 0;
begin
  if new.parent_id is not null then
    -- Cycle guard. `parent_id` is a self reference, so nothing in
    -- the FK stops A→B→A, and that turns the path walk below into
    -- an infinite loop rather than a bad URL.
    ancestor := new.parent_id;
    while ancestor is not null loop
      if ancestor = new.id then
        raise exception 'لا يمكن جعل الصفحة تابعة لنفسها' using errcode = '23514';
      end if;
      hops := hops + 1;
      if hops > 32 then
        raise exception 'تسلسل الصفحات عميق أكثر من اللازم' using errcode = '23514';
      end if;
      select p.parent_id into ancestor from public.pages p where p.id = ancestor;
    end loop;

    select p.path into parent_path from public.pages p where p.id = new.parent_id;
  end if;

  new.path := case
    when new.slug = '' then coalesce(nullif(parent_path, ''), '/')
    else rtrim(coalesce(parent_path, ''), '/') || '/' || new.slug
  end;

  -- Publish stamp: first transition into `published` records when.
  if new.state = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger pages_apply_path
  before insert or update of slug, parent_id, state on public.pages
  for each row execute function public.pages_apply_path();

create or replace function public.pages_after_path_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_path_change(old.path, new.path);

  -- Children inherit the parent's path, so they have to be rewritten
  -- too — and each of them writes its own redirect. The no-op update
  -- re-fires `pages_apply_path` on the child; it terminates because
  -- this trigger only fires when the path actually changed.
  update public.pages
     set slug = slug
   where parent_id = new.id;

  return null;
end;
$$;

create trigger pages_after_path_change
  after update on public.pages
  for each row
  when (old.path is distinct from new.path and old.path <> '')
  execute function public.pages_after_path_change();

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- ── Page content fields ────────────────────────────────────────

create table public.page_fields (
  id        uuid primary key default gen_random_uuid(),
  page_id   uuid not null references public.pages (id) on delete cascade,

  -- Developer-defined key the component reads ('hero.title').
  key       text not null,
  label     text not null default '',
  help      text not null default '',

  -- 'cta' holds {"label": …, "href": …} — spec §2 wants the button
  -- text and the button link as separate fields, not one blob of
  -- markup with a link inside it.
  -- 'richtext' holds the block array that `RichText` renders:
  -- [{"type":"p","text":…}]. Never an HTML string — dashboard
  -- authored HTML through dangerouslySetInnerHTML would make every
  -- editor account an XSS vector.
  type      text not null default 'text',
  value     jsonb not null default '""'::jsonb,

  -- Image fields point at the library through a real foreign key, so
  -- "where is this image used" is a query and not a jsonb scan.
  media_id  uuid references public.media (id) on delete set null,
  alt_text  text not null default '',

  position  integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,

  constraint page_fields_type check (
    type in ('text', 'richtext', 'image', 'cta', 'list', 'url', 'number', 'boolean')
  ),
  unique (page_id, key)
);

comment on table public.page_fields is
  'Per-page editable content. The set of fields is defined by the developer per page (Dashboard spec §2).';

create index page_fields_page_idx on public.page_fields (page_id, position);

create trigger page_fields_set_updated_at
  before update on public.page_fields
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────

alter table public.pages enable row level security;
alter table public.page_fields enable row level security;

create policy "pages: public read published"
  on public.pages for select
  to anon, authenticated
  using (state = 'published');

create policy "pages: staff read all"
  on public.pages for select
  to authenticated
  using (public.is_editor());

create policy "pages: editors write"
  on public.pages for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy "page_fields: public read published"
  on public.page_fields for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_fields.page_id and p.state = 'published'
    )
  );

create policy "page_fields: staff read all"
  on public.page_fields for select
  to authenticated
  using (public.is_editor());

create policy "page_fields: editors write"
  on public.page_fields for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

grant select on public.pages, public.page_fields to anon, authenticated;
grant insert, update, delete on public.pages, public.page_fields to authenticated;
