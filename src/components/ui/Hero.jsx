import { useRef } from 'react';

import { HeroScrollContext } from './heroScroll.js';
import { Spiral, SpiralDivider } from './Spiral.jsx';
import { RevealOnMount } from '@components/motion/Reveal.jsx';
import { ScrollExit } from '@components/motion/ScrollExit.jsx';
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

   THE SPLIT HERO IS EXACTLY ONE SCREEN
   ----------------------------------------------------------------
   `lg:h-screen` — 100vh, not `min-h`. The homepage hero is meant to
   be the whole first viewport and nothing more, so that the band
   below it is always the reward for the first scroll.

   Mobile gets `min-h-[100dvh]` instead, and the difference is not a
   rounding detail:

   • `dvh` rather than `vh`, because on iOS Safari `100vh` is the
     height with the URL bar RETRACTED. Used as a fixed height it
     puts the bottom of the hero underneath the browser chrome on
     load, which is exactly the overlap the brief rules out.
   • `min-h` rather than `h`, because the phone layout stacks the
     copy AND the artwork in one column. Pinned to one screen that
     would either clip the CTA or force the type down to nothing;
     as a floor, the hero still fills the screen and is free to
     grow past it when the content genuinely needs the room.
   ================================================================ */

export function Hero({
  eyebrow,
  title,
  subtitle,
  actions,
  /* There was a `proof` prop here — one figure and its caption on a
     hairline under the actions, ported from the reference layout's
     `.info-clients-home-1-wrapper`. It is gone at the client's
     request: the same number already leads the الأرقام band, and on
     a hero that is now exactly one viewport tall the rule under the
     buttons closed the column off instead of letting it breathe. */
  /** Artwork for the second column — e.g. <HeroArtwork />. */
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

  // The scroll range the artwork's exit is measured against. It has
  // to be the SECTION and not the artwork's own box: the artwork
  // shrinks as it goes, and a target that changes size underneath
  // `useScroll` re-measures into a moving range — the shrink feeds
  // its own progress and the whole thing eases out early.
  const sectionRef = useRef(null);

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative overflow-hidden',
        dark ? 'surface-dark' : 'bg-gradient-to-b from-brand-50 to-app',
        // See "THE SPLIT HERO IS EXACTLY ONE SCREEN" above.
        split && 'min-h-[100dvh] lg:h-screen',
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
            ? // Fills the section it was just given, with the copy +
              // artwork vertically centred in whatever is left once the
              // floating nav has been cleared. `h-full` is what makes
              // the centring act on the viewport-tall section rather
              // than on the content's own height.
              // Mobile top padding raised from +2rem to +4rem (client,
              // mobile notes: "the title is too close to the menu — give
              // it enough space"). This clears the title from the fixed
              // nav AND opens the gap to the `--nav-h` seam above it.
              // Desktop (`lg:`) keeps +2rem — it was never flagged.
              'flex h-full items-center pt-[calc(var(--nav-h)+4rem)] pb-16 lg:pt-[calc(var(--nav-h)+2rem)] lg:pb-12'
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
          {/* ── Copy — first in the DOM, always ───────────────

                `relative z-[1]` is what keeps the headline ON TOP of
                the artwork's arcs. `HeroArtwork` draws them into a box
                178% as wide as its own column that bleeds far past its
                inline start — on the homepage it reaches x=782 while
                the h1 starts at x=644, so the bright accent arc crosses
                the last word of the title ("المجتمعية"). Being first in
                the DOM does not save the copy: the artwork column is
                `position: relative`, so it paints in the positioned
                step, above static inline text no matter what order the
                two are written in. Making the copy positioned too, one
                step up, puts the arc back BEHIND the letters where it
                reads as depth instead of as a line struck through the
                title.

                `z-[1]` and not `z-10`: the `SpiralDivider` above sits
                at `z-10` and has to stay over this. ──────────────── */}
          <div
            className={cn(
              'relative z-[1] flex flex-col',
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
                  'max-w-xl text-lg leading-relaxed',
                  // The split hero owns a whole viewport, so its copy
                  // is set on a looser rhythm than an interior title
                  // band — the client asked for the column to breathe.
                  // The gaps GROW down the stack (title → text →
                  // buttons) rather than staying equal: equal spacing
                  // reads as a list of three things, widening spacing
                  // reads as one statement resolving into an action.
                  split ? 'mt-7 lg:mt-9' : 'mt-6',
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
                // Client (mobile notes): the two hero actions sit side by
                // side, not stacked — the phone screenshot showed them one
                // under the other. `flex-wrap` keeps them in a row wherever
                // they fit (both clear 375px here) and only drops the
                // second below on a genuinely narrower screen, instead of
                // the old `flex-col sm:flex-row` that stacked everything
                // below 640px.
                className={cn(
                  'flex flex-wrap gap-3',
                  split ? 'mt-11 lg:mt-14' : 'mt-10',
                  centered ? 'items-center justify-center' : 'items-start',
                )}
              >
                {actions}
              </RevealOnMount>
            ) : null}
          </div>

          {/* ── Artwork — second in the DOM, so it lands under the
                copy on mobile and beside it from lg up.

                No `RevealOnMount` here: `HeroArtwork` runs its own
                two-beat entrance (arcs draw, then photo), and a
                wrapper fading the whole thing in at 240ms would have
                shown the finished lines before they had drawn
                themselves.

                THE SCROLL EXIT IS THE PHOTO'S, NOT THE ARTWORK'S
                ------------------------------------------------
                This used to wrap the whole `visual` in `ScrollExit`,
                which took the drawn arcs down with the photograph.
                The client asked for the opposite: the PHOTO dissolves
                on scroll, the arcs stay drawn and fully visible as
                the band's own structure.

                So the section's scroll range is published on
                `HeroScrollContext` and `HeroArtwork` puts the
                `ScrollExit` around its photo alone. The range has to
                stay the section's — see the note on `sectionRef`
                above — which is why it is handed down rather than
                re-measured inside the artwork, and a context rather
                than a prop because that is the one way to pass a ref
                two levels down without anything reading `.current`
                during render (see `heroScroll.js`).

                The legacy `image` prop has no inner structure to
                target, so it keeps the wrapper. ───────────────── */}
          {split ? (
            visual ? (
              <HeroScrollContext.Provider value={sectionRef}>
                <div className="w-full">{visual}</div>
              </HeroScrollContext.Provider>
            ) : (
              <ScrollExit
                targetRef={sectionRef}
                className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sunken shadow-e3"
              >
                {media}
              </ScrollExit>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Hero;
