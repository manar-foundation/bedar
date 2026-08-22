# بدار — Bedar Platform

منصة بدار للريادة المجتمعية — الموقع العام + لوحة التحكم.

Arabic-first (RTL) marketing site and content dashboard for **bedar.org**, built for
ThreeMS × Manar Foundation. Migrating from `bedar.webflow.io`.

---

## Tech stack

| Layer   | Choice                                           |
| ------- | ------------------------------------------------ |
| Build   | Vite 8 (Rolldown bundler)                        |
| UI      | React 18 + React Router 7                        |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), RTL-first |
| Motion  | Framer Motion 12                                 |
| Icons   | lucide-react                                     |
| Backend | Supabase (Postgres + Auth + Storage) — _Phase 4_ |
| Hosting | Vercel, auto-deploy from GitHub `main`           |

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

| Script                             | What it does                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                      | Dev server on :5173                                                            |
| `npm run build`                    | Production build → `dist/`                                                     |
| `npm run preview`                  | Serve the production build locally                                             |
| `npm run lint`                     | ESLint                                                                         |
| `npm run format`                   | Prettier                                                                       |
| `npm run db:push`                  | Apply `supabase/migrations/` to the linked project                             |
| `npm run db:reset`                 | Rebuild the local database from zero (needs Docker)                            |
| `npm run db:seed`                  | Load `src/content/` into Supabase (needs the service-role key)                 |
| `node scripts/optimize-images.mjs` | Re-encode bundled photography to WebP at display size (`--dry-run` to preview) |

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

| Group       | Components                                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core        | `Button` `IconButton` `Badge` `Tag`                                                                                                                                                       |
| Forms       | `Field` `Input` `Textarea` `Select` `Checkbox` `Radio` `Switch` `FileUpload`                                                                                                              |
| Surfaces    | `Card` `Modal` `Tooltip`                                                                                                                                                                  |
| Data & nav  | `Table` `Tabs` `Breadcrumbs` `Accordion`                                                                                                                                                  |
| Composition | `Section` `StickySplit`                                                                                                                                                                   |
| Blocks      | `Hero` `PageHero` `HeroEmblem` `SectionHeading` `ProcessSteps` `NumberedList` `FeatureGrid` `ContentCard` `IconCard` `BrandCard` `Testimonial` `StatBand` `StatRow` `CtaBand` `WordOrbit` |
| Brand       | `Logo` `Spiral` `SpiralDivider` `SocialIcon`                                                                                                                                              |

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

### Page composition

A marketing page describes its structure with these, rather than repeating
wrapper classes. The CSS primitives they lean on are in `styles/layout.css`
(`.panel-inset`, `.panel-quiet`, `.stat-tile`, `.sticky-col`, `.grid-stagger`,
`.rule-fade`, `.process-rail`), one file so a section's shape has one place to
be wrong in.

