import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a media query.
 *
 * Built on `useSyncExternalStore` rather than useState + useEffect:
 * matchMedia is an external store, and this reads it during render, so
 * there is no first-paint flash of the wrong value and no cascading
 * re-render to correct it.
 *
 * For layout, prefer Tailwind's responsive variants — this is for the
 * cases CSS cannot express, e.g. rendering a different component tree
 * on mobile, or skipping an expensive animation on small screens.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // No SSR in this app, but the third argument is required for the
  // hook to be safe if the site is ever prerendered.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Matches the design system's `--bp-*` scale. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

export default useMediaQuery;
