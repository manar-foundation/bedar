import { Spiral, SpiralDivider } from './Spiral.jsx';
import { RevealOnMount } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   HERO — the dark band at the top of a page.

   Deep-teal base plus the soft mint radial glow, via `.surface-dark`
   (see styles/animations.css). This is one of the four places that
   treatment is allowed: hero, impact stats, programs, footer.

   The design-system source builds a LIGHT hero on a
   `brand-50 → bg-app` gradient. That is not the Bedar hero the
   readme describes ("a bold dark hero with a soft mint glow up top")
   and it is not what the live site shows, so the dark treatment is
   the default here and `tone="light"` is the opt-out for interior
   pages that just need a title band.

   TWO SHAPES, ONE COMPONENT
   ----------------------------------------------------------------
   • `visual` given  → split hero: copy in the inline-start column
     (the RIGHT half in RTL), artwork in the other. This is the
     homepage.
   • no `visual`     → the centred title band every interior page
     uses. Untouched.

   The copy column is always FIRST in the DOM. That is what makes the
   mobile order right — text, then artwork — without a single order
   utility: `order-*` would have to be undone at the `lg` breakpoint
   and would leave the tab order following the visual layout instead
   of the reading order.

   Every field is CMS-mappable — this is what the Phase 5 page editor
   writes into.

   NAV CLEARANCE
   ----------------------------------------------------------------
   `Navbar` is `fixed`, not `sticky` (see components/layout/Navbar.jsx)
   so it floats transparently over this section instead of sitting in
   flow above it — that is what lets the header blend into the dark
   hero. Because it no longer reserves space, THIS component is what
   keeps the title out from under the nav row: top padding starts at
   `--nav-h` and adds the section's own breathing room on top of it,
   rather than the two overlapping.
   ================================================================ */

