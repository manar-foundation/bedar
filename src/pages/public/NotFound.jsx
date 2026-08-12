import { Button, Section, Spiral } from '@components/ui';
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
    // The 404 lands under a FIXED navbar with no hero above it to
    // clear it, so it reserves that height itself — the only page on
    // the site whose first element is body content.
    <Section size="lg" className="pt-(--nav-h)">
      <div className="panel-inset px-7 py-16 sm:px-10 lg:py-24">
        <div className="relative mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
          <Spiral className="size-12 text-brand-200" />
          {/* .ltr-run — a bare numeral beside Arabic can bidi-reorder. */}
          <p className="ltr-run text-7xl font-bold tracking-tight text-brand-200/90">
            {notFound.code}
          </p>
          <h1 className="text-2xl font-bold text-white md:text-3xl">{notFound.title}</h1>
          <p className="leading-relaxed text-brand-100/80">{notFound.body}</p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button variant="accent" to={notFound.primaryCta.href}>
              {notFound.primaryCta.label}
            </Button>
            <Button variant="inverse" to={notFound.secondaryCta.href}>
              {notFound.secondaryCta.label}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
