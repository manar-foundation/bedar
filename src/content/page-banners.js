/* ================================================================
   PAGE BANNERS — the background photograph behind each page's
   `<PageHero>`.

   Every interior page renders the SAME banner component (the one
   lifted off the hackathon program page — see components/ui/
   PageHero.jsx). This file is the only thing that differs between
   them, so setting a page's banner is a one-line change here and
   never an edit to the page component.

   TO SET ONE
   ----------------------------------------------------------------
   1. Put the file in `src/assets/banners/` — a wide crop, 2000px on
      the long edge is plenty. WebP; `node scripts/optimize-images.mjs`
      re-encodes anything dropped in as JPEG/PNG.
   2. Import it at the top of this file.
   3. Point the page's key at it.

        import bannerServices from '@assets/banners/services.webp';
        …
        services: bannerServices,

   That is the whole procedure. The banner is dimmed and scrimmed by
   `.page-hero-photo` / `.page-hero-scrim` (styles/layout.css) so the
   white heading over it keeps its contrast whatever the photograph
   is — do not pre-darken the file, or it will be darkened twice.

   `null` is a supported value, not a placeholder to be tidied away:
   the band renders on its own aurora and spiral watermark, which is
   exactly how the hackathon banner looks today. Pages ship without
   photographs until the client supplies them.

   WHY THIS IS NOT IN `pages.js`
   ----------------------------------------------------------------
   `pages.js` is COPY — strings an editor rewrites. A banner is a
   bundled asset that Vite has to fingerprint at build time, so it has
   to be a real `import` rather than a path in a data file. Dashboard-
   uploaded images are a different mechanism entirely: those arrive as
   Storage URLs on the record, and `PageHero`'s `image` prop takes
   either, so a Phase 6 page field can override any of these without
   touching the component.
   ================================================================ */

import bannerUsusSyria from '@assets/banners/usus-syria.webp';

export const pageBanners = {
  /** /about — من نحن */
  about: null,
  /** /social-entrepreneurship — بدار والريادة المجتمعية */
  socialEntrepreneurship: null,
  /** /services — الخدمات */
  services: null,
  /** /programs — البرامج */
  programs: null,
  /** /blog — المدونة */
  blog: null,
  /** /news — الأخبار */
  news: null,
  /** /contact-us — تواصل معنا */
  contact: null,
  /** /programs/hackathon — the hackathon landing page */
  hackathon: null,
  /**
   * /programs/usus-syria — أُسُس سوريا للريادة المجتمعية.
   *
   * A wide crop of `assets/services/photo-management-guidance.jpg`
   * (the founder mapping hypotheses across a wall of notes), which is
   * the closest thing in the bundled photography to what this
   * programme actually does — validate a business model against the
   * market. The crop is committed as WebP the same way the service
   * photographs are; the JPEG it came from is still the master.
   */
  ususSyria: bannerUsusSyria,
};

/**
 * Fallback banner for a collection detail page (`/blog/:slug`,
 * `/news/:slug`, `/programs/:slug`) whose record carries no cover
 * image of its own. The item's own `image` wins when it has one.
 */
export const collectionBanner = null;

export default pageBanners;
