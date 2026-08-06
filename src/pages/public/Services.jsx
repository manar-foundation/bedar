import {
  Card,
  CtaBand,
  Hero,
  SectionHeading,
  SectionSeam,
  TestimonialsCarousel,
} from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { servicesPage, services } from '@content/pages.js';

import photoIdeaDevelopment from '@assets/services/photo-idea-development.jpg';
import photoFeasibility from '@assets/services/photo-feasibility-review.jpg';
import photoManagement from '@assets/services/photo-management-guidance.jpg';
import photoConsulting from '@assets/services/photo-specialist-consulting.jpg';
import photoTraining from '@assets/services/photo-training.jpg';
import photoExpertNetwork from '@assets/services/photo-expert-network.jpg';
import photoInvestorNetwork from '@assets/services/photo-investor-network.jpg';

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
      <Hero
        title={servicesPage.hero.title}
        subtitle={servicesPage.hero.subtitle}
        showSpiral={false}
      />

      {/* ── Intro ───────────────────────────────────────────── */}
      <section className="container-page section-y">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow={servicesPage.intro.eyebrow}
            title={servicesPage.intro.title}
            align="start"
          />
          <Reveal as="p" className="leading-relaxed text-ink-secondary">
            {servicesPage.intro.body}
          </Reveal>
        </div>
      </section>

      <SectionSeam />

      {/* ── The seven services. Two columns rather than three:
             each description is a full paragraph, and three columns
             makes an unreadable 30-character measure in Arabic. Each
             card now leads with its own editorial photo. ────────── */}
      <section className="section-glow">
        <div className="container-page section-y">
          <div className="grid gap-6 lg:grid-cols-2">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index % 2}>
                <Card
                  elevation={1}
                  interactive
                  padded={false}
                  className="group h-full overflow-hidden"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-sunken">
                    <img
                      src={SERVICE_PHOTOS[service.id]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-(--dur-slow) ease-(--ease-standard) group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-3 p-7">
                    <h2 className="text-lg font-semibold text-ink">{service.title}</h2>
                    <p className="text-sm leading-relaxed text-ink-secondary">
                      {service.description}
                    </p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionSeam />

      {/* ── Expert testimonials — the same animated carousel the
             homepage uses, fed the same data. ─────────────────── */}
      <section className="section-wash">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow={servicesPage.testimonials.eyebrow}
            title={servicesPage.testimonials.title}
            align="center"
            className="mb-12"
          />
          <Reveal>
            <TestimonialsCarousel items={testimonials} />
          </Reveal>
        </div>
      </section>

      <SectionSeam />

      <CtaBand {...servicesPage.cta} />
    </>
  );
}
