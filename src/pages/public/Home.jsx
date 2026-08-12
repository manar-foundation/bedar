import {
  ArrowLeft,
  ClipboardCheck,
  Compass,
  GraduationCap,
  HandCoins,
  Lightbulb,
  MessagesSquare,
  Users,
} from 'lucide-react';

import {
  Accordion,
  Button,
  ContentCard,
  CtaBand,
  Hero,
  HeroArtwork,
  IconCard,
  NumberedList,
  Section,
  SectionHeading,
  SectionSeam,
  StatRow,
  StickySplit,
  TestimonialsCarousel,
  WordOrbit,
} from '@components/ui';
import { Reveal, Stagger, StaggerItem } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { home, services, about, contactCta } from '@content/pages.js';
import { cn } from '@utils/cn.js';

/* Clean single-line marks, one per service (keyed by id). */
const SERVICE_ICONS = {
  'idea-development': Lightbulb,
  'feasibility-review': ClipboardCheck,
  'management-guidance': Compass,
  'specialist-consulting': MessagesSquare,
  training: GraduationCap,
  'expert-network': Users,
  'investor-network': HandCoins,
};

/**
 * Homepage. Every string comes from `content/pages.js` — the page
 * owns the layout, the data owns the words (Infra spec §3).
 *
 * BAND ORDER IS THE CLIENT'S, NOT THE REFERENCE'S
 * ----------------------------------------------------------------
 * The shapes still come from the reference homepage — the left
 * column below is what that layout does, the right is which existing
 * Bedar content sits in it. Nothing was written, cut or reworded to
 * make the fit: where a shape needed content this site does not
 * have, the shape changed, not the copy.
 *
 * The SEQUENCE, though, is the client's (Aug 2026 notes, §2). It
 * argues the case before the offer: who we are, what we have done,
 * then what we sell — so the figures now vouch for the platform
 * immediately after it introduces itself, and the programs land
 * after a reader knows which segment they are in.
 *
 *   1 hero split                  home.hero + HeroArtwork
 *   2 about, ring of words        home.about + about.values titles
 *   3 figures, ruled row          about.stats
 *   4 "commitment" icon grid      home.services + the seven services
 *   5 numbered rows               home.audience
 *   6 latest updates, split head  home.programs + programs cards
 *   7 collection cards, split     home.testimonials + carousel
 *   8 FAQ, narrow column          home.faq + faq
 *   9 closing CTA panel           contactCta
 *
 * Tones alternate across that order (glow → plain → dark → glow-alt
 * → wash → glow → glow-alt) so no two neighbouring bands share a
 * treatment. Re-check that if you reorder again: the sequence is
 * what gives the page its rhythm, and two adjacent glows read as one
 * very long section.
 *
 * BAND 3 HAS NO HEADING ON PURPOSE
 * ----------------------------------------------------------------
 * Not an omission. The reference's own achievements band renders its
 * slash marks with an EMPTY label between them — the numbers are the
 * heading. Inventing an Arabic title for it here would be adding
 * copy, which the brief forbids, so the band stays headless and the
 * figures carry it exactly as they do in the reference.
 */
