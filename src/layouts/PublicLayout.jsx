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
 * AMBIENT BACKGROUND
 * ----------------------------------------------------------------
 * A single `fixed` layer of soft mint/teal radial glows sits behind
 * everything (`-z-10`, above the `bg-app` base but below all content).
 * The pale marketing sections that carry no solid background of their
 * own (`.section-glow`) let it show through, so the whole light run of
 * the page shares one continuous, gently-lit surface instead of
 * reading as separate white blocks. Opaque bands (`.surface-dark`,
 * `.section-wash`) simply cover it. Alphas are low on purpose — felt,
 * not seen — so dark ink keeps its AA contrast everywhere.
 */
export default function PublicLayout() {
  const { pathname } = useLocation();

  return (
    <div className="relative flex min-h-dvh flex-col bg-app">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(55rem 38rem at 12% 6%, rgba(169,225,211,0.22), transparent 60%),' +
            'radial-gradient(48rem 40rem at 92% 26%, rgba(64,116,121,0.13), transparent 55%),' +
            'radial-gradient(52rem 44rem at 50% 102%, rgba(11,122,115,0.12), transparent 60%)',
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
