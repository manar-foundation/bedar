import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   BACK-TO-TOP — a floating button that fades in once the visitor has
   scrolled past the first screen, and returns them to the top.

   Distinct from `ScrollToTop.jsx`, which silently resets scroll on
   route change; this is a visible control the user clicks.

   Placement is logical (`end-*`), so it sits in the bottom-inline-end
   corner — the LEFT in this RTL site. `scrollY` is read through a
   passive listener (mirrors Navbar's scroll handler), and the smooth
   scroll drops to an instant jump under `prefers-reduced-motion`.
   ================================================================ */

const SHOW_AFTER = 480;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'instant' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="العودة إلى أعلى الصفحة"
      tabIndex={visible ? 0 : -1}
      className={cn(
        'fixed end-5 bottom-5 z-40 inline-flex size-12 items-center justify-center rounded-full',
        'bg-accent-500 text-white shadow-e3 ring-1 ring-white/15',
        'transition-[opacity,transform] duration-(--dur-base) ease-(--ease-standard)',
        'hover:bg-accent-600 focus-visible:outline-none focus-visible:shadow-focus',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}

export default BackToTop;
