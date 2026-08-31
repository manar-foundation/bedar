import { CalendarDays, Tag } from 'lucide-react';

import { Breadcrumbs } from './Breadcrumbs.jsx';
import { Spiral } from './Spiral.jsx';
import { RevealOnMount } from '@components/motion/Reveal.jsx';
import { formatDate, toISODate } from '@utils/format.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   PAGE HERO — the banner at the top of every page that is not the
   homepage.

   WHERE IT CAME FROM
   ----------------------------------------------------------------
   This is the title band the program detail pages were already
   rendering (`/programs/hackathon` and its siblings), lifted out of
   `layout/CollectionDetail.jsx` unchanged. The client pointed at that
   page and asked for its banner everywhere: "the layout used on the
   hackathon inner page is exactly what I want on all sub-pages".

   So the geometry below is not new work and must not be re-tuned in
   isolation — it is the hackathon banner, and every interior page now
   shares it:

     • `.surface-dark` base with the drifting `.hero-aurora` fields
     • an oversized `Spiral` watermark bled off the inline-start edge
       at 6% opacity (the RIGHT edge in RTL, which is where the client
       sees it)
     • a `max-w-3xl` column, centred in the container, with its text
       START-aligned — the block is centred, the type is not
     • breadcrumbs, then category chip, then h1, then date
     • top padding that clears the FIXED navbar (`--nav-h`) rather
       than assuming the header reserves space in flow

   The interior branch of `Hero` (no `visual`) is what the marketing
   pages used before this, and it is a different band: centred type,
   no breadcrumb, no watermark, no chip. Those pages now call this
   instead. `Hero` keeps its split shape for the homepage, which the
   client explicitly excluded.

   THE BACKGROUND IS A PROP, NOT A FORK
   ----------------------------------------------------------------
   `image` is the whole point of extracting this: the client wants a
   dedicated banner photograph per page behind the SAME structure.
   It takes anything that resolves to a URL — an imported asset, a
   Storage URL from the dashboard, a string — and when it is absent
   the band renders exactly as the hackathon page does today, on the
   aurora alone. Nothing else about the layout changes with it, which
   is what "same template, different image" has to mean.

   `src/content/page-banners.js` is the one place to set them; each
   page reads its own key from there so a new photograph is a
   one-line change in a content file rather than an edit to seven
   page components.

   The photo sits UNDER a scrim, not behind raw text. Arabic display
   type over an unmodified photograph fails contrast the moment the
   image has a light region in it, and a banner is the one element on
   a page whose text cannot be allowed to become unreadable — so the
   image is dimmed and a gradient runs the depth of the band. Both
   live in `.page-hero-photo` / `.page-hero-scrim` (layout.css), so
   the treatment is identical on every page that sets one.

   THE EYEBROW IS BRACKETED, LIKE EVERY OTHER LABEL ON THE SITE
   ----------------------------------------------------------------
   `SectionHeading` wraps its eyebrow in a pair of slashes — `/ label /`
   — which is the reference template's section-label styling and the
   one piece of it that survives translation intact (the solidus is
   direction-neutral, so the pair brackets the words in both RTL and
   LTR without a mirrored variant). The old interior `Hero` printed
   its eyebrow bare, so `/services` and friends were the only headers
   on the site whose label was missing its brackets. It is drawn here
   the way `SectionHeading` draws it, declaration for declaration.

   The marks are `aria-hidden`: a screen reader should hear the label,
   not two solidi.
   ================================================================ */

