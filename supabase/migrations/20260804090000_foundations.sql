-- ================================================================
-- 0001 · FOUNDATIONS — enums, shared triggers, authorisation helpers
--
-- Everything later migrations depend on. Nothing here holds content.
--
-- AUTHORISATION MODEL (Dashboard spec §9, §13)
-- ----------------------------------------------------------------
--   anon           → reads published content only
--   editor         → reads everything, writes content
--   admin          → editor + users, settings, integrations, redirects
--
-- Two rules are enforced in the database rather than in the client,
-- because the client is a UX guard and nothing more:
--
--   1. The role is read from `public.profiles`, never from a claim
--      the browser can set.
--   2. A user who has enrolled a second factor must present it. The
--      session's `aal` claim is checked in every write policy, so a
--      stolen aal1 session cannot edit the site even though it can
--      open the dashboard shell.
--
-- The helpers are SECURITY DEFINER on purpose: `is_admin()` reads
-- `profiles`, and `profiles` has RLS policies that call `is_admin()`.
-- Without SECURITY DEFINER that is infinite recursion. `search_path`
-- is pinned to '' so every reference inside them must be schema
-- qualified — an unqualified name in a definer function is how
-- search_path hijacking works.
-- ================================================================

-- ── Enums ──────────────────────────────────────────────────────
-- Values are duplicated in `src/utils/constants.js`. Changing one
-- without the other is the most likely way to break this schema.

create type public.app_role as enum ('admin', 'editor');

-- Dashboard spec §2 and §10. `unpublished` is distinct from `draft`:
-- it is a page that WAS live and was pulled, which matters for the
-- redirects manager and for the sitemap.
create type public.publish_state as enum ('draft', 'published', 'unpublished');

-- Article-shaped collections. Testimonials and FAQ have their own
-- tables — a quote with a photo and a question/answer pair share
-- almost no columns with an article, and forcing them into one table
-- would mean a dozen nullable columns and no usable constraints.
create type public.content_collection as enum ('articles', 'news', 'programs');

create type public.nav_location as enum ('header', 'footer');

-- ── updated_at ─────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  -- `auth.uid()` is null for service-role writes (the seed script,
  -- the Phase 6 publish function). Keep the previous value then,
  -- rather than blanking out who last touched the row.
  -- `jsonb_exists(...)` rather than the `?` operator: `?` is a bind
  -- placeholder in several Postgres drivers and breaks when this file
  -- is applied through one of them.
  if jsonb_exists(to_jsonb(new), 'updated_by') then
    new.updated_by = coalesce(auth.uid(), old.updated_by);
  end if;
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at and updated_by on any table that has those columns.';

-- ── Authorisation helpers live in 0002 ─────────────────────────
--
-- `auth_role()` reads `public.profiles`, and Postgres validates the
-- body of a LANGUAGE SQL function when it is created — so defining
-- it here, one migration before the table exists, fails outright.
-- The helpers are created immediately after that table instead,
-- which also puts them next to the thing they read.