| Piece                       | What it is                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<Section tone size>`       | `<section>` + `.container-page` + vertical rhythm + surface treatment. Replaced the three-line wrapper every band used to open with.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `<StickySplit aside ratio>` | Two-column spread whose heading half pins (`.sticky-col`) while the content half scrolls. For long reads. `ratio` is written aside/content: `narrow` 0.8/1.2, `even`, `wide` 1.15/0.85, `roomy` 0.68/1.32. A page that needs a wider content column asks for a wider ratio — it must never reorder the columns visually, because the aside is first in the DOM for a reason.                                                                                                                                                                                                                                                                                       |
| `<SectionHeading layout>`   | `stack` (centred/start), `split` (title one side, CTA the other, hairline under both), `aside` (narrow, for `StickySplit`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `<ProcessSteps>`            | Numbered vertical timeline on a rail. For content that is ordered.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `<NumberedList>`            | Rows numbered `01.`, `02.` … with a hairline between them. For content that is _enumerated_ but not ordered — use `ProcessSteps` when it really is a sequence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `<StatRow>`                 | Figures in one ruled row, no tiles. The inline shape, for numbers that sit inside another band. `StatBand` is still the tiled, full-band version.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `<IconCard>`                | The one card behind every "what we offer / value / sector" grid. `compact` for dense label grids. `titleLines` reserves a floor for the title so every card in a row starts its copy on the same baseline. `lines` clamps the paragraph — and **`lines={null}` drops the clamp and the hover swap together**, which is what the homepage services and hackathon goals grids now pass. An unclamped paragraph only balances if the measure can hold it: at the 278px tile a 4-up grid gives, the longest service description is 332px of text in a 128px slot, so those grids went to 3-up in the same change. Pair with `auto-rows-fr` for identical card heights. |
| `<WordOrbit>`               | A ring of words around the spiral. The homepage About band's artwork; the words are `about.values[].title`, never new copy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `<CollectionListing>`       | `/programs`, `/blog`, `/news`: newest item full width, rest in a grid whose column count is derived from how many remain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

**Vary the band shape down a page.** Nine sections of "centred heading, grid
under it" is what made the site read as a template — the heading landed in the
same place every screen. Alternate `split` / `aside` / centred deliberately, and
keep the centred one for bands whose content really is symmetrical.

**No new copy in JSX.** A split header needs a link label and an `aside` heading
often needs a lede; both go in `content/pages.js` like every other string, so
the dashboard can edit them (Infra spec §3).

### The interaction language

Five CSS primitives in `styles/layout.css` carry every hover on the public
site. Use them rather than writing a new transition per component — the point
is that a card behaves the same way on every page.

| Class                                  | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.media-frame` + `.media-zoom`         | A 10px window that clips its image; the image scales to 1.06 on hover (the frame must not scale, or its corners swell). Also fires from an ancestor `.group`.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `.arrow-link`                          | Label + arrow whose `gap` opens from 4px to 12px on hover. `gap` is logical, so the arrow travels leftward in RTL — forward.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `.band-tile`                           | The card hover: 3px lift, shadow shift, brighter edge, plus an accent line wiping across the top and a corner bloom. Transform, opacity and shadow only, so a grid of twelve costs nothing.                                                                                                                                                                                                                                                                                                                                                                                |
| `.swap-rest` + `.swap-in`              | The card's two faces. **The incoming one draws the title exactly as the resting one does** — same size, weight, colour and mint rule, wrapping — so the heading stays legible through the swap instead of shrinking to a truncated mint caption. Only the icon and the clamped paragraph trade places. Leaving the title out of the swap and pinning it instead does not fit: the space under a fixed heading is 127px and the longest description needs 229px.                                                                                                            |
| `.stat-row`                            | Figures separated by hairlines. Which child loses its rule depends on the breakpoint (2-up vs 4-up), which is why it is CSS and not a class string.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.word-orbit*`                         | The ring, its words and their hover. Positions are computed in `WordOrbit`, so the ring stays even at any item count.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `.process-rail` + `.process-rail-fill` | The numbered timeline's connector: a dim track per step with a bright stroke over it that `ProcessSteps` scales from scroll. Drawn per segment, never as one element — see the note in that file. It runs from one marker's **outer edge** to the next one's, never centre to centre: the marker's resting fill is mint at 12%, so a line starting inside it is plainly visible through the numeral. `ProcessSteps` also takes a `date`/`meta` per step — the hackathon timeline's stage dates, as a plain string because several are ranges and `Intl` cannot format one. |
| `.process-step-copy`                   | The gap between one step and the next. Lives in CSS, keyed off `.process-step:not(:last-child)`, because a `last:` utility on the copy div matches **every** step — the copy is always the last child of its own `<li>`. `.process-steps-roomy` opens it from 72px to 88px.                                                                                                                                                                                                                                                                                                |
| `.footer-band`                         | The full-bleed closing band. A hairline across the whole viewport plus a step down in tone; the content stays in `.container-page`.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.quote-panel` + `.quote-stack`        | The testimonials card, and the grid cell every slide shares. All five are rendered and the inactive ones are `visibility: hidden` — measured, so the panel is the height of the longest quote and the band cannot resize when the slide changes.                                                                                                                                                                                                                                                                                                                           |
| `.social-chip`                         | The footer's 44px round account button, carrying a real brand mark from `SocialIcon`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### The reference's interaction patterns, and where they came from

The hovers are not invented. They were read out of the reference template's own
Webflow IX2 data (`Webflow.require('ix2').store.getState().ixData` on
`embrace-center-wcopilot.webflow.io`), which is the only place a Webflow site's
interaction layer actually lives — it is absent from the rendered markup, so
fetching the page as text shows none of it. Its 877 events break down as ~384
scroll-into-view reveals, ~123 hover pairs, ~66 click toggles and 14 continuous
scroll bindings, driving `TRANSFORM_MOVE / SCALE / ROTATE`, `STYLE_OPACITY`,
`STYLE_TEXT_COLOR`, `STYLE_BACKGROUND_COLOR`, `STYLE_FILTER` and `STYLE_BORDER`.

