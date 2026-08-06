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
   ================================================================ */

const STEP = 0.08;

export function Reveal({
  children,
  delay = 0,
  y = 24,
  as = 'div',
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
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.56, delay: delay * STEP, ease: [0.2, 0, 0, 1] }}
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
      transition={{ duration: 0.56, delay: delay * STEP, ease: [0.2, 0, 0, 1] }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Reveal;
