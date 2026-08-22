-- ================================================================
-- 0011 · FORM SUBMISSIONS (client notes §2)
--
-- "Add a section to the dashboard to manage every request and every
--  piece of data arriving from the contact form and the newsletter
--  signup. Every submission must be saved to the database and shown
--  to the administrator in a table, stating which form it came
--  through."
--
-- Until now a submission was EMAILED and nothing else (api/contact.js,
-- api/newsletter.js). Email is a notification, not a record: it is not
-- searchable, it cannot be marked handled, and a bounced or filtered
-- message is a lost enquiry with no trace. This table is the record;
-- the email stays as the notification on top of it.
--
-- WHO WRITES, WHO READS
-- ----------------------------------------------------------------
-- Writes come from the serverless functions in `api/`, with the
-- SERVICE-ROLE key — never from the browser. That is deliberate:
-- an anon INSERT policy on this table is an open, unauthenticated
-- write endpoint into the project's database, and no amount of
-- CHECK constraints makes that a good idea. The functions already
-- verify the captcha and the honeypot before they get here, so the
-- gate sits in front of the write rather than inside RLS.
--
-- Reads are staff-only. Nothing here is public: these rows hold a
-- member of the public's name, email, phone and message.
-- ================================================================

create table public.form_submissions (
  id         uuid primary key default gen_random_uuid(),

  -- Which form produced the row — the "نوع النموذج" column §2 asks
  -- for. A CHECK and not an enum: a new form is a code change in
  -- `api/` that ships with its own migration line, and an enum value
  -- cannot be removed once added.
  form_key   text not null check (form_key in ('contact', 'newsletter')),

  -- The fields both forms have in common, promoted to columns so the
  -- dashboard can sort, search and show them without unpacking jsonb
  -- per row. A newsletter signup fills only `email`.
  name       text not null default '',
  email      text not null default '',
  phone      text not null default '',
  subject    text not null default '',
  message    text not null default '',

  -- Everything the endpoint received, verbatim. The columns above are
  -- a projection of it; this is what makes a form field added later
  -- visible in the dashboard without a migration.
  payload    jsonb not null default '{}'::jsonb,

  -- Triage state. Spec §2 asks for management, not just a log — an
  -- inbox where nothing can be marked done is a list that only grows.
  is_handled boolean not null default false,
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,

  -- Diagnostics for abuse triage. `user_agent` is kept whole;
  -- the IP is NOT stored — it is personal data under GDPR (Manar is
  -- a Netherlands-registered NGO, see spec §12) and nothing in the
  -- dashboard needs it. What is kept is the captcha verdict, which is
  -- what an administrator would actually look at.
  user_agent text not null default '',
  captcha    jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint form_submissions_payload_is_object check (jsonb_typeof(payload) = 'object')
);

comment on table public.form_submissions is
  'Every contact + newsletter submission, saved before it is emailed. Written by the api/ serverless functions with the service-role key (client notes §2).';
comment on column public.form_submissions.form_key is
  'Which form the request came through — shown as its own column in the dashboard.';
comment on column public.form_submissions.payload is
  'The raw submitted body. The named columns are a projection of it.';

-- The dashboard's default view: newest first, optionally filtered to
-- one form. One index covers both.
create index form_submissions_inbox_idx
  on public.form_submissions (form_key, created_at desc);

create index form_submissions_unhandled_idx
  on public.form_submissions (created_at desc)
  where not is_handled;

-- A newsletter address is unique per subscriber: re-submitting the
-- same address must not grow the list by one row per click. Contact
-- messages are NOT deduplicated — the same person legitimately writes
-- twice.
create unique index form_submissions_newsletter_email_key
  on public.form_submissions (lower(email))
  where form_key = 'newsletter';

-- ── Triage stamping ────────────────────────────────────────────
-- `handled_at` / `handled_by` are derived from `is_handled`, so they
-- are set here rather than trusted from the client — a dashboard that
-- forgets to send them would leave a handled row with no record of
-- who handled it or when.

create or replace function public.form_submissions_stamp_handled()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_handled is distinct from old.is_handled then
    if new.is_handled then
      new.handled_at := now();
      new.handled_by := auth.uid();
    else
      new.handled_at := null;
      new.handled_by := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger form_submissions_stamp_handled
  before update on public.form_submissions
  for each row execute function public.form_submissions_stamp_handled();

-- ── RLS ────────────────────────────────────────────────────────

alter table public.form_submissions enable row level security;

-- No policy for `anon` at all — neither select nor insert. The
-- service-role key used by the api/ functions bypasses RLS, which is
-- exactly why it must stay on the server.

create policy "form_submissions: staff read"
  on public.form_submissions for select
  to authenticated
  using (public.is_editor());

-- Marking one handled is ordinary editorial work; both roles may.
-- `can_edit()` and not `is_editor()` — the former composes the role
-- check with `has_required_aal()`, which is what enforces 2FA.
create policy "form_submissions: editors triage"
  on public.form_submissions for update
  to authenticated
  using (public.can_edit())
  with check (public.can_edit());

-- Deleting a submission destroys the only copy of someone's enquiry.
-- Admins only.
create policy "form_submissions: admins delete"
  on public.form_submissions for delete
  to authenticated
  using (public.can_administer());

grant select, update, delete on public.form_submissions to authenticated;
