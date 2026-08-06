import { useEffect, useRef, useState } from 'react';

/** Read once, at mount, before the first paint. */
function shouldRevealImmediately() {
  if (typeof window === 'undefined') return false;
  if (typeof IntersectionObserver === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveal-on-scroll via IntersectionObserver — the same technique the
 * design system uses for `data-reveal`.
 *
 * Fires once and then disconnects: re-animating on every scroll-by is
 * the thing that makes reveal effects feel cheap. Starts already
 * visible when the user prefers reduced motion, so content is never
 * gated behind an animation that will not play — decided in the state
 * initialiser rather than an effect, so there is no frame where the
 * content is hidden from someone who asked for no motion.
 *
 *   const [ref, visible] = useScrollReveal();
 *   <div ref={ref} className={visible ? 'opacity-100' : 'opacity-0'} />
 */
export function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(shouldRevealImmediately);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, visible]);

  return [ref, visible];
}

export default useScrollReveal;
