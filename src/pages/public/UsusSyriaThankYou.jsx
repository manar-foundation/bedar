import { Section, ProcessSteps } from '@components/ui';
import { useSeo } from '@hooks/useSeo.js';
import { ususSyriaThankYou as copy } from '@content/usus-syria.js';
import logoManar from '@assets/partners/manar.svg';
import logoBedarWhite from '@assets/bedar-logo-white.svg';

/**
 * /osos/thank-you — confirmation shown after the أُسُس سورية form.
 *
 * Fixed copy (`ususSyriaThankYou`), held out of search by
 * `content/noindex-paths.js`. Both logos are white artwork, so the page
 * stays on the site's dark surface. It sits under the FIXED navbar with
 * no hero above it, so it reserves the navbar height itself, like the 404.
 */
export default function UsusSyriaThankYou() {
  useSeo(copy.seo);

  return (
    <Section size="lg" className="pt-(--nav-h)">
      <div className="panel-inset mx-auto max-w-4xl px-7 py-14 sm:px-14 md:py-20 lg:px-20 lg:py-24">
        <h1 className="text-center text-4xl font-bold text-white md:text-5xl">{copy.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-loose md:text-xl text-brand-100/90">{copy.lede}</p>

        <h2 className="mt-14 mb-8 text-2xl font-bold text-white">{copy.stepsHeading}</h2>
        <ProcessSteps steps={copy.steps} tone="inverse" />

        <p className="mt-12 text-lg font-medium leading-loose text-white">{copy.promise}</p>

        {/* Label on its own line, then each contact on a line of its own —
            side by side they wrapped mid-pair on a phone. */}
        <div className="mt-8 leading-loose text-brand-100/80">
          <p>{copy.contact.label}</p>
          <p>
            <a href={`mailto:${copy.contact.email}`} className="ltr-run underline underline-offset-4">
              {copy.contact.email}
            </a>
          </p>
          <p>
            <a href={`tel:${copy.contact.phone}`} className="ltr-run underline underline-offset-4">
              {copy.contact.phone}
            </a>
          </p>
        </div>

        <div className="mt-16 flex items-center justify-center gap-5 border-t border-white/10 pt-12 sm:gap-10">
          <img src={logoManar} alt="مؤسسة منار" className="h-7 w-auto min-w-0 sm:h-12 md:h-14" draggable="false" />
          <span aria-hidden="true" className="h-7 w-px bg-white/20 sm:h-10" />
          <img src={logoBedarWhite} alt="بدار" className="h-7 w-auto min-w-0 sm:h-12 md:h-14" draggable="false" />
        </div>
      </div>
    </Section>
  );
}
