# Supabase — schema, RLS, Auth (Phase 4)

The backend the dashboard is built on. Nothing here is reachable from the public
site: `@supabase/supabase-js` is loaded only inside the lazy `/admin` branch, and
the public pages keep reading `src/content/` until the Phase 6 publish pipeline
writes those files from the database.

---

## Layout

```
supabase/
├── config.toml     Local stack config (invite-only auth, TOTP enabled)
└── migrations/
    ├── …_foundations.sql      enums, updated_at trigger
    ├── …_profiles.sql         users, roles, authorisation + 2FA helpers, guards
    ├── …_media.sql            media library + storage bucket and policies
    ├── …_redirects.sql        redirects manager + slug-change automation
    ├── …_pages.sql            pages, page_fields, URL maintenance
    ├── …_collections.sql      articles / news / programs, testimonials, FAQ
    ├── …_global_content.sql   navbar, footer, site settings
    └── …_versions.sql         content version history
```

Migrations are ordered by filename and each one is self-contained: the table,
its indexes, its triggers and its RLS policies live together, so "who may write
to this table" is answered in the same file that creates it.

---

## First-time setup

```bash
supabase link --project-ref <ref>
```

```bash
npm run db:push
```

Then, in the hosted project's dashboard:

1. **Authentication → Providers → Email** — turn **off** "Enable sign ups".
   Accounts are created by invitation (Dashboard spec §9). `config.toml` sets
   this for the local stack only; the hosted project has its own switch.
2. **Authentication → Multi-Factor Authentication** — enable **TOTP (App
   Authenticator)**. Without this, `mfa.enroll()` fails and nobody can complete
   the enrolment screen.
3. **Authentication → URL Configuration** — set the site URL and add the Netlify
   deploy-preview pattern to the redirect allow-list.

Create the first user (Authentication → Users → *Add user*). The
`handle_new_user` trigger gives the **first** account the `admin` role because
someone has to be able to promote the second one; every later account starts as
`editor`.

Seed the content:

```bash
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run db:seed
```

It reads `src/content/` — the same files the site renders — so there is no
second copy of the Arabic copy to drift. It is idempotent; re-run it after a
content-file edit. `node scripts/seed-supabase.mjs --dry-run` prints the row
counts without writing.

If `db push` reports `must be owner of table objects` on the storage policies in
`…_media.sql`, run that file's `create policy … on storage.objects` statements
from the dashboard SQL editor instead — `storage.objects` is owned by
`supabase_storage_admin`, and some projects do not grant that to the migration
role.

### Local stack

```bash
supabase start
```

Requires Docker. `npm run db:reset` rebuilds the local database from the
migrations, which is the fastest way to check that they apply cleanly from
zero.

---

## The authorisation model

| Role | May |
|---|---|
| `anon` | read published pages, published collection items, visible nav, public settings, enabled redirects, media |
| `editor` | all of the above unpublished too, plus write content: pages, fields, collections, testimonials, FAQ, media, nav, footer copy |
| `admin` | everything, plus users, integrations, captcha, consent, manual redirects, version pruning |

Three things carry that model:

- **`public.auth_role()`** re-reads the role from `profiles` on every statement.
  A role in the browser's memory is a rendering hint and nothing more.
- **`public.has_required_aal()`** requires `aal2` from any user who has a
  verified second factor. It tolerates `aal1` from a user with none, because the
  first admin has to be able to reach the enrolment screen — that is the only
  hole, and `RequireAuth` closes it in the UI by refusing every other route.
- **`public.can_edit()` / `public.can_administer()`** are the composition of the
  two, and every write policy in the schema is one of them. A new table cannot
  quietly forget the 2FA half.

Column-level rules that RLS cannot express are triggers:
`guard_profile_privileges` (nobody edits their own role), `guard_last_admin`
(the last admin cannot be demoted or deleted), `navigation_items_depth_guard`
(two levels of nav, no more).

## Things the schema does on its own

- **Renaming a page writes a 301.** `record_path_change()` fires on any path
  change, repoints redirects that pointed at the old path so no chain forms, and
  cascades to child pages.
- **Featuring an article un-features the previous one** (spec §3.2), enforced by
  a partial unique index plus a trigger that clears the old one first — so an
  editor gets a swap, not a constraint error.
- **Every content edit is versioned** (spec §10). `record_version()` snapshots
  the whole row as jsonb on insert, update and delete, skipping saves that
  changed nothing. History is append-only: there is no INSERT or UPDATE policy
  on `content_versions` for any client role.
- **`is_hidden_from_search` is one switch** that both adds `noindex` and drops
  the page from the sitemap (spec §2). Two switches is how a page ends up
  noindexed but still submitted for crawling.

## What is deliberately not here

- **Form submissions.** Contact and newsletter go straight to GoHighLevel and
  are not duplicated in the dashboard (spec §4).
- **The captcha secret key.** Only the site key is stored; the secret belongs to
  whatever verifies the token server-side (spec §4).
- **The 404 page.** Fixed content, never editable (spec §14).
- **A `restore_version` function.** Restoring is an UPDATE built from a snapshot
  and belongs to the Phase 5 dashboard, where it appends a new version like any
  other edit rather than rewriting history.
