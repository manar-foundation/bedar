import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { navigation, footer, headerCta, siteSettings } from '@content/site.js';
import { programs, articles, news } from '@content/collections.js';
import * as seedPages from '@content/pages.js';
import { testimonials as seedTestimonials, faq as seedFaq } from '@content/pages.js';
// Imported from `env` rather than `supabaseClient` deliberately: this
// context is mounted on the public site, and pulling in the Supabase
// client here would drag ~53 kB gzipped into the public bundle. The
// live reads below go through `publicContent.js`, which reads
// published rows over PostgREST with plain `fetch` — no client.
import { hasSupabase } from '@utils/env.js';
import {
  fetchCollections,
  fetchFaq,
  fetchNavigation,
  fetchPages,
  fetchSettings,
  fetchTestimonials,
} from '@services/publicContent.js';
import { ALL_SCOPES, subscribe } from '@services/contentSync.js';
import { subscribeToChanges } from '@services/realtime.js';

const ContentContext = createContext(null);

const SEED_COLLECTIONS = { programs, articles, news };

/** How often a visible tab re-reads when the realtime socket is not
 *  available. Only runs while the document is visible, and only until
 *  the socket connects. */
const POLL_MS = 20_000;

/* ── Seed ⊕ database reconciliation ──────────────────────────────
   Three merge strategies, one per content shape, all chosen to make
   the user-visible promise true — "publish in the dashboard, see it
   on the site" — WITHOUT ever blanking the site if the database is
   empty or unreachable.

   Collections: the database is AUTHORITATIVE as soon as it returns
   any published row at all. It used to be a union by slug with the
   seed as a floor, and that quietly broke the other half of the
   promise: deleting a seeded programme in the dashboard, or flipping
   it back to draft, brought its seed twin straight back on the next
   read, which reads on screen as "the delete did not save". The seed
   is now the fallback for an unreachable or an entirely unseeded
   database — the two cases it was actually protecting against — and
   nothing else.

   Pages: DEEP MERGE, database over seed, per field. `page_fields`
   holds one row per dotted key, and a project seeded before a field
   existed simply has no row for it — overlaying rather than
   replacing means that field keeps rendering its seeded copy instead
   of going blank.

   Testimonials and FAQ: REPLACE the seed once the database has at
   least one published row. Their ids differ between seed (slug) and
   database (uuid), so a union would show every curated item twice.
   ──────────────────────────────────────────────────────────────── */

/**
 * True when the read came back and had at least one row somewhere.
 *
 * The check spans all three collections on purpose: emptying the
 * `articles` collection must not resurrect the seeded articles just
 * because that one list is now empty. Only a database with nothing
 * published anywhere is treated as "not seeded yet".
 */
function databaseHasCollections(db) {
  return Boolean(db) && (db.programs.length > 0 || db.articles.length > 0 || db.news.length > 0);
}

function mergeCollections(db) {
  return databaseHasCollections(db) ? db : SEED_COLLECTIONS;
}

/**
 * Overlay `patch` onto `base`, recursing into plain objects only.
 *
 * Arrays are REPLACED, never merged element-wise: a list field is
 * edited as a whole in the dashboard, and index-wise merging would
 * make a shortened list keep the seed's trailing entries.
 */
function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch ?? base;
  if (!base || typeof base !== 'object' || Array.isArray(base)) return patch;

  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = key in base ? deepMerge(base[key], value) : value;
  }
  return out;
}

/**
 * Every page export in `content/pages.js`, with the published field
 * values laid over the top. Keyed by export name (`home`,
 * `socialEntrepreneurship`, …) — see `PAGE_KEYS` in `publicContent`.
 */
function mergePages(db) {
  if (!db) return seedPages;
  const out = { ...seedPages };
  for (const [name, content] of Object.entries(db)) {
    if (name in seedPages) out[name] = deepMerge(seedPages[name], content);
  }
  return out;
}

/** Header nav — the database owns it outright once it has rows. */
function mergeNavigation(db) {
  return db?.header?.length ? db.header : navigation;
}

/**
 * Footer, assembled from the seed, the `footer` settings blob and the
 * navigation columns — the three places the dashboard splits it
 * across (Dashboard spec §3.1 edits the columns as navigation, §6
 * edits the copy as a setting).
 */
function mergeFooter(settings, navColumns) {
  const blob = settings?.footer;
  const merged = blob ? deepMerge(footer, blob) : footer;
  return navColumns?.length ? { ...merged, columns: navColumns } : merged;
}

function mergeSettings(settings) {
  if (!settings) return siteSettings;
  return deepMerge(siteSettings, {
    ...settings.organization,
    ...(settings.social ? { social: settings.social } : {}),
    ...(settings.integrations ? { integrations: settings.integrations } : {}),
    ...(settings.captcha ? { captcha: settings.captcha } : {}),
    ...(settings.consent ? { consent: settings.consent } : {}),
  });
}

/**
 * Site content — navbar, footer, settings, page copy, collections,
 * testimonials, FAQ.
 *
 * Infrastructure spec §3 requires nav, footer and article-style
 * content to be DATA, not hardcoded markup, so the dashboard can edit
 * them and a new article can reach the homepage with no code change.
 * This context is the single seam where that data enters the tree.
 *
 * The static seed in `src/content/` renders on the very first paint
 * (and is the whole site when Supabase is not configured). When it is
 * configured, the reads below fetch the published rows and swap them
 * in.
 *
 * STAYING FRESH. Four signals converge on one `refresh`:
 *
 *   contentSync   a dashboard save, in this tab or another one of
 *                 the same browser. Instant, and the case that
 *                 matters most — the editor checking their own work.
 *   realtime      the same save seen from another device, pushed
 *                 over the Postgres replication stream.
 *   polling       fallback while the tab is visible and the socket
 *                 is not connected, so the site is still eventually
 *                 correct on a network that blocks WebSockets.
 *   focus         returning to the tab, which also covers waking a
 *                 laptop with the site already open.
 */
