-- ================================================================
-- REALTIME — publish public-facing row changes to subscribers.
--
-- The public site holds a copy of the published content in
-- `ContentContext`. A dashboard save is announced inside the editor's
-- own browser by `contentSync` (BroadcastChannel), but a visitor on
-- another device has no way to hear about it — they would wait for
-- their next focus/visibility revalidation or the polling fallback.
--
-- Adding these tables to the `supabase_realtime` publication makes
-- Supabase Realtime push the change instead, and `services/realtime.js`
-- turns it back into the same refetch a local save triggers.
--
-- SAFETY
-- ----------------------------------------------------------------
-- A publication does NOT bypass RLS. Realtime re-evaluates the
-- subscriber's policies per row, so `anon` is told about a row only
-- if `… public read published` would have let it read that row. An
-- unpublished draft never reaches a visitor's socket.
--
-- `replica identity` stays DEFAULT (primary key). The payload then
-- carries the new row and only the key columns of the old one, which
-- is all `realtime.js` uses — it reads `payload.data.table` and
-- refetches. FULL would put every column of every draft revision on
-- the wire for no gain.
-- ================================================================

-- `supabase_realtime` is created by the platform, but a local
-- `supabase db reset` starts without it — create it if missing so
-- this migration is runnable on a fresh database.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime with (publish = 'insert, update, delete');
  end if;
end
$$;

-- Idempotent: `add table` errors if the table is already a member,
-- so each one is guarded. Re-running the migration is a no-op.
do $$
declare
  target text;
begin
  foreach target in array array[
    'collection_items',   -- articles / news / programs
    'testimonials',
    'faq_items',
    'pages',
    'page_fields',        -- the per-section content the editor writes
    'navigation_items',   -- header menu + footer columns
    'site_settings',
    'media'               -- alt-text edits; covers are embedded in the reads
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end
$$;
