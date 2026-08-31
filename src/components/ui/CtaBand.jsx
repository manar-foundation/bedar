import { ArrowLeft } from 'lucide-react';

import { Button } from './Button.jsx';
import { Spiral } from './Spiral.jsx';
import { Reveal } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';

/**
 * `to` for an in-app path, `href` for anything that leaves the site.
 *
 * `Button` already routes on which of the two it is given — `to`
 * renders a react-router `<Link>`, `href` an `<a>` with the external
 * `rel`/`target` handling. This band used to hardcode `to`, which
 * turned an absolute URL into a client-side navigation to the path
 * `/https://…`. It matters for program pages whose call to action is
 * an application form on a form host (see `APPLY_URL` in
 * `content/usus-syria.js`), and it is inert for every band that
 * already passes an internal path.
 */
function linkProps(target) {
  const href = target?.href ?? '';
  return /^(https?:|mailto:|tel:)/.test(href) ? { href } : { to: href };
}

/**
 * The closing call-to-action band. The same block ends several
 * marketing pages, so it is one component fed by page data rather
 * than four near-identical copies.
 *
 * AN INSET PANEL, NOT A FULL-BLEED STRIP
 * ----------------------------------------------------------------
 * This used to be a centred stack on a full-width dark band. On a
 * site that is already one continuous dark surface, a full-bleed
 * dark band is invisible — it ends the page with no edge at all.
 * Both reference layouts close on a PANEL (Embrace Center's
 * `cta-1-type-wrapper`, 50px of padding inside a rounded card), and
 * that panel edge is what makes the last thing on the page read as
 * a deliberate destination rather than as more page.
 *
 * `align="split"` (the default) puts the copy on the inline-start and
 * the buttons opposite it, which is the shape when there are two
 * actions. `align="center"` keeps the old centred stack for a band
 * that carries a single action.
 */
export function CtaBand({ eyebrow, title, lede, cta, secondaryCta, align = 'split', className }) {
  const centered = align === 'center';

  return (
    <section className={cn('relative', className)}>
      <div className="container-page section-y">
        <div
          className={cn(
            // Mobile inline padding trimmed (px-7 → px-5) so the two
            // actions have room to sit side by side inside the panel on a
            // phone (client, mobile notes); sm+ keeps the roomier padding.
            'panel-inset px-5 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-20',
            centered && 'text-center',
          )}
        >
          {/* The mark as a watermark bled off the inline-end corner,
              the same treatment BrandCard uses — it ties the closing
              panel to the cards the reader has just scrolled past. */}
          <Spiral
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 size-44 text-brand-200/[0.07] end-6"
          />

          <div
            className={cn(
              'relative flex flex-col gap-8',
              !centered && 'lg:flex-row lg:items-end lg:justify-between lg:gap-16',
            )}
          >
            <div
              className={cn(
                'flex flex-col gap-4',
                centered ? 'mx-auto max-w-2xl items-center' : 'max-w-xl',
              )}
            >
              <Reveal>
                <Spiral className="size-8 text-brand-200" />
              </Reveal>

              {eyebrow ? (
                <Reveal
                  as="p"
                  delay={1}
                  className="text-xs font-semibold tracking-wide text-brand-200"
                >
                  {eyebrow}
                </Reveal>
              ) : null}

              <Reveal delay={2}>
                <h2 className="text-2xl font-bold leading-snug text-white md:text-3xl lg:text-4xl">
                  {title}
                </h2>
              </Reveal>

              {lede ? (
                <Reveal as="p" delay={3} className="text-base leading-relaxed text-brand-100/80">
                  {lede}
                </Reveal>
              ) : null}
            </div>

            {cta ? (
              <Reveal
                delay={4}
                // Client (mobile notes): these two actions sit side by
                // side on the phone, not stacked. `flex-wrap` keeps them
                // in one row where they fit and wraps only if a screen is
                // truly too narrow — replacing `flex-col sm:flex-row`,
                // which stacked them on every phone below 640px.
                className={cn(
                  'flex shrink-0 flex-wrap gap-2 sm:gap-3',
                  centered ? 'items-center justify-center' : 'items-start lg:items-center',
                )}
              >
                {/* ArrowLeft unmirrored — in RTL "forward" is leftward. */}
                <Button
                  variant="accent"
                  size="lg"
                  {...linkProps(cta)}
                  // Trim horizontal padding below sm so both actions fit
                  // one row on a phone; restored to the lg default at sm+.
                  className="max-sm:px-3.5"
                  iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
                >
                  {cta.label}
                </Button>

                {secondaryCta ? (
                  <Button
                    variant="inverse"
                    size="lg"
                    {...linkProps(secondaryCta)}
                    className="max-sm:px-3.5"
                  >
                    {secondaryCta.label}
                  </Button>
                ) : null}
              </Reveal>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaBand;
