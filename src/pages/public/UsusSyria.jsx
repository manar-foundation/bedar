import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Coins,
  GraduationCap,
  Handshake,
  MapPin,
  Network,
  PlugZap,
  Puzzle,
  Recycle,
  Rocket,
  Tags,
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
  StickySplit,
} from '@components/ui';
import { Reveal, RevealOnMount, Stagger, StaggerItem } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useCountUp } from '@hooks/useCountUp.js';
import { useSeo } from '@hooks/useSeo.js';
import { formatNumber } from '@utils/format.js';
import { ususSyria } from '@content/usus-syria.js';
import { pageBanners } from '@content/page-banners.js';
import coverFallback from '@assets/banners/usus-syria.webp';
import programLogo from '@assets/programs/usus-syria-logo.svg';
import logoSmedc from '@assets/partners/smedc.webp';
import logoSdo from '@assets/partners/sdo.webp';

/* ================================================================
   مشروع أُسُس سورية — /programs/usus-syria.

   WHY THIS PAGE HAS ITS OWN COMPONENT
   ----------------------------------------------------------------
   The same reason `Hackathon.jsx` does, and this is the second of
   the two. `CollectionDetail` renders a program written as an
   article; the client's brief for this one
   ("إنشاء صفحة هبوط أسس سوريا - بدار - يوليو 2026 (1).docx") is a
   LANDING-PAGE brief — eight numbered bands, each a different shape
   — so it gets a layout instead of a rich-text body.
   `content/usus-syria.js` is its content half, and the note at the
   top of that file records what the Sept 2026 re-issue changed.

   ASSEMBLED FROM THE SITE'S OWN PRIMITIVES
   ----------------------------------------------------------------
   Nothing below is invented for this page. The brief asks for a
   design close to the hackathon program page, and the way to get
   that is not to copy its markup — it is to compose from the same
   parts, which is what that page does too:

     brief's band              primitive             also used on
     ────────────────────────  ────────────────────  ──────────────
     header                    PageHero              every sub-page
     1 · التحديات              quiet-panel rows      (this page)
     2 · عن المشروع            StickySplit + aside   /social-…
       + the two figures       FigureCard            (this page)
       القطاعات المستهدفة      IconCard grid         home, /about
     3 · على ماذا ستحصل        IconCard grid         /programs/hackathon
     4 · الفئة المستهدفة       panel-quiet list      hackathon conditions
     5 · رحلة المشروع          ProcessSteps          /about, hackathon
     6 · آلية التقديم          NumberedList          /social-…
     7 · دعوة للتسجيل          CtaBand               every page
     8 · شركاؤنا               panel-quiet plates    (this page)

   The band tones alternate on the hackathon page's own rhythm
   (plain → glow → glow-alt → dark → plain → wash), which is what
   keeps a long page from reading as one undifferentiated column.

   NO TWO ADJACENT BANDS SHARE A SHAPE
   ----------------------------------------------------------------
   Three of the eight bands are card grids, which is one more than
   this page carried in July, so they are deliberately kept apart and
   given different silhouettes:

     §1 التحديات      quiet rows, MUTED mark, split header
     §2 عن المشروع     sticky aside header, a 2-up figure pair inside
                      the split, then a 3-up IconCard grid
     §3 ستحصل         split header, 5-up IconCard grid, brand mark
     §4 الفئة         centred inverse header on dark, tick list

   §1's marks are deliberately NOT the brand tint the IconCard grids
   use. Those bands are offers; this one is a list of pressures, and
   painting a power cut in the same mint as "دعم مالي أولي" reads as
   a feature. Same reason it is quiet rows and not cards.

   ORDER
   ----------------------------------------------------------------
   The brief's own order, unchanged, section 1 through section 8 —
   which as of Sept 2026 puts رحلة المشروع AFTER الفئة المستهدفة, the
   reverse of the July brief.

   The one departure from the document's layout is the client's own
   instruction: the two figures the brief prints under its header are
   now cards under the عن المشروع paragraph, instead of a ruled row of
   their own (Sept 2026). That paragraph is where the brief actually
   says "تمكين 21 شركة ناشئة", so the pair answers the sentence above
   it. The location chip still belongs to the header, and the figures
   are still the brief's words — only their band moved.

   THE EMOJI ARE MARKS, AND THEY ARE DRAWN AS MARKS
   ----------------------------------------------------------------
   Section 3 of the brief prefixes each benefit with an emoji. Site
   copy on Bedar carries no emoji — that is a standing brand rule —
   so each one is carried here as the lucide equivalent of the
   character the brief chose, keyed by id the same way the services,
   values and hackathon-goal grids key theirs. The intent survives,
   the typeface changes; see the note in `content/usus-syria.js`.
   ================================================================ */

