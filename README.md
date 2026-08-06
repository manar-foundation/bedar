# بدار — Bedar Platform

منصة بدار للريادة المجتمعية — الموقع العام + لوحة التحكم.

Arabic-first (RTL) marketing site and content dashboard for **bedar.org**, built for
ThreeMS × Manar Foundation. Migrating from `bedar.webflow.io`.

---

## Tech stack

| Layer | Choice |
|---|---|
| Build | Vite 8 (Rolldown bundler) |
| UI | React 18 + React Router 7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), RTL-first |
| Motion | Framer Motion 12 |
| Icons | lucide-react |
| Backend | Supabase (Postgres + Auth + Storage) — *Phase 4* |
| Hosting | Netlify, auto-deploy from GitHub `main` |

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The **public site runs with no backend** — its content comes from `src/content/`,
and it stays that way by design: the dashboard writes to Supabase, and the Phase 6
publish pipeline writes those files back into the repo. Supabase is needed only to
sign in to `/admin`.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:push` | Apply `supabase/migrations/` to the linked project |
| `npm run db:reset` | Rebuild the local database from zero (needs Docker) |
| `npm run db:seed` | Load `src/content/` into Supabase (needs the service-role key) |

Copy `.env.example` → `.env`. Never commit `.env`. The service-role key is
**not** a `VITE_` variable — anything with that prefix ships in the browser
bundle, and that key bypasses every RLS policy in the project.

---

## Project structure

```
src/
├── assets/        Logo, favicon, images
├── components/
│   ├── admin/     Dashboard-only building blocks — see Phase 5 below
│   ├── layout/    Navbar, NavDropdown, Footer, NewsletterForm, ScrollToTop, …
│   ├── motion/    Reveal / RevealOnMount
│   └── ui/        Design-system components — see below
├── content/       Site content seed — nav, footer, settings (data, not markup)
├── context/       ThemeContext, ContentContext, AuthContext, ToastContext
├── hooks/         useScrollReveal, useCountUp, useMediaQuery, useAsyncData
├── layouts/       PublicLayout, AdminLayout, AdminShell, ProtectedAdminLayout
├── pages/
│   ├── public/    Home, About, Programs, Services, Blog, News, Contact, 404
│   └── admin/     Dashboard, PageEditor, Collections, Media, Redirects, …
├── services/      supabaseClient + one query module per domain (Phase 5)
├── styles/        Tailwind entry, design tokens, RTL rules, animations
├── utils/         cn, env, format, constants
├── App.jsx        Providers
├── routes.jsx     Route table
└── main.jsx       Entry
```

Import aliases (`@components`, `@pages`, `@utils`, …) are configured in
`vite.config.js`. Use them instead of `../../..` chains.

---

## Design system

Brand tokens live in `src/styles/tokens/`, copied from the **Bedar Design System**
folder at the repo root. `src/styles/theme.css` bridges them into Tailwind so you
get `bg-brand-500`, `text-ink`, `rounded-card`, `shadow-e3`, `ease-standard`, etc.

Non-negotiables:

- **Readex Pro only.** No secondary Arabic face, no Inter, no Cairo.
- **Western digits (0-9) always**, even inside Arabic prose. Never ٠-٩. Use the
  helpers in `utils/format.js` — they pass `ar-u-nu-latn` to every `Intl` call,
  because plain `ar` yields Arabic-Indic digits in most runtimes.
- **Teal only**, plus one saturated turquoise (`accent-500`, #0B7A73) reserved for
  primary CTAs. `accent-400` is the vivid tint for glows and gradients and cannot
  carry white text.
- **Dark surfaces** (`.surface-dark`) are for hero / impact-stats / programs /
  footer only. Long-form Arabic body always sits on light `bg-app`.
- **Motion** 140–560ms on `cubic-bezier(0.2,0,0,1)`. Everything respects
  `prefers-reduced-motion`.

### Two deliberate deviations from the design-system source files

Both are documented in-file at the point of change:

1. `tokens/fonts.css` is a no-op. Readex Pro is loaded from `index.html` with
   `preconnect` instead of a remote CSS `@import`, which avoids a render-blocking
   request waterfall.
2. `tokens/spacing.css` renames `--container-*` → `--layout-*`. Tailwind v4 owns
   the `--container-*` namespace; keeping the original names would silently
   redefine `max-w-xl` as 1280px across the whole app. Values are unchanged.

### Component library (Phase 2)

`src/components/ui/` is a Tailwind + token port of
`Bedar Design System (2)/components/`. Import from the barrel:

```js
import { Button, Card, Input, Hero } from '@components/ui';
```

| Group | Components |
|---|---|
| Core | `Button` `IconButton` `Badge` `Tag` |
| Forms | `Field` `Input` `Textarea` `Select` `Checkbox` `Radio` `Switch` `FileUpload` |
| Surfaces | `Card` `Modal` `Tooltip` |
| Data & nav | `Table` `Tabs` `Breadcrumbs` `Accordion` |
| Blocks | `Hero` `HeroEmblem` `SectionHeading` `FeatureGrid` `ContentCard` `Testimonial` `StatBand` |
| Brand | `Logo` `Spiral` `SpiralDivider` |

The ports are visually faithful. Where one differs from its source it is
because the design-system file is a static specimen and this is a live RTL
app — each difference is documented in the component that makes it. The
recurring ones:

- **Inline styles → utilities.** The sources track `hover` in React state,
  which costs a render per pointer-enter and cannot express `:focus-visible`
  or `:active`. Same pixels, as CSS.
- **Physical → logical.** `padding: 0 14px 0 40px`, `left: 18px`,
  `placement: 'left'` all point the wrong way in RTL.
- **Real semantics.** `Modal` traps and restores focus, `Tabs` implements the
  ARIA tabs pattern, `Checkbox`/`Radio`/`Switch` keep a focusable input,
  `Field` wires `aria-describedby` to hints and errors.

`fieldChrome` / `fieldTone` live in `ui/fieldStyles.js`, not in `Field.jsx` —
a module exporting both a component and constants breaks Fast Refresh.

### The homepage hero

`Hero` has two shapes. Pass `visual` and it splits: copy in the inline-start
column — the **right** half in RTL — and artwork opposite. Pass nothing and it
stays the centred title band every interior page uses.

The copy column is always first in the DOM, which is what puts the text above
the artwork on mobile. No `order-*` utility is involved: reordering visually
would leave the tab order following the layout instead of the reading order.

`HeroEmblem` is the artwork — the brand spiral inside three counter-rotating
orbits, over a breathing glow, with the `.hero-aurora` colour fields drifting
behind the whole band. It is CSS animation and not Framer Motion: nothing in it
is interactive, so it belongs on the compositor rather than on the main thread
next to the scroll handlers. Every class it uses stops dead under
`prefers-reduced-motion` — the motion tokens only zero out *transitions*, and an
endless drift is exactly what a vestibular disorder cannot tolerate.

### RTL

`dir="rtl"` is the default, not a variant. **Use logical utilities** — `ps-`/`pe-`,
`ms-`/`me-`, `start-`/`end-`, `border-s-`, `text-start` — so everything flips for
free. Physical utilities are reserved for things that must *not* flip.

Icon mirroring: `.mirror-rtl` is for LTR-drawn directional icons whose names are
not directional (`LogOut`, `Reply`, `Share`). Do **not** apply it to named arrows —
in RTL "forward" is leftward, so a next-CTA uses a plain `<ArrowLeft>`.

---

## Architecture notes

**Content is data, not markup.** Navbar, footer, and article-style collections are
data structures (`src/content/site.js` → Supabase in Phase 4). This is what lets
the dashboard edit them, and what lets a newly published article reach the homepage
with no code change. Infrastructure spec §3.

Every Arabic string in `site.js` is verbatim from bedar.webflow.io, including the
shape of the header. Two things there are easy to get wrong:

- **`منصة بدار` is a group, not a link.** On the live site it is a dropdown toggle
  with no `href`, holding `من نحن` and `بدار والريادة المجتمعية`. A nav item is a
  group when it carries `children` — `Navbar` branches on that, so the dashboard
  can add or remove one without a code change.
- **`تواصل معنا` is the CTA, not a nav link.** It is the turquoise button
  (`headerCta`), and it must not also appear in the link list.

**Supabase never reaches the public bundle.** `@supabase/supabase-js` is ~53 kB
gzipped and no public visitor authenticates. `AuthProvider` is therefore mounted
inside the lazily-loaded admin branch (`layouts/AdminShell.jsx`), not at the app
root, and `routes.jsx` imports nothing that transitively reaches it.

Regression check after any routing change:

```bash
npm run build && grep -c supabase dist/index.html
```

It must print `0`. If it prints anything else, something in the eager import graph
started pulling in the Supabase client.

**Client-side auth is a UX guard, not a security boundary.** `RequireAuth` only
decides what to render. Authorisation is enforced by Supabase RLS on every table,
so bypassing it reveals an empty dashboard, not data.

---

## Backend (Phase 4)

Schema, RLS and auth live in `supabase/` — see `supabase/README.md` for the
setup runbook and the full authorisation model. The short version:

| Table | Holds |
|---|---|
| `profiles` | dashboard users + role (`admin` / `editor`) |
| `pages`, `page_fields` | per-page content, SEO, publish state, URL |
| `collection_items` | articles, news, programs (one table, one discriminator) |
| `testimonials`, `faq_items` | the two non-article collections |
| `navigation_items` | navbar + footer, one ordered tree |
| `site_settings` | organisation schema, integrations, captcha, consent |
| `media` | index over the Storage bucket, alt text per file |
| `redirects` | old path → new path, 301/302 |
| `content_versions` | append-only history of every content edit |

Three rules hold the model together, all of them in SQL:

- `public.auth_role()` re-reads the role from `profiles` on every statement.
  The role in the browser is a rendering hint.
- `public.has_required_aal()` demands `aal2` from anyone who has enrolled a
  second factor, and tolerates `aal1` from anyone who has not — otherwise the
  first admin could never reach the enrolment screen. `RequireAuth` closes that
  gap in the UI by refusing every route except `/admin/security` until a factor
  exists.
- Every write policy is `can_edit()` or `can_administer()`, which are those two
  composed. A new table cannot forget the 2FA half.

### Two-factor (Dashboard spec §13)

TOTP only — an authenticator app costs nothing per login, needs no phone number
and no SMS deliverability, and survives a SIM swap. `/admin/security` handles
enrolment (QR + manual secret) and removal; `/admin/login` grows a second step
for the six-digit code, derived from the session's assurance level rather than
from local state, so reloading mid-challenge does not send the user back to the
password field.

### Seeding

```bash
npm run db:seed
```

`scripts/seed-supabase.mjs` reads `src/content/` — the same files the site
renders — and upserts pages, fields, collections, navigation and settings. Same
reasoning as `migrate-bodies.mjs`: 40 kB of Arabic copy transcribed into INSERT
statements is a silent-corruption risk and a second source that drifts.
`--dry-run` prints the row counts without writing.

---

## Dashboard (Phase 5)

`/admin`, Arabic and RTL like the rest of the site. Every screen reads and
writes Supabase directly; there is no API layer between them, because RLS *is*
the authorisation layer and a Node tier in front of it would only be a second
place to forget a policy.

| Screen | Spec | What it edits |
|---|---|---|
| لوحة التحكم | — | Counts, drafts waiting, recent edits |
| الصفحات | §2, §5, §6 | Page fields, slug, parent, SEO, publish state |
| الهيدر والفوتر | §3.1 | Navigation tree, header CTA, footer copy |
| المجموعات | §3.2 | Articles, news, programs, testimonials, FAQ |
| مكتبة الوسائط | §7 | Upload, alt text, usage, delete |
| إعادة التوجيه | §8 | Old path → new path, 301/302, enable |
| التكاملات | §11, §4 | GTM, Search Console, head/footer code, captcha, form destination |
| سجل النسخ | §10 | Every content edit, with restore |
| المستخدمون | §9 | Roles, activation |
| الأمان | §13 | TOTP enrolment |
| الإعدادات | §6, §12 | Organisation schema, social, consent, own name |

### The parts worth knowing before you edit one

**Services, not queries in components.** `src/services/*Service.js` is one
module per domain and the only place `.from(TABLE)` appears. They throw Errors
carrying an Arabic message — `db.js` maps SQLSTATEs, and passes through the
Arabic that the schema's own triggers raise (`لا يمكن إزالة آخر حساب مدير`),
because those were written for this audience.

**`useAsyncData` resets during render, not in an effect.** ESLint enforces
`react-hooks/set-state-in-effect`; seeding a form from an effect renders one
frame of the previous record's values. Every editor screen uses the same shape:
compare the loaded object's identity during render, and reset the form there.

**Nothing autosaves.** `SaveBar` appears when the form differs from what was
loaded and arms `beforeunload` while it is showing. A page is live copy two
people may be editing; the moment a half-written sentence becomes the public
site is an editor's decision, not a debounce timer.

**Long-form content is a block array, and there is no rich-text box.**
`BlockEditor` edits `[{type:'p'|'h2'|'h3'|'quote'|'ul', …}]`, which `RichText`
renders as React elements. A WYSIWYG producing an HTML string would have to come
back through `dangerouslySetInnerHTML`, which makes every editor account an XSS
vector — and RLS does not help there, because an editor is *authorised* to
write. The cost (no inline bold, no inline links) is accepted.

**Database rules are not re-implemented in the browser.** Featured-item
exclusivity, the 301 written on a slug rename, the two-level navigation cap and
the last-admin guard all live in triggers. The screens write the intent and show
the error the database returns; a client-side copy of those rules is a copy that
drifts and loses the race.

**Deletion order for media is storage first, row second.** A foreign key cannot
reach into Storage, so a half-failure leaves a visible row pointing at a missing
file — noticeable and retryable — rather than bytes nobody can see.

`src/components/admin/` holds the shared pieces (`AdminPage`, `DataState`,
`SaveBar`, `FieldEditor`, `BlockEditor`, `ListEditor`, `ImageField`,
`MediaPicker`, `SeoSection`, `ConfirmDialog`). It is a separate barrel from
`@components/ui` on purpose: several of these reach the Supabase client, and the
ui barrel is imported by every public page.

## Phased delivery

| Phase | Scope | Status |
|---|---|---|
| 1 | Vite + React + Tailwind RTL scaffold, folder structure, routing | ✅ Done |
| 2 | Design system components (Button, Input, Card, Modal, Hero, …) | ✅ Done |
| 3 | Public pages with verbatim content from bedar.webflow.io | ✅ Done¹ |
| 4 | Supabase schema, RLS, Auth + 2FA | ✅ Done² |
| 5 | Admin dashboard (pages, collections, media, SEO, redirects) | ✅ Done³ |
| 6 | Publish pipeline: version snapshot → GitHub API → Netlify | ⏳ |
| 7 | End-to-end testing, responsive + a11y pass | ⏳ |

Routes for every page exist from Phase 1 so navigation, layouts and the 404
boundary can be tested for real. Screens not yet built render
`components/layout/PagePlaceholder.jsx`, which names the phase that fills them in.

³ Every screen in the sidebar is built and reads and writes the linked Supabase
project. Two things in the dashboard are deliberately absent rather than
unfinished, and each says so on screen: **pages cannot be created or deleted**
(they are built in code — spec §2/§14), and **accounts cannot be invited** from
the browser, because `auth.admin.inviteUserByEmail` needs the service-role key
and that key bypasses every RLS policy in the project. Inviting happens in the
Supabase dashboard until Phase 6 adds an Edge Function that holds it
server-side.

² Migrations and RLS are applied to the linked project and `npm run db:seed` has
loaded `src/content/` into it — the dashboard opens onto the real site. What
still needs confirming per project is the Auth configuration: TOTP enabled and
signups disabled in the Supabase Auth settings, and a first user created (the
first account bootstraps as `admin`; see `supabase/README.md`).

¹ Every marketing surface — home, about, social entrepreneurship, services,
programs, blog, news, contact, 404 — carries its full copy, its per-page
`<title>` and meta description, and its form definitions. All nine collection
items carry their metadata *and* their long-form body.

### Page content lives in `src/content/`

| File | Holds |
|---|---|
| `site.js` | Navbar, footer, global settings |
| `pages.js` | Per-page copy, SEO, services, testimonials, FAQ, form definitions |
| `collections.js` | `programs`, `articles`, `news` metadata + `findBySlug` + `loadBody` |
| `collection-bodies.js` | **Generated.** Long-form bodies, keyed by slug |

### Migrating the bodies

Article, news and program bodies are **generated, never transcribed**:

```bash
node scripts/migrate-bodies.mjs
```

It fetches each item from the Webflow site, parses the rich-text block into
structured blocks, and rewrites `collection-bodies.js`. Two reasons it is a
script and not a copy-paste: a dropped tashkeel or swapped quote mark inside
3,000 words of Arabic is invisible until the client reads it, and the migration
stays re-runnable while the Webflow site is still being edited before cutover.
`--dry-run` prints a per-item block/word count without writing.

Blocks are structured data (`{ type: 'p' | 'h2' | 'h3' | 'quote' | 'ul' }`), not
HTML strings. `RichText` renders them as real React elements — running
dashboard-authored content through `dangerouslySetInnerHTML` would make every
editor account an XSS vector, and RLS does not help there: an editor is
authorised to write, they just should not be able to write `<script>`.

`/programs/hackathon` is a bespoke Webflow landing page with no rich-text block,
so the script falls back to walking its prose between the `<h1>` and the footer.
That preserves every word but flattens the dated timeline into headings — if the
client wants that layout back it is a page build, not a content migration.

**Never import `collection-bodies.js` statically from `collections.js`.** It is
~49 kB raw, and `collections.js` is reached from `ContentContext`, which every
public page mounts — a static import ships all nine bodies to a visitor who only
sees the homepage. `CollectionDetail` calls `loadBody(slug)`, so the text splits
into its own chunk (13.6 kB gzipped) and loads only on a detail route. Same rule
as Supabase, same reason.

Pages own layout; data owns words. A copy change must never be a code change.
`useSeo` (`src/hooks/useSeo.js`) applies each page's title and description —
note that a client-rendered SPA needs prerendering before crawlers see those,
which is a Phase 6 deploy concern.

---

## Deployment

Netlify builds from `main` on every push. `netlify.toml` holds the build command,
the SPA fallback redirect (required — without it a hard refresh on `/programs`
returns Netlify's own 404), security headers, and immutable caching for
fingerprinted assets.

**Rollback** — two independent safety nets, both free:

- *Netlify:* Deploys tab → "Publish deploy" on any earlier snapshot. Instant,
  consumes no plan credits.
- *GitHub:* `git revert` at the code level.

Plan requirements per the infrastructure spec: GitHub Free is sufficient; Netlify
**Personal ($9/mo)** before public launch — the Free plan's ~20 deploys/month is
easy to exceed during active editing, and a suspended site is a real risk for a
donor-facing page.

---

## Known issues

**Logo artwork.** `src/assets/bedar-logo.svg` is the supplied file: navy wordmark +
teal spiral. The brand calls for a dark-teal wordmark (`#022124`). The client is
providing a recolored SVG — drop it in at the same path, no code change needed.

**`react-router` advisory GHSA-qwww-vcr4-c8h2** (high). Affects 7.12.0–8.2.0, which
includes the current latest (7.18.2); no fixed release exists yet. The vulnerability
is a CSRF bypass in **RSC mode**. This app is a client-only SPA using
`BrowserRouter` with no server actions and no RSC handler, so it is not reachable
here. Revisit when a patched release ships — `npm audit fix --force` would downgrade
to 7.11.0 and lose seven minors of fixes for no gain.

---

## Source documents

- `Bedar_Website_Infrastructure.docx` — hosting, repo structure, deploy workflow
- `Bedar_Dashboard_Specification.docx` — dashboard scope for v1
- `Bedar Design System (2)/` — tokens, foundations, component kit
- Live reference: <https://bedar.webflow.io/> · Production: <https://www.bedar.org>
