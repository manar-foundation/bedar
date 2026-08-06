import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reset scroll on navigation.
 *
 * Skips when the URL carries a hash (in-page anchor) so deep links to
 * a section still land there, and jumps instantly rather than smooth-
 * scrolling, because a smooth scroll on route change reads as lag.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
