import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Breadcrumbs, RichText, Spiral } from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { findBySlug, loadBody } from '@content/collections.js';
import { fetchItemBody, hasSupabase } from '@services/publicContent.js';
import { formatDate, toISODate } from '@utils/format.js';

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

  return (
    <>
      {/* Title band. Dark treatment is fine here — it carries a
          heading and metadata, not long-form body copy. */}
      <section className="surface-dark">
        <div className="container-page py-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <Breadcrumbs
              className="[&_a]:text-brand-100/70 [&_a:hover]:text-brand-200 [&_span]:text-white"
              items={[
                { label: 'الرئيسية', href: '/' },
                { label: breadcrumbLabel, href: backHref },
                { label: item.title },
              ]}
            />

            {item.category ? (
              <p className="mt-6 text-xs font-semibold text-brand-200">{item.category}</p>
            ) : null}

            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">{item.title}</h1>

            {item.date ? (
              <time
                dateTime={toISODate(item.date)}
                className="mt-4 block text-sm text-brand-100/70"
              >
                {formatDate(item.date)}
              </time>
            ) : null}
          </div>
        </div>
      </section>

      {/* Body — light surface. Long-form Arabic never sits on dark. */}
      <article className="container-page section-y">
        <div className="mx-auto max-w-3xl">
          {/* Cover image — dashboard-uploaded, resolved from Storage.
              Pulled up to overlap the dark title band above it. */}
          {typeof item.image === 'string' && item.image ? (
            <Reveal className="-mt-14 mb-10 overflow-hidden rounded-2xl shadow-e3 lg:-mt-20">
              <img
                src={item.image}
                alt={item.imageAlt ?? ''}
                className="aspect-[16/9] w-full object-cover"
              />
            </Reveal>
          ) : null}

          {item.excerpt ? (
            <Reveal as="p" className="text-lg leading-relaxed text-ink">
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

          <Reveal className="mt-12 border-t border-subtle pt-8">
            {/* ArrowRight unmirrored — in RTL "back" is rightward. */}
            <Link
              to={backHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 no-underline hover:text-brand-700"
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
