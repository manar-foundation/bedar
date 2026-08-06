-- ================================================================
-- 0002 · PROFILES — who may sign in, and as what (Dashboard spec §9)
--
-- `auth.users` is owned by Supabase and must not be extended. The
-- app-visible mirror is `public.profiles`, keyed by the same id, and
-- it is the ONLY source of a user's role. The client caches the role
-- for rendering; every policy in this schema re-reads it here.
-- ================================================================

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  role         public.app_role not null default 'editor',
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Dashboard users. Role lives here, never in a JWT claim the browser can set.';
comment on column public.profiles.is_active is
  'Soft revoke. Deactivating strips every permission (auth_role() returns NULL) without deleting the auth user or orphaning their authored rows.';

create index profiles_role_idx on public.profiles (role) where is_active;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Authorisation helpers ──────────────────────────────────────
--
-- Defined here rather than in 0001: they read `profiles`, and a
-- LANGUAGE SQL body is validated at CREATE time, so they cannot
-- exist before the table does. See that migration's header for
-- the model these implement.
-- Named `auth_role` and not `current_role`: CURRENT_ROLE is a
-- reserved SQL keyword in Postgres and cannot be used as a function
-- name without quoting it at every call site.
create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.is_active
$$;

comment on function public.auth_role() is
  'Role of the calling user, from profiles. NULL when signed out or deactivated.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.auth_role() = 'admin'::public.app_role
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.auth_role() in ('admin'::public.app_role, 'editor'::public.app_role)
$$;

-- ── Two-factor enforcement (Dashboard spec §13) ────────────────
--
-- The condition is deliberately conditional on enrolment rather than
-- a flat `aal = 'aal2'`. A flat check is unrecoverable: the very
-- first admin has no factor yet, so requiring aal2 to do anything
-- would lock the project out of its own dashboard before anyone
-- could enrol. So:
--
--   no verified factor  → aal1 is accepted (enrolment is possible)
--   ≥1 verified factor  → aal2 is required (the factor must be used)
--
-- The client mirrors this: `RequireAuth` sends a user with no factor
-- to /admin/security and refuses every other route until they enrol.
-- That is the policy; this function is the enforcement.
create or replace function public.has_required_aal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from auth.mfa_factors f
      where f.user_id = (select auth.uid())
        and f.status = 'verified'
    )
    then coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    else true
  end
$$;

comment on function public.has_required_aal() is
  'True when the session satisfies the user''s own 2FA enrolment: aal2 required once a verified factor exists, aal1 tolerated before that so the first enrolment is possible.';

-- Composed guards. Every write policy in this schema is one of
-- these two, so the 2FA rule can never be forgotten on a new table.
create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_editor() and public.has_required_aal()
$$;

create or replace function public.can_administer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() and public.has_required_aal()
$$;

-- The helpers are called from policies, which run as the invoking
-- role — so anon/authenticated need EXECUTE.
grant execute on function public.auth_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.has_required_aal() to anon, authenticated;
grant execute on function public.can_edit() to anon, authenticated;
grant execute on function public.can_administer() to anon, authenticated;

-- ── Provisioning ───────────────────────────────────────────────
--
-- Signups are disabled (see supabase/config.toml and the Auth
-- settings of the hosted project). Users are created by an admin
-- through an invite, which still lands in `auth.users`, so the
-- profile row is created by this trigger either way.
--
-- The role is NOT read from user metadata. Metadata is attacker
-- controlled on any self-signup flow, and "we turned signups off"
-- is a setting, not a guarantee. The first account bootstraps as
-- admin because someone has to be able to promote the second one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bootstrap boolean;
begin
  select not exists (
    select 1 from public.profiles where role = 'admin'::public.app_role and is_active
  ) into bootstrap;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when bootstrap then 'admin'::public.app_role else 'editor'::public.app_role end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the mirrored email in step when it is changed in Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ── Privilege guards ───────────────────────────────────────────
--
-- RLS is row-level, not column-level: a policy that lets a user
-- update their own profile lets them update every column of it,
-- including `role`. These triggers are the column-level half.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- No end-user session: the seed script, an Edge Function, or psql.
  -- Those run as service_role/postgres and are already trusted.
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'لا يمكن تغيير الصلاحية إلا من قِبل مدير' using errcode = '42501';
  end if;

  if new.is_active is distinct from old.is_active then
    raise exception 'لا يمكن تفعيل أو تعطيل الحسابات إلا من قِبل مدير' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Locking the whole team out of the dashboard should take more than
-- one careless click in the users screen. Promoting a replacement
-- first is the intended recovery path; the service-role key is the
-- break-glass one.
create or replace function public.guard_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  select count(*) into remaining
  from public.profiles
  where role = 'admin'::public.app_role
    and is_active
    and id <> old.id;

  if remaining = 0 then
    raise exception 'لا يمكن إزالة آخر حساب مدير. عيّن مديراً آخر أولاً' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_last_admin
  before update on public.profiles
  for each row
  when (
    old.role = 'admin'::public.app_role and old.is_active
    and (new.role <> 'admin'::public.app_role or not new.is_active)
  )
  execute function public.guard_last_admin();

create trigger profiles_guard_last_admin_delete
  before delete on public.profiles
  for each row
  when (old.role = 'admin'::public.app_role and old.is_active)
  execute function public.guard_last_admin();

-- ── RLS ────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Anyone signed in can read their own row — RequireAuth needs the
-- role before it can render anything, and that read happens at aal1,
-- before the 2FA challenge. Reading your own name is not a write.
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: admins read all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Own row: name only in practice, since the guard trigger rejects
-- role and is_active changes from a non-admin.
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) and public.has_required_aal())
  with check (id = (select auth.uid()));

create policy "profiles: admins manage"
  on public.profiles for all
  to authenticated
  using (public.can_administer())
  with check (public.can_administer());

-- No INSERT policy by design. Rows arrive from the auth trigger,
-- which is SECURITY DEFINER and bypasses RLS. A client-side insert
-- into profiles would mean inventing a user without an auth account.

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant insert, delete on public.profiles to authenticated; -- gated to admins by RLS
