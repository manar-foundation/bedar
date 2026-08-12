import heroPhoto from '@assets/services/photo-expert-network.webp';
import { useHeroScrollTarget } from './heroScroll.js';
import { ScrollExit } from '@components/motion/ScrollExit.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   HERO ARTWORK — drawn arcs, then the photograph on top of them.

   Replaces `HeroEmblem` (the orbiting spiral) in the homepage hero.
   The emblem restated a mark the navbar already carries two
   centimetres away; this band now carries a PHOTOGRAPH instead —
   people mid-collaboration, which is what the platform is actually
   about — sitting inside a set of arcs that radiate from the outer
   bottom corner.

   THE LOAD SEQUENCE
   ----------------------------------------------------------------
   Two beats, in order, because a photo and five lines arriving at
   once is just a fade:

     1. the arcs DRAW, innermost first, 120ms apart
     2. once the last one lands, the photo fades up and settles from
        a slight scale-down

   The draw is `stroke-dashoffset` on a normalised `pathLength="1"`.
   Normalising matters: without it the 680-radius arc is nearly three
   times the length of the 250 one, so a shared duration would have
   the outer arcs visibly racing the inner ones. With `pathLength`
   every arc travels "1", and the stagger is the only thing setting
   the rhythm.

   WHY CSS AND NOT FRAMER MOTION
   ----------------------------------------------------------------
   Same reason as the emblem before it: this is a fire-once entrance
   with nothing interactive or interruptible in it. Framer would run
   a JS tick per frame for it, on the same main thread as the
   scroll-linked exit above (see `ScrollExit`) — which is the one
   thing here that genuinely needs the main thread. Keeping the
   entrance in CSS leaves that budget alone.

   The photo's own entrance animates transform + opacity only, so it
   stays on the compositor. The arc draw is a paint, not a
   composite — that is unavoidable for a stroke animation, but it is
   five hairlines for 1.6s, once, and it is over before the visitor
   can scroll.

   THE SCROLL EXIT IS THE PHOTO'S ALONE
   ----------------------------------------------------------------
   `Hero` used to wrap this whole component in `<ScrollExit>`, which
   shrank and dissolved the arcs along with the photograph. The arcs
   are the band's STRUCTURE, not part of the photo — they read as
   drawn onto the surface — so they now stay put at full opacity and
   only the photograph dissolves as the hero leaves.

   The range comes off `HeroScrollContext` — the hero SECTION's ref,
   handed down rather than measured here, because the exit has to be
   timed against a box that does not change size: the photo shrinks
   as it goes, and a `useScroll` target that shrinks underneath
   itself feeds its own progress and eases out early. Outside a hero
   the context is `null` and the photo simply renders static. See
   `heroScroll.js`.

   The `ScrollExit` is a WRAPPER around `.hero-artwork-photo`, never
   the same element. That element is running `hero-artwork-in` with
   `animation-fill-mode: forwards`, and a filling animation outranks
   inline styles on the same property — the scroll-driven scale and
   opacity would compute and then simply never render. Same trap as
   `.word-orbit-ring-shell` and `.btn-press`.

   RTL
   ----------------------------------------------------------------
   The arcs are anchored to the bottom INLINE-START corner, which is
   the bottom-right in Arabic. The SVG itself is drawn left-handed,
   so it is mirrored back under `ltr` — `-scale-x-100` is physical
   and therefore stated per direction, exactly like a drawer.
   ================================================================ */

/** Radii ascend so the set reads as one system radiating from a
    single point. The third arc is the bright one, the way the
    reference layout gives one arc in its fan a highlight and leaves
    the rest quieter.

    The first pass ran these at 0.10–0.55 and they barely registered
    on the dark surface — the client read them as missing rather
    than as subtle. They are roughly doubled here, and the outer
    arcs no longer fade toward nothing: an arc that trails off is
    only legible as a fade when the eye can already see where it
    started, which on a near-black band it cannot. Opacity still
    steps DOWN with radius, so the set keeps its depth; it just
    starts from a floor that is actually visible. */
