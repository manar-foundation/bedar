import { Button, Spiral } from '@components/ui';
import { useSeo } from '@hooks/useSeo.js';
import { notFound } from '@content/pages.js';

/**
 * 404.
 *
 * Fixed content by design — the Dashboard spec (§2, §14) puts an
 * editable 404 explicitly out of scope for v1, so this page is not
 * backed by any content record and never appears in the page list.
 * The strings still live in `pages.js` so the file stays a single
 * inventory of what the site says.
 */
export default function NotFound() {
  useSeo(notFound.seo);

  return (
    <section className="container-page section-y">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
        <Spiral className="size-12 text-brand-300" />
        {/* .ltr-run — a bare numeral beside Arabic can bidi-reorder. */}
        <p className="ltr-run text-6xl font-bold text-brand-500">{notFound.code}</p>
        <h1 className="text-2xl font-bold text-ink md:text-3xl">{notFound.title}</h1>
        <p className="leading-relaxed text-ink-secondary">{notFound.body}</p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button to={notFound.primaryCta.href}>{notFound.primaryCta.label}</Button>
          <Button variant="secondary" to={notFound.secondaryCta.href}>
            {notFound.secondaryCta.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
