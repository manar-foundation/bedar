import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Navbar from '@components/layout/Navbar.jsx';
import Footer from '@components/layout/Footer.jsx';
import BackToTop from '@components/layout/BackToTop.jsx';

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
 * The whole page shares ONE fixed background — a deep-teal base with a
 * couple of soft, static glows drifting off the top and bottom
 * corners, the same idea as the dashboard canvas. Individual sections
 * no longer paint their own opaque blocks (see `.surface-dark` /
 * `.section-wash` in animations.css, which go transparent in dark), so
 * the page reads as one lit surface with cards floating on it instead
 * of a stack of separately-coloured bands.
 */
export default function PublicLayout() {
  const { pathname } = useLocation();

  return (
    // `public-site` scopes the marketing site's interaction rules
    // (layout.css) so none of them can reach the dashboard, which the
    // brief puts explicitly out of scope. Both shells are dark, so
    // `data-theme` cannot be the discriminator.
    <div data-theme="dark" className="public-site relative flex min-h-dvh flex-col bg-app">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60rem 42rem at 88% -4%, rgba(169,225,211,0.10), transparent 60%),' +
            'radial-gradient(52rem 40rem at 6% 8%, rgba(30,158,147,0.09), transparent 58%),' +
            'radial-gradient(60rem 48rem at 50% 108%, rgba(11,122,115,0.10), transparent 62%)',
        }}
      />

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
