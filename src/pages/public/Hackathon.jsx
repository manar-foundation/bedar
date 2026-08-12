import { useState } from 'react';
import {
  Blocks,
  Building2,
  ClipboardCheck,
  Cpu,
  DraftingCompass,
  Droplets,
  GraduationCap,
  HeartHandshake,
  Leaf,
  MessagesSquare,
  NotebookPen,
  PencilRuler,
  Rocket,
  ShieldCheck,
  Target,
  Tent,
  Video,
  Wrench,
  Zap,
} from 'lucide-react';

import {
  Accordion,
  CtaBand,
  IconCard,
  PageHero,
  ProcessSteps,
  Section,
  SectionHeading,
  SectionSeam,
  Spiral,
  StatRow,
  StickySplit,
  Tabs,
} from '@components/ui';
import { Reveal, RevealOnMount, Stagger, StaggerItem } from '@components/motion/Reveal.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { hackathon } from '@content/hackathon.js';
import { contactCta } from '@content/pages.js';
import { pageBanners } from '@content/page-banners.js';
import { breadcrumbsFor } from '@content/site.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   HACKATHON — /programs/hackathon, built rather than migrated.

   WHY THIS PAGE HAS ITS OWN COMPONENT
   ----------------------------------------------------------------
   Every other program renders through `CollectionDetail`, which is
   right for a program written as an article. This one was a bespoke
   landing page on the client's Webflow site, and the migration script
   has no rich-text block to read on it — it walks the prose instead,
   which preserved every word and lost every structure. The result is
   the page the client flagged: ~6000px of flat column, 40 headings,
   two sections rendered twice, a timeline with its dates stripped and
   an FAQ with its questions stripped.

   `content/hackathon.js` recovers the structure (and the dates and
   questions, read back from the source markup). This file is the
   layout for it, and it is assembled from the site's OWN primitives
   rather than from anything invented here — that is the second half
   of the brief: "align its design aesthetic, spacing, typography and
   card treatments with the rest of the website."

     band                       primitive             used elsewhere
     ────────────────────────── ───────────────────── ──────────────
     banner                     PageHero              every sub-page
     figures                    StatRow               /about, home
     about                      StickySplit + aside   /social-…
     goals                      IconCard grid         home, /about
     who / what / which         Tabs + IconCard       (new shape)
     timeline                   ProcessSteps          /about goals
     partner                    panel-inset           CTA bands
     conditions                 panel-quiet           /social-…
     FAQ                        Accordion             home
     closing                    CtaBand               every page

   THE ONLY NEW SHAPE IS THE TAB STRIP, AND IT IS THE POINT
   ----------------------------------------------------------------
   Three of the source's sections — who may take part, which
   specialisms are wanted, which tracks exist — are the same shape:
   a short title and one line under it. Stacked, they are 15 near
   identical cards down one column, and they are most of the reason
   the page reads as a wall. They are three panels of one tab strip
   here, so a reader sees one list at a time and can compare them by
   switching rather than by scrolling.

   The tab strip is the site's `Tabs`, which is the real ARIA pattern
   (roving tabindex, arrow keys with RTL-correct direction). The
   panels are `IconCard`s, the same card the services and values grids
   use. Nothing about either is specific to this page.

   ORDER
   ----------------------------------------------------------------
   The source's own order, with one change: its three "who/what/which"
   sections ran between the goals and the partner, and that is exactly
   where the tab strip sits. Everything else follows the page as the
   client wrote it — about, goals, participation, partner, conditions,
   timeline, FAQ.

   NO REGISTRATION CTA
   ----------------------------------------------------------------
   The source page's buttons say "سجّل الآن في الهاكاثون" and point at
   a registration form. This program is `status: 'past'` (it ran in
   August 2024) and the form is gone from the live page, so repeating
   that call to action would invite a reader to register for something
   that has finished. The page closes on the site's standard contact
   band instead. If the client re-runs the hackathon, the CTA belongs
   back in `content/hackathon.js` as a `hero.cta` field.
   ================================================================ */

/* One mark per goal, keyed by id — the same pattern the services,
   values and sectors grids use, so an item renamed in the dashboard
   keeps its icon. Each is read from what the goal's own description
   says, not from its title alone:

     فتح حوار شامل            تسليط الضوء … وتدعم إطلاق مبادرات  → MessagesSquare
     تحفيز التعاون            إنشاء جسور التواصل لتبادل الخبرات   → HeartHandshake
     تطوير أدوات وحلول        أدوات … تعزّز كفاءة عمليات الإعمار  → Wrench
     تقديم حلول عملية         إلى الجهات الفاعلة … لضمان تنفيذها  → ClipboardCheck
     جمع وتوثيق الأفكار       التي يمكن تحويلها إلى مبادرات       → NotebookPen
     تعزيز التأثير المستدام   كل فكرة تتحول إلى مبادرة ناجحة      → Target
     دمج التكنولوجيا الحديثة  الاستفادة من التكنولوجيا الحديثة    → Cpu */
