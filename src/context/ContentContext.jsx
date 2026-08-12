import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { navigation, footer, siteSettings } from '@content/site.js';
import { programs, articles, news } from '@content/collections.js';
import { testimonials as seedTestimonials, faq as seedFaq } from '@content/pages.js';
// Imported from `env` rather than `supabaseClient` deliberately: this
// context is mounted on the public site, and pulling in the Supabase
// client here would drag ~53 kB gzipped into the public bundle. The
// live read below goes through `publicContent.js`, which reads
// published rows over PostgREST with plain `fetch` — no client.
import { hasSupabase } from '@utils/env.js';
import { fetchCollections, fetchTestimonials, fetchFaq } from '@services/publicContent.js';

const ContentContext = createContext(null);

const SEED_COLLECTIONS = { programs, articles, news };

/* ── Seed ⊕ database reconciliation ──────────────────────────────
   Two merge strategies, one per content shape, both chosen to make
   the user-visible promise true — "publish in the dashboard, see it
   on the site" — WITHOUT ever blanking the site if the database is
   empty or unreachable.

   Collections (articles/news/programs) merge BY SLUG, database
   winning: a new item appears, an edited item overrides its seed
   twin, and any seed item the database has not been told about still
   shows. `slug` is the shared natural key (`db:seed` reuses it), so
   there are no duplicates.

   Testimonials and FAQ REPLACE the seed once the database has at
   least one published row. Their ids differ between seed (slug) and
   database (uuid), so a union would show every curated item twice —
   and these are short, hand-picked lists the dashboard is meant to
   own outright. Empty result ⇒ keep the seed. ──────────────────── */
function mergeBySlug(dbList, seedList) {
  const seen = new Set(dbList.map((item) => item.slug));
  return [...dbList, ...seedList.filter((item) => !seen.has(item.slug))];
}

function mergeCollections(db) {
  if (!db) return SEED_COLLECTIONS;
  return {
    programs: mergeBySlug(db.programs, programs),
    articles: mergeBySlug(db.articles, articles),
    news: mergeBySlug(db.news, news),
  };
}

/**
 * Site content — navbar, footer, settings, collections, testimonials,
 * FAQ.
 *
 * Infrastructure spec §3 requires nav, footer and article-style
 * content to be DATA, not hardcoded markup, so the dashboard can edit
 * them and a new article can reach the homepage with no code change.
 * This context is the single seam where that data enters the tree.
 *
 * The static seed in `src/content/` renders on the very first paint
 * (and is the whole site when Supabase is not configured). When it is
 * configured, the effect below reads the published rows and swaps
 * them in — so a hard refresh always shows the current published
 * state, and returning to the tab re-reads it (the `revalidate`
 * listeners), which is the lightweight stand-in for a realtime
 * socket that would have needed the client we keep out of the bundle.
 */
export function ContentProvider({ children }) {
  // `null` = not yet loaded from the database this session. The seed
  // is always the fallback, so the site is never empty.
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!hasSupabase) return undefined;

    let active = true;

    // Async, so this is not a synchronous setState in an effect body
    // (react-hooks/set-state-in-effect). Each source settles on its
    // own; one failing (e.g. a table missing) never blocks the others.
    async function load() {
      const [collections, testimonials, faq] = await Promise.all([
        fetchCollections().catch(() => null),
        fetchTestimonials().catch(() => null),
        fetchFaq().catch(() => null),
      ]);
      if (active) setLive({ collections, testimonials, faq });
    }

    load();

    // Re-read when the reader comes back to the tab or refocuses the
    // window — near-live updates without polling or a websocket.
    const revalidate = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);

    return () => {
      active = false;
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, []);

  const value = useMemo(() => {
    const collections = mergeCollections(live?.collections);
    const testimonials = live?.testimonials?.length ? live.testimonials : seedTestimonials;
    const faq = live?.faq?.length ? live.faq : seedFaq;

    return {
      navigation,
      settings: siteSettings,
      collections,
      testimonials,
      faq,

      /**
       * The footer's "أحدث المقالات" block, resolved from the
       * `articles` collection rather than from a hardcoded list —
       * Infra spec §3: publish a new article and it appears here with
       * no code change. Reads the merged list, so a dashboard-
       * published article reaches the footer too.
       */
      footer: {
        ...footer,
        latestArticles: {
          ...footer.latestArticles,
          items: (collections.articles.length ? collections.articles : footer.latestArticles.seed)
            .slice(0, footer.latestArticles.limit)
            .map((article) => ({ id: article.id, title: article.title, href: article.href })),
        },
      },

      /** Where content is currently coming from — surfaced in the
       *  admin dashboard so it is obvious when the backend is not
       *  yet wired up. */
      source: hasSupabase ? 'supabase' : 'local-seed',
      loading: hasSupabase && live === null,
      error: null,
    };
  }, [live]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used inside <ContentProvider>');
  return context;
}

export default ContentContext;
