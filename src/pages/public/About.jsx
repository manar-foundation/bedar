import { ArrowLeft, BadgeCheck, HeartHandshake, Lightbulb, ScanEye, Sprout } from 'lucide-react';

import {
  BrandCard,
  Button,
  CtaBand,
  IconCard,
  PageHero,
  ProcessSteps,
  Section,
  SectionHeading,
  SectionSeam,
  StatRow,
  StickySplit,
} from '@components/ui';
import { Reveal, Stagger, StaggerItem } from '@components/motion/Reveal.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { about } from '@content/pages.js';
import { pageBanners } from '@content/page-banners.js';
import { breadcrumbsFor } from '@content/site.js';
import { cn } from '@utils/cn.js';

/* One mark per value, keyed by id — the same pattern the services
   and sectors grids use, so every icon on the site resolves the same
   way and a value renamed in the dashboard keeps its mark.

   These were deliberately absent before, on the argument that the
   design system has no glyph for "الشفافية" that would not be
   decoration invented on the spot. The brief overrules that: it asks
   for a mark per value that expresses what the value says. Each one
   is chosen from what the value's own description states, not from
   the title alone:

     الشراكة    شبكة واسعة من العلاقات … مع المبادرين والخبراء  → HeartHandshake
     الشفافية   بناء ثقة مع المجتمع والشركاء — visible dealings  → ScanEye
     المهنية    النزاهة والأمانة … وصولاً لتحقيق التميز          → BadgeCheck
     الإبداع    التفكير الإبداعي وتطوير أفكار مستدامة            → Lightbulb
     التمكين    تطوير قدراتهم وتحقيق أهدافهم المجتمعية           → Sprout

   `Sprout` rather than a rising arrow for التمكين: empowerment here
   is growing someone's own capacity, not lifting a metric. */
const VALUE_ICONS = {
  partnership: HeartHandshake,
  transparency: ScanEye,
  professionalism: BadgeCheck,
  creativity: Lightbulb,
  empowerment: Sprout,
};

/**
 * من نحن — intro, impact stats, vision, mission, values, goals.
 *
 * LAYOUT
 * ----------------------------------------------------------------
 * The intro pins its heading against the copy and the figures follow
 * it immediately as one ruled row (the reference's achievements
 * band); vision and mission are staggered so the pair reads as a
 * spread rather than as two equal boxes; the values share the site's
 * one card; and the six strategic goals are a numbered sequence
 * instead of six identical check-bullets, which is what they were
 * always describing.
 */
export default function About() {
  useSeo(about.seo);

  return (
    <>
      {/* The site-wide interior banner — the hackathon program page's
          header, which the client asked to standardise onto every
          sub-page. Set `about` in content/page-banners.js to put a
          photograph behind it; nothing else changes. */}
      <PageHero
        breadcrumbs={breadcrumbsFor('/about')}
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        subtitle={about.hero.subtitle}
        image={pageBanners.about}
      />

      {/* ── Intro ───────────────────────────────────────────── */}
      <Section>
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={about.intro.eyebrow}
              title={about.intro.title}
              layout="aside"
            />
          }
        >
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
        </StickySplit>
      </Section>

      {/* Impact numbers, as the reference's achievements band: one
          ruled row, no tiles and no heading of its own — the figures
          are the heading. It follows the intro with no seam between
          them, because the numbers are the evidence for the paragraph
          above and a divider would break that pairing. Digits stay
          Western via formatNumber (inside StatRow). */}
      <Section size="sm">
        <StatRow stats={about.stats} />
      </Section>

      <SectionSeam />

      {/* ── Vision + mission ─────────────────────────────────────
             `grid-stagger` drops the second panel by 80px from `lg`
             up, so the pair reads as a composed spread instead of two
             equal boxes side by side. */}
      <Section tone="glow">
        <div className="grid-stagger grid gap-6 lg:grid-cols-2 lg:gap-8">
          {[about.vision, about.mission].map((block, index) => (
            <Reveal key={block.eyebrow} delay={index}>
              <BrandCard
                as="h2"
                eyebrow={block.eyebrow}
                title={block.title}
                description={block.body}
                variant={index % 2 === 0 ? 'a' : 'b'}
                interactive
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <SectionSeam />

      {/* ── Values ──────────────────────────────────────────── */}
      <Section tone="wash">
        <SectionHeading
          eyebrow={about.values.eyebrow}
          title={about.values.title}
          layout="split"
          className="mb-12"
        />

        {/* The same `IconCard` the services grid uses — one card
            system across every interior page — now carrying a mark
            per value (see `VALUE_ICONS`).

            Five items in a three-column grid leaves a two-card gap on
            the last row. The first card spans two columns from `lg`
            up, which turns 5 into 6 and closes the block: the lead
            value gets a wider measure for its longest description and
            the row below it is full. `lines={5}` because that wider
            card can hold a fifth line without unbalancing the row. */}
        <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {about.values.items.map((value, index) => {
            const Icon = VALUE_ICONS[value.id];
            return (
              <StaggerItem key={value.id} className={cn('h-full', index === 0 && 'lg:col-span-2')}>
                <IconCard
                  title={value.title}
                  description={value.description}
                  lines={index === 0 ? 5 : 4}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <SectionSeam />

      {/* ── Strategic goals ──────────────────────────────────────
             Six objectives drawn as a numbered sequence on a rail
             that draws itself as the section scrolls (`ProcessSteps`).
             They were six identical check-bullets, which flattened an
             ordered list into a pile — the numbering is the one thing
             that told the reader there were six distinct commitments
             rather than one long sentence.

             `ratio="roomy"` gives the LIST the wider half: the
             brief's complaint was that this column was cramped. At
             the previous 0.8/1.2 split the six goals ran in a 672px
             column while a four-word heading held 448px beside them,
             which is backwards — the heading needs a narrow measure
             and the list needs room. The list column gains ~130px, so
             each goal sits on two comfortable lines instead of three
             tight ones, and the step rhythm inside `ProcessSteps`
             grew with it.

             The client reported this section AGAIN as cramped and
             overlapping, and the ratio was not the reason: the step
             rhythm was computing to ZERO (a `last:` variant that
             matched every step — see `ProcessSteps.jsx`), so the six
             goals were stacked flush whatever width they had. That is
             fixed at the source. On top of it this band now runs at
             `size="lg"` (160px of vertical padding on desktop instead
             of 120) and the list at `process-steps-roomy` (88px
             between goals instead of 72) — "زيد من طول القسم" and
             "اعطي مساحة اكبر" respectively. */}
      <Section tone="glow-alt" size="lg">
        <StickySplit
          ratio="roomy"
          aside={
            <SectionHeading
              eyebrow={about.goals.eyebrow}
              title={about.goals.title}
              layout="aside"
              actions={
                <Button
                  variant="accent"
                  to={about.goals.cta.href}
                  iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
                >
                  {about.goals.cta.label}
                </Button>
              }
            />
          }
        >
          <ProcessSteps
            className="process-steps-roomy"
            steps={about.goals.items.map((goal) => ({ id: goal.slice(0, 24), title: goal }))}
          />
        </StickySplit>
      </Section>

      <SectionSeam />

      <CtaBand {...about.cta} />
    </>
  );
}