const GOAL_ICONS = {
  dialogue: MessagesSquare,
  collaboration: HeartHandshake,
  tools: Wrench,
  practical: ClipboardCheck,
  documentation: NotebookPen,
  impact: Target,
  technology: Cpu,
};

/* Marks for the three tabbed lists. Flat rather than nested per tab:
   the ids are unique across all three except `water`, which appears
   in both the disciplines and the tracks list and wants the same
   droplet in each — so a flat map is not a collision, it is the
   correct behaviour. */
const PARTICIPATION_ICONS = {
  // من يمكنه المشاركة؟
  'development-workers': HeartHandshake,
  students: GraduationCap,
  entrepreneurs: Rocket,
  // التخصصات المطلوبة
  'engineers-architects': DraftingCompass,
  'construction-tech': Building2,
  environmental: Leaf,
  water: Droplets,
  designers: PencilRuler,
  'energy-engineers': Zap,
  // مجالات الهاكاثون
  power: Zap,
  rubble: Blocks,
  shelter: Tent,
  rebuilding: Building2,
  environment: Leaf,
};

export default function Hackathon() {
  useSeo(hackathon.seo);

  // The tab strip's state. One `useState` is the whole of it — the
  // panels are all in the DOM order they are declared in, and only
  // the selected one renders, so there is no measurement or layout
  // work involved in a switch.
  const [tab, setTab] = useState(hackathon.participation.tabs[0].id);
  const activeTab = hackathon.participation.tabs.find((entry) => entry.id === tab);

  return (
    <>
      {/* ── Banner ───────────────────────────────────────────────
             The same `PageHero` every sub-page now uses — this page
             is where that component came from, so it is unchanged
             here apart from reading its content from `hackathon.js`
             instead of from a collection record. */}
      <PageHero
        breadcrumbs={[...breadcrumbsFor('/programs'), { label: hackathon.hero.title }]}
        category={hackathon.hero.category}
        title={hackathon.hero.title}
        subtitle={hackathon.hero.tagline}
        date={hackathon.hero.date}
        image={pageBanners.hackathon}
      >
        {/* Delivery format, as a chip rather than a sentence: it is
            the one logistical fact a reader scanning the banner needs,
            and it is a label, not prose. */}
        <RevealOnMount delay={4} className="mt-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-300/10 px-3.5 py-1.5 text-sm font-medium text-brand-100 ring-1 ring-inset ring-brand-200/25">
            <Video className="size-4 shrink-0" aria-hidden="true" />
            {hackathon.hero.note}
          </span>
        </RevealOnMount>
      </PageHero>

      {/* ── The figures ──────────────────────────────────────────
             Four facts the source states in its own prose, lifted
             into the ruled row /about and the homepage already use.
             `countUp` and `grouped` are off: two of these are ranges
             ("24–25") rather than quantities, and `formatNumber`
             groups thousands on something that is not a total. */}
      <Section size="sm">
        <StatRow
          stats={hackathon.facts.map((fact) => ({ ...fact, countUp: false, grouped: false }))}
        />
      </Section>

      <SectionSeam />

      {/* ── About ────────────────────────────────────────────────
             The heaviest reading on the page: two 90-word Arabic
             paragraphs. Pinned heading beside them, which is the
             device /social-entrepreneurship uses for exactly this —
             the section's subject stays on screen for as long as the
             section does. */}
      <Section>
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={hackathon.about.eyebrow}
              title={hackathon.about.title}
              layout="aside"
            />
          }
        >
          <div className="flex flex-col gap-6">
            {/* The opening pitch, set apart from the explanation with
                the lead-paragraph treatment the article pages use. */}
            <Reveal
              as="p"
              className="border-s-2 border-brand-300 ps-5 text-lg font-medium leading-relaxed text-ink dark:border-brand-500"
            >
              {hackathon.hero.lede}
            </Reveal>

            {hackathon.about.body.map((paragraph) => (
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

      {/* ── Goals ────────────────────────────────────────────────
             Seven goals in the site's one card. Same grid arithmetic
             as the homepage services band: seven cards fill a
             three-column grid exactly when the first and last span
             two, and `auto-rows-fr` makes all seven the same height.

             `lines={null}` — these descriptions are one sentence each
             and there is nothing to hold back behind a hover. */}
      <Section tone="glow">
        <SectionHeading
          eyebrow={hackathon.goals.eyebrow}
          title={hackathon.goals.title}
          layout="split"
          className="mb-12"
        />

        <Stagger className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hackathon.goals.items.map((goal, index) => {
            const Icon = GOAL_ICONS[goal.id];
            const lead = index === 0;
            const last = index === hackathon.goals.items.length - 1;
            return (
              <StaggerItem
                key={goal.id}
                className={cn('h-full', lead && 'sm:col-span-2', last && 'lg:col-span-2')}
              >
                <IconCard
                  title={goal.title}
                  description={goal.description}
                  lines={null}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <SectionSeam />

      {/* ── Who / what / which, as one tab strip ─────────────────
             See the note at the top of this file: three parallel
             lists that were 15 cards down one column are one panel
             at a time here.

             On the dark band, because this is the interactive block
             on the page and the tone change is what says so. */}
      <Section tone="dark">
        <SectionHeading title={activeTab.title} align="center" tone="inverse" className="mb-10" />

        <Reveal className="mb-12 flex justify-center">
          <Tabs
            idPrefix="hack-tab"
            tabs={hackathon.participation.tabs.map((entry) => ({
              value: entry.id,
              label: entry.label,
            }))}
            value={tab}
            onChange={setTab}
            /* `w-auto` + centred: the strip is a set of three short
               Arabic labels, and stretched to the container it reads
               as a nav bar rather than as a control. */
            className="w-auto justify-center border-white/15"
          />
        </Reveal>

        {/* One panel, keyed by the active tab so the cards re-enter
            on every switch rather than swapping their text in place —
            the entrance is what tells the reader the list changed.
            `role="tabpanel"` and the id/labelledby pair are what wire
            it to `Tabs`; without them the strip is a row of buttons
            with ARIA that lies. */}
        <Stagger
          key={activeTab.id}
          id={`panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`hack-tab-${activeTab.id}`}
          tabIndex={-1}
          className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {activeTab.items.map((item) => {
            const Icon = PARTICIPATION_ICONS[item.id];
            return (
              <StaggerItem key={item.id} className="h-full">
                <IconCard
                  title={item.title}
                  description={item.description}
                  lines={null}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <SectionSeam />

      {/* ── Timeline ─────────────────────────────────────────────
             Nine dated stages on the scroll-drawn rail. This is the
             structure the migration flattened hardest: the stages
             survived as bare headings and their dates did not survive
             at all, because the source keeps them in markup rather
             than in prose.

             `ProcessSteps` already draws a numbered sequence on a rail
             that fills as the section passes; the only thing it
             needed was somewhere to put a date, which is the `date`
             field it now reads. Same component, same rail, same
             reduced-motion behaviour as the strategic goals on
             /about — the two read as one device used twice.

             `size="lg"` and `process-steps-roomy` for the same reason
             they are set there: nine steps at the default rhythm sit
             too close to read as separate stages. */}
      <Section tone="glow-alt" size="lg">
        <StickySplit
          ratio="roomy"
          aside={
            <SectionHeading title={hackathon.timeline.title} layout="aside" size="base" as="h2" />
          }
        >
          <ProcessSteps className="process-steps-roomy" steps={hackathon.timeline.items} />
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── Strategic partner ────────────────────────────────────
             A named organisation and two paragraphs about it. Held in
             `.panel-inset` — the site's one framed surface, which is
             what marks a passage as a stated position rather than as
             more explanation. The spiral watermark is the same
             treatment `CtaBand` and `BrandCard` give their panels. */}
      <Section tone="wash">
        <Reveal className="panel-inset px-7 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <Spiral
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 size-44 text-brand-200/[0.07] end-6"
          />

          <div className="relative max-w-3xl">
            <SectionHeading
              eyebrow={hackathon.partner.eyebrow}
              title={hackathon.partner.title}
              size="sm"
              as="h2"
            />

            <div className="mt-6 flex flex-col gap-5">
              {hackathon.partner.body.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="leading-relaxed text-ink-secondary">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      <SectionSeam />

      {/* ── Conditions ───────────────────────────────────────────
             Two paragraphs of eligibility rules. Quiet panel rather
             than the inset one — this is read, not actioned, and
             `.panel-quiet` is the surface that keeps body-copy
             contrast (see the note on it in layout.css).

             The shield mark rather than a checklist of ticks: the two
             paragraphs are prose, and splitting a sentence into
             bullets to earn an icon per line would be rewriting the
             client's copy to fit a layout. */}
      <Section>
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={hackathon.conditions.eyebrow}
              title={hackathon.conditions.title}
              layout="aside"
            />
          }
        >
          <Reveal className="panel-quiet flex flex-col gap-5 p-8 sm:p-10">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring">
              <ShieldCheck className="size-6" aria-hidden="true" strokeWidth={1.75} />
            </span>

            {hackathon.conditions.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="leading-relaxed text-ink-secondary">
                {paragraph}
              </p>
            ))}
          </Reveal>
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── FAQ ──────────────────────────────────────────────────
             Four questions, in the same accordion the homepage FAQ
             uses. The QUESTIONS are the part the migration lost — the
             flat body carries only the four answers, which is why
             that section of it reads as four unrelated sentences. */}
      <Section tone="glow">
        <StickySplit
          aside={
            <SectionHeading
              eyebrow={hackathon.faq.eyebrow}
              title={hackathon.faq.title}
              layout="aside"
            />
          }
        >
          {/* `Accordion` reads `question`/`answer` as well as
              `title`/`content`, so the FAQ items go in as they are. */}
          <Accordion items={hackathon.faq.items} />
        </StickySplit>
      </Section>

      <SectionSeam />

      <CtaBand {...contactCta} />
    </>
  );
}
