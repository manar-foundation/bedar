import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Navbar from '@components/layout/Navbar.jsx';
import Footer from '@components/layout/Footer.jsx';
import BackToTop from '@components/layout/BackToTop.jsx';
import RouteLoader from '@components/layout/RouteLoader.jsx';
import SiteIntegrations from '@components/layout/SiteIntegrations.jsx';
import SiteSchema from '@components/layout/SiteSchema.jsx';
import AutoReveal from '@components/motion/AutoReveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { NOINDEX_CONTENT, isNoindexPath } from '@content/noindex-paths.js';

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
 * own `.section-ambient-layer`, which draws one of seven lighting
 * scenes — four lit and three not. They differ in how many sources
 * they have, where the weight sits and which axis the composition runs
 * along, so no two consecutive bands are lit the same shape, and the
 * unlit ones are what make the lit ones read as chosen. This field is
 * why an unlit band still has tone: it is the floor under all of them.
 * The lighting used to be two page-tall aurora columns mounted here,
 * which the client rejected — one unchanging shape from the first
 * pixel to the last is a rail, not lighting. See the note on
 * `.section-ambient-layer`.
 *
 * NOTHING RENDERS BEFORE THE CONTENT IS CURRENT
 * ----------------------------------------------------------------
 * `ready` is false until the first read of the published content
 * settles (ContentContext, "first paint is not the seed"). While it
 * is, this shell draws the brand loader and nothing else — no
 * navbar, no page, no footer, because all three are content and all
 * three would otherwise paint the build-time seed and then visibly
 * swap. That swap is what the client reported as the old page
 * flashing under the new one after an edit.
 *
 * It is a gate, not a spinner-by-default: `ready` starts TRUE when
 * Supabase is unconfigured, and the context opens it after two
 * seconds regardless, so the slow path costs a bounded wait rather
 * than the site.
 *
 * WHAT THE SHELL CARRIES BESIDES THE PAGE
 * ----------------------------------------------------------------
 * `SiteIntegrations` (GTM, Search Console, the dashboard's custom
 * head/footer code) and `SiteSchema` (site-wide Organization
 * JSON-LD) are mounted OUTSIDE the `ready` gate, so a tag manager
 * is installed and the structured data is in <head> from the first
 * paint rather than after the content read settles. Both render
 * nothing and both are mounted HERE rather than in `App`, because
 * neither belongs on the dashboard — see the header of
 * `SiteIntegrations.jsx`.
 */
/**
 * Keep `<meta name="robots">` in step with the route.
 *
 * The tag that MATTERS is the one `api/html.js` writes into the
 * document before it is sent — a crawler deciding whether to list a
 * URL does not run this code. This is the browser half, and it earns
 * its place on one case: a visitor who lands anywhere else and then
 * clicks through to a held-back page gets no fresh document, so
 * without this the SPA would carry the previous route's robots state.
 *
 * The server's tag is adopted rather than duplicated — it is matched
 * by name, and only removed on a route that is not held back, which
 * is why `data-bedar-injected` is not the selector here.
 */
function useRobotsTag(pathname) {
  const noindex = isNoindexPath(pathname);

  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');

    if (!noindex) {
      // Only ever remove what this site put there. A robots tag in
      // the shell itself would be a site-wide decision, not ours.
      if (existing?.dataset.bedarInjected === 'robots') existing.remove();
      return undefined;
    }

    const tag = existing ?? document.createElement('meta');
    tag.setAttribute('name', 'robots');
    tag.setAttribute('content', NOINDEX_CONTENT);
    tag.dataset.bedarInjected = 'robots';
    if (!existing) document.head.appendChild(tag);

    return undefined;
  }, [noindex]);
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  const { ready } = useContent();

  useRobotsTag(pathname);

  const chrome = (
    <>
      <SiteIntegrations />
      <SiteSchema />
    </>
  );

  if (!ready) {
    return (
      <>
        {chrome}
        <div
          data-theme="dark"
          className="public-site page-ambient flex min-h-dvh flex-col justify-center bg-app"
          // The page has no content yet and the loader speaks for it;
          // announcing a half-built document underneath would be noise.
          aria-busy="true"
        >
          <RouteLoader />
        </div>
      </>
    );
  }

  return (
    // `public-site` scopes the marketing site's interaction rules
    // (layout.css) so none of them can reach the dashboard, which the
    // brief puts explicitly out of scope. Both shells are dark, so
    // `data-theme` cannot be the discriminator.
    <div
      data-theme="dark"
      className="public-site page-ambient relative flex min-h-dvh flex-col bg-app"
    >
      {chrome}
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
