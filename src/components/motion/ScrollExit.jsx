import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

import { cn } from '@utils/cn.js';

/* ================================================================
   SCROLL EXIT — an element that shrinks and dissolves as its
   section scrolls off the top of the screen.

   The homepage hero is exactly one viewport tall, so its artwork
   owns the whole first screen and then has to get out of the way.
   Letting it simply scroll away leaves a photograph sliding under
   the next band's copy for half a screen; this ties it to the
   scrollbar instead, so it is scaled down and gone by the time the
   section below arrives.

   THE RANGE
   ----------------------------------------------------------------
   `offset: ['start start', 'end start']` puts progress 0 at the
   moment the section's top meets the viewport's top (page load, for
   a hero) and progress 1 at the moment its BOTTOM does — one full
   viewport of scrolling for a full-height section. Everything is
   spent inside that window, which is what "gone by the next
   section" means. Opacity finishes earlier than scale (0.62 vs
   0.92) on purpose: an element still faintly visible while it is
   also still shrinking reads as debris, so it is fully clear well
   before the transform settles.

   WHY A SPRING ON THE PROGRESS
   ----------------------------------------------------------------
   A mouse wheel does not emit a smooth stream — it emits ~100px
   jumps. Mapped straight onto scale, those jumps are visible as
   steps in the shrink. The spring turns the step into a ramp. It is
   stiff enough (220) that it never reads as lag or float; it is
   only smoothing the input, not adding personality.

   PERFORMANCE
   ----------------------------------------------------------------
   Transform and opacity only, so every frame is a composite and
   nothing here can trigger layout. `will-change` promotes the
   element up front rather than at the first scroll event, which is
   what stops the initial frame from hitching.

   Under `prefers-reduced-motion` the wrapper renders as a plain div
   and nothing subscribes to the scroll at all — no listener, no
   spring, no per-frame work.
   ================================================================ */

/** The subscribing half. Split out so that under reduced motion it
    is never mounted — the scroll listener and the spring's frame
    loop are created by these hooks, and a hook cannot be skipped
    with a conditional. */
function ScrollExitMotion({ targetRef, children, className, ...rest }) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start'],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  });

  const scale = useTransform(progress, [0, 0.92], [1, 0.68]);
  const opacity = useTransform(progress, [0, 0.62], [1, 0]);

  return (
    <motion.div
      style={{ scale, opacity, willChange: 'transform, opacity' }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function ScrollExit({ targetRef, children, className, ...rest }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={cn(className)} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <ScrollExitMotion targetRef={targetRef} className={className} {...rest}>
      {children}
    </ScrollExitMotion>
  );
}

export default ScrollExit;