export default function Home() {
  // testimonials + faq come from context so a dashboard-published one
  // reaches the homepage; the context falls back to the seed when the
  // database has none. `services` stays a static import — it is a page
  // (§2/§14), not a dashboard collection.
  const { collections, testimonials, faq } = useContent();
  useSeo(home.seo);

  const latestPrograms = collections.programs.slice(0, home.programs.limit);
  // The newest program leads the band at full width; the rest sit
  // beside it. `slice` rather than an index test so an empty
  // collection renders nothing at all instead of a broken lead card.
  const [leadProgram, ...restPrograms] = latestPrograms;

  return (
    <>
      {/* ── 1 · Hero ──────────────────────────────────────────────
             Copy on the inline-start side — the right half in RTL —
             and the drawn arcs + photograph opposite it. On mobile
             the grid collapses and the copy comes first, which is the
             DOM order, so no `order-*` juggling.

             The artwork used to be `HeroEmblem`, the brand spiral in
             an orbit. It went because it restated a mark the navbar
             already carries, and because a hero pinned to exactly one
             viewport should spend that screen on the people the
             platform is for rather than on the logo a second time.

             The reference splits its headline across two colours,
             the first line in the accent. Bedar's title is already
             two data fields for its line break, so the same treatment
             costs nothing: the mint tint lands on the first line
             without touching the copy. */}
      <Hero
        align="start"
        title={
          <>
            <span className="text-brand-200">{home.hero.title}</span>
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
              className="group"
              iconEnd={
                <ArrowLeft
                  aria-hidden="true"
                  className="size-4 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:-translate-x-1"
                />
              }
            >
              {home.hero.cta.label}
            </Button>
            <Button variant="inverse" size="lg" to={home.about.cta.href}>
              {home.about.cta.label}
            </Button>
          </>
        }
        visual={<HeroArtwork alt={home.hero.imageAlt} />}
      />

      <SectionSeam />

      {/* ── 2 · About ─────────────────────────────────────────────
             The reference's about band: artwork on one side, label +
             statement + paragraph on the other. Its artwork is a ring
             of single words around its logo; this one is the same
             ring around the Bedar spiral, carrying the brand's own
             five values. They are `about.values[].title`, not new
             copy — one source of truth with the About page. */}
      <Section tone="glow">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* On mobile the copy leads and the orbit follows (client,
              Aug 2026): `order-last` drops the ring below the text in
              the single-column stack. `lg:order-none` restores source
              order at the split, so the ring is back on the right
              (inline-start in RTL) on desktop — desktop is untouched. */}
          <Reveal className="order-last lg:order-none">
            {/* The full value objects, not just their titles — the
                ring reveals each value's own description in its
                centre when you pick one. Same source as /about. */}
            <WordOrbit items={about.values.items} />
          </Reveal>

          <div className="flex flex-col">
            <SectionHeading
              eyebrow={home.about.eyebrow}
              title={home.about.title}
              layout="aside"
              size="base"
              className="[&>div]:max-w-none"
            />

            <div className="mt-6 flex flex-col gap-5">
              {home.about.body.map((paragraph) => (
                <Reveal
                  as="p"
                  key={paragraph.slice(0, 24)}
                  className="leading-relaxed text-ink-secondary"
                >
                  {paragraph}
                </Reveal>
              ))}
            </div>

            <Reveal delay={2} className="mt-9">
              <Button
                variant="outline"
                to={home.about.cta.href}
                className="group"
                iconEnd={
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-4 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:-translate-x-1"
                  />
                }
              >
                {home.about.cta.label}
              </Button>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ── 3 · The figures ───────────────────────────────────────
             One ruled row, no tiles and no heading — see the note at
             the top of this file. `size="sm"` because the band is a
             single row of type and the standard rhythm would leave it
             floating in its own screen. */}
      <Section size="sm">
        <StatRow stats={about.stats} />
      </Section>

      <SectionSeam />

      {/* ── 4 · Services ──────────────────────────────────────────
             The reference's `commitment` grid, on its dark band.

             The header used to be the grid's FIRST CELL: seven cards
             in a four-column grid leaves a hole on the last row, and
             putting the heading inside turned 7 into 8 and closed the
             block. The client asked for the other shape — title and
             lede centred above the band, the cards in a full grid
             underneath ("اريد العنوان و النص الوصف في الاعلى
             بالمنتصف و مربعات الوصف تكون تحتها") — so the header comes
             out and the hole it was plugging comes back.

             The lead service takes the freed cell instead: it spans
             two columns from `sm` up, which turns 7 into 8 again and
             fills the grid exactly. It is the same device the values
             grid on /about already uses for its 5-in-a-3-up, so this
             is an existing pattern reused rather than a second way of
             evening up a short last row — and the widest card goes to
             تطوير الأفكار, which opens the service sequence. */}
      <Section tone="dark">
        <SectionHeading
          title={home.services.title}
          lede={home.services.lede}
          align="center"
          tone="inverse"
          className="mb-12"
          actions={
            <Button
              variant="outline"
              to={home.services.cta.href}
              className="group"
              iconEnd={
                <ArrowLeft
                  aria-hidden="true"
                  className="size-4 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:-translate-x-1"
                />
              }
            >
              {home.services.cta.label}
            </Button>
          }
        />

        {/* THREE COLUMNS, AND EVERY DESCRIPTION IN FULL
            ------------------------------------------------------
            This grid ran four-up from `xl` with each paragraph
            clamped to four lines, on the trade documented in
            `IconCard`: an even row, bought with a summary the reader
            had to hover to finish. The client has ruled the other way
            — the description must read at rest — so the clamp is gone
            (`lines={null}`, which drops the hover swap with it).

            The column count is what makes that affordable, and it is
            not a taste call. Measured at 1280px: the four-up tile is
            278px wide, where the longest description is 332px of text
            in a 128px slot — unclamping it there gives one card twice
            the height of its neighbours and a band that is mostly
            empty tile. At three-up the same tile is 389px, the same
            description sets in nine lines, and the card lands at
            roughly 389×424 — the squarish proportion it already had.

            Seven cards fill a three-column grid EXACTLY when two of
            them are double-width, so the lead and the last one span:

              lg (3 cols)  [lead ██ · s2] [s3 · s4 · s5] [s6 · s7 ██]
              sm (2 cols)  [lead ████] [s2 · s3] [s4 · s5] [s6 · s7]

            which is why the two spans are at different breakpoints —
            at two-up the lead alone already closes the grid, and a
            second double-width card would reopen it. The device is
            the site's own: /about's values grid evens a 5-in-a-3-up
            the same way.

            `auto-rows-fr` sizes every row to the tallest, so the
            seven cards are identical in height rather than merely
            even row by row. Same treatment as the /services grid. */}
        <Stagger className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[service.id];
            const lead = index === 0;
            const last = index === services.length - 1;
            return (
              <StaggerItem
                key={service.id}
                className={cn('h-full', lead && 'sm:col-span-2', last && 'lg:col-span-2')}
              >
                <IconCard
                  title={service.title}
                  description={service.description}
                  // No clamp: the full paragraph is on the card's
                  // resting face, which is the whole point of the
                  // change above.
                  lines={null}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      {/* ── 5 · Target audience ───────────────────────────────────
             The reference numbers this band 01–04 and hides three of
             its four paragraphs behind an accordion. The numbering
             ports; the hiding does not — these three segments each
             address a different reader, and collapsing two of them
             would bury content the brief says to preserve. Heading
             pinned beside the rows, so the band's subject stays on
             screen for as long as the rows do. */}
      <Section tone="glow-alt">
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={home.audience.eyebrow}
              title={home.audience.title}
              layout="aside"
              size="base"
            />
          }
        >
          <NumberedList items={home.audience.items} />
        </StickySplit>
      </Section>

      {/* ── 6 · Latest programs ───────────────────────────────────
             The reference's `title-section-bottom`: title one side,
             "view all" opposite, hairline under both. The newest item
             leads at full width and the remaining two sit beside each
             other below it. */}
      <Section tone="wash">
        <SectionHeading
          eyebrow={home.programs.eyebrow}
          title={home.programs.title}
          layout="split"
          actions={
            <Button
              variant="outline"
              to={home.programs.cta.href}
              className="group"
              iconEnd={
                <ArrowLeft
                  aria-hidden="true"
                  className="size-4 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:-translate-x-1"
                />
              }
            >
              {home.programs.cta.label}
            </Button>
          }
          className="mb-12"
        />

        {leadProgram ? (
          <Stagger className="flex flex-col gap-6">
            <StaggerItem>
              <ContentCard
                featured
                title={leadProgram.title}
                excerpt={leadProgram.excerpt}
                href={leadProgram.href}
                image={leadProgram.image}
                imageAlt={leadProgram.imageAlt}
                category={leadProgram.category}
                date={leadProgram.date}
                cta="إقرأ المزيد"
              />
            </StaggerItem>

            {restPrograms.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {restPrograms.map((program) => (
                  <StaggerItem key={program.id} className="h-full">
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
                  </StaggerItem>
                ))}
              </div>
            ) : null}
          </Stagger>
        ) : null}
      </Section>

      {/* ── 7 · Expert testimonials ───────────────────────────────
             The reference's third collection band, same split header
             as the programs band above it so the two listings on the
             page read as one system. */}
      <Section tone="glow">
        <SectionHeading
          eyebrow={home.testimonials.eyebrow}
          title={home.testimonials.title}
          layout="split"
          className="mb-12"
        />

        <Reveal>
          <TestimonialsCarousel items={testimonials} />
        </Reveal>
      </Section>

      {/* ── 8 · FAQ ───────────────────────────────────────────────
             Heading pinned on one side, the questions on the other. A
             centred heading over a full-width accordion made the
             questions the widest measure on the page; halved, each one
             is a readable line length. */}
      <Section tone="glow-alt">
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={home.faq.eyebrow}
              title={home.faq.title}
              layout="aside"
              lede={home.faq.lede}
              actions={
                <Button
                  variant="outline"
                  to={home.faq.cta.href}
                  className="group"
                  iconEnd={
                    <ArrowLeft
                      aria-hidden="true"
                      className="size-4 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:-translate-x-1"
                    />
                  }
                >
                  {home.faq.cta.label}
                </Button>
              }
            />
          }
        >
          <Accordion items={faq} />
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── 9 · Closing CTA ─────────────────────────────────────── */}
      <CtaBand {...contactCta} secondaryCta={home.about.cta} />
    </>
  );
}