Three of its signatures are ported:

| Reference            | What it does                                                                                | Here                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `.service-list-item` | Resting layer moves down 80px + fades over 500ms; incoming layer rises `y:30→0` over ~260ms | `IconCard`'s `.swap-rest` / `.swap-in` — the card's whole face trades for the full, unclamped description |
| `primary-big-button` | `TRANSFORM_SCALE 0.9` + text/background swap over 300ms — the button gets **smaller**       | `.btn-press`, at 0.96 (a 260px Arabic CTA at 0.9 moves its end 26px and reads as a flinch)                |
| `.dropdown-nav-link` | `TRANSFORM_MOVE x:0→20` on hover                                                            | `.link-slide`, at 10px on `padding-inline-start` so it travels leftward in RTL                            |

`.btn-press` and `.link-slide` are **unlayered** in `layout.css` and scoped to
`.public-site`. Unlayered because Tailwind v4 emits `transform` and the padding
longhands from the `utilities` layer, which outranks `@layer components` however
specific the selector is — inside the layer the press computed to identity and
silently never happened. Scoped because `Button` is shared with the dashboard,
which is out of scope.

**Where hover is the only way in, there is a no-hover fallback.** `@media (hover:
none)` drops the clamp entirely and hides the swap layer: the swap is what gives
the clamped text back, and a device that cannot hover would otherwise never see
it. The grids are single-column at that size, so there is no row left to even up.

**Scroll- and pointer-linked motion.** `ProcessSteps` draws its rail from the
first step to the last through a Framer spring, and drops to a static render
under `prefers-reduced-motion`. `WordOrbit` is a **dial**, not a decoration —
each value is a real `<button>`; hovering, focusing or tapping one dims the other
four and brings that value's own description into the middle of the ring. Its
tilt is CSS custom properties written straight from the pointer handler, with no
animation frame involved.

Its **entrance** is a fourth ported reference behaviour, read out of the same
IX2 data as the three hovers above (`"About Scroll Section"`): the two rings
converge from opposite sides (`translateX ±200px → 0`) while the centre mark
unwinds `rotateZ -180deg → 0`, all over 500ms on a 100ms delay. An
IntersectionObserver adds `is-in` once and disconnects; every transform is a CSS
transition off that class, and the numbers live in `tokens/motion.css` as
`--dur-entrance*` so they collapse with the rest under `prefers-reduced-motion`.
Two structural rules make it work and are easy to undo by accident:

- **A shell moves, the ring inside it spins.** `emblem-orbit-*` and
  `emblem-float` are running animations on `transform`, and a running animation
  beats a transition on the same property — the travel put on the ring itself
  renders as nothing at all.
- **`.word-orbit-rings` must keep its `overflow: hidden`.** A ring translated
  200px at rest would otherwise extend the document's scroll width. Clipping is
  safe _here_ (and not on a section) because nothing inside that box is
  `position: sticky`.

`Reveal` / `StaggerItem` carry four entrance variants: `rise` (default), `lift`
(rise + scale, for card grids), `fall` (arrives from above — the sectors grid's
cascade), and `slide` (arrives from the inline side; `x` is physical and is not
flipped for RTL, because the gesture is spatial rather than reading-order). A
grid whose visual order is not its DOM order — a diagonal cascade — sets the
parent's `step` to 0 and gives each item its own `delay`.

**Everything a page did not animate by hand still arrives.**
`components/motion/AutoReveal.jsx` is mounted once in `PublicLayout` and gives
every remaining block on every public page — body copy, article bodies, the
footer, forms, listings — the same 22px rise over 620ms, from ONE
IntersectionObserver. `styles/reveal.css` holds the states. Four things about it
are load-bearing:

- **It never touches a subtree Framer already owns.** `Reveal`, `Stagger`,
  `StaggerItem` and `ScrollExit` stamp `data-reveal="off"` on themselves; a
  container that _holds_ one is skipped too, so a list of animated rows is not
  faded in underneath them. `data-no-reveal` is the manual opt-out and
  `data-reveal="on" | "left" | "right"` the manual opt-in.
