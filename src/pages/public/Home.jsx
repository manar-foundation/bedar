import { ArrowLeft } from 'lucide-react';

import {
  Accordion,
  Button,
  Card,
  ContentCard,
  CtaBand,
  Hero,
  HeroEmblem,
  SectionHeading,
  SectionSeam,
  Spiral,
  TestimonialsCarousel,
} from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { home, services, contactCta } from '@content/pages.js';

import iconIdeaDevelopment from '@assets/services/service-idea-development.svg';
import iconFeasibility from '@assets/services/service-feasibility-review.svg';
import iconManagementGuidance from '@assets/services/service-management-guidance.svg';
import iconConsulting from '@assets/services/service-consulting.svg';
import iconTraining from '@assets/services/service-training.svg';
import iconExpertNetwork from '@assets/services/service-expert-network.svg';
import iconInvestorNetwork from '@assets/services/service-investor-network.svg';

/* Official Bedar service icons (bedar.webflow.io), keyed by service id. */
const SERVICE_ICONS = {
  'idea-development': iconIdeaDevelopment,
  'feasibility-review': iconFeasibility,
  'management-guidance': iconManagementGuidance,
  'specialist-consulting': iconConsulting,
  training: iconTraining,
  'expert-network': iconExpertNetwork,
  'investor-network': iconInvestorNetwork,
};

/**
 * Homepage. Every string comes from `content/pages.js` — the page
 * owns the layout, the data owns the words (Infra spec §3).
 *
 * Section order matches the live site:
 *   hero · programs · about · services · audience · FAQ · quotes
 */
export default function Home() {
  // testimonials + faq come from context so a dashboard-published one
  // reaches the homepage; the context falls back to the seed when the
  // database has none. `services` stays a static import — it is a page
  // (§2/§14), not a dashboard collection.
  const { collections, testimonials, faq } = useContent();
  useSeo(home.seo);

  const latestPrograms = collections.programs.slice(0, home.programs.limit);

  return (
    <>
      {/* Split hero: copy on the inline-start side — the right half
          in RTL — and the animated mark opposite it. On mobile the
          grid collapses and the copy comes first, which is the DOM
          order, so no `order-*` juggling. */}
      <Hero
        align="start"
        title={
          <>
            {home.hero.title}
            <span className="block">{home.hero.titleSecondLine}</span>
          </>
        }
        subtitle={home.hero.subtitle}
        actions={
          <>
            <Button
              variant="accent"
              size="lg"
              to={home.hero.cta.href}
              iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
            >
              {home.hero.cta.label}
            </Button>
            <Button variant="inverse" size="lg" to={home.about.cta.href}>
              {home.about.cta.label}
            </Button>
          </>
        }
        visual={<HeroEmblem />}
      />

      <SectionSeam />

      {/* ── Latest programs ─────────────────────────────────── */}
      <section className="section-glow">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow={home.programs.eyebrow}
            title={home.programs.title}
            align="center"
            className="mb-12"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestPrograms.map((program, index) => (
              <Reveal key={program.id} delay={index}>
                <ContentCard
                  title={program.title}
                  excerpt={program.excerpt}
                  href={program.href}
                  image={program.image}
                  imageAlt={program.imageAlt}
                  category={program.category}
                  date={program.date}
                  cta="إقرأ المزيد"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionSeam />

      {/* ── About ───────────────────────────────────────────── */}
      <section className="section-wash">
        <div className="container-page section-y">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <SectionHeading eyebrow={home.about.eyebrow} title={home.about.title} align="start" />

            <div className="flex flex-col gap-5">
              {home.about.body.map((paragraph) => (
                <Reveal
                  as="p"
                  key={paragraph.slice(0, 24)}
                  className="leading-relaxed text-ink-secondary"
                >
                  {paragraph}
                </Reveal>
              ))}
              <Reveal className="mt-2">
                <Button
                  variant="outline"
                  to={home.about.cta.href}
                  iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
                >
                  {home.about.cta.label}
                </Button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <SectionSeam />

      {/* ── Services ────────────────────────────────────────── */}
      <section className="section-glow section-glow-alt">
        <div className="container-page section-y">
          <SectionHeading
            title={home.services.title}
            lede={home.services.lede}
            align="center"
            className="mb-12"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.id} delay={index % 3}>
                <Card elevation={1} interactive className="h-full gap-3 p-7">
                  {/* Official service illustration in a soft brand tile. */}
                  <span className="mb-1 inline-flex size-16 items-center justify-center rounded-2xl bg-brand-50/70 p-2.5">
                    <img
                      src={SERVICE_ICONS[service.id]}
                      alt=""
                      aria-hidden="true"
                      className="size-full object-contain"
                    />
                  </span>
                  <h3 className="text-lg font-semibold text-ink">{service.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-secondary">
                    {service.description}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionSeam />

      {/* ── Target audience — dark band ─────────────────────── */}
      <section className="surface-dark">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow={home.audience.eyebrow}
            title={home.audience.title}
            align="center"
            tone="inverse"
            className="mb-12"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {home.audience.items.map((item, index) => (
              <Reveal key={item.id} delay={index}>
                <div className="relative h-full overflow-hidden rounded-lg border border-white/10 bg-white/5 p-7">
                  {/* The spiral as a watermark, per the design system. */}
                  <Spiral
                    className="pointer-events-none absolute -top-4 start-4 size-20 text-brand-200/10"
                    aria-hidden="true"
                  />
                  <h3 className="relative text-lg font-semibold text-white">{item.title}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-brand-100/75">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SectionSeam />

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="section-glow">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow={home.faq.eyebrow}
            title={home.faq.title}
            align="center"
            className="mb-12"
          />
          <Accordion items={faq} className="mx-auto max-w-3xl" />
        </div>
      </section>

      <SectionSeam />

      {/* ── Expert testimonials ─────────────────────────────── */}
      <section className="section-wash">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow={home.testimonials.eyebrow}
            title={home.testimonials.title}
            align="center"
            className="mb-12"
          />

          <Reveal>
            <TestimonialsCarousel items={testimonials} />
          </Reveal>
        </div>
      </section>

      <SectionSeam />

      <CtaBand {...contactCta} />
    </>
  );
}
