import {
  BookOpen,
  BrainCircuit,
  Building2,
  Droplets,
  Factory,
  HeartPulse,
  Landmark,
  Leaf,
  LineChart,
  Palette,
  Rocket,
  Sprout,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

import {
  BrandCard,
  CtaBand,
  IconCard,
  PageHero,
  ProcessSteps,
  Section,
  SectionHeading,
  SectionSeam,
  StickySplit,
} from '@components/ui';
import { Reveal, Stagger, StaggerItem } from '@components/motion/Reveal.jsx';
import { useIsMobile } from '@hooks/useMediaQuery.js';
import { useSeo } from '@hooks/useSeo.js';
import { socialEntrepreneurship as page } from '@content/pages.js';
import { pageBanners } from '@content/page-banners.js';
import { breadcrumbsFor } from '@content/site.js';

/* Clean line-marks, one per قطاع (keyed by id) — they replaced the
   raster illustrations the brief flagged as poor on the dark surface. */
const sectorIcon = {
  health: HeartPulse,
  edtech: BookOpen,
  wash: Droplets,
  'smart-agriculture': Sprout,
  'renewable-energy': Zap,
  industry: Factory,
  environment: Leaf,
  fintech: Landmark,
  'urban-sustainability': Building2,
  'culture-arts': Palette,
  ai: BrainCircuit,
  'economic-development': LineChart,
};

/* The sectors grid's widest column count (`lg:grid-cols-4`). The
   entrance cascade is computed against it — see the note on the grid. */
const SECTOR_COLUMNS = 4;

/* Impact-horizon marks. */
const impactIcon = {
  'short-term': Rocket,
  'medium-term': TrendingUp,
  'long-term': Target,
};

/**
 * بدار والريادة المجتمعية — the concept page.
 *
 * This is the most text-heavy page on the site, and it is the one the
 * pinned-heading spread was built for: two 150-word Arabic paragraphs
 * used to run under a heading that had scrolled away by the second
 * sentence. Now the section's subject stays on screen for as long as
 * the section does.
 *
 * The three elements of the adopted definition are a numbered
 * sequence rather than a bulleted list — they are explicitly ordered
 * in the source text ("وتتضمن العناصر التالية").
 */
export default function SocialEntrepreneurship() {
  useSeo(page.seo);
  // The impact cards' entrance is horizontal, and a horizontal
  // entrance only works while they sit side by side. Below `md` they
  // are stacked full-bleed in the container, so a 36px x-offset hangs
  // 16px off the screen edge for as long as the card is waiting to be
  // revealed — which on a phone is the entire time before you scroll
  // to it. Tailwind cannot express this: the offset is a Framer
  // variant, not a class. Hence the one case `useMediaQuery` is
  // documented for — "skipping an expensive/wrong animation on small
  // screens".
  const isMobile = useIsMobile();

  return (
    <>
      <PageHero
        breadcrumbs={breadcrumbsFor('/social-entrepreneurship')}
        eyebrow={page.hero.eyebrow}
        title={
          <>
            {page.hero.title}
            <span className="block">{page.hero.titleSecondLine}</span>
          </>
        }
        subtitle={page.hero.subtitle}
        image={pageBanners.socialEntrepreneurship}
      />

      {/* ── The concept ─────────────────────────────────────── */}
      <Section>
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={page.concept.eyebrow}
              title={page.concept.title}
              layout="aside"
            />
          }
        >
          <div className="flex flex-col gap-6">
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
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── The definition Bedar adopts ──────────────────────────
             Held inside a quiet panel rather than running loose on the
             page: this is the one passage on the site that is a
             position being taken, and the panel edge is what separates
             a stated position from surrounding explanation. */}
      {/* `ratio="roomy"` for the same reason as the strategic goals on
          /about, which the brief pairs this section with: the heading
          is one line and the panel beside it holds two paragraphs, a
          three-step sequence and a pull-quote. At the old 0.8/1.2
          split that panel had 672px for all of it while the heading
          held 448px to say one sentence, and the numbered elements
          inside ran three-to-a-line-and-a-half. Same component, same
          ratio, same scroll-drawn rail — the two sections now read as
          one device used twice rather than as two similar lists.

          The client reported this panel as cramped alongside the
          strategic goals, and it was the same defect in the same
          place: the three numbered elements had ZERO space between
          them because `ProcessSteps` was zeroing its own step rhythm
          (see the note in that file). Fixed at the source, and the
          panel opened up with it — `size="lg"` on the band, a wider
          padding box (48px on desktop, was 40), 32px between the
          panel's blocks and `process-steps-roomy` on the elements. */}
      <Section tone="glow" size="lg">
        <StickySplit
          ratio="roomy"
          aside={<SectionHeading title={page.definition.title} layout="aside" size="sm" as="h2" />}
        >
          <div className="panel-quiet flex flex-col gap-8 p-8 sm:p-10 lg:p-12">
            {page.definition.body.map((paragraph) => (
              <Reveal
                as="p"
                key={paragraph.slice(0, 24)}
                className="leading-relaxed text-ink-secondary"
              >
                {paragraph}
              </Reveal>
            ))}

            {/* The three ordered elements of the definition. */}
            <ProcessSteps
              className="process-steps-roomy mt-2"
              steps={page.definition.elements.map((element) => ({
                id: element.slice(0, 24),
                title: element,
              }))}
            />

            <Reveal
              as="p"
              className="border-s-4 border-brand-300 bg-brand-500/10 px-6 py-5 leading-relaxed text-ink dark:border-brand-500"
            >
              {page.definition.conclusion}
            </Reveal>
          </div>
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── Bedar's sectors ──────────────────────────────────────
             Twelve short labels. A split header keeps the block's
             title beside the grid's top edge rather than centred over
             a four-column field of tiles. */}
      <Section tone="wash">
        <SectionHeading
          eyebrow={page.sectors.eyebrow}
          title={page.sectors.title}
          layout="split"
          className="mb-12"
        />

        {/* The site's one card, in its `compact` size: twelve of
            these are labels rather than descriptions, and at the full
            card size they ran to four screens.

            ENTRANCE (brief §3)
            ------------------------------------------------------
            The tiles used to share the grid's plain `lift`. Twelve
            identical cards rising 24px in sequence is a long, flat
            gesture — by the eighth tile it reads as a loading state.

            They now DROP into place from above (`fall`) on a faster
            step, and the step is driven by the tile's DIAGONAL rather
            than its index: `row + column`, so the cascade sweeps from
            the grid's reading-start corner outward instead of
            crawling row by row. The column count is a breakpoint
            thing, so the diagonal is computed against the widest
            grid (4-up); at 2- and 3-up it degrades to a slightly
            different but still even cascade, which is fine — what
            must not happen is twelve tiles arriving at once. */}
        <Stagger as="ul" step={0} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {page.sectors.items.map((sector, index) => {
            const Icon = sectorIcon[sector.id];
            // The diagonal, against the widest (4-up) grid.
            const diagonal = (index % SECTOR_COLUMNS) + Math.floor(index / SECTOR_COLUMNS);
            return (
              <StaggerItem
                as="li"
                key={sector.id}
                variant="fall"
                y={28}
                delay={diagonal * 0.055}
                className="h-full"
              >
                <IconCard
                  compact
                  title={sector.label}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <SectionSeam />

      {/* ── Impact over three horizons ───────────────────────────
             Three horizons in sequence, so the cards are staggered
             into a rising line rather than sitting level — short,
             medium and long term should not read as simultaneous. */}
      <Section tone="dark">
        <SectionHeading title={page.impact.title} align="center" tone="inverse" className="mb-12" />

        {/* `items-start` from `md` up: the cards size to their own
            copy instead of stretching to the tallest, which is what
            lets the offsets read as a rising line rather than as
            three boxes with uneven bottoms. */}
        <Stagger className="grid gap-6 md:grid-cols-3 md:items-start">
          {page.impact.items.map((item, index) => {
            const Icon = impactIcon[item.id];
            return (
              <StaggerItem
                key={item.id}
                // Each horizon slides in from the side, so the three
                // arrive as a rising line rather than as three boxes
                // appearing in place. `x` is physical and that is
                // deliberate here — the gesture is spatial (toward
                // the tile's own column), not a reading-order one.
                // Stacked on a phone, it falls in instead (see the
                // note on `isMobile` above).
                variant={isMobile ? 'lift' : 'slide'}
                x={index === 0 ? 0 : 36}
                className="md:mt-(--horizon-step)"
                // A 40px step per horizon, from `md` up where the
                // three sit side by side. Inline because it is a
                // per-index offset, which no utility class expresses.
                style={{ '--horizon-step': `${index * 2.5}rem` }}
              >
                <BrandCard
                  className="items-center text-center"
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                  title={item.title}
                  description={item.description}
                  variant={index % 2 === 0 ? 'a' : 'b'}
                  interactive
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <SectionSeam />

      <CtaBand {...page.cta} />
    </>
  );
}