- **Only JavaScript ever hides anything.** Every rule is keyed off an attribute
  that only the observer writes, so no JS means a fully visible page. It also
  refuses to hide an element measuring 0×0 — a collapsed accordion panel cannot
  be left invisible after it opens.
- **The attribute is removed once the reveal settles.** The rules are unlayered
  (they have to beat Tailwind's `transform` utilities), so a lingering
  `transform: none` would outrank `.band-tile:hover` for the life of the page.
  A settled element is byte-for-byte the element it would be without the file.
- **The stagger is decided at reveal time, over the elements arriving in the
  same observer batch** — not at scan time by DOM position. Numbering during
  the scan gives the twentieth paragraph of an article a permanent 420ms delay
  when it is the only thing on screen.
- **Nothing may still be hidden once the reader is at the bottom of the
  document.** The observer's root is shrunk 8% at the bottom so a block starts
  arriving before it is fully on screen — which in the middle of a page is
  free, and at the END of one is a dead band the reader cannot scroll past. It
  cost the footer's legal bar on every page: at 1440×900 the band is 72px, the
  shrunk root ends at 828, and the copyright line sits at 854–870, so
  `كافة الحقوق محفوظة ©` and the design credit were at `opacity: 0` site-wide.
  `flushTail()` is the guard — at maximum scroll it shows anything still
  marked, driven from `scroll`, `resize`, the observer callback and each scan.
  It also covers the page that never scrolls at all. If you change
  `ROOT_MARGIN`, that guard is what keeps the change from hiding content.

The homepage bands, `Navbar`, `Footer` and the card system follow the
**Embrace Center** reference layout (`embrace-center-wcopilot.webflow.io`).
Where its shape needed content this site does not have, the shape changed —
copy was never written, cut or reworded to fit it. Two ports that are
deliberately partial: its 74px/0.9-leading headline sizes carry over but its
leading does not (Arabic collides below ~1.18), and its `scale(1.2)` image zoom
is 1.06 here, because 1.2 on a 16:10 crop throws away a fifth of the frame.

### The interior banner

Every page that is **not** the homepage opens with `PageHero`. It is the title
band the program detail pages were already rendering, lifted out of
`layout/CollectionDetail.jsx` at the client's request ("the layout on the
hackathon inner page is what I want on all sub-pages", Aug 2026): `.surface-dark`

- drifting aurora, an oversized spiral watermark bled off the inline-start edge,
  and a `max-w-3xl` column — centred in the container, **start**-aligned inside —
  carrying breadcrumbs → category chip → eyebrow → `h1` → date.

Three things about it are load-bearing:

- **The background photograph is a prop, and one file sets them all.**
  `src/content/page-banners.js` maps a page to its banner; a page with `null`
  renders on the aurora alone, which is exactly how the hackathon banner looks
  today. The image is dimmed to 30% under a gradient scrim (`.page-hero-photo`
  / `.page-hero-scrim`) — a banner is the one element whose text cannot be
  allowed to fail contrast, and a photograph at full strength puts arbitrary
  luminance behind white Arabic display type. Do not pre-darken the file.
- **The eyebrow is bracketed** — `/ خدمات بدار /` — drawn exactly as
  `SectionHeading` draws its own. The old interior `Hero` printed it bare,
  which is why `/services` was the only listing page whose header looked
  different from `/programs`, `/blog` and `/news`.
- **The breadcrumb label comes from the navigation**, via `breadcrumbsFor(href)`
  in `content/site.js`, not from a per-page string. Renaming a nav item in the
  dashboard renames it in the trail on the same publish.

`Hero` is now the homepage's split shape only.

### The homepage hero

`Hero` has two shapes. Pass `visual` and it splits: copy in the inline-start
column — the **right** half in RTL — and artwork opposite. Pass nothing and it
stays the centred title band every interior page uses.

The copy column is always first in the DOM, which is what puts the text above
the artwork on mobile. No `order-*` utility is involved: reordering visually
would leave the tab order following the layout instead of the reading order.

`HeroArtwork` is the artwork — a set of drawn arcs radiating from the bottom
inline-start corner with the photograph over them. On scroll, **only the
photograph leaves**: `ScrollExit` wraps the photo alone, and the arcs stay
drawn and fully opaque as the band's own structure. The scroll range is the
hero SECTION's, published on `HeroScrollContext` (`ui/heroScroll.js`) because
the photo shrinks as it goes and a `useScroll` target that shrinks underneath
itself feeds its own progress. `ScrollExit` must never be the same element as
`.hero-artwork-photo`: that one runs `hero-artwork-in` with `forwards`, and a
filling animation outranks the inline styles Framer writes.

`HeroEmblem` was the previous artwork — the brand spiral inside three counter-rotating
orbits, over a breathing glow, with the `.hero-aurora` colour fields drifting
behind the whole band. It is CSS animation and not Framer Motion: nothing in it
is interactive, so it belongs on the compositor rather than on the main thread
next to the scroll handlers. Every class it uses stops dead under
`prefers-reduced-motion` — the motion tokens only zero out _transitions_, and an
endless drift is exactly what a vestibular disorder cannot tolerate.

### RTL

`dir="rtl"` is the default, not a variant. **Use logical utilities** — `ps-`/`pe-`,
`ms-`/`me-`, `start-`/`end-`, `border-s-`, `text-start` — so everything flips for
free. Physical utilities are reserved for things that must _not_ flip.

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

**The first paint is never the build-time seed.** `src/content/` is the site's
floor, not its first frame. `ContentContext` holds the page behind the brand
loader (`ready`) until the first read of the published rows settles, so a reload
straight after an edit shows the new copy or nothing — never the old copy
followed by a visible swap, which is what the seed-first render used to do. Two
things bound the wait: a 2 s deadline, and a versioned `localStorage` snapshot of
the last content this browser saw, which is what gets painted if the deadline
passes or the read fails. Neither applies when Supabase is unconfigured — there
`ready` starts true and the seed *is* the site.

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

| Table                       | Holds                                                   |
| --------------------------- | ------------------------------------------------------- |
| `profiles`                  | dashboard users + role (`admin` / `editor`)             |
| `pages`, `page_fields`      | per-page content, SEO, publish state, URL               |
| `collection_items`          | articles, news, programs (one table, one discriminator) |
| `testimonials`, `faq_items` | the two non-article collections                         |
| `services`                  | the services band on `/` and on `/services`             |
| `navigation_items`          | navbar + footer, one ordered tree                       |
| `site_settings`             | organisation schema, integrations, captcha, consent     |
| `media`                     | index over the Storage bucket, alt text per file        |
| `redirects`                 | old path → new path, 301/302                            |
| `content_versions`          | append-only history of every content edit               |

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
writes Supabase directly; there is no API layer between them, because RLS _is_
the authorisation layer and a Node tier in front of it would only be a second
place to forget a policy.

| Screen         | Spec       | What it edits                                                    |
| -------------- | ---------- | ---------------------------------------------------------------- |
| لوحة التحكم    | —          | Counts, drafts waiting, recent edits                             |
| الصفحات        | §2, §5, §6 | Page fields, slug, parent, SEO, publish state                    |
| الهيدر والفوتر | §3.1       | Navigation tree, header CTA, footer copy                         |
| المجموعات      | §3.2       | Articles, news, programs, **services**, testimonials, FAQ        |
| مكتبة الوسائط  | §7         | Upload, alt text, usage, delete                                  |
| إعادة التوجيه  | §8         | Old path → new path, 301/302, enable                             |
| التكاملات      | §11, §4    | GTM, Search Console, head/footer code, captcha, form destination |
| سجل النسخ      | §10        | Every content edit, with restore                                 |
| المستخدمون     | §9         | Roles, activation                                                |
| الأمان         | §13        | TOTP enrolment                                                   |
| الإعدادات      | §6, §12    | Organisation schema, social, consent, own name                   |

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
vector — and RLS does not help there, because an editor is _authorised_ to
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

| Phase | Scope                                                           | Status   |
| ----- | --------------------------------------------------------------- | -------- |
| 1     | Vite + React + Tailwind RTL scaffold, folder structure, routing | ✅ Done  |
| 2     | Design system components (Button, Input, Card, Modal, Hero, …)  | ✅ Done  |
| 3     | Public pages with verbatim content from bedar.webflow.io        | ✅ Done¹ |
| 4     | Supabase schema, RLS, Auth + 2FA                                | ✅ Done² |
| 5     | Admin dashboard (pages, collections, media, SEO, redirects)     | ✅ Done³ |
| 6     | Publish pipeline: version snapshot → GitHub API → Vercel         | ⏳       |
| 7     | End-to-end testing, responsive + a11y pass                      | ⏳       |

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
items carry their metadata _and_ their long-form body.

### Page content lives in `src/content/`

| File                   | Holds                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `site.js`              | Navbar, footer, global settings                                     |
| `pages.js`             | Per-page copy, SEO, services, testimonials, FAQ, form definitions   |
| `collections.js`       | `programs`, `articles`, `news` metadata + `findBySlug` + `loadBody` |
| `collection-bodies.js` | **Generated.** Long-form bodies, keyed by slug                      |

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
That preserves every word but flattens the dated timeline into headings.

**That page build has since happened** (Aug 2026). `content/hackathon.js` holds
its content as structure — goals, three tabbed lists, a dated timeline, an FAQ —
and `pages/public/Hackathon.jsx` is the layout, routed ahead of `:slug` in
`routes.jsx`. Every other program still renders through `ProgramDetail` →
`CollectionDetail`, and the hackathon still appears in the /programs listing like
any other; only its detail view differs.

Three things the prose walk could not reach were read back from the source's
markup and now live in `content/hackathon.js`: the timeline's **dates** (the
source keeps them outside its prose), the FAQ's **questions** (the migrated body
has only the four answers), and the section eyebrows. Two sections the migration
duplicated — the timeline and the tracks list, which the Webflow page renders
twice for its mobile breakpoint — are one list each. `collection-bodies.js` is
untouched and still holds the flat body: it is generated, and re-running
`migrate-bodies.mjs` must not fight the built page.

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

