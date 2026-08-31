import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  Coins,
  GraduationCap,
  Handshake,
  MapPin,
  Puzzle,
  Recycle,
  Users,
  Zap,
} from 'lucide-react';

import {
  Button,
  CtaBand,
  IconCard,
  NumberedList,
  PageHero,
  ProcessSteps,
  Section,
  SectionHeading,
  SectionSeam,
  Spiral,
  StatRow,
  StickySplit,
} from '@components/ui';
import { Reveal, RevealOnMount, Stagger, StaggerItem } from '@components/motion/Reveal.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { ususSyria } from '@content/usus-syria.js';
import { pageBanners } from '@content/page-banners.js';
import { breadcrumbsFor } from '@content/site.js';

/* ================================================================
   أُسُس سوريا للريادة المجتمعية — /programs/usus-syria.

   WHY THIS PAGE HAS ITS OWN COMPONENT
   ----------------------------------------------------------------
   The same reason `Hackathon.jsx` does, and this is the second of
   the two. `CollectionDetail` renders a program written as an
   article; the client's brief for this one
   ("إنشاء صفحة هبوط أسس سوريا - بدار - يوليو 2026.docx") is a
   LANDING-PAGE brief — six numbered bands, each a different shape —
   so it gets a layout instead of a rich-text body.
   `content/usus-syria.js` is its content half.

   ASSEMBLED FROM THE SITE'S OWN PRIMITIVES
   ----------------------------------------------------------------
   Nothing below is invented for this page. The brief asks for a
   design close to the hackathon program page, and the way to get
   that is not to copy its markup — it is to compose from the same
   parts, which is what that page does too:

     brief's band              primitive             also used on
     ────────────────────────  ────────────────────  ──────────────
     header                    PageHero              every sub-page
     the four figures          StatRow               /about, home
     1 · عن البرنامج            StickySplit + aside   /social-…
       القطاعات المستهدفة       IconCard grid         home, /about
     2 · ماذا ستحقق            IconCard grid         /programs/hackathon
     3 · رحلة البرنامج          ProcessSteps          /about, hackathon
     4 · الفئة المستهدفة        panel-quiet list      hackathon conditions
     5 · آلية التقديم           NumberedList          /social-…
     6 · دعوة للتسجيل           CtaBand               every page

   The band tones alternate on the hackathon page's own rhythm
   (plain → glow → glow-alt → dark → wash → panel), which is what
   keeps a long page from reading as one undifferentiated column.

   ORDER
   ----------------------------------------------------------------
   The brief's own order, unchanged, section 1 through section 6.
   The figures and the location chip come from the block the brief
   prints under its header, so they stay attached to the header.

   THE EMOJI ARE MARKS, AND THEY ARE DRAWN AS MARKS
   ----------------------------------------------------------------
   Section 2 of the brief prefixes each benefit with an emoji. Site
   copy on Bedar carries no emoji — that is a standing brand rule —
   so each one is carried here as the lucide equivalent of the
   character the brief chose, keyed by id the same way the services,
   values and hackathon-goal grids key theirs. The intent survives,
   the typeface changes; see the note in `content/usus-syria.js`.
   ================================================================ */

/* The brief's own emoji, as lucide marks:

     🧩 تدريب عملي            → Puzzle
     👥 إرشاد متخصص           → Users
     📊 اختبار السوق          → BarChart3
     🤝 تشبيك وشراكات         → Handshake
     📅 متابعة بعد البرنامج    → CalendarCheck
     💰 دعم مالي أولي         → Coins                                */
const BENEFIT_ICONS = {
  training: Puzzle,
  mentorship: Users,
  'market-test': BarChart3,
  network: Handshake,
  'follow-up': CalendarCheck,
  'seed-funding': Coins,
};

