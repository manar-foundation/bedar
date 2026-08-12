import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@utils/cn.js';

/* ================================================================
   REVEAL — the one scroll-reveal used across the marketing site.

   The design system specifies a 24px rise over 560ms on
   cubic-bezier(0.2,0,0,1), firing once when the element enters the
   viewport. That is exactly what this is, and having it in one place
   is what stops six pages from each inventing their own slightly
   different reveal.

   `once: true` matters: re-animating every time an element scrolls
   back into view is the thing that makes a site feel cheap, and it
   makes long pages exhausting to scroll back up.

   Under `prefers-reduced-motion` the element renders plain — not
   "animated faster", not "faded instead". No motion.

   `<Reveal delay={1}>` is a STEP, not seconds: children in a group
   stagger at 80ms per step, matching the homepage hero.

   VARIANTS
   ----------------------------------------------------------------
   Four, all settling on the same easing and duration so mixing them
   in one section still reads as a single system:

     rise   (default) the plain 24px lift from below.
     lift   adds a slight scale-up so a card reads as coming toward
            the reader — for grids of cards, where a pure translate
            looks flat.
     fall   arrives from ABOVE instead of below. For a grid whose
            tiles should look like they are settling into place
            rather than rising into it (brief §3: "الهبوط المنساب من
            الأعلى"). Paired with a stagger it reads as a cascade.
     slide  arrives from the inline side. `x` is PHYSICAL in Framer
            Motion, so the caller passes a signed `x` and the sign
            means "from the left" / "from the right" on screen —
            deliberately not flipped for RTL, because a tile sliding
            in from the near edge of its own column is a spatial
            gesture, not a reading-order one.

   Every variant animates transform + opacity only. Nothing here
   touches a layout property, so a twelve-tile grid animating at once
   stays on the compositor.
   ================================================================ */

const STEP = 0.08;
const DURATION = 0.56;
const EASE = [0.2, 0, 0, 1];

/** Initial state per variant. */
function initialFor(variant, y, x) {
  if (variant === 'lift') return { opacity: 0, y, scale: 0.965 };
  if (variant === 'fall') return { opacity: 0, y: -y, scale: 0.97 };
  if (variant === 'slide') return { opacity: 0, x, scale: 0.97 };
  return { opacity: 0, y };
}

function targetFor(variant) {
  if (variant === 'lift' || variant === 'fall') return { opacity: 1, y: 0, scale: 1 };
  if (variant === 'slide') return { opacity: 1, x: 0, scale: 1 };
  return { opacity: 1, y: 0 };
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  x = 0,
  as = 'div',
  variant = 'rise',
  className,
  amount = 0.2,
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] ?? motion.div;

  if (reduceMotion) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <Component
      initial={initialFor(variant, y, x)}
      whileInView={targetFor(variant)}
      viewport={{ once: true, amount }}
      transition={{ duration: DURATION, delay: delay * STEP, ease: EASE }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Same reveal, but fires on mount instead of on scroll. For
 * above-the-fold content — a hero must never wait for an
 * IntersectionObserver callback it is already past.
 */
export function RevealOnMount({ children, delay = 0, y = 24, as = 'div', className, ...rest }) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] ?? motion.div;

  if (reduceMotion) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <Component
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION, delay: delay * STEP, ease: EASE }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

/* ================================================================
   STAGGER — a container that reveals its children in sequence.

   The alternative is `<Reveal delay={index}>` on every child, which
   makes the delay a property of the ITEM rather than of the list:
   the moment a grid is filtered or reordered, the delays no longer
   match the visual order. Here the parent owns the rhythm, the
   children only say "I am a step", and the whole group is driven by
   ONE viewport observer instead of one per card.

   Pair with `<StaggerItem>`. Both collapse to plain elements under
   `prefers-reduced-motion`.
   ================================================================ */

export function Stagger({
  children,
  as = 'div',
  className,
  amount = 0.15,
  step = STEP,
  delay = 0,
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] ?? motion.div;

  if (reduceMotion) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <Component
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: step, delayChildren: delay } },
      }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * One step inside a <Stagger>.
 *
 * `delay` (seconds) is an EXTRA offset on top of whatever the parent's
 * `staggerChildren` contributes. It exists for grids whose visual
 * order is not their DOM order — a diagonal cascade across a
 * multi-column grid, say, where the delay is a function of the tile's
 * row and column rather than of its index. Set the parent's `step` to
 * 0 when you drive the rhythm this way, or the two rhythms compound.
 */
export function StaggerItem({
  children,
  as = 'div',
  y = 24,
  x = 0,
  delay = 0,
  variant = 'lift',
  className,
  ...rest
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] ?? motion.div;

  if (reduceMotion) {
    const Plain = as;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <Component
      variants={{
        hidden: initialFor(variant, y, x),
        shown: {
          ...targetFor(variant),
          transition: { duration: DURATION, ease: EASE, delay },
        },
      }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Reveal;