Vercel builds from `main` on every push. Build command and output directory are
auto-detected from Vite (`npm run build` → `dist`); `.nvmrc` pins the Node major.
`vercel.json` holds the SPA fallback rewrite (required — without it a hard
refresh on `/programs` returns a 404), the permanent `/program/*` →
`/programs/*` redirect, security headers, and immutable caching for
fingerprinted assets. `netlify.toml` is kept for the previous host and is
ignored by Vercel.

**Environment variables.** Every `VITE_*` key in `.env.example` must be set in
Project → Settings → Environment Variables, for Production, Preview and
Development. Vite INLINES them at build time, so changing one needs a redeploy,
not a restart — and a missing one ships as an empty string rather than failing
the build. `SUPABASE_SERVICE_ROLE_KEY` belongs to the seed script only and must
never be added to Vercel.

### Form delivery (contact + newsletter)

The public contact form and the footer newsletter signup post to two Vercel
serverless functions — `api/contact.js` and `api/newsletter.js` — which email
each submission to the site inbox via **Resend** (`lib/email.js`, plain `fetch`,
no npm dependency). The browser side is `src/services/publicForms.js`, wired in
as the `onSubmit`/`onSubscribe` props on `<ContactForm>` and `<NewsletterForm>`.
It uses plain `fetch` — no `@supabase/supabase-js` — so the bundle rule still
holds. `vercel.json`'s SPA rewrite excludes `/api/*` so those requests reach the
functions.

