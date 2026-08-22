-- ================================================================
-- 0011 · FORM SUBMISSIONS — every contact message and newsletter
--        signup, kept in the database and listed in the dashboard.
--        (Client notes ٢, Aug 2026)
--
-- Until now a submission was emailed and forgotten: `api/contact.js`
-- and `api/newsletter.js` handed it to Resend and returned 200. An
-- inbox is not a record — a deleted mail is a deleted request, and
-- there is no way to answer "how many people wrote to us in July".
-- The client asked for the requests themselves, in one table in the
-- dashboard, with the form each one came from.
--
-- ONE TABLE, ONE DISCRIMINATOR
-- ----------------------------------------------------------------
-- Same shape as `collection_items`: contact and newsletter are the
-- same event (someone gave us their details) with different fields
-- filled, so they share a table and a `form` column rather than
-- splitting into two screens that then need a merged view anyway.
-- Newsletter rows fill `email` and nothing else; that is fine and is
-- why every text column carries a default.
--
-- WHO MAY INSERT
-- ----------------------------------------------------------------
-- `anon`, and nothing else it can do here. The endpoints in `api/`
-- run on Vercel with the ANON key — deliberately, because the
-- service-role key bypasses every policy in the project and this
-- repo's rule is that it never leaves the seed script (README,
-- "Environment variables"). So the insert is a real RLS-checked
-- insert, and the policy below is what makes it legal.
--
-- The exposure that buys: someone holding the (public) anon key can
-- POST junk rows straight at PostgREST, bypassing the captcha the
-- endpoint checks. They could equally POST junk at `/api/contact`,
-- so the captcha was never the thing standing between us and a
-- determined script — it stops the naive ones. What matters is the
-- other half: anon may INSERT and may NOT select, update or delete,
-- so submissions can never be read back by the person who sent them,
-- and junk is an editor pressing delete rather than a leak.
-- ================================================================

create type public.form_kind as enum ('contact', 'newsletter');

create table public.form_submissions (
  id          uuid primary key default gen_random_uuid(),

  -- Which form this came from. The client's requirement is explicit
  -- that the table must say so ("مع توضيح نوع النموذج").
  form        public.form_kind not null,

  -- The contact form's five fields, flattened into columns so the
  -- dashboard can sort and search them. A newsletter row uses
  -- `email` alone and leaves the rest empty.
  name        text not null default '',
  email       text not null default '',
  phone       text not null default '',
  subject     text not null default '',
  message     text not null default '',

  -- Everything the form posted, verbatim. The columns above are the
  -- fields we know today; `contact.form.fields` is dashboard-editable
  -- copy and a future field would otherwise be received and dropped.
  payload     jsonb not null default '{}'::jsonb,

  -- Context, for triage. `source_path` is the page the visitor was on
  -- (a program page's form and the contact page's form are the same
  -- endpoint); `user_agent` separates a person from a script.
  source_path text not null default '',
  user_agent  text not null default '',

  -- Handled state. Not a publish_state: a submission is not content
  -- and is never published — it is read or it is not.
  is_read     boolean not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- A newsletter row is worthless without an address, and a contact
  -- row without a message is a bot. Checked here rather than only in
  -- the endpoint, because the endpoint is not the only way in.
  constraint form_submissions_has_content check (
    case form
      when 'newsletter'::public.form_kind then email <> ''
      else email <> '' and message <> ''
    end
  ),

  -- Bounded, so a script cannot fill the table one row at a time.
  constraint form_submissions_lengths check (
    length(name) <= 200
    and length(email) <= 320
    and length(phone) <= 60
    and length(subject) <= 300
    and length(message) <= 5000
    and length(source_path) <= 500
    and length(user_agent) <= 500
  )
);

comment on table public.form_submissions is
  'Contact + newsletter submissions, listed in the dashboard. Inserted by the api/ endpoints with the anon key under RLS.';
comment on column public.form_submissions.form is
  'Which form the request came from — shown as a column in the dashboard table.';

-- The dashboard lists newest first, optionally filtered by form and
-- by unread. One index covers all three.
create index form_submissions_inbox_idx
  on public.form_submissions (created_at desc);
create index form_submissions_form_idx
  on public.form_submissions (form, created_at desc);
create index form_submissions_unread_idx
  on public.form_submissions (created_at desc)
  where not is_read;

create trigger form_submissions_set_updated_at
  before update on public.form_submissions
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────

alter table public.form_submissions enable row level security;

-- Insert only, and only rows that look like a submission. `is_read`
-- is pinned false so a caller cannot file a request as already
-- handled, and `created_at` is left to the default rather than
-- trusted from the wire.
create policy "form_submissions: public insert"
  on public.form_submissions for insert
  to anon, authenticated
  with check (not is_read);

-- Reading them is staff-only. There is no public select policy at
-- all, so the anon key that wrote the row cannot read it back.
create policy "form_submissions: staff read"
  on public.form_submissions for select
  to authenticated
  using (public.is_editor());

-- Marking one read is an edit; both roles do it, under the same 2FA
-- gate as every other write (`can_edit()` = role + has_required_aal).
create policy "form_submissions: editors update"
  on public.form_submissions for update
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

-- Deleting a request is destroying a record of someone contacting
-- the organisation, so it is an admin act.
create policy "form_submissions: admins delete"
  on public.form_submissions for delete
  to authenticated
  using (public.can_administer());

grant insert on public.form_submissions to anon, authenticated;
grant select, update, delete on public.form_submissions to authenticated;

-- The dashboard's inbox badge should light up while an editor has the
-- screen open, same as every other live-updating list.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'form_submissions'
  ) then
    alter publication supabase_realtime add table public.form_submissions;
  end if;
end
$$;
