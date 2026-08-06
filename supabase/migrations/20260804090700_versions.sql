-- ================================================================
-- 0008 · VERSION HISTORY (Dashboard spec §10)
--
-- "Version history on content edits, separate from the code-level
-- Git history." This is that: an append-only row per saved change,
-- captured by trigger rather than by the dashboard remembering to
-- write one. A history that depends on the client writing it is a
-- history with holes in it.
--
-- Snapshots are whole-row jsonb, not diffs. Restoring a version has
-- to work years later, after columns have been added, and a diff
-- chain that has to be replayed through schema changes does not.
-- ================================================================

create table public.content_versions (
  id           uuid primary key default gen_random_uuid(),

  -- Table name of the versioned row. Text and not an enum: adding a
  -- versioned table should not require an enum migration.
  entity_type  text not null,

  -- Text, not uuid — `site_settings` is keyed by name.
  entity_id    text not null,

  -- Denormalised for the history screen, which must still be able to
  -- name a deleted item.
  entity_label text not null default '',

  version      integer not null,
  action       text not null,
  snapshot     jsonb not null,

  created_at   timestamptz not null default now(),
  created_by   uuid references public.profiles (id) on delete set null,

  -- Also denormalised, and for the same reason: an author who leaves
  -- the team should not erase who made a change.
  created_by_email text not null default '',

  note         text not null default '',

  constraint content_versions_action check (action in ('insert', 'update', 'delete')),
  unique (entity_type, entity_id, version)
);

comment on table public.content_versions is
  'Append-only content history, written by trigger (Dashboard spec §10). Not the Git history — that covers code.';

create index content_versions_entity_idx
  on public.content_versions (entity_type, entity_id, version desc);
create index content_versions_recent_idx
  on public.content_versions (created_at desc);

-- ── The trigger ────────────────────────────────────────────────

create or replace function public.record_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  snap      jsonb;
  act       text;
  ent_id    text;
  label     text;
  next_no   integer;
  attempt   integer;
  actor     uuid := (select auth.uid());
  actor_mail text := '';
begin
  if tg_op = 'DELETE' then
    snap := to_jsonb(old);
    act  := 'delete';
  else
    snap := to_jsonb(new);
    act  := lower(tg_op);
  end if;

  -- A save that changed nothing is not a version. Bookkeeping
  -- columns are excluded from the comparison, otherwise every
  -- touch would look like an edit.
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'updated_at' - 'updated_by')
       = (to_jsonb(old) - 'updated_at' - 'updated_by') then
    return null;
  end if;

  ent_id := coalesce(snap ->> 'id', snap ->> 'key');
  if ent_id is null then
    return null;
  end if;

  label := coalesce(
    nullif(snap ->> 'title', ''),
    nullif(snap ->> 'question', ''),
    nullif(snap ->> 'person_name', ''),
    nullif(snap ->> 'label', ''),
    nullif(snap ->> 'key', ''),
    ''
  );

  if actor is not null then
    select p.email into actor_mail from public.profiles p where p.id = actor;
  end if;

  -- `max(version) + 1` is a read-then-write, so two editors saving
  -- different rows of the same page at the same moment can pick the
  -- same number. The unique constraint catches that; retrying is
  -- what makes it a non-event instead of a failed save. Three
  -- attempts is generous for a two-person editorial team.
  for attempt in 1..3 loop
    begin
      select coalesce(max(v.version), 0) + 1 into next_no
      from public.content_versions v
      where v.entity_type = tg_table_name and v.entity_id = ent_id;

      insert into public.content_versions (
        entity_type, entity_id, entity_label, version, action, snapshot,
        created_by, created_by_email
      )
      values (
        tg_table_name, ent_id, label, next_no, act, snap,
        actor, coalesce(actor_mail, '')
      );

      return null;
    exception
      when unique_violation then
        -- Someone took that number between the select and the
        -- insert. Loop and read it again.
        null;
    end;
  end loop;

  return null;
end;
$$;

create trigger pages_record_version
  after insert or update or delete on public.pages
  for each row execute function public.record_version();

create trigger page_fields_record_version
  after insert or update or delete on public.page_fields
  for each row execute function public.record_version();

create trigger collection_items_record_version
  after insert or update or delete on public.collection_items
  for each row execute function public.record_version();

create trigger testimonials_record_version
  after insert or update or delete on public.testimonials
  for each row execute function public.record_version();

create trigger faq_items_record_version
  after insert or update or delete on public.faq_items
  for each row execute function public.record_version();

create trigger navigation_items_record_version
  after insert or update or delete on public.navigation_items
  for each row execute function public.record_version();

create trigger site_settings_record_version
  after insert or update or delete on public.site_settings
  for each row execute function public.record_version();

-- ── Retention ──────────────────────────────────────────────────
--
-- Unbounded history on a table that also stores article bodies grows
-- without limit for no editorial benefit — nobody restores the 300th
-- previous version of the homepage hero. Called manually from the
-- dashboard, or from a scheduled job once pg_cron is enabled.

create or replace function public.prune_content_versions(keep integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  if not public.can_administer() and (select auth.uid()) is not null then
    raise exception 'غير مصرّح' using errcode = '42501';
  end if;

  with ranked as (
    select id, row_number() over (
      partition by entity_type, entity_id order by version desc
    ) as rn
    from public.content_versions
  )
  delete from public.content_versions v
  using ranked r
  where v.id = r.id and r.rn > keep;

  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- ── RLS ────────────────────────────────────────────────────────

alter table public.content_versions enable row level security;

create policy "content_versions: staff read"
  on public.content_versions for select
  to authenticated
  using (public.is_editor());

create policy "content_versions: admins delete"
  on public.content_versions for delete
  to authenticated
  using (public.can_administer());

-- No INSERT or UPDATE policy anywhere. History is written by the
-- trigger (SECURITY DEFINER, so it bypasses RLS) and is not editable
-- afterwards by anyone holding an anon key — a rewritable audit log
-- is not an audit log.

grant select on public.content_versions to authenticated;
grant delete on public.content_versions to authenticated;
grant execute on function public.prune_content_versions(integer) to authenticated;

-- Phase 5 note: "restore this version" is an UPDATE on the source
-- table built from `snapshot`, performed by the dashboard, which
-- then records a new version like any other edit. Restoring must
-- never rewrite history — it appends to it.
