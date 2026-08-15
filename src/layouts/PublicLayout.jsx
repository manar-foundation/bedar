import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Navbar from '@components/layout/Navbar.jsx';
import Footer from '@components/layout/Footer.jsx';
import BackToTop from '@components/layout/BackToTop.jsx';
import AutoReveal from '@components/motion/AutoReveal.jsx';

/**
 * Shell for every public page: sticky navbar, animated main, footer.
 *
 * The page transition is deliberately small — an 8px rise and a fade
 * over 280ms. Anything bigger fights the scroll-reveal animations
 * inside the page and reads as a slow site rather than a polished one.
 * `prefers-reduced-motion` is honoured by Framer Motion's own
 * `useReducedMotion` handling of these transforms.
 *
 * DARK-ONLY, ONE CONTINUOUS SURFACE
 * ----------------------------------------------------------------
 * The public site renders dark, always. It pins `data-theme="dark"`
 * on its own shell rather than trusting the global <html> attribute,
 * so the admin theme toggle (the only remaining toggle) can never
 * leak light mode onto the marketing site.
 *
 * `AutoReveal` is mounted here, once, for the whole public site: one
 * IntersectionObserver that gives every block of content on every page
 * the same scroll entrance, without nine page files having to wrap
 * every element they own. It renders nothing and it never touches a
 * subtree that Framer already animates — see that component's header.
 *
 * The whole page shares ONE background: `bg-app` plus `.page-ambient`
 * (animations.css), every soft glow on the site painted as gradients
 * on THIS element, whose box is the full height of the document.
 * Individual sections paint nothing of their own — `.surface-dark`,
 * `.section-wash` and `.section-glow-layer` are all transparent or off
 * in dark — so the page reads as one continuous lit canvas with cards
 * floating on it instead of a stack of separately-coloured bands.
 *
 * The glows belong to the DOCUMENT, not to the viewport, and that is
 * the point of this pass: the fixed layer that used to live here pinned
 * three glows to the screen, so scrolling 9,000px moved the content
 * past lighting that never changed. (It also never rendered at all —
 * see the stacking-context note in `.page-ambient`, which is why the
 * site read as one lit hero above eight flat bands.) Sized to the
 * document, the light drifts from one side to the other as you read
 * down the page and no two sections are lit alike.
 */
export default function PublicLayout() {
  const { pathname } = useLocation();

  return (
    // `public-site` scopes the marketing site's interaction rules
    // (layout.css) so none of them can reach the dashboard, which the
    // brief puts explicitly out of scope. Both shells are dark, so
    // `data-theme` cannot be the discriminator.
    <div
      data-theme="dark"
      className="public-site page-ambient relative flex min-h-dvh flex-col bg-app"
    >
      <AutoReveal />

      {/* Page aurora: three slowly-drifting layers of teal light — a
          varied organic field (columns, highlights, corner blooms), not
          just side bars (the threems.co.uk reference, in brand palette).
          Real layers rather than a background so each can drift on its
          own transform path; clipped and z-index -1, so it is contained
          (no scroll width, sticky still pins) and paints behind all
          content and between every section seam. See `.page-aurora` in
          animations.css. */}
      <div aria-hidden="true" className="page-aurora">
        <span />
        <span />
        <span />
      </div>

      <Navbar />

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />
      <BackToTop />
    </div>
  );
}