export function ContentProvider({ children }) {
  // `null` = not yet loaded from the database this session. The seed
  // is always the fallback, so the site is never empty.
  const [live, setLive] = useState(null);

  // Bumped by every refresh so `useAsyncData`-style consumers and the
  // detail routes can re-run their own reads off one dependency.
  const [revision, setRevision] = useState(0);

  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // The in-flight generation. A refresh that resolves after a newer
  // one has already been issued is dropped — otherwise a slow
  // "everything" read can land on top of a fast, newer "collections"
  // read and put the deleted item back on screen.
  const generation = useRef(0);

  const READERS = useMemo(
    () => ({
      collections: fetchCollections,
      testimonials: fetchTestimonials,
      faq: fetchFaq,
      pages: fetchPages,
      navigation: fetchNavigation,
      settings: fetchSettings,
    }),
    [],
  );

  /**
   * Re-read the named scopes (default: all of them).
   *
   * Each source settles on its own — one failing (a table missing, a
   * dropped connection) leaves the others and the previous value
   * untouched rather than blanking the site.
   */
  const refresh = useCallback(
    async (scopes = ALL_SCOPES) => {
      if (!hasSupabase) return;

      const mine = ++generation.current;
      const wanted = scopes.filter((scope) => scope in READERS);
      if (!wanted.length) return;

      const results = await Promise.all(
        wanted.map((scope) =>
          READERS[scope]()
            .then((data) => [scope, data])
            .catch(() => [scope, undefined]),
        ),
      );

      if (mine !== generation.current) return;

      setLive((previous) => {
        const next = { ...previous };
        for (const [scope, data] of results) {
          // `undefined` = this read failed; keep what was showing.
          // `null` is a legitimate "the table is empty" answer.
          if (data !== undefined) next[scope] = data;
        }
        return next;
      });
      setRevision((value) => value + 1);
    },
    [READERS],
  );

  useEffect(() => {
    if (!hasSupabase) return undefined;

    refresh();

    // A save anywhere in this browser — the dashboard runs inside
    // this same provider, so this fires before the editor has even
    // navigated back to the public page.
    const unsubscribe = subscribe((scopes) => refresh(scopes));

    const revalidate = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [refresh]);

  // Cross-device. Reports 'failed' when the socket cannot be reached
  // or the tables are not in the `supabase_realtime` publication, and
  // the poll below covers that case.
  useEffect(() => {
    if (!hasSupabase) return undefined;
    return subscribeToChanges({
      onStatus: (status) => setRealtimeConnected(status === 'connected'),
    });
  }, []);

  useEffect(() => {
    if (!hasSupabase || realtimeConnected) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [realtimeConnected, refresh]);

  const value = useMemo(() => {
    const collections = mergeCollections(live?.collections);
    const testimonials = live?.testimonials?.length ? live.testimonials : seedTestimonials;
    const faq = live?.faq?.length ? live.faq : seedFaq;
    const pages = mergePages(live?.pages);
    const settings = mergeSettings(live?.settings);

    return {
      navigation: mergeNavigation(live?.navigation),
      headerCta: live?.settings?.header_cta ?? headerCta,
      settings,
      pages,
      collections,
      testimonials,
      faq,

      /**
       * The footer's "أحدث المقالات" block, resolved from the
       * `articles` collection rather than from a hardcoded list —
       * Infra spec §3: publish a new article and it appears here with
       * no code change.
       */
      footer: (() => {
        const base = mergeFooter(live?.settings, live?.navigation?.footer);
        return {
          ...base,
          latestArticles: {
            ...base.latestArticles,
            items: (collections.articles.length
              ? collections.articles
              : base.latestArticles.seed ?? []
            )
              .slice(0, base.latestArticles.limit)
              .map((article) => ({ id: article.id, title: article.title, href: article.href })),
          },
        };
      })(),

      /** Re-read on demand. Exposed so a detail route can refetch its
       *  own body after a publish, and so the dashboard can force a
       *  read without a reload. */
      refresh,

      /** Increments on every completed refresh — a stable dependency
       *  for consumers that run their own queries. */
      revision,

      /** Where content is currently coming from — surfaced in the
       *  admin dashboard so it is obvious when the backend is not
       *  yet wired up. */
      source: hasSupabase ? 'supabase' : 'local-seed',
      live: realtimeConnected,
      loading: hasSupabase && live === null,
      error: null,
    };
  }, [live, refresh, revision, realtimeConnected]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used inside <ContentProvider>');
  return context;
}

/**
 * One page's copy, with the dashboard's published edits already laid
 * over the seed.
 *
 * `usePage('blogPage')` replaces a bare `import { blogPage }`. The
 * argument is the EXPORT NAME in `content/pages.js`, not the `pages`
 * table key — `publicContent.PAGE_KEYS` maps between the two, and
 * every export is always present because the merge starts from the
 * seed module. A page therefore renders its own words on the first
 * paint and never waits on the network.
 *
 * Exports with no page row behind them (`services`, `contactCta`,
 * `notFound`) resolve to the seed, which is what they are.
 */
export function usePage(name) {
  const { pages } = useContent();
  return pages[name];
}

export default ContentContext;