const ARCS = [
  { r: 250, width: 1.5, stroke: 'var(--brand-200)', opacity: 0.55 },
  { r: 350, width: 1.5, stroke: 'var(--brand-200)', opacity: 0.45 },
  { r: 450, width: 2.75, stroke: 'var(--accent-300)', opacity: 0.95 },
  { r: 560, width: 1.5, stroke: 'var(--brand-200)', opacity: 0.36 },
  { r: 680, width: 1.5, stroke: 'var(--brand-200)', opacity: 0.28 },
];

/** Where every arc is centred, in viewBox units — just past the
    bottom-start corner, so only the sweep is ever on screen. */
const CX = 60;
const CY = 820;

export function HeroArtwork({ alt, className }) {
  const scrollTargetRef = useHeroScrollTarget();

  return (
    <div
      className={cn('hero-artwork relative mx-auto w-full max-w-[30rem] lg:max-w-none', className)}
      // The durations live in CSS (`.hero-artwork`); the arc COUNT
      // lives here, because it is a property of the array below.
      // Handing the last index over is what lets the stylesheet cue
      // the photo off the final arc without knowing how many there
      // are — add a sixth arc and the photo waits for it.
      style={{ '--hero-line-last': ARCS.length - 1 }}
    >
      {/* ── The arcs. Absolutely positioned and deliberately larger
            than the photo so they bleed past the column; the hero
            section's own `overflow-hidden` is what crops them. ── */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 720 820"
        fill="none"
        preserveAspectRatio="xMinYMax slice"
        className="hero-lines pointer-events-none absolute bottom-[-12%] start-[-38%] h-[135%] w-[178%] ltr:-scale-x-100"
      >
        {ARCS.map((arc, i) => (
          <path
            key={arc.r}
            // A half-circle: from the point due start-side of the
            // centre, up over the top, down to the point due
            // end-side of it. Sweep flag 1 is clockwise on screen
            // (SVG's y grows downward), i.e. over the top and not
            // under the bottom.
            d={`M ${CX - arc.r} ${CY} A ${arc.r} ${arc.r} 0 0 1 ${CX + arc.r} ${CY}`}
            stroke={arc.stroke}
            strokeOpacity={arc.opacity}
            strokeWidth={arc.width}
            strokeLinecap="round"
            pathLength="1"
            style={{ animationDelay: `calc(var(--hero-line-stagger) * ${i})` }}
          />
        ))}
      </svg>

      {/* ── The photograph, over the arcs. Height-capped rather than
            purely aspect-driven: the hero is exactly one viewport
            tall now, so the artwork has to yield to the copy on a
            short laptop instead of pushing the CTA out of the
            frame.

            `ScrollExit` is the outer layer and `.hero-artwork-photo`
            the inner one — one owns the exit, the other the entrance,
            and they cannot share an element (see the header note).
            No target means no subscription: the artwork renders
            static, which is what every other call site wants. ─── */}
      <ScrollExit targetRef={scrollTargetRef} className="relative">
        <div className="hero-artwork-photo relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.75)]">
          <img
            src={heroPhoto}
            alt={alt}
            width="1100"
            height="825"
            // Above the fold on the site's most-visited page: it must
            // not wait for the lazy-loading heuristic to notice it.
            loading="eager"
            // Lowercase: React 18 passes unknown attributes through
            // verbatim but warns on the camelCase spelling, which it
            // only started mapping in 19.
            fetchpriority="high"
            decoding="async"
            className="aspect-[4/3] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5] lg:max-h-[58vh]"
          />
          {/* Grades the photo into the dark band. Without it the
              bright meeting-room whites cut a rectangle out of the
              surface the rest of the hero is painted on. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--hero-bg)_75%,transparent)] via-transparent to-[color-mix(in_oklab,var(--hero-bg)_25%,transparent)]"
          />
        </div>
      </ScrollExit>
    </div>
  );
}

export default HeroArtwork;
