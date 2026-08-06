import { Card, CtaBand, Hero, SectionHeading, SpiralDivider } from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { socialEntrepreneurship as page } from '@content/pages.js';

/* Sector icons — the mint line illustrations from the source site,
   one per قطاع, keyed by `sector.id`. */
import iconHealth from '@assets/sectors/health.svg';
import iconEdtech from '@assets/sectors/edtech.svg';
import iconWash from '@assets/sectors/wash.svg';
import iconAgri from '@assets/sectors/smart-agriculture.svg';
import iconEnergy from '@assets/sectors/renewable-energy.svg';
import iconIndustry from '@assets/sectors/industry.svg';
import iconEnvironment from '@assets/sectors/environment.svg';
import iconFintech from '@assets/sectors/fintech.svg';
import iconUrban from '@assets/sectors/urban-sustainability.svg';
import iconCulture from '@assets/sectors/culture-arts.svg';
import iconAi from '@assets/sectors/ai.svg';
import iconEconomic from '@assets/sectors/economic-development.svg';

/* Impact-horizon icons — same source illustrations, on the dark band. */
import iconShortTerm from '@assets/impact/short-term.svg';
import iconMediumTerm from '@assets/impact/medium-term.svg';
import iconLongTerm from '@assets/impact/long-term.svg';

const sectorIcon = {
  health: iconHealth,
  edtech: iconEdtech,
  wash: iconWash,
  'smart-agriculture': iconAgri,
  'renewable-energy': iconEnergy,
  industry: iconIndustry,
  environment: iconEnvironment,
  fintech: iconFintech,
  'urban-sustainability': iconUrban,
  'culture-arts': iconCulture,
  ai: iconAi,
  'economic-development': iconEconomic,
};

const impactIcon = {
  'short-term': iconShortTerm,
  'medium-term': iconMediumTerm,
  'long-term': iconLongTerm,
};

/**
 * بدار والريادة المجتمعية — the concept page.
 *
 * This is the most text-heavy page on the site, so it is also the
 * one that most needs the light surface: long-form Arabic body copy
 * never sits on a dark or glowing background (CLAUDE.md). Only the
 * hero, the sectors icons and the closing impact/CTA bands carry the
 * dark or tinted treatment.
 */
export default function SocialEntrepreneurship() {
  useSeo(page.seo);

  return (
    <>
      <Hero
        title={
          <>
            {page.hero.title}
            <span className="block">{page.hero.titleSecondLine}</span>
          </>
        }
        subtitle={page.hero.subtitle}
        showSpiral={false}
      />

      {/* ── The concept ─────────────────────────────────────── */}
      <section className="container-page section-y">
        <SectionHeading
          eyebrow={page.concept.eyebrow}
          title={page.concept.title}
          align="start"
          className="mb-8"
        />

        <div className="flex max-w-3xl flex-col gap-5">
          {page.concept.body.map((paragraph) => (
            <Reveal
              as="p"
              key={paragraph.slice(0, 24)}
              className="leading-relaxed text-ink-secondary"
            >
              {paragraph}
            </Reveal>
          ))}
        </div>

        <SpiralDivider className="my-14" />

        {/* ── The definition Bedar adopts ───────────────────── */}
        <div className="max-w-3xl">
          <Reveal>
            <h2 className="text-xl font-semibold text-ink md:text-2xl">{page.definition.title}</h2>
          </Reveal>

          <div className="mt-6 flex flex-col gap-5">
            {page.definition.body.map((paragraph) => (
              <Reveal
                as="p"
                key={paragraph.slice(0, 24)}
                className="leading-relaxed text-ink-secondary"
              >
                {paragraph}
              </Reveal>
            ))}
          </div>

          {/* The three elements of the adopted definition. */}
          <ol className="mt-6 flex flex-col gap-4">
            {page.definition.elements.map((element, index) => (
              <Reveal as="li" key={element.slice(0, 24)} delay={index} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-100">
                  {/* Western digits — .ltr-run keeps the numeral in
                      logical order beside the Arabic that follows. */}
                  <span className="ltr-run">{index + 1}</span>
                </span>
                <span className="leading-relaxed text-ink-secondary">{element}</span>
              </Reveal>
            ))}
          </ol>

          <Reveal
            as="p"
            className="mt-8 border-s-4 border-brand-300 bg-brand-25 px-5 py-4 leading-relaxed text-ink dark:border-brand-500 dark:bg-brand-900/40"
          >
            {page.definition.conclusion}
          </Reveal>
        </div>
      </section>

      {/* ── Bedar's sectors ─────────────────────────────────── */}
      <section className="bg-sunken">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow={page.sectors.eyebrow}
            title={page.sectors.title}
            align="center"
            className="mb-12"
          />

          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {page.sectors.items.map((sector, index) => (
              <Reveal as="li" key={sector.id} delay={index % 4}>
                <Card
                  elevation={0}
                  className="h-full items-center gap-4 p-6 text-center transition-shadow hover:shadow-md"
                >
                  {/* The source illustrations are light-mint, so they
                      sit inside a teal badge to read on a light card. */}
                  <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600">
                    <img src={sectorIcon[sector.id]} alt="" aria-hidden="true" className="size-9" />
                  </span>
                  <h3 className="text-sm font-semibold leading-relaxed text-ink">{sector.label}</h3>
                </Card>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Impact over three horizons ──────────────────────── */}
      <section className="surface-dark">
        <div className="container-page section-y">
          <SectionHeading
            title={page.impact.title}
            align="center"
            tone="inverse"
            className="mb-12"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {page.impact.items.map((item, index) => (
              <Reveal key={item.id} delay={index}>
                <div className="flex h-full flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <img src={impactIcon[item.id]} alt="" aria-hidden="true" className="size-16" />
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-brand-100/80">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand {...page.cta} />
    </>
  );
}
