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
      <div className="panel-inset mx-auto max-w-3xl px-6 py-12 sm:px-10 lg:py-16">
        <h1 className="text-center text-3xl font-bold text-white md:text-4xl">{copy.title}</h1>
        <p className="mt-4 text-center text-lg leading-relaxed text-brand-100/90">{copy.lede}</p>

        <h2 className="mt-10 mb-5 text-xl font-bold text-white">{copy.stepsHeading}</h2>
        <ProcessSteps steps={copy.steps} tone="inverse" />

        <p className="mt-8 font-medium leading-relaxed text-white">{copy.promise}</p>

        <p className="mt-6 leading-relaxed text-brand-100/80">
          {copy.contact.label}{' '}
          <a href={`mailto:${copy.contact.email}`} className="ltr-run underline underline-offset-4">
            {copy.contact.email}
          </a>
          {' — '}
          <a href={`tel:${copy.contact.phone}`} className="ltr-run underline underline-offset-4">
            {copy.contact.phone}
          </a>
        </p>

        <div className="mt-12 flex items-center justify-center gap-8 border-t border-white/10 pt-8">
          <img src={logoManar} alt="مؤسسة منار" className="h-10 w-auto md:h-12" draggable="false" />
          <span aria-hidden="true" className="h-8 w-px bg-white/20" />
          <img src={logoBedarWhite} alt="بدار" className="h-10 w-auto md:h-12" draggable="false" />
        </div>
      </div>
    </Section>
  );
}
