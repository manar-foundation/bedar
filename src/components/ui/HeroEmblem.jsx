import { Spiral } from './Spiral.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   HERO EMBLEM — the Bedar spiral inside a slow orbital system.

   The homepage hero used to be a centred block of text on a flat
   dark field: correct, and cold. This is the counterweight — the
   brand's own mark, given depth and a pulse, sitting opposite the
   headline.

   WHY THE SPIRAL AND NOT THE FULL LOGO
   ----------------------------------------------------------------
   `bedar-logo.svg` is a navy wordmark plus the mark. Navy on the
   near-black hero is invisible, and the Arabic headline already
   says "منصة بدار" two centimetres away — a second wordmark would
   be repetition, not branding. The spiral is the ownable motif per
   the design system, so it is what gets the stage.

   WHY CSS ANIMATION AND NOT FRAMER MOTION
   ----------------------------------------------------------------
   Nothing here is interactive or interruptible; it is six elements
   rotating forever. Framer Motion would run a JS tick for every
   frame of that on the main thread, next to the scroll handlers.
   These run on the compositor and cost nothing while the user
   scrolls. Every class used here stops under
   `prefers-reduced-motion` — see styles/animations.css.

   Rotation is symmetric, so nothing in here needs an RTL variant.
   The whole thing is decorative and hidden from assistive tech.
   ================================================================ */

export function HeroEmblem({ className }) {
  return (
    <div
      aria-hidden="true"
      // Capped hard on phones: the emblem sits BELOW the copy there,
      // and a full-width square would push the CTA off the first
      // screen for the sake of decoration.
      className={cn(
        'relative mx-auto aspect-square w-full max-w-[17rem] sm:max-w-[21rem] lg:max-w-[26rem]',
        className,
      )}
    >
      {/* Glow. Sits behind everything and breathes on a 7s cycle. */}
      <div className="emblem-breathe absolute inset-[14%] rounded-full bg-[radial-gradient(circle,var(--accent-400)_0%,transparent_68%)] blur-2xl" />

      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 size-full"
        focusable="false"
      >
        <defs>
          <linearGradient id="bedar-emblem-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent-300)" />
            <stop offset="55%" stopColor="var(--brand-200)" />
            <stop offset="100%" stopColor="var(--accent-400)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="bedar-emblem-ring" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-200)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--brand-200)" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Outer dotted ring — the slowest layer, 90s a turn. */}
        <g className="emblem-orbit-slow" style={{ transformOrigin: '50% 50%' }}>
          <circle
            cx="200"
            cy="200"
            r="186"
            stroke="var(--brand-200)"
            strokeOpacity="0.22"
            strokeWidth="1"
            strokeDasharray="2 12"
            strokeLinecap="round"
          />
          <circle cx="200" cy="14" r="4" fill="var(--accent-300)" />
        </g>

        {/* Middle ring: a hairline circle plus one bright arc, turning
            the other way so the two layers never look glued. */}
        <g className="emblem-orbit-reverse" style={{ transformOrigin: '50% 50%' }}>
          <circle cx="200" cy="200" r="152" stroke="url(#bedar-emblem-ring)" strokeWidth="1.5" />
          <circle
            cx="200"
            cy="200"
            r="152"
            stroke="url(#bedar-emblem-arc)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="26 74"
          />
          <circle cx="352" cy="200" r="5" fill="var(--brand-200)" fillOpacity="0.9" />
        </g>

        {/* Inner ring — the traced one: its dashes crawl along the
            circle as well as rotating with it. */}
        <g className="emblem-orbit" style={{ transformOrigin: '50% 50%' }}>
          <circle
            className="emblem-trace"
            cx="200"
            cy="200"
            r="118"
            stroke="var(--accent-300)"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <circle cx="200" cy="82" r="3.5" fill="var(--accent-300)" fillOpacity="0.8" />
          <circle cx="118" cy="282" r="2.5" fill="var(--brand-200)" fillOpacity="0.6" />
        </g>
      </svg>

      {/* Centre disc. Glass over the glow, with the mark floating
          inside it on a 6s cycle. */}
      <div className="absolute inset-[27%] flex items-center justify-center rounded-full border border-white/12 bg-white/6 shadow-[0_24px_70px_-24px_rgba(11,122,115,0.85)] backdrop-blur-sm">
        <Spiral className="emblem-float h-[58%] w-auto text-brand-200 drop-shadow-[0_6px_18px_rgba(169,225,211,0.35)]" />
      </div>
    </div>
  );
}

export default HeroEmblem;