export function Hero({
  eyebrow,
  title,
  subtitle,
  actions,
  /** A short proof line under the actions — the reference layout's
      `.info-clients-home-1-wrapper` ("5,000+ families / empowered
      through donations"). One figure and its caption, no more: it is
      the thing a visitor scans for before they read anything else,
      and the full set of numbers still gets its own band further
      down. Pass `{ value, label }`. */
  proof,
  /** Artwork for the second column — e.g. <HeroEmblem />. */
  visual,
  /** Kept for the older call sites that pass a framed image. */
  image,
  align = 'center',
  tone = 'dark',
  showSpiral = true,
  className,
}) {
  const dark = tone === 'dark';
  const media = visual ?? image;
  const split = Boolean(media);
  const centered = align === 'center' && !split;

  return (
    <section
      className={cn(
        'relative overflow-hidden',
        dark ? 'surface-dark' : 'bg-gradient-to-b from-brand-50 to-app',
        className,
      )}
    >
      {/* The drifting colour fields. Dark heroes only — on the light
          tone there is no contrast headroom for them, and a pale
          band does not read as cold in the first place. */}
      {dark && split ? (
        <div className="hero-aurora">
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {/* A soft seam exactly where the fixed Navbar's bottom edge
          lands (`--nav-h`) — the mark reads as the site's signature
          on the boundary rather than a hard cut between the floating
          header and the section beneath it. In flow with the section
          (not `fixed`), so it scrolls away with the hero like any
          other content instead of hovering over whatever follows. */}
      <div
        aria-hidden="true"
        className="container-page pointer-events-none absolute inset-x-0 top-(--nav-h) z-10"
      >
        <SpiralDivider className={dark ? 'text-brand-200/45' : 'text-brand-300/50'} />
      </div>

      <div
        className={cn(
          'container-page',
          split
            ? // A tall, breathing split hero — fills most of the viewport
              // on desktop (`min-h`) with the copy + artwork vertically
              // centred, so it reads as a proper landing band rather than
              // a short strip. Mobile keeps simple top/bottom padding.
              'pt-[calc(var(--nav-h)+2rem)] pb-16 lg:flex lg:min-h-[88vh] lg:items-center lg:pt-[calc(var(--nav-h)+3rem)] lg:pb-20'
            : // The centred title band every INTERIOR page uses. The
              // brief called its top/bottom spacing too tight, so it is
              // widened here — one place, so every interior hero gets the
              // same generous, identical clearance (homepage uses the
              // split branch above and is unaffected).
              'pt-[calc(var(--nav-h)+4rem)] pb-24 lg:pt-[calc(var(--nav-h)+7rem)] lg:pb-36',
        )}
      >
        <div
          className={cn(
            'grid w-full items-center gap-12',
            split && 'lg:grid-cols-[1.05fr_0.95fr] lg:gap-16',
          )}
        >
          {/* ── Copy — first in the DOM, always ─────────────── */}
          <div
            className={cn(
              'flex flex-col',
              centered ? 'mx-auto max-w-3xl items-center text-center' : 'text-start',
            )}
          >
            {showSpiral && !split ? (
              <RevealOnMount className={cn('mb-8 flex', centered && 'justify-center')}>
                <Spiral className={cn('size-12', dark ? 'text-brand-200' : 'text-brand-400')} />
              </RevealOnMount>
            ) : null}

            {eyebrow ? (
              <RevealOnMount
                as="p"
                delay={1}
                className={cn(
                  'mb-3 text-xs font-semibold tracking-wide',
                  dark ? 'text-brand-200' : 'text-brand-600',
                )}
              >
                {eyebrow}
              </RevealOnMount>
            ) : null}

            <RevealOnMount delay={2}>
              <h1
                className={cn(
                  'font-bold tracking-tight',
                  // The reference sets its h1 at 74px on a 0.9 leading.
                  // The size ports; the leading does not — Arabic at 0.9
                  // collides line to line. 1.18 is the floor that holds.
                  split
                    ? 'text-[2.5rem] leading-[1.18] sm:text-6xl lg:text-[4.25rem]'
                    : 'text-4xl leading-[1.2] sm:text-5xl lg:text-6xl',
                  dark ? 'text-white' : 'text-ink',
                )}
              >
                {title}
              </h1>
            </RevealOnMount>

            {subtitle ? (
              <RevealOnMount
                as="p"
                delay={3}
                className={cn(
                  'mt-6 max-w-xl text-lg leading-relaxed',
                  centered && 'mx-auto',
                  dark ? 'text-brand-100/80' : 'text-ink-secondary',
                )}
              >
                {subtitle}
              </RevealOnMount>
            ) : null}

            {actions ? (
              <RevealOnMount
                delay={4}
                className={cn(
                  'mt-10 flex flex-col gap-3 sm:flex-row',
                  centered ? 'items-center justify-center' : 'items-start',
                )}
              >
                {actions}
              </RevealOnMount>
            ) : null}

            {/* The proof line, separated from the actions by a
                hairline rather than by more space — the reference
                divides them the same way, and on a dark surface a
                rule is the only separator that reads at all. */}
            {proof ? (
              <RevealOnMount
                delay={5}
                className={cn(
                  'mt-10 flex items-center gap-4 border-t border-subtle pt-6',
                  centered && 'justify-center',
                )}
              >
                <span className="text-3xl font-bold tabular-nums text-brand-200">
                  <span className="ltr-run">{proof.value}</span>
                </span>
                <span className="max-w-[16rem] text-sm leading-relaxed text-ink-secondary">
                  {proof.label}
                </span>
              </RevealOnMount>
            ) : null}
          </div>

          {/* ── Artwork — second in the DOM, so it lands under the
                copy on mobile and beside it from lg up. ─────── */}
          {split ? (
            <RevealOnMount
              delay={3}
              className={cn(
                'w-full',
                // A framed photo keeps its card; the emblem is drawn
                // artwork and must not sit in a box.
                visual ? '' : 'aspect-[4/3] overflow-hidden rounded-2xl bg-sunken shadow-e3',
              )}
            >
              {media}
            </RevealOnMount>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Hero;