These functions read three env vars in Vercel (Production **and** Preview), with
**no** `VITE_` prefix so the API key never ships to the browser:

| Var                  | Purpose                                    | Default                     |
| -------------------- | ------------------------------------------ | --------------------------- |
| `RESEND_API_KEY`     | Resend API key (required)                  | —                           |
| `CONTACT_TO_EMAIL`   | recipient inbox                            | `info@bedar.org`            |
| `CONTACT_FROM_EMAIL` | sender (must be on a Resend-verified domain) | `Bedar <onboarding@resend.dev>` |

Until `bedar.org` is verified in Resend, keep `CONTACT_FROM_EMAIL` at the default
and set `CONTACT_TO_EMAIL` to the address you registered with Resend — Resend only
delivers to the account owner before a domain is verified. After verifying,
switch `CONTACT_FROM_EMAIL` to e.g. `Bedar <noreply@bedar.org>` and
`CONTACT_TO_EMAIL` to `info@bedar.org`. The contact form carries a hidden
honeypot field the endpoints silently drop. To test locally, use `vercel dev`
(plain `npm run dev` serves no functions, so the form's fetch 404s).

**Rollback** — two independent safety nets:

- _Vercel:_ Deployments tab → "Promote to Production" on any earlier build.
  Instant, no rebuild.
- _GitHub:_ `git revert` at the code level.

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
