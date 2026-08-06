import { Check } from 'lucide-react';

import { Button, Card, CtaBand, Hero, SectionHeading, Spiral, StatBand } from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { about } from '@content/pages.js';

/** من نحن — intro, impact stats, vision, mission, values, goals. */
export default function About() {
  useSeo(about.seo);

  return (
    <>
      <Hero title={about.hero.title} subtitle={about.hero.subtitle} showSpiral={false} />

      {/* ── Intro ───────────────────────────────────────────── */}
      <section className="container-page section-y">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionHeading eyebrow={about.intro.eyebrow} title={about.intro.title} align="start" />
          <div className="flex flex-col gap-5">
            {about.intro.body.map((paragraph) => (
              <Reveal
                as="p"
                key={paragraph.slice(0, 24)}
                className="leading-relaxed text-ink-secondary"
              >
                {paragraph}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Impact numbers — one of the four surfaces allowed the dark
          treatment. Digits stay Western via formatNumber. */}
      <StatBand stats={about.stats} />

      {/* ── Vision + mission ────────────────────────────────── */}
      <section className="container-page section-y">
        <div className="grid gap-6 lg:grid-cols-2">
          {[about.vision, about.mission].map((block, index) => (
            <Reveal key={block.eyebrow} delay={index}>
              <Card elevation={0} className="h-full gap-4 p-8">
                <Spiral className="size-8 text-brand-300" />
                <p className="text-xs font-semibold tracking-wide text-brand-600">
                  {block.eyebrow}
                </p>
                <h2 className="text-2xl font-bold text-ink">{block.title}</h2>
                <p className="leading-relaxed text-ink-secondary">{block.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────── */}
      <section className="bg-sunken">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow={about.values.eyebrow}
            title={about.values.title}
            align="center"
            className="mb-12"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {about.values.items.map((value, index) => (
              <Reveal key={value.id} delay={index % 3}>
                <Card elevation={0} className="h-full gap-3 p-7">
                  <h3 className="text-lg font-semibold text-ink">{value.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-secondary">{value.description}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Strategic goals ─────────────────────────────────── */}
      <section className="container-page section-y">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow={about.goals.eyebrow} title={about.goals.title} align="start" />
            <Reveal className="mt-8">
              <Button variant="accent" to={about.goals.cta.href}>
                {about.goals.cta.label}
              </Button>
            </Reveal>
          </div>

          <ul className="flex flex-col gap-4">
            {about.goals.items.map((goal, index) => (
              <Reveal as="li" key={goal.slice(0, 24)} delay={index % 3} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-100">
                  <Check className="size-3.5" aria-hidden="true" strokeWidth={3} />
                </span>
                <span className="leading-relaxed text-ink-secondary">{goal}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand {...about.cta} />
    </>
  );
}
