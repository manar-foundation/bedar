import { useEffect, useRef, useState } from 'react';

import { useScrollReveal } from './useScrollReveal.js';
import { usePrefersReducedMotion } from './useMediaQuery.js';

/**
 * Count-up for the impact-stats band ("40+ مبادرة", "2019", "500").
 *
 * Starts when the element scrolls into view and runs on rAF rather
 * than setInterval, so it stays in step with the compositor.
 *
 * Under `prefers-reduced-motion` it returns the final value directly
 * instead of animating to it — a number ticking upward is exactly the
 * kind of motion that rule is meant to suppress. That is done by
 * short-circuiting the return value rather than writing state, so no
 * render is wasted producing a number nobody sees.
 *
 *   const [ref, value] = useCountUp(40);
 *   <span ref={ref}>{formatNumber(value)}+</span>
 */
export function useCountUp(target, { duration = 1600 } = {}) {
  const [ref, visible] = useScrollReveal({ threshold: 0.4 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const frameRef = useRef(0);

  const animated = !prefersReducedMotion && duration > 0;

  useEffect(() => {
    if (!visible || !animated) return undefined;

    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast off the mark, long settle. Reads as
      // "counting" rather than "sliding".
      const eased = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
      setValue(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [visible, animated, target, duration]);

  return [ref, animated ? value : target];
}

export default useCountUp;
