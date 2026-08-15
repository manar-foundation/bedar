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
 * (animations.css), a very diffuse field painted as gradients on THIS
 * element, whose box is the full height of the document. It is the
 * FLOOR — it keeps every stretch of the page lifted off raw near-black
 * so the site reads as one continuous surface, and individual sections
 * paint no colour of their own (`.surface-dark`, `.section-wash` and
 * `.section-glow-layer` are all transparent or off in dark) instead of
 * stacking as separately-coloured bands.
 *
 * The lighting you actually SEE is composed per band, by `<Section>`'s
 * own `.section-ambient-layer`: a bloom over the heading and round orbs
 * entering from the edges, different in every section. It used to be
 * two page-tall aurora columns mounted here, which the client rejected
 * — one unchanging shape from the first pixel to the last is a rail,
 * not lighting. See the note on `.section-ambient-layer`.
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