/* One mark per target sector, read from what the sector's own line
   says rather than from its title alone:

     الطاقة والحلول اللامركزية      إنتاج الطاقة وإدارتها     → Zap
     الاقتصاد الدائري وإعادة التدوير  إعادة الاستخدام والنفايات → Recycle
     تقنيات التعليم والمهارات       تطوير التعلم وتنمية المهارات → GraduationCap */
const SECTOR_ICONS = {
  energy: Zap,
  'circular-economy': Recycle,
  edtech: GraduationCap,
};

/**
 * `to` for an in-app path, `href` for a form on another host.
 *
 * The apply CTA's destination is a single constant in the content
 * file and the client has not supplied the real form yet, so this
 * page must not assume its shape. Same rule `CtaBand` applies to its
 * own buttons.
 */
function applyLinkProps(cta) {
  return /^(https?:|mailto:|tel:)/.test(cta.href) ? { href: cta.href } : { to: cta.href };
}

export default function UsusSyria() {
  useSeo(ususSyria.seo);

  const { hero, facts, about, benefits, journey, audience, applying, closing } = ususSyria;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────
             The banner every sub-page shares, with the brief's own
             header line as its subtitle and the apply button as its
             action. The photograph is set in `page-banners.js`, not
             here — see the note at the top of that file. */}
      <PageHero
        breadcrumbs={[...breadcrumbsFor('/programs'), { label: hero.title }]}
        category={hero.category}
        title={hero.title}
        subtitle={hero.tagline}
        image={pageBanners.ususSyria}
        actions={
          <Button
            variant="accent"
            size="lg"
            {...applyLinkProps(hero.cta)}
            /* ArrowLeft unmirrored — in RTL "forward" is leftward,
               so the plain glyph already points the right way. */
            iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
          >
            {hero.cta.label}
          </Button>
        }
      >
        {/* The two cities, as a chip rather than a sentence: it is a
            label the brief prints on its own line, and it is the one
            logistical fact a reader scanning the header needs. Same
            treatment the hackathon banner gives its delivery format. */}
        <RevealOnMount delay={4} className="mt-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-300/10 px-3.5 py-1.5 text-sm font-medium text-brand-100 ring-1 ring-inset ring-brand-200/25">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {hero.location}
          </span>
        </RevealOnMount>
      </PageHero>

      {/* ── The four figures ─────────────────────────────────────
             The block the brief prints under its header, in the
             ruled row /about and the homepage already use. These are
             genuine quantities (18 / 12 / 3 / 6), so unlike the
             hackathon's date ranges they count up. */}
      <Section size="sm">
        <StatRow stats={facts} />
      </Section>

      <SectionSeam />

      {/* ── 1 · عن البرنامج ──────────────────────────────────────
             One dense paragraph, so the heading is pinned beside it —
             the device /social-entrepreneurship uses for exactly
             this. The target sectors follow in the same band, at
             full container width: they belong to section 1 of the
             brief, but three cards inside the split's narrower
             column would sit two-up and break the set. */}
      <Section>
        <StickySplit
          aside={<SectionHeading eyebrow={about.eyebrow} title={about.title} layout="aside" />}
        >
          <Reveal
            as="p"
            className="border-s-2 border-brand-300 ps-5 text-lg font-medium leading-relaxed text-ink dark:border-brand-500"
          >
            {about.body}
          </Reveal>
        </StickySplit>

        <Reveal as="h3" className="mb-8 mt-14 text-lg font-bold text-ink lg:text-xl">
          {about.sectorsTitle}
        </Reveal>

        <Stagger className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {about.sectors.map((sector) => {
            const Icon = SECTOR_ICONS[sector.id];
            return (
              <StaggerItem key={sector.id} className="h-full">
                <IconCard
                  title={sector.title}
                  description={sector.description}
                  lines={null}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <SectionSeam />

      {/* ── 2 · ماذا ستحقق من مشاركتك في البرنامج؟ ────────────────
             Six cards, the brief's own suggested presentation. Same
             grid arithmetic as the hackathon's goals: six fill three
             columns exactly, and `auto-rows-fr` levels their heights
             so the row reads as one set.

             `lines={null}` — every description is a single short
             sentence, so there is nothing to hold back behind a
             clamp. */}
      <Section tone="glow">
        <SectionHeading
          title={benefits.title}
          lede={benefits.lede}
          layout="split"
          className="mb-12"
        />

        <Stagger className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.items.map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.id];
            return (
              <StaggerItem key={benefit.id} className="h-full">
                <IconCard
                  title={benefit.title}
                  description={benefit.description}
                  lines={null}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>

      <SectionSeam />

      {/* ── 3 · رحلة البرنامج ────────────────────────────────────
             Four stages on the scroll-drawn rail — the same
             component and the same rail as the hackathon's timeline
             and the strategic goals on /about, so the three read as
             one device used three times.

             The brief's "المرحلة الأولى" labels go in the rail's
             `meta` slot, above each stage's name. The rail numbers
             the stages itself, so the label and the number say the
             same thing twice on purpose: the number is the reader's
             position in the sequence, the label is the brief's own
             name for the stage. */}
      <Section tone="glow-alt" size="lg">
        <StickySplit
          ratio="roomy"
          aside={
            <SectionHeading title={journey.title} lede={journey.lede} layout="aside" as="h2" />
          }
        >
          <ProcessSteps className="process-steps-roomy" steps={journey.items} />
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── 4 · الفئة المستهدفة ──────────────────────────────────
             Four eligibility lines. A tonal break here rather than a
             fourth light band, and a checklist rather than cards:
             each line is a condition the reader tests themselves
             against, which is what a tick beside it says and what a
             card around it would not.

             The lines are the brief's sentences, unsplit — there is
             no title/description pair to make without rewriting
             them. */}
      <Section tone="dark">
        <SectionHeading
          title={audience.title}
          lede={audience.lede}
          align="center"
          tone="inverse"
          className="mb-12"
        />

        <Stagger className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {audience.items.map((item) => (
            <StaggerItem key={item.slice(0, 24)} className="h-full">
              <div className="panel-quiet flex h-full items-start gap-4 p-6">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring">
                  <BadgeCheck className="size-5" aria-hidden="true" strokeWidth={1.75} />
                </span>
                <p className="leading-relaxed text-ink-secondary">{item}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <SectionSeam />

      {/* ── 5 · آلية التقديم ─────────────────────────────────────
             `NumberedList`, not a second `ProcessSteps`: two
             scroll-drawn rails on one page read as the same section
             twice, and this is an enumerated funnel rather than a
             timeline the reader lives through. The component's own
             note draws the same distinction.

             The brief's closing sentence for this section is a
             qualifier on the whole funnel, so it sits under the list
             in the framed panel rather than becoming a sixth step. */}
      <Section tone="wash">
        <StickySplit
          aside={<SectionHeading title={applying.title} lede={applying.lede} layout="aside" />}
        >
          <NumberedList items={applying.items} />

          <Reveal className="panel-inset mt-10 px-6 py-7 sm:px-8">
            <Spiral
              aria-hidden="true"
              className="pointer-events-none absolute -top-6 size-32 text-brand-200/[0.07] end-5"
            />
            <p className="relative leading-relaxed text-ink-secondary">{applying.note}</p>
          </Reveal>
        </StickySplit>
      </Section>

      <SectionSeam />

      {/* ── 6 · دعوة للتسجيل ─────────────────────────────────────
             The site's standard closing band, carrying the brief's
             own eyebrow, heading, paragraph and button. Unlike the
             hackathon — a past program with no form left to point at
             — this one is open, so the page closes on its call to
             apply rather than on the generic contact band. */}
      <CtaBand
        eyebrow={closing.eyebrow}
        title={closing.title}
        lede={closing.lede}
        cta={closing.cta}
      />
    </>
  );
}
