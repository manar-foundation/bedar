import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { PageHero, RichText, Spiral } from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { findBySlug, loadBody } from '@content/collections.js';
import { collectionBanner } from '@content/page-banners.js';
import { fetchItemBody, hasSupabase } from '@services/publicContent.js';

/* ================================================================
   COLLECTION DETAIL — one layout behind /blog/:slug, /news/:slug
   and /programs/:slug.

   The three collections share a shape (title, date, excerpt,
   category, body), so they share a renderer. A per-collection page
   would be three copies of the same file drifting apart.

   MISSING ITEM → 404, not a blank page. A slug that does not resolve
   renders the real NotFound route, so a dead link behaves like a
   dead link instead of showing empty furniture.

   EMPTY BODY → an honest notice, not a blank column. Bodies come
   from the generated `collection-bodies.js`; a record with none is
   either newly created in the dashboard or one the migration could
   not parse, and saying so beats rendering an article-shaped void.
   ================================================================ */

export function CollectionDetail({
  collection,
  collectionName,
  slug,
  backHref,
  backLabel,
  breadcrumbLabel,
}) {
  const item = findBySlug(collection, slug);

  // Hooks must run unconditionally, so useSeo is called with the
  // item's SEO or nothing — the redirect below happens after.
  useSeo(
    item
      ? (item.seo ?? {
          title: `${item.title} | منصة بدار للريادة المجتمعية`,
          description: item.excerpt,
        })
      : {},
  );

  if (!item) return <Navigate to="/404" replace />;

  return (
    <DetailBody
      item={item}
      collectionName={collectionName}
      backHref={backHref}
      backLabel={backLabel}
      breadcrumbLabel={breadcrumbLabel}
    />
  );
}

/**
 * Split out so the body fetch lives behind the not-found guard —
 * hooks cannot run conditionally, and there is no sense loading a
 * 15 kB chunk for a slug that does not exist.
 */
function DetailBody({ item, collectionName, backHref, backLabel, breadcrumbLabel }) {
  const [body, setBody] = useState(null); // null = loading

  useEffect(() => {
    let active = true;
    // Async, so this is not a synchronous setState in an effect body
    // (react-hooks/set-state-in-effect). `active` drops the result
    // if the reader navigated away before the chunk arrived.
    //
    // Body resolution order: the generated static seed first (the
    // migrated Webflow bodies), then the database. An item authored in
    // the dashboard has no seed entry, so its body comes from the
    // `collection_items.body` block array over PostgREST.
    async function resolveBody() {
      const seed = await loadBody(item.slug);
      if (seed.length > 0) return seed;
      if (hasSupabase && collectionName) {
        const dbBody = await fetchItemBody(collectionName, item.slug).catch(() => null);
        if (dbBody) return dbBody;
      }
      return seed; // [] — renders the "no body yet" notice
    }

    resolveBody().then((blocks) => {
      if (active) setBody(blocks);
    });
    return () => {
      active = false;
    };
  }, [item.slug, collectionName]);

  const loading = body === null;
  const hasBody = Array.isArray(body) && body.length > 0;

  const hasCover = typeof item.image === 'string' && Boolean(item.image);

  return (
    <>
      {/* Title band. This is where `PageHero` came from: the markup
          that used to be inlined here is now that component, and every
          interior page on the site renders it (the client asked for
          this page's header everywhere — see the note in
          components/ui/PageHero.jsx). Nothing about how these pages
          look changed in the move; they simply stopped being the only
          pages that looked this way.

          No `image` from the item: a record's own cover is already
          rendered below the band, overlapping it. Putting the same
          photograph behind the title as well would show it twice,
          once at 30% and once in full, forty pixels apart. */}
      <PageHero
        breadcrumbs={[
          { label: 'الرئيسية', href: '/' },
          { label: breadcrumbLabel, href: backHref },
          { label: item.title },
        ]}
        category={item.category}
        title={item.title}
        date={item.date}
        image={collectionBanner}
      />

      {/* Body. The cover runs at the container's full width — an
          article's one image should not be capped at the text
          measure — and the prose below it sits in a 3xl column, which
          is ~70 Arabic characters per line. */}
      <article className="container-page section-y">
        {/* Cover image — dashboard-uploaded, resolved from Storage.
            Pulled up to overlap the dark title band above it. */}
        {hasCover ? (
          <Reveal className="-mt-14 mb-12 overflow-hidden rounded-2xl shadow-e3 ring-1 ring-white/10 lg:-mt-28 lg:mb-16">
            <img
              src={item.image}
              alt={item.imageAlt ?? ''}
              className="aspect-[16/9] w-full object-cover"
            />
          </Reveal>
        ) : null}

        <div className="mx-auto max-w-3xl">
          {item.excerpt ? (
            // Lead paragraph — set apart from the body with a larger
            // measure and an inline-start accent rule (flips in RTL).
            <Reveal
              as="p"
              className="border-s-2 border-brand-300 ps-5 text-lg font-medium leading-relaxed text-ink dark:border-brand-500"
            >
              {item.excerpt}
            </Reveal>
          ) : null}

          {loading ? (
            // Skeleton rather than a spinner: the shape tells the
            // reader an article is coming, and it holds the layout
            // so nothing jumps when the chunk lands.
            <div className="mt-8 flex flex-col gap-4" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="skeleton h-4 rounded-sm last:w-2/3" />
              ))}
            </div>
          ) : hasBody ? (
            <RichText blocks={body} className="mt-8" />
          ) : (
            <Reveal className="mt-10 flex flex-col items-center gap-4 rounded-lg border border-dashed border-default px-6 py-12 text-center">
              <Spiral className="size-8 text-brand-300" />
              <p className="text-sm text-ink-muted">لا يوجد نص منشور لهذا المحتوى بعد.</p>
            </Reveal>
          )}

          <Reveal className="mt-14 border-t border-subtle pt-8">
            {/* ArrowRight unmirrored — in RTL "back" is rightward.
                `.arrow-link` is the site-wide gesture: the arrow moves
                away from the label on hover rather than the link
                sliding, so this reads the same as every other arrow on
                the site. */}
            <Link
              to={backHref}
              className="arrow-link text-sm font-semibold text-brand-200 no-underline hover:text-mint-300"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
              {backLabel}
            </Link>
          </Reveal>
        </div>
      </article>
    </>
  );
}

export default CollectionDetail;
