-- ================================================================
-- 0010 · SERVICES — the seven things Bedar offers
--
-- WHY A TABLE AND NOT PAGE FIELDS
-- ----------------------------------------------------------------
-- The services started life as a static array in
-- `src/content/pages.js`, imported directly by two pages. That made
-- them the one piece of repeated, card-shaped content on the site
-- that an editor could not touch — every other list (articles,
-- programs, testimonials, FAQ) is already a collection.
--
-- They are not page content either. `page_fields` holds one row per
-- dotted key belonging to ONE page, and the services are rendered by
-- two: the homepage band and /services. Flattening them into
-- `services.items` under the services page would put the homepage's
-- copy inside another page's record, and would hand the editor a raw
-- JSON list editor instead of a form per service — with no publish
-- state, no ordering and nowhere to attach an image.
--
-- So: a small ordered collection of its own, shaped like
-- `testimonials` (migration 0006), which is the closest existing
-- thing — a short record, ordered by hand, with an optional image.
--
-- IMAGES ARE OPTIONAL BY DESIGN. Each service ships with a bundled,
-- teal-graded photograph and a line icon, keyed by `key`. A row with
-- no `image_media_id` renders those; uploading one overrides it.
-- That is what lets this table be introduced without re-uploading
-- seven photographs before the site looks right again.
-- ================================================================

create table public.services (
  id          uuid primary key default gen_random_uuid(),

  -- Stable identifier mirroring the ids in `src/content/pages.js`.
  -- It is what the bundled photo and icon are keyed by, so it is not
  -- cosmetic: renaming it drops a service back to its placeholder
  -- artwork. The dashboard shows it read-only for that reason.
  key         text not null unique,

  title       text not null,
  description text not null default '',

  -- Name of the line icon drawn on the homepage card, from the
  -- allowlist in `src/content/serviceIcons.js`. Text and not an enum:
  -- the set is a front-end concern that changes with the icon
  -- library, and a CHECK here would mean a migration every time a
  -- designer picks a different mark. An unknown name falls back to
  -- the `key` mapping, so a stale value can never break a render.
  icon        text not null default '',

  -- The editorial photograph on /services. NULL = use the bundled
  -- one for this `key`.
  image_media_id uuid references public.media (id) on delete set null,
  image_alt   text not null default '',

  -- Render order, on both pages. Plain integers reassigned from 0 on
  -- each reorder — same approach as `testimonials`, and the same
  -- reasoning: seven rows do not need a fractional index.
  position    integer not null default 0,

  state       public.publish_state not null default 'published',

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null,

  constraint services_key_format check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.services is
  'The services rendered on the homepage band and on /services. Ordered, publishable, editable from the dashboard (Dashboard spec §3.2).';

create index services_order_idx on public.services (position);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- History, like every other editable table. `record_version` reads
-- the label out of the snapshot's `title`, which this table has.
create trigger services_record_version
  after insert or update or delete on public.services
  for each row execute function public.record_version();

-- ── RLS ────────────────────────────────────────────────────────
--
-- `can_edit()` and not `is_editor()`: the composed check is the one
-- that also demands the second factor (spec §13).

alter table public.services enable row level security;

create policy "services: public read published"
  on public.services for select
  to anon, authenticated
  using (state = 'published');

create policy "services: staff read all"
  on public.services for select
  to authenticated
  using (public.is_editor());

create policy "services: editors write"
  on public.services for all
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;

-- ── Realtime ───────────────────────────────────────────────────
--
-- Same publication the other public-facing tables joined in
-- migration 0009, so a save reaches a visitor on another device
-- without waiting for their next revalidation. Guarded because
-- `add table` errors on a table that is already a member.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'services'
  ) then
    execute 'alter publication supabase_realtime add table public.services';
  end if;
end
$$;
