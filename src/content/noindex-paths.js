/* ================================================================
   ROUTES HELD BACK FROM SEARCH.

   A path listed here is served normally — it answers on the live
   site and anyone with the link sees the finished page — but it
   carries `<meta name="robots" content="noindex, nofollow">`, so no
   search engine lists it. It is the "published, but only for people
   we send the link to" state.

   WHY THIS EXISTS IN CODE AND NOT IN THE DASHBOARD
   ----------------------------------------------------------------
   The dashboard's own switch for this is `is_hidden_from_search` on
   a page or collection item, and where a database row backs the URL
   that switch is the right one to use — `api/sitemap.js` already
   honours it.

   It cannot do the job here, for two reasons:

   1. `/programs/usus-syria` is a BUILT page. Its route lives in
      `routes.jsx` and its content in `content/usus-syria.js`; the
      `collection_items` row exists only to put a card in the
      /programs listing. The page answers whether or not that row is
      readable, so a flag on the row cannot govern the page.

   2. That row is deliberately a DRAFT right now, which is what keeps
      the card off the listing — and a draft is invisible to the anon
      key the server reads with. A rule that cannot be read is not a
      rule.

   Note also that `is_hidden_from_search` does not currently emit any
   robots tag at all: `SeoSection.jsx` tells the editor it "adds
   noindex", and only the sitemap half was ever built. Wiring the
   robots tag to that column is the proper fix and is worth doing —
   but it is a separate change with its own blast radius across every
   page and item, and it would still not cover a draft-backed built
   page. This list is the mechanism that actually holds THIS route.

   HOW IT IS ENFORCED — BOTH HALVES, ON PURPOSE
   ----------------------------------------------------------------
   server  `api/html.js` writes the meta into the document before it
           leaves the server. This is the half that matters: a
           crawler that does not execute JavaScript sees only the raw
           response, which is the same reason the head injection
           exists at all (client notes §5).
   browser `PublicLayout` toggles the same tag on navigation, so a
           visitor who arrives elsewhere and clicks through does not
           carry the wrong robots state around the SPA.

   NOT robots.txt. A `Disallow` there would be worse than nothing: it
   stops the crawl, so the noindex is never READ, and a disallowed
   URL can still be listed from inbound links alone. It would also
   publish the path — robots.txt is world-readable, so the one file
   everybody fetches would advertise the page we are holding back.

   TO RELEASE A PATH
   ----------------------------------------------------------------
   Delete its line. Nothing else is involved: the page is already
   live, so it simply becomes indexable on the next deploy. Remember
   the sitemap is a separate gate — a released page reaches it only
   once its row is `published` and not `is_hidden_from_search`.
   ================================================================ */

/**
 * Exact pathnames, no trailing slash, no patterns.
 *
 * A literal set rather than prefixes or globs: this is a short,
 * deliberate, temporary list, and a pattern that quietly swallows a
 * whole branch of the site is the failure mode worth designing out.
 */
export const NOINDEX_PATHS = new Set([
  /* أُسُس سوريا للريادة المجتمعية — live for review by link only,
     at the client's request (Aug 2026). Its listing card is held back
     separately, by keeping the `collection_items` row a draft. Remove
     both together when the programme is announced. */
  '/programs/usus-syria',
]);

/** The robots directive for a held-back route. */
export const NOINDEX_CONTENT = 'noindex, nofollow';

/**
 * Is this pathname held back from search?
 *
 * Trailing slashes are normalised because the same page answers at
 * both `/programs/usus-syria` and `/programs/usus-syria/`, and a
 * crawler that finds the second must not get an indexable copy.
 */
export function isNoindexPath(pathname) {
  if (typeof pathname !== 'string') return false;
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return NOINDEX_PATHS.has(clean);
}

export default { NOINDEX_PATHS, NOINDEX_CONTENT, isNoindexPath };