export function PageHero({
  /** Small bracketed label above the title — `/ الخدمات /`. */
  eyebrow,
  title,
  subtitle,
  /** `[{ label, href }]` — the last entry is the current page. */
  breadcrumbs,
  /**
   * Nodes at the TOP of the copy column, above the breadcrumbs and
   * the title — a programme wordmark, a status chip, anything that
   * introduces the page before its name does.
   *
   * `children` renders at the BOTTOM of the column, after the
   * actions, which is the wrong end for this: a mark that belongs
   * over the title cannot be passed as a child and pulled back up
   * with a negative margin. /programs/usus-syria leads with its own
   * wordmark and its location chip here, in place of the breadcrumb
   * trail (client edit, Aug 2026).
   */
  lead,
  /** Category chip, above the title. Used by the collection pages. */
  category,
  /** ISO date string. Rendered as a `<time>` under the title. */
  date,
  /** Buttons under the copy. */
  actions,
  /** Background photograph — see `content/page-banners.js`. */
  image,
  /** Only set this when the photo carries meaning of its own. */
  imageAlt,
  /**
   * Artwork for a SECOND column, beside the copy rather than behind
   * it — the shape `Hero` uses on the homepage, on the banner every
   * other page already shares.
   *
   * `image` and this are not alternatives to each other: `image` is a
   * backdrop (pinned at 30% under a scrim, texture behind the title),
   * this is a picture the reader is meant to look at. A page that
   * wants its photograph SEEN passes it here and leaves its
   * `page-banners` key `null` — which is what /programs/usus-syria
   * does, at the client's request (Aug 2026).
   *
   * Passing both is legal and occasionally right (an atmospheric
   * backdrop behind a framed portrait), so neither clears the other.
   */
  visual,
  /** Extra nodes at the bottom of the column (stats, meta rows). */
  children,
  className,
}) {
  const split = Boolean(visual);

  return (
    <section className={cn('surface-dark relative overflow-hidden', className)}>
      {/* ── The banner photograph, when the page sets one ─────────
             `aria-hidden` unless the caller gives it alt text: a
             decorative backdrop announced by name is noise in a screen
             reader, and the page's h1 sits right beside it. */}
      {image ? (
        <>
          <img
            src={image}
            alt={imageAlt ?? ''}
            aria-hidden={imageAlt ? undefined : 'true'}
            /* Eager, not lazy — it is above the fold on every page
               that has one, and a lazy banner is a visible pop. */
            decoding="async"
            className="page-hero-photo"
          />
          <span aria-hidden="true" className="page-hero-scrim" />
        </>
      ) : null}

      <div className="hero-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {/* Oversized spiral watermark, bled off the inline-start edge. */}
      <Spiral
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -start-16 size-72 text-brand-200/[0.06]"
      />

      <div className="container-page relative pb-16 pt-[calc(var(--nav-h)+3.5rem)] lg:pb-24 lg:pt-[calc(var(--nav-h)+5rem)]">
        {/* Two columns when there is a visual, one when there is not.
            The ratio is `Hero`'s, so the split banner and the split
            homepage hero put their fold in the same place.

            The copy is the FIRST child and the visual the second, so
            in RTL the picture lands on the LEFT of the text with no
            `order` and no direction-specific class — the grid places
            them along the inline axis, which is what flips. Below
            `lg` the grid is one column and they stack, copy first. */}
        <div
          className={cn(split && 'grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16')}
        >
          <div className={cn(split ? 'min-w-0' : 'mx-auto max-w-3xl')}>
            {lead ? <div className="mb-7">{lead}</div> : null}

            {breadcrumbs?.length ? (
              <RevealOnMount>
                <Breadcrumbs
                  className="[&_a]:text-brand-100/70 [&_a:hover]:text-brand-200 [&_span]:text-white"
                  items={breadcrumbs}
                />
              </RevealOnMount>
            ) : null}

            {category ? (
              <RevealOnMount delay={1} className={cn(breadcrumbs?.length ? 'mt-6' : 'mt-0')}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-white/15">
                  <Tag className="size-3.5" aria-hidden="true" />
                  {category}
                </span>
              </RevealOnMount>
            ) : null}

            {/* The bracketed label. Same treatment as `SectionHeading`'s
                eyebrow — see the note at the top of this file. */}
            {eyebrow ? (
              <RevealOnMount
                as="p"
                delay={1}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-200',
                  breadcrumbs?.length || category ? 'mt-6' : 'mt-0',
                )}
              >
                <span aria-hidden="true" className="opacity-60">
                  /
                </span>
                {eyebrow}
                <span aria-hidden="true" className="opacity-60">
                  /
                </span>
              </RevealOnMount>
            ) : null}

            <RevealOnMount delay={2}>
              <h1
                className={cn(
                  'text-3xl font-bold leading-tight text-white md:text-4xl lg:text-[2.75rem]',
                  breadcrumbs?.length || category || eyebrow ? 'mt-5' : 'mt-0',
                )}
              >
                {title}
              </h1>
            </RevealOnMount>

            {subtitle ? (
              <RevealOnMount
                as="p"
                delay={3}
                className="mt-5 text-lg leading-relaxed text-brand-100/80"
              >
                {subtitle}
              </RevealOnMount>
            ) : null}

            {date ? (
              <RevealOnMount delay={3}>
                <time
                  dateTime={toISODate(date)}
                  className="mt-5 inline-flex items-center gap-2 text-sm text-brand-100/70"
                >
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatDate(date)}
                </time>
              </RevealOnMount>
            ) : null}

            {actions ? (
              <RevealOnMount
                delay={4}
                className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                {actions}
              </RevealOnMount>
            ) : null}

            {children}
          </div>

          {visual ? <div className="min-w-0">{visual}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default PageHero;
