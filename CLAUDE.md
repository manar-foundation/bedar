# Bedar — working notes

Read `README.md` first for stack, structure and phase status. This file is the
short list of things that are easy to get wrong here.

## Brand rules that are not negotiable

- **Readex Pro only.** No second font, ever.
- **Western digits (0-9) always**, including inside Arabic prose. Never ٠-٩.
  Format numbers and dates through `src/utils/format.js` — plain `Intl` with the
  `ar` locale emits Arabic-Indic digits.
- **Teal palette only.** `accent-500` (#0B7A73 turquoise) is reserved for primary
  CTAs and nothing else. It replaced the original bronze #B08968 in Aug 2026 —
  that colour sat outside the palette and never met AA against white.
- `.surface-dark` belongs to hero / impact-stats / programs / footer. Long-form
  Arabic body copy never sits on a dark or glowing surface.
- Voice: warm, credible, first-person plural (نعمل، نستقطب). No jargon, no
  hyperbole, **no emoji in site copy**.

## RTL

The site is Arabic-first; `dir="rtl"` is the baseline, not a variant.

- Use logical utilities: `ps-`/`pe-`, `ms-`/`me-`, `start-`/`end-`, `border-s-`,
  `rounded-s-`, `text-start`. They flip automatically.
- Physical utilities (`pl-`, `left-`, `text-left`) only for things that must NOT
  flip — Latin code blocks, charts, embedded LTR content.
- `translate-x-*` is physical and does not flip. State it per direction with
  `rtl:` / `ltr:` when positioning drawers.
- Named arrows are already directional: in RTL "forward" is leftward, so a
  next-CTA uses a plain `<ArrowLeft>`. `.mirror-rtl` is only for LTR-drawn icons
  with non-directional names (`LogOut`, `Reply`, `Share`).
- Wrap Latin/numeric runs inside Arabic prose in `.ltr-run`.

## Keep Supabase out of the public bundle

`@supabase/supabase-js` is ~53 kB gzipped and no public visitor authenticates.
`AuthProvider` is mounted inside the lazily-loaded admin branch
(`layouts/AdminShell.jsx`), and `routes.jsx` must not statically import anything
that transitively reaches it — that is why `ProtectedAdminLayout.jsx` exists
instead of composing `RequireAuth` + `AdminLayout` inline in the route table.

After any routing or context change:

```bash
npm run build && grep -c supabase dist/index.html
```

Must print `0`.

Import `hasSupabase` from `@utils/env.js`, never from `@services/supabaseClient.js`,
in anything the public site mounts.

## Supabase schema rules (Phase 4)

Migrations are in `supabase/migrations/`, one domain per file, with each table's
indexes, triggers and RLS policies in the same file that creates it.

- **Every write policy is `public.can_edit()` or `public.can_administer()`.**
  Never write a policy that checks `is_editor()` alone — those two compose the
  role check with `has_required_aal()`, which is what enforces 2FA (spec §13).
- **A `language sql` function body is validated at CREATE time.** `auth_role()`
  reads `profiles`, so it lives in the profiles migration, not before it.
- **Definer functions pin `set search_path = ''`** and schema-qualify every
  name. An unqualified name in a SECURITY DEFINER function is the hijack.
- Long-form content is a **block array in jsonb**, never an HTML string —
  `RichText` renders blocks as React elements, and dashboard-authored HTML
  through `dangerouslySetInnerHTML` would make every editor account an XSS
  vector. RLS does not help there: an editor is authorised to write.
- The public site does **not** read Supabase. The dashboard writes to it and the
  Phase 6 publish pipeline writes `src/content/` back into the repo.

## Dashboard rules (Phase 5)

- **Queries live in `src/services/*Service.js`.** `.from(TABLE)` must not appear
  in a component. Those modules throw Errors with Arabic messages — `db.js` maps
  SQLSTATEs and passes trigger-raised Arabic through untouched.
- **Seed a form during render, never in an effect.** Compare the loaded object's
  identity (`if (data && data !== loaded) { setLoaded(data); setForm(…) }`).
  An effect renders one frame of the previous record and trips
  `react-hooks/set-state-in-effect`.
- **No autosave anywhere.** `SaveBar` shows when the form differs from what was
  loaded; saving is an explicit act.
- **Do not re-implement a database rule in the browser.** Featured exclusivity,
  the 301 on a slug rename, the two-level nav cap and the last-admin guard are
  triggers. Write the intent, surface the returned error.
- **`pages` has no create/delete in the dashboard, and users have no invite
  button.** Both are spec, not gaps — pages are built in code (§2/§14), and
  inviting needs the service-role key, which cannot be in a browser bundle.
  Each screen says so on screen; don't "fix" them.
- A write that RLS refuses comes back as **PGRST116** (zero rows), not 42501 —
  an UPDATE simply matches nothing. Error text has to name both causes.

## Content is data

Navbar, footer and collections are data (`src/content/site.js`, then Supabase).
Never hardcode a nav link or a footer column into JSX — the dashboard has to be
able to edit it, and a new article has to reach the homepage with no code change.

## Vite 8 / Tailwind v4 gotchas

- Vite 8 bundles with **Rolldown**. `build.rollupOptions.output.manualChunks` in
  object form is rejected; use `output.codeSplitting.groups`.
- Tailwind v4 owns these CSS variable namespaces: `--color-*`, `--font-*`,
  `--radius-*`, `--shadow-*`, `--ease-*`, `--container-*`, `--breakpoint-*`,
  `--text-*` (font sizes), `--animate-*`. Design-system tokens that collide must
  either be renamed or declared inside `@theme` with matching values. Two renames
  are already in place — see README.
- Semantic theme colours use `@theme inline` so `data-theme="dark"` re-themes
  utilities live. Static scales use plain `@theme`.

## React

- ESLint enforces `react-hooks/set-state-in-effect`. Do not call `setState`
  synchronously in an effect body — derive it in the state initialiser, adjust it
  during render with a previous-value comparison, or use `useSyncExternalStore`
  for external stores like `matchMedia`.

## Specs

`Bedar_Dashboard_Specification.docx` and `Bedar_Website_Infrastructure.docx` in
`~/Downloads` are the contract. When in doubt about dashboard scope, check §14 of
the dashboard spec — several tempting features (visual page builder, multilingual,
editable 404, maintenance mode, theme controls) are explicitly out of scope for v1.
