-- ================================================================
-- 0006 · CONTENT COLLECTIONS (Dashboard spec §3.2)
--
--   collection_items → articles, news, programs (article-shaped)
--   testimonials     → quote, name, title/organisation, photo
--   faq_items        → question / answer, reorderable
--
-- Articles, news and programs share every column, so they share a
-- table with a discriminator. Testimonials and FAQ do not — putting
-- them in the same table would mean a dozen always-null columns and
-- no constraint that means anything.
-- ================================================================

create table public.collection_items (
  id          uuid primary key default gen_random_uuid(),
  collection  public.content_collection not null,
  slug        text not null,

  -- The public URL. Derived from the collection when left empty,
  -- but stored and editable because the migrated site is not
  -- self-consistent: two of the three programs live under
  -- /program/:slug and one under /programs/:slug. Both shapes are
  -- routed, and rewriting them would 404 inbound links that the
  -- client does not control.
  path        text not null default '',

  title       text not null,
  excerpt     text not null default '',

  -- Block array — [{"type":"p","text":…}] — not an HTML string.
  -- Same reason as page_fields.richtext: `RichText` renders these as
  -- real React elements, so an editor account cannot inject script.
  body        jsonb not null default '[]'::jsonb,

  cover_media_id uuid references public.media (id) on delete set null,
  cover_alt      text not null default '',

  author      text not null default '',
  category    text not null default '',
  tags        text[] not null default '{}',

  -- Programs only: which tab on /programs the item belongs to.
  -- Nullable because it is meaningless for an article.
  program_status text,

  -- Spec §3.2: marking an article featured un-marks the previous
  -- one. Enforced by trigger below, not by asking the dashboard to
  -- remember — two editors clicking at once would otherwise leave
  -- two featured articles and a non-deterministic homepage.
  is_featured boolean not null default false,

  state        public.publish_state not null default 'draft',
  published_at timestamptz,

  seo_title       text not null default '',
  seo_description text not null default '',
  canonical_url   text not null default '',
  og_image_id     uuid references public.media (id) on delete set null,
  is_hidden_from_search boolean not null default false,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,

  constraint collection_items_slug_shape check (slug <> '' and slug !~ '[[:space:]/]'),
  constraint collection_items_body_is_array check (jsonb_typeof(body) = 'array'),
  constraint collection_items_program_status check (
    program_status is null or program_status in ('past', 'current', 'upcoming')
  ),
  unique (collection, slug)
);

comment on table public.collection_items is
  'Articles, news and programs. Publishing one is what makes it appear on the homepage and in the footer with no code change (Infrastructure spec §3).';

create unique index collection_items_path_key on public.collection_items (path);
create index collection_items_listing_idx
  on public.collection_items (collection, published_at desc)
  where state = 'published';

-- Exactly one featured item per collection, at the database level.
create unique index collection_items_one_featured
  on public.collection_items (collection)
  where is_featured;

-- ── Path + publish stamping ────────────────────────────────────

create or replace function public.collection_items_apply_path()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if btrim(coalesce(new.path, '')) = '' then
    new.path := case new.collection
      when 'articles' then '/blog/'
      when 'news'     then '/news/'
      else '/programs/'
    end || new.slug;
  end if;

  if new.state = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger collection_items_apply_path
  before insert or update of slug, path, collection, state on public.collection_items
  for each row execute function public.collection_items_apply_path();

create or replace function public.collection_items_after_path_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_path_change(old.path, new.path);
  return null;
end;
$$;

create trigger collection_items_after_path_change
  after update on public.collection_items
  for each row
  when (old.path is distinct from new.path and old.path <> '')
  execute function public.collection_items_after_path_change();

-- ── Featured exclusivity ───────────────────────────────────────
--
-- The unique index above makes two featured items impossible; this
-- trigger makes the dashboard's intended behaviour possible, by
-- clearing the previous one BEFORE the index is checked. Without it
-- an editor would get a constraint violation instead of a swap.

create or replace function public.collection_items_single_featured()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_featured then
    update public.collection_items
       set is_featured = false
     where collection = new.collection
       and id <> new.id
       and is_featured;
  end if;
  return new;
end;
$$;

create trigger collection_items_single_featured
  before insert or update of is_featured on public.collection_items
  for each row
  when (new.is_featured)
  execute function public.collection_items_single_featured();

create trigger collection_items_set_updated_at
  before update on public.collection_items
  for each row execute function public.set_updated_at();

-- ── Testimonials ───────────────────────────────────────────────

create table public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  quote         text not null,
  person_name   text not null,
  person_title  text not null default '',
  photo_media_id uuid references public.media (id) on delete set null,
  photo_alt     text not null default '',
  position      integer not null default 0,
  state         public.publish_state not null default 'published',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.profiles (id) on delete set null
);

comment on table public.testimonials is
  'Dashboard spec §3.2 — quote, name, title/organisation, photo.';

create index testimonials_order_idx on public.testimonials (position);

create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ── FAQ ────────────────────────────────────────────────────────

create table public.faq_items (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,

  -- Reorderable (spec §3.2). Plain integers with gaps, reassigned on
  -- drag — a linked list or fractional index buys nothing at the
  -- couple of dozen rows this will ever hold.
  position   integer not null default 0,

  state      public.publish_state not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

comment on table public.faq_items is
  'Dashboard spec §3.2. Also the source of the FAQPage schema (spec §6) on any page with renders_faq = true.';

create index faq_items_order_idx on public.faq_items (position);

create trigger faq_items_set_updated_at
  before update on public.faq_items
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────

alter table public.collection_items enable row level security;
alter table public.testimonials     enable row level security;
alter table public.faq_items        enable row level security;

create policy "collection_items: public read published"
  on public.collection_items for select
  to anon, authenticated
  using (state = 'published');

create policy "collection_items: staff read all"
  on public.collection_items for select
  to authenticated
  using (public.is_editor());

create policy "collection_items: editors write"
  on public.collection_items for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy "testimonials: public read published"
  on public.testimonials for select
  to anon, authenticated
  using (state = 'published');

create policy "testimonials: staff read all"
  on public.testimonials for select
  to authenticated
  using (public.is_editor());

create policy "testimonials: editors write"
  on public.testimonials for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy "faq_items: public read published"
  on public.faq_items for select
  to anon, authenticated
  using (state = 'published');

create policy "faq_items: staff read all"
  on public.faq_items for select
  to authenticated
  using (public.is_editor());

create policy "faq_items: editors write"
  on public.faq_items for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

grant select on public.collection_items, public.testimonials, public.faq_items
  to anon, authenticated;
grant insert, update, delete on public.collection_items, public.testimonials, public.faq_items
  to authenticated;
