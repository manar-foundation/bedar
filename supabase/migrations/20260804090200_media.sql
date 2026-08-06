-- ================================================================
-- 0003 · MEDIA LIBRARY (Dashboard spec §7)
--
-- One record per uploaded file, so an image is uploaded once and
-- referenced everywhere. Every consumer (page field, article cover,
-- OG image, testimonial photo) points at `media.id` rather than at a
-- URL string — that is what makes "reuse instead of re-upload" real
-- and what lets the library show where a file is used.
--
-- Bytes live in Supabase Storage; this table is the index over them.
-- ================================================================

create table public.media (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null default 'media',
  path         text not null,
  file_name    text not null,
  mime_type    text not null,
  size_bytes   bigint not null default 0,
  width        integer,
  height       integer,

  -- Dashboard spec §7: "Every image requires an alt text field."
  -- The field is mandatory; an empty STRING stays legal because a
  -- decorative image must be able to say so — `alt=""` is the
  -- correct markup for one, and forcing text there would make
  -- screen readers read out filler. The dashboard asks for alt text
  -- on upload and warns on empty; it does not invent it.
  alt_text     text not null default '',

  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles (id) on delete set null,

  constraint media_path_not_blank check (btrim(path) <> ''),
  unique (bucket, path)
);

comment on table public.media is
  'Index over Supabase Storage. Content references media.id, never a raw URL.';

create index media_created_at_idx on public.media (created_at desc);

create trigger media_set_updated_at
  before update on public.media
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────

alter table public.media enable row level security;

-- The bucket is public, so the rows describing it are too. Hiding
-- the index while serving the bytes would be theatre.
create policy "media: public read"
  on public.media for select
  to anon, authenticated
  using (true);

create policy "media: editors write"
  on public.media for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

grant select on public.media to anon, authenticated;
grant insert, update, delete on public.media to authenticated;

-- ── Storage bucket ─────────────────────────────────────────────
--
-- Public: these are marketing images on a public website, and a
-- signed-URL scheme would only add latency and a token in the HTML
-- for content that is already meant to be seen. Nothing private is
-- ever uploaded here — the dashboard has no private-file feature.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'image/gif', 'image/svg+xml', 'application/pdf'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media objects: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "media objects: editors write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.can_edit());

create policy "media objects: editors update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.can_edit())
  with check (bucket_id = 'media' and public.can_edit());

create policy "media objects: editors delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.can_edit());

-- NOTE for Phase 5: deleting a `media` row does not delete the
-- object. Storage removal is an API call, not a foreign key, so the
-- media manager must call `storage.remove()` and only then delete
-- the row — in that order, so a failed delete leaves a visible file
-- rather than an invisible orphan.