/* The brief's own emoji, as lucide marks. `📊 اختبار السوق` is gone
   from the map along with the card the Sept 2026 brief dropped:

     🧩 تدريب عملي         → Puzzle
     👥 إرشاد متخصص        → Users
     🤝 تشبيك وشراكات      → Handshake
     📅 متابعة مستمرة      → CalendarCheck
     💰 دعم مالي أولي      → Coins                                   */
const BENEFIT_ICONS = {
  training: Puzzle,
  mentorship: Users,
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

/* The four challenges the Sept 2026 brief opens on. The brief gives
   these no marks of its own — unlike the benefits, there is no emoji
   to carry over — so each one is read from the subject of the
   sentence, in the brief's order:

     ضعف الكهرباء والإنترنت              → PlugZap
     تسعير المنتجات / القدرة الشرائية     → Tags
     التمويل والخبرات والشبكات           → Network
     الانتقال من التدريب إلى التنفيذ      → Rocket

   Positional, because the brief's challenges are plain sentences
   with no id to key on — the same way `audience` carries plain
   strings. Keep the array and the content list in step. */
const CHALLENGE_ICONS = [PlugZap, Tags, Network, Rocket];

/* ── THE TWO PARTNER LOGOS ─────────────────────────────────────
   Keyed by the `partners` id in `content/usus-syria.js`, the way
   every other mark on this page is keyed. Both files were supplied
   by the client (Sept 2026); the brief itself embeds no images.

     sme-authority        smeda.gov.sy/assets/images/Logo.png
     syrian-development   the SDO S3 bucket's own
                          "SDO Logo Horizontal - White.png"

   BOTH ARE REVERSED ARTWORK, BECAUSE THIS BAND IS DARK
   ----------------------------------------------------------------
   SDO publish a white horizontal variant and that is the file used,
   untouched — the three stars are white in their own reversed
   artwork, not a change made here.

   SMEDC publish no reversed variant, and their file is #231F20 ink
   plus a #5AB39F teal: on this surface the wordmark and the dotted
   map both disappeared and only the teal line survived. So the
   NEUTRAL ink alone was lifted to white and the teal was left exactly
   as supplied — the partner's second brand colour is intact, and the
   result matches what SDO's own reversed file does. That is a
   reversed lockup, not a recolour: no hue is changed, and the
   alpha channel is untouched so the antialiasing survives.

   REPLACE THE SMEDC FILE the moment the partner supplies a reversed
   variant of their own — a partner's own artwork always wins over
   one derived here. Neither file may be used on a light surface.

   Both were trimmed to their ink (the supplied SMEDC file carries
   baked-in padding that would have made it read smaller than SDO at
   the same height) and exported at 200px tall, which is 2.5x the
   80px they render at. Re-export them if that height changes — 2x is
   the floor for a retina screen, and these are raster files, so the
   source height is the whole quality budget.                       */
const PARTNER_LOGOS = {
  'sme-authority': logoSmedc,
  'syrian-development': logoSdo,
};

/* ── THE TWO HEADLINE FIGURES, AS CARDS ────────────────────────
   The brief prints "21 شركة ناشئة" and "3 قطاعات مستهدفة" under its
   header. The client moved them (Sept 2026) under §2's "مسرعة أعمال
   متخصصة …" paragraph — the sentence that actually states them.

   WHY THIS IS NOT THE `band-tile` BOX THE SECTOR CARDS USE
   ----------------------------------------------------------------
   It was, and it read as almost nothing: `band-tile` is `#0f2325` on
   a `#081a1a` page behind a `#1b2e31` hairline, which is a 7% lift
   and a border you cannot see. That is the right restraint for the
   three sector cards — a row of equals, where the box is a container
   and the copy is the content — and the wrong one for two figures
   whose whole job is to be seen. So the client asked for a clearer,
   better-looking box and this is it:

     surface   a teal wash pooling at the reading corner and fading
               out, instead of a flat near-black panel
     ring      brand-300 at 25%, which is visible, against a hairline
               that was not
     edge      a brand-300 bar down the inline-start edge — the same
               gesture the paragraph directly above uses, so the pair
               reads as belonging to that sentence rather than as two
               cards that happen to follow it
     bloom     a soft teal glow behind the numeral, the page's own
               depth language (`section-title-glow`, the card blooms)

   The figure is 4xl/5xl against a 16px label — enough to lead the
   card without the box growing around it. It went to 5xl/6xl for one
   round and came back down with the padding when the client asked
   for a smaller box; the tile is 126px now against the 148px it was,
   and the number still dominates because the LABEL came down too.
   Shrink those two together or not at all: cutting only the padding
   moves the height by 8px and reads as no change.

   NO MARK ON THESE TWO, at the client's instruction (Sept 2026).
   They carried a Building2 / Target pair for one round and lost it;
   do not add one back. The figure IS the card's mark.

   The count-up came across from `StatRow` and `formatNumber` keeps
   the digits Western, which is the whole reason that helper exists. */
function FigureCard({ value, label }) {
  const [ref, shown] = useCountUp(value);

  return (
    <div className="group relative flex h-full flex-col justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-bl from-brand-400/[0.16] via-brand-500/[0.07] to-transparent p-6 ps-7 ring-1 ring-inset ring-brand-300/25 transition-shadow duration-(--dur-base) ease-(--ease-standard) hover:shadow-e2 hover:ring-brand-300/45">
      {/* The paragraph above this pair is set against a teal rule on
          its reading edge. This is the same rule, so the cards read as
          that sentence's own figures. It fades out downward rather
          than boxing the card in. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-brand-300 via-brand-300/70 to-brand-300/10"
      />

      {/* Depth behind the numeral, not decoration beside it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 size-40 rounded-full bg-brand-300/15 blur-3xl -start-8"
      />

      <span
        ref={ref}
        className="relative text-4xl font-bold leading-none tabular-nums text-brand-200 lg:text-5xl"
      >
        {/* `.ltr-run` for the same reason `StatRow` used one: a figure
            inside Arabic prose must not bidi-reorder. */}
        <span className="ltr-run">{formatNumber(shown)}</span>
      </span>

      <p className="relative text-base font-medium leading-snug text-ink">{label}</p>
    </div>
  );
}

/**
 * `to` for an in-app path, `href` for a form on another host.
 *
 * The apply CTA's destination is a single constant in the content
 * file and the client has not supplied the real form yet, so this
 * page must not assume its shape. Same rule `CtaBand` applies to its
 * own buttons, and all five of this page's CTAs go through it.
 */
function applyLinkProps(cta) {
  return /^(https?:|mailto:|tel:)/.test(cta.href) ? { href: cta.href } : { to: cta.href };
}

/* ── A SIGNED NUMBER NEEDS ISOLATING; A PLAIN ONE DOES NOT ─────
   The Sept 2026 brief writes one benefit as "+50 ساعة تدريبية …",
   and that leading sign is the one numeric hazard on this page.

   A BARE digit run inside Arabic prose already typesets correctly on
   its own — "12 أسبوعًا", "1:1", "5,000 دولار" and "18 و35 عامًا" all
   render left-to-right with no help, because the bidi algorithm
   gives a European-number run its own level inside an RTL paragraph.
   A LEADING SIGN does not: `+` is a bidi TERMINATOR, and at the start
   of the line there is no number before it to attach to, so it falls
   back to the paragraph's own direction and lands on the far side of
   the digits. "+50 ساعة" then typesets as "50+ ساعة", which is a
   different claim about the programme, not a cosmetic difference.

   `.ltr-run` (rtl.css) is the site's fix for exactly this, and
   wrapping the sign and its digits TOGETHER is the same thing
   `StatRow` does with a prefix + figure pair. The client's string is
   untouched — only its typesetting changes.

   Anchored to the start of a word so a hyphen between two numbers (a
   year range, a date) is left alone: there it is a separator, not a
   sign, and isolating it would break the pair it joins. */
const SIGNED_NUMBER = /(?<=^|[\s(])([+−-]\d[\d.,]*)/g;

function bidiSafe(text) {
  const parts = text.split(SIGNED_NUMBER);
  if (parts.length === 1) return text;

  // `split` with one capture group alternates literal, capture,
  // literal … so the odd indices are the runs to isolate.
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={part + index} className="ltr-run">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/* ── THE PROGRAMME'S OWN WORDMARK ──────────────────────────────
   A geometric-Kufic lockup of «أُسُس سوريا», supplied by the client
   (Aug 2026) to sit INSIDE this page — not in the navbar, not on the
   listing card, and not as a second site logo. It appears twice, each
   time doing a different job:

     header         at the top of the copy column, in place of the
                    breadcrumb trail and the category chip — the mark
                    introduces the programme, and a crumb repeating its
                    name under its own logo was the redundancy the
                    client's Aug 2026 pass removed
     closing band   in place of the site spiral, so the page signs off
                    in the programme's own name

   It led the عن المشروع aside as well until that same pass. It came
   out when the mark moved into the header, where it introduces the
   programme better and does not compete with itself two bands later.

   BOTH INSTANCES ARE THE SAME SIZE — `w-28 lg:w-32`, on the client's
   instruction (Aug 2026). The header one was twice that and read as a
   second masthead competing with the h1 directly under it. Sized on
   WIDTH in both places, never height: this is a two-line wordmark at
   1.66:1, and pinning its height collapses it to an illegible smudge.
   Change one and change the other.

   Its teal is the client's file, not a token, and it is left alone:
   it already sits inside the brand's own range (#43B3A7 → #69C1A9)
   and clears AA against the page's near-black surface comfortably.
   Do not recolour it to `currentColor` — a supplied wordmark is not
   an icon.

   Twice is the ceiling. A third instance turns a mark into wallpaper.
   §8's partner plates in particular are NOT a place for it — that
   band belongs to the partners.

   The artwork still spells the programme سوريا; the Sept 2026 copy
   spells it سورية. The alt text follows the COPY, because that is
   the programme's name now, and re-lettering a supplied wordmark is
   the client's job, not ours. */
const LOGO_ALT = 'مشروع أُسُس سورية';

/* The photograph, when the programme record has no cover of its own.
   A real file rather than nothing, so the page is never shipped
   image-less — but it is only the floor: the dashboard's cover wins
   the moment one is uploaded. See the note on the header below. */
const FALLBACK_COVER = {
  src: coverFallback,
  alt: 'مؤسس يراجع فرضيات مشروعه على لوح من الملاحظات في مساحة عمل مشتركة',
};

export default function UsusSyria() {
  useSeo(ususSyria.seo);

  const {
    hero,
    facts,
    challenges,
    about,
    benefits,
    audience,
    journey,
    applying,
    closing,
    partners,
  } = ususSyria;

  /* The programme's own record, for the one thing on this page that
     is NOT in the brief: its photograph. Everything else here is
     structured content in `content/usus-syria.js`, but the client
     asked to be able to change the header image from the dashboard
     whenever they like — so it is read from the record's cover
     (`collection_items.cover_media_id`, the "صورة الغلاف" field under
     /admin/collections/programs) exactly the way `CollectionDetail`
     reads an article's.

     `find` rather than an index: the listing is ordered by
     `published_at`, so a position here would be a bug waiting for the
     next programme to be published. Undefined until the record is
     published — a draft is not in the public read — and the bundled
     crop stands in until then. */
  const { collections } = useContent();
  const record = collections.programs.find((item) => item.slug === ususSyria.slug);
  const cover = record?.image ? { src: record.image, alt: record.imageAlt ?? '' } : FALLBACK_COVER;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────
             The banner every sub-page shares, with the brief's own
             header line as its subtitle and the apply button as its
             action.

             A PICTURE BESIDE THE TITLE, NOT A BACKDROP BEHIND IT
             ---------------------------------------------------------
             `PageHero`'s `image` pins a photograph behind the copy at
             30% opacity under a scrim, so it reads as texture rather
             than as a picture. The client asked for the opposite here
             (Aug 2026): a real image, beside the text, that they can
             change from the dashboard whenever they want.

             It therefore goes in `visual` — the band's second column
             — and the copy stays in the first. In RTL that puts the
             picture on the LEFT of the text, which is what was asked
             for, and it is the grid's inline axis that does it rather
             than any `order` or `left-` class, so the same markup is
             correct in both directions.

             The `page-banners` key is still passed the way every
             other page passes its own. It is `null` there,
             deliberately and with a note saying why, so adding an
             atmospheric backdrop BEHIND this split later stays a
             one-line change rather than a re-wiring. */}
      <PageHero
        lead={
          <>
            {/* The wordmark takes the breadcrumb trail's place at the
                top of the column, and the location chip sits directly
                over the name — both client edits (Aug 2026). The trail
                and the "البرامج الحالية" chip are gone with it: the
                mark introduces the programme, and repeating its name
                in a crumb under its own logo was the redundancy the
                edit removes. */}
            <RevealOnMount>
              <img src={programLogo} alt={LOGO_ALT} className="h-auto w-28 lg:w-32" />
            </RevealOnMount>

            <RevealOnMount delay={1} className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-300/10 px-3.5 py-1.5 text-sm font-medium text-brand-100 ring-1 ring-inset ring-brand-200/25">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {hero.location}
              </span>
            </RevealOnMount>
          </>
        }
        title={hero.title}
        subtitle={hero.tagline}
        image={pageBanners.ususSyria}
        visual={
          /* Framed the way `CollectionDetail` frames an article's
             cover — same radius, same elevation, same hairline — so
             the picture belongs to the site rather than to this page.
             4/3 rather than 16/9: beside a column this tall, a wide
             crop leaves the band looking half-empty.

             `RevealOnMount`, not `Reveal`: this is above the fold, and
             a scroll-triggered reveal on something already in view
             either fires instantly or not at all. */
          <RevealOnMount delay={3}>
            <div className="overflow-hidden rounded-2xl shadow-e3 ring-1 ring-white/10">
              <img
                src={cover.src}
                alt={cover.alt}
                /* Eager: it is at the top of the page, and a lazy
                   image this high is a visible pop on first paint. */
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </RevealOnMount>
        }
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
      />

      {/* ── 1 · التحديات ─────────────────────────────────────────
             New in the Sept 2026 brief, and the page now opens on it:
             four pressures the reader recognises, before any claim
             about the programme.

             Quiet rows rather than cards, and a MUTED mark rather
             than the brand tint — see the note at the top of this
             file. The heading is `split` so the question and its lede
             sit side by side, which no other band on the page does. */}
      <Section>
        <SectionHeading
          eyebrow={challenges.eyebrow}
          title={challenges.title}
          lede={challenges.lede}
          layout="split"
          className="mb-12"
        />

        <Stagger className="grid gap-4 lg:grid-cols-2">
          {challenges.items.map((item, index) => {
            const Icon = CHALLENGE_ICONS[index];
            return (
              <StaggerItem key={item.slice(0, 24)} className="h-full">
                <div className="panel-quiet flex h-full items-start gap-4 p-6">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-subtle bg-sunken text-ink-secondary">
                    {Icon ? (
                      <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
                    ) : null}
                  </span>
                  <p className="leading-relaxed text-ink-secondary">{item}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* The brief's own bridge out of the section, then the line
            it closes on — carried whole as the button's label rather
            than trimmed to "قدّم الآن", because the sentence IS the
            client's call to action. `outline`, not `accent`: the
            turquoise is reserved for the page's primary CTAs (the
            header and the closing band), and five haloed buttons on
            one page would leave none of them primary. */}
        <Reveal className="mt-10 flex flex-col items-start gap-6">
          <p className="max-w-2xl text-lg font-medium leading-relaxed text-ink">
            {challenges.note}
          </p>

          <Button
            variant="outline"
            size="lg"
            {...applyLinkProps(challenges.cta)}
            iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
          >
            {challenges.cta.label}
          </Button>
        </Reveal>
      </Section>

      <SectionSeam />

      {/* ── 2 · عن المشروع ───────────────────────────────────────
             One dense paragraph, so the heading is pinned beside it —
             the device /social-entrepreneurship uses for exactly
             this. The target sectors follow in the same band, at
             full container width: they belong to section 2 of the
             brief, but three cards inside the split's narrower
             column would sit two-up and break the set.

             THE TWO FIGURES SIT UNDER THAT PARAGRAPH
             ---------------------------------------------------------
             Client instruction (Sept 2026), and the right home for
             them: the paragraph is where the brief actually SAYS
             "تمكين 21 شركة ناشئة … عبر برنامج مكثف", so the pair
             quantifies the sentence directly above it instead of
             leading a list of what the programme gives you. They
             travelled from a ruled row under the hero, through §3,
             to here.

             Inside the split's own column rather than at container
             width: they belong to the paragraph, and a pair of cards
             spanning the full band would read as a section of their
             own and push the eye past the sentence they answer to.
             Two cards fit that column exactly 2-up. */}
      <Section tone="glow">
        <StickySplit
          aside={<SectionHeading eyebrow={about.eyebrow} title={about.title} layout="aside" />}
        >
          <Reveal
            as="p"
            className="border-s-2 border-brand-300 ps-5 text-lg font-medium leading-relaxed text-ink dark:border-brand-500"
          >
            {about.body}
          </Reveal>

          <Stagger className="mt-9 grid gap-6 sm:auto-rows-fr sm:grid-cols-2">
            {facts.map((fact) => (
              <StaggerItem key={fact.id} className="h-full">
                <FigureCard value={fact.value} label={fact.label} />
              </StaggerItem>
            ))}
          </Stagger>
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

      {/* ── 3 · على ماذا ستحصل الشركات المشاركة؟ ──────────────────
             FIVE cards, not six — the Sept 2026 brief dropped
             اختبار السوق as a card of its own. The two headline
             figures passed through this grid for one round and now
             live under the عن المشروع paragraph they quantify, at the
             client's instruction; see the note on §2.

             Five is the awkward count in a 3-up grid: it leaves two
             orphans hugging the reading edge of the last row. So at
             `lg` the grid runs on SIX columns with every card
             spanning two, and the fourth card starts at column 2 —
             which puts 3 across the top and the remaining 2 centred
             under them. Below `lg` it is the ordinary 2-up grid and
             the span classes do not apply.

             Change the card count and change `nth-child(4)` with it;
             the two are one decision, not two.

             `auto-rows-fr` starts at `sm`, not at the base. Levelling
             row heights is what keeps cards that sit SIDE BY SIDE on
             one baseline; in the single column below `sm` there is no
             row to level and it only stretches every card to the
             tallest.

             `lines={null}` — every description is a single short
             sentence, so there is nothing to hold back behind a
             clamp. */}
      <Section tone="glow-alt">
        <SectionHeading
          title={benefits.title}
          lede={benefits.lede}
          layout="split"
          className="mb-12"
        />

        <Stagger className="grid gap-6 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-6 lg:[&>*]:col-span-2 lg:[&>*:nth-child(4)]:col-start-2">
          {benefits.items.map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.id];
            return (
              <StaggerItem key={benefit.id} className="h-full">
                <IconCard
                  title={benefit.title}
                  description={bidiSafe(benefit.description)}
                  lines={null}
                  icon={Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
                />
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal className="mt-12 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            {...applyLinkProps(benefits.cta)}
            iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
          >
            {benefits.cta.label}
          </Button>
        </Reveal>
      </Section>

      <SectionSeam />

      {/* ── 4 · الفئة المستهدفة ──────────────────────────────────
             SIX eligibility lines now, up from four. A tonal break
             here rather than a fourth light band, and a checklist
             rather than cards: each line is a condition the reader
             tests themselves against, which is what a tick beside it
             says and what a card around it would not.

             2-up, so six fills three even rows. The lines are the
             brief's sentences, unsplit — there is no
             title/description pair to make without rewriting them.

             The band closes on the brief's own line, as a button.
             `inverse` because this is `.surface-dark`: an outline
             button drawn in the teal `--action-primary` does not
             clear AA against it. */}
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

        <Reveal className="mt-12 flex justify-center">
          <Button
            variant="inverse"
            size="lg"
            {...applyLinkProps(audience.cta)}
            iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
          >
            {audience.cta.label}
          </Button>
        </Reveal>
      </Section>

      <SectionSeam />

      {/* ── 5 · رحلة المشروع ─────────────────────────────────────
             Four stages on the scroll-drawn rail — the same
             component and the same rail as the hackathon's timeline
             and the strategic goals on /about, so the three read as
             one device used three times.

             The brief's "المرحلة الأولى" labels go in the rail's
             `meta` slot, above each stage's name. The rail numbers
             the stages itself, so the label and the number say the
             same thing twice on purpose: the number is the reader's
             position in the sequence, the label is the brief's own
             name for the stage.

             Below الفئة المستهدفة, which is where the Sept 2026 brief
             puts it — it ran above it in July. */}
      <Section size="lg">
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

      {/* ── 6 · آلية التقديم ─────────────────────────────────────
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

      {/* ── 7 · دعوة للتسجيل ─────────────────────────────────────
             The site's standard closing band, carrying the brief's
             own heading, paragraph and button. Unlike the hackathon
             — a past program with no form left to point at — this one
             is open, so the page closes on its call to apply rather
             than on the generic contact band. */}
      <CtaBand
        title={closing.title}
        lede={closing.lede}
        cta={closing.cta}
        /* The programme's mark instead of the site's spiral. Sized on
           its WIDTH, not its height: the spiral is a 32px icon, but
           this is a two-line wordmark at 1.66:1, and pinning its
           height collapses it to a 73px smudge with the Kufic no
           longer readable. `alt=""`
           on purpose: this is the SECOND time the wordmark appears on
           the page, and a screen reader that has already announced it
           in the header should hear the closing heading here, not
           the programme's name twice. */
        mark={<img src={programLogo} alt="" className="h-auto w-28 lg:w-32" />}
      />

      {/* ── 8 · شركاؤنا ──────────────────────────────────────────
             New in the Sept 2026 brief, and the last band on the page
             — which is where the client's own comment on the brief
             asks for it ("يفضل وضع الشركاء في آخر الصفحة مع الرعاة").
             After the closing band on purpose, therefore, rather than
             before it.

             A LOGO WALL, so the two marks are the content and the
             plates only hold them. `PARTNER_LOGOS` resolves the id;
             the partner's name from the brief becomes the `alt`, so
             the band says the same thing to a screen reader as it
             does on screen.

             SIZED ON HEIGHT, NEVER ON WIDTH — a logo row reads as a
             row because every mark shares a cap height, not because
             the boxes match. The two files are trimmed to their ink
             and have near-identical aspect ratios (3.14:1 and 2.98:1),
             so one height puts them at the same optical weight.
             `max-w-full` is the guard for a narrow phone, where the
             height would otherwise overflow the plate.

             Quiet plates rather than IconCards: this band shows
             organisations, it does not describe them, and a card with
             an empty description slot would read as unfinished.

             `size="sm"` — the sentence the brief gives ("نعتزّ
             بشركائنا في إنجاح المشروع") is the whole section, and a
             closing band should not out-weigh the CTA directly above
             it.

             Both images are `lazy`: this is the last band on a page
             about seven screens tall, so neither is anywhere near the
             first paint.

             READ THE MOU NOTE in `content/usus-syria.js` before this
             page is opened to search engines — a logo claims more
             than a name did. */}
      <Section size="sm">
        <SectionHeading
          eyebrow={partners.eyebrow}
          title={partners.title}
          align="center"
          size="sm"
          className="mb-10"
        />

        <Stagger className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {partners.items.map((partner) => (
            <StaggerItem key={partner.id} className="h-full">
              <div className="panel-quiet flex h-full min-h-36 items-center justify-center p-6">
                <img
                  src={PARTNER_LOGOS[partner.id]}
                  alt={partner.name}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-auto max-w-full object-contain sm:h-20"
                />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>
    </>
  );
}
