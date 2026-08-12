import {
  CtaBand,
  PageHero,
  Section,
  SectionHeading,
  SectionSeam,
  StickySplit,
  TestimonialsCarousel,
} from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { servicesPage, services } from '@content/pages.js';
import { pageBanners } from '@content/page-banners.js';
import { breadcrumbsFor } from '@content/site.js';

import photoIdeaDevelopment from '@assets/services/photo-idea-development.webp';
import photoFeasibility from '@assets/services/photo-feasibility-review.webp';
import photoManagement from '@assets/services/photo-management-guidance.webp';
import photoConsulting from '@assets/services/photo-specialist-consulting.webp';
import photoTraining from '@assets/services/photo-training.webp';
import photoExpertNetwork from '@assets/services/photo-expert-network.webp';
import photoInvestorNetwork from '@assets/services/photo-investor-network.webp';

/* Editorial teal-graded photographs, one per service, keyed by id.
   The homepage services section uses the site's flat icons; this page
   is the dedicated services page, so it gets its own richer imagery
   (per the brief) — a distinct photo for every one of the seven. */
const SERVICE_PHOTOS = {
  'idea-development': photoIdeaDevelopment,
  'feasibility-review': photoFeasibility,
  'management-guidance': photoManagement,
  'specialist-consulting': photoConsulting,
  training: photoTraining,
  'expert-network': photoExpertNetwork,
  'investor-network': photoInvestorNetwork,
};

/** الخدمات — the seven services, plus the expert quotes. */
export default function Services() {
  // Same carousel as the homepage, same live testimonials source.
  const { testimonials } = useContent();
  useSeo(servicesPage.seo);

  return (
    <>
      {/* `eyebrow` is the fix for the header the client reported as
          inconsistent: this page was the only listing page with no
          bracketed label over its h1. `PageHero` draws it the way
          `SectionHeading` does — `/ خدمات بدار /`. */}
      <PageHero
        breadcrumbs={breadcrumbsFor('/services')}
        eyebrow={servicesPage.hero.eyebrow}
        title={servicesPage.hero.title}
        subtitle={servicesPage.hero.subtitle}
        image={pageBanners.services}
      />

      {/* ── Intro ───────────────────────────────────────────── */}
      <Section>
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={servicesPage.intro.eyebrow}
              title={servicesPage.intro.title}
              layout="aside"
            />
          }
        >
          <Reveal as="p" className="text-lg leading-relaxed text-ink-secondary">
            {servicesPage.intro.body}
          </Reveal>
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── The seven services ───────────────────────────────────
             Two columns rather than three: each description is a full
             paragraph, and three columns makes an unreadable
             30-character measure in Arabic.

             EVERY CARD IS THE SAME SIZE (client, Aug 2026)
             ------------------------------------------------------
             This grid used to carry `grid-stagger`, which drops every
             even child 80px to make a two-column run read as a spread
             rather than as a ledger. It is a good device and it is the
             wrong one HERE: the margin comes out of the child's
             stretched height, so the even card in every row rendered
             80px shorter than the odd one beside it — measured at
             690/610, 690/610, 666/586. The client read that, correctly,
             as seven cards of seven different sizes.

             So the offset comes off and `auto-rows-fr` goes on. `1fr`
             on the implicit rows sizes EVERY row to the tallest one in
             the grid, not just each row to its own tallest, so all
             seven cards end up identical in both axes however long
             their copy runs. The photo frame is a fixed ratio and the
             copy block sits under it, so the slack lands at the bottom
             of the shorter cards — which is what "equal height cards"
             means and what makes the column edges line up.

             The stagger is not missed: the cards are big, photographic
             and evenly ruled, and it was the one thing stopping them
             from lining up. Each card leads with its own editorial
             photo and carries a Western-digit index so a reader can
             refer to "الخدمة 3". */}
      <Section tone="glow">
        <div className="grid auto-rows-fr gap-6 lg:grid-cols-2 lg:gap-8">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index % 2} className="h-full">
              {/* Same shell as `ContentCard`: inset media in a 10px
                  frame that the photo scales inside, and the whole
                  card lifting on `.band-tile`. These are the only
                  photographs on the site, so this is the one page
                  where the reference's image treatment lands exactly
                  as it does on the reference itself. Not a link —
                  a service has no page of its own — so it stays a
                  <div> rather than a card pretending to be clickable. */}
              <div className="band-tile group flex h-full flex-col rounded-lg border border-subtle bg-surface p-3">
                <div className="media-frame aspect-[16/10] bg-sunken">
                  <img
                    src={SERVICE_PHOTOS[service.id]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    // `decoding="async"` keeps a 1100px decode off the
                    // main thread; `width`/`height` give the element an
                    // intrinsic ratio, so the row does not reflow if the
                    // frame's `aspect-[16/10]` ever changes. The files
                    // are WebP at the size they are displayed — see
                    // `scripts/optimize-images.mjs`.
                    decoding="async"
                    width={1100}
                    height={825}
                    className="media-zoom size-full object-cover"
                  />

                  {/* The index, set on the media rather than beside the
                      title — it numbers the service without competing
                      with the heading for the first line of the card. */}
                  <span className="absolute top-4 inline-flex size-10 items-center justify-center rounded-full bg-brand-950/70 text-sm font-bold text-brand-200 ring-1 ring-inset ring-brand-200/25 backdrop-blur-sm end-4">
                    <span className="ltr-run">{index + 1}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-3 px-4 pb-4 pt-6 lg:px-5 lg:pb-5">
                  <h2 className="text-lg font-semibold text-ink transition-colors duration-(--dur-base) ease-(--ease-standard) group-hover:text-brand-200 lg:text-xl">
                    {service.title}
                  </h2>
                  <p className="text-base leading-relaxed text-ink-secondary">
                    {service.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <SectionSeam />

      {/* ── Expert testimonials — the same animated carousel the
             homepage uses, fed the same data. ─────────────────── */}
      <Section tone="wash">
        <SectionHeading
          eyebrow={servicesPage.testimonials.eyebrow}
          title={servicesPage.testimonials.title}
          layout="split"
          className="mb-12"
        />
        <Reveal>
          <TestimonialsCarousel items={testimonials} />
        </Reveal>
      </Section>

      <SectionSeam />

      <CtaBand {...servicesPage.cta} />
    </>
  );
}
