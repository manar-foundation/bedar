import { Fragment } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Coins,
  Footprints,
  GraduationCap,
  Handshake,
  MapPin,
  MessagesSquare,
  Network,
  NotebookPen,
  PlugZap,
  Puzzle,
  Recycle,
  RefreshCw,
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
  StatRow,
  StickySplit,
} from '@components/ui';
import { Reveal, RevealOnMount, Stagger, StaggerItem } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { ususSyria } from '@content/usus-syria.js';
import { pageBanners } from '@content/page-banners.js';
import coverFallback from '@assets/banners/usus-syria.webp';
import programLogo from '@assets/programs/usus-syria-logo.svg';
import logoSmedc from '@assets/partners/smedc.webp';
import logoPresently from '@assets/partners/presently.png';

/* ================================================================
   مشروع أُسُس سورية — /programs/usus-syria.

   WHY THIS PAGE HAS ITS OWN COMPONENT
   ----------------------------------------------------------------
   It is the only program with one. `CollectionDetail` renders a
   program written as an article — the hackathon had a built page too
   until Sept 2026, when its content was cut to a summary and it moved
   back onto that renderer (see `routes.jsx`). The client's brief for
   this one
   ("صفحة هبوط أسس سورية - بدار - يوليو 2026.docx") is a LANDING-PAGE
   brief — eight numbered bands, each a different shape — so it gets a
   layout instead of a rich-text body. `content/usus-syria.js` is its
   content half, and the note at the top of that file records what the
   final (8 Oct 2026) brief changed, including the comment-driven rules
   the body text alone would get wrong.

   ASSEMBLED FROM THE SITE'S OWN PRIMITIVES
   ----------------------------------------------------------------
   Nothing below is invented for this page: it composes the site's
   own parts rather than copying any one page's markup.

     brief's band              primitive             also used on
     ────────────────────────  ────────────────────  ──────────────
     header                    PageHero              every sub-page
       + the three figures     StatRow               home, /about
     1 · التحديات              quiet-panel rows      (this page)
     2 · عن المشروع            StickySplit + aside   /about, /social-…
       القطاعات المستهدفة      IconCard grid         home, /about
     3 · على ماذا ستحصل        IconCard grid         home, /about
     4 · الفئة المستهدفة       panel-quiet list      (this page)
     5 · رحلة المشروع          ProcessSteps, 1 rail  /about, /social-…
       + الإيقاع الأسبوعي      panel-inset cycle     (this page)
     6 · آلية التقديم          NumberedList          home
     7 · دعوة للتسجيل          CtaBand               most pages
     8 · شركاؤنا               panel-quiet plates    (this page)

   The band tones alternate (plain → glow → glow-alt → dark → plain →
   wash), which is what keeps a long page from reading as one
   undifferentiated column.

   NO TWO ADJACENT BANDS SHARE A SHAPE
   ----------------------------------------------------------------
   Three of the eight bands are card grids, which is one more than
   this page carried in July, so they are deliberately kept apart and
   given different silhouettes:

     §1 التحديات      quiet rows, MUTED mark, split header
     §2 عن المشروع     sticky aside header, then a 3-up IconCard grid
     §3 ستحصل         split header, 5-up IconCard grid, brand mark
     §4 الفئة         centred inverse header on dark, tick list

   §1's marks are deliberately NOT the brand tint the IconCard grids
   use. Those bands are offers; this one is a list of pressures, and
   painting a power cut in the same mint as "دعم مالي أولي" reads as
   a feature. Same reason it is quiet rows and not cards.

   ORDER
   ----------------------------------------------------------------
   The brief's own order, unchanged, section 1 through section 8 —
   which puts رحلة المشروع AFTER الفئة المستهدفة.

   The three figures the brief prints under its header are drawn as a
   ruled `StatRow` band directly under the hero, ahead of §1 — the
   brief's own header block. The location chip stays in the header,
   over the programme name; the figures are the brief's own words.

   THE EMOJI ARE MARKS, AND THEY ARE DRAWN AS MARKS
   ----------------------------------------------------------------
   Section 3 of the brief prefixes each benefit with an emoji. Site
   copy on Bedar carries no emoji — that is a standing brand rule —
   so each one is carried here as the lucide equivalent of the
   character the brief chose, keyed by id the same way the site's
   other icon grids (services, values) key theirs. The intent survives,
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

/* ── THE WEEKLY-RHYTHM MARKS ────────────────────────────────────
   The journey closes on a weekly rhythm of three beats (see the
   `journey` note in `content/usus-syria.js`). No mark is in the brief
   — it is a flat document — so each is read from what its beat DOES,
   keyed by the id the content file gives it:

     يوم تدريب كامل       an applied day, not a talk → NotebookPen
     مهمة ميدانية         out of the room, in field → Footprints
     جلسة إرشاد           a mentor conversation      → MessagesSquare

   The three PHASES carry no icon: their titles sit on the left of the
   continuous rail as text, so the line's shape is never interrupted
   (client instruction). See the §5 note and `ProcessSteps`. */
const RHYTHM_ICONS = {
  'training-day': NotebookPen,
  'field-task': Footprints,
  mentoring: MessagesSquare,
};

/* ── THE PARTNER LOGOS ─────────────────────────────────────────
   Keyed by the `partners` id in `content/usus-syria.js`, the way
   every other mark on this page is keyed. The brief embeds no images.

     sme-authority        smeda.gov.sy/assets/images/Logo.png
     presently            supplied by the client (Oct 2026), after the
                          final brief replaced منظمة التنمية السورية
                          (SDO) with Presently. The SDO mark is retired
                          and must NOT stand in for it.

   PRESENTLY IS ALREADY REVERSED ARTWORK
   ----------------------------------------------------------------
   The supplied file is #FFFFFF ink (97% of its opaque pixels) with a
   #27AAE1 blue dot — the partner's own light-on-dark lockup, so it
   reads on this band with no change to a single colour. Do not lift or
   recolour it; a partner's own artwork wins.

   It arrived on a 1826x675 canvas whose ink filled only 60% of the
   height (168px of transparent margin above, 99px below). Logos here
   are sized on HEIGHT, so that margin would have drawn Presently ~40%
   shorter than SMEDC and sat it low in its plate. It was therefore
   cropped to its ink — 1710x408, transparent margin only: every pixel
   inside the crop is unchanged and no alpha was discarded. 408px is
   5x the 80px it renders at, comfortably over the 2x retina floor.

   SMEDC IS REVERSED ARTWORK, BECAUSE THIS BAND IS DARK
   ----------------------------------------------------------------
   SMEDC publish no reversed variant, and their file is #231F20 ink
   plus a #5AB39F teal: on this surface the wordmark and the dotted map
   both disappeared and only the teal line survived. So the NEUTRAL ink
   alone was lifted to white and the teal was left exactly as supplied
   — the partner's second brand colour is intact. That is a reversed
   lockup, not a recolour: no hue is changed, and the alpha channel is
   untouched so the antialiasing survives.

   REPLACE THE SMEDC FILE the moment the partner supplies a reversed
   variant of their own — a partner's own artwork always wins over one
   derived here. The file may not be used on a light surface.

   It was trimmed to its ink (the supplied file carries baked-in
   padding) and exported at 200px tall, 2.5x the 80px it renders at.
   Re-export it if that height changes — 2x is the floor for a retina
   screen, and it is a raster file, so the source height is the whole
   quality budget.                                                   */
const PARTNER_LOGOS = {
  'sme-authority': logoSmedc,
  presently: logoPresently,
};

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
   The brief writes one benefit as "+62 ساعة تدريبية …", and that
   leading sign is the one numeric hazard on this page.

   A BARE digit run inside Arabic prose already typesets correctly on
   its own — "12 أسبوعًا", "3,500 دولار" and "23 و35 عامًا" all
   render left-to-right with no help, because the bidi algorithm
   gives a European-number run its own level inside an RTL paragraph.
   A LEADING SIGN does not: `+` is a bidi TERMINATOR, and at the start
   of the line there is no number before it to attach to, so it falls
   back to the paragraph's own direction and lands on the far side of
   the digits. "+62 ساعة" then typesets as "62+ ساعة", which is a
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

/* ── THIS PAGE'S ACTION TEAL IS THE PROGRAMME'S OWN ────────────
   Every button on this page (the accent CTAs and the outline ones)
   is drawn in #69C1A9 — the exact teal of the أُسُس سورية wordmark,
   as specified by the programme's landing-page file.

   THIS IS A PAGE-SCOPED OVERRIDE, ON PURPOSE.
   ----------------------------------------------------------------
   The rest of the public site pins its buttons to the mint highlight
   (`--action-accent` = `--brand-200`) — the client's Aug 2026
   direction, stated once in `styles/tokens/colors.css`. أُسُس سورية
   is the one page that opts out of that mint and keeps the darker
   turquoise so its buttons match its wordmark and its file. So the
   override lives HERE, on this page's own carrier, and is NOT touched
   in the global tokens — changing it there would repaint every button
   on every page and undo the Aug 2026 decision.

   Set as inline custom properties on the wrapper so they cascade to
   `PageHero`, every `Section` button and the closing `CtaBand` without
   any of them being touched. The values are the file's own: the hover
   lifts brighter (#7ecdb7), the glow is the matching rgba, and the
   hero aurora's third band follows. `--action-accent-on` (the near-
   black label) is unchanged — it clears AA against #69C1A9 as it did
   against the mint. A plain carrier `<div>`, not `display:contents`
   and never `overflow:hidden`: the full-bleed bands and the sticky
   splits both need an ancestor that adds no box model of its own. */
const ACCENT_SCOPE = {
  '--action-primary': '#69C1A9',
  '--action-primary-hover': '#7ecdb7',
  '--action-accent': '#69C1A9',
  '--action-accent-hover': '#7ecdb7',
  '--action-accent-glow': 'rgba(105, 193, 169, 0.42)',
  '--hero-aurora-c': 'rgba(105, 193, 169, 0.26)',
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

  /* The nine journey stages flattened into one list, so the rail is a
     single unbroken line (§5 note). The first stage of each phase
     carries that phase's title and scope chip, which `ProcessSteps`
     draws on the left of the rail without a row of its own. */
  const journeySteps = journey.phases.flatMap((phase) =>
    phase.steps.map((step, index) =>
      index === 0 ? { ...step, phaseLabel: phase.label, phaseScope: phase.scope } : step,
    ),
  );

  return (
    <div style={ACCENT_SCOPE}>
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

      {/* ── The three headline figures ───────────────────────────
             The brief prints "21 مشروع ناشئ", "3 قطاعات مستهدفة" and
             "12 أسبوعًا تدريبيًا" under its header, and that is where
             they sit: a ruled `StatRow` band directly under the hero,
             ahead of the first section — the brief's own header block.

             `StatRow`, not tiled cards or a `band-tile` box: the three
             numbers are the content, so they run as one hairline-ruled
             row with no box around any. `max-w-4xl` keeps the trio
             from stranding across the full container, and
             `lg:grid-cols-3` holds them 3-up rather than letting the
             4-up default leave a lonely fourth column. The count-up
             and the Western digits are `StatRow`'s own (`useCountUp` +
             `formatNumber`); the figures are the brief's words. */}
      <Section size="sm">
        <StatRow stats={facts} className="max-w-4xl lg:grid-cols-3" />
      </Section>

      <SectionSeam />

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

             THE FIGURES DO NOT SIT HERE
             ---------------------------------------------------------
             They are the brief's header block and run as a ruled
             `StatRow` directly under the hero, ahead of §1 — see the
             band above. Do not fold them back into this paragraph:
             the paragraph names "تمكين 21 مشروع شبابي ناشئ" and the
             12 أسبوعًا in prose, and cards repeating those figures here
             would say the same numbers twice on one screen. */}
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
             اختبار السوق as a card of its own. The headline figures
             (three since the final brief) are NOT in this grid: they
             run as the ruled `StatRow` directly under the hero — see
             the figures band and the note on §2.

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
      {/* Drawn in the LIGHT theme — see the note on §6 below, which
          is the other half of the same client instruction. The
          gradient is the file's own scene for this band. */}
      <Section
        tone="glow-alt"
        data-theme="light"
        className="band-light-surface"
        style={{
          '--band-light-surface':
            'linear-gradient(180deg, #dcf1ea 0%, #cbe9df 52%, #e4f4ee 100%)',
          /* Inline, not in the stylesheet: `[data-theme='light']`
             declares these on this very element from an unlayered
             rule, and unlayered CSS beats anything in a `@layer`
             regardless of specificity. Inline is what actually wins.
             See the band's note in animations.css for the values. */
          '--action-primary': '#2c7c6a',
          '--action-primary-hover': '#24685a',
        }}
      >
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
             SIX eligibility lines. A tonal break
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
             THE CENTREPIECE, and the one band the client singled out
             for a visual treatment (Faten Nasman, 8 Oct 2026): the
             journey must READ as a journey of stages, not as a list of
             text. So the brief's nine stages run as ONE continuous
             scroll-drawn rail — the same rail as /about and
             /social-entrepreneurship — and each stage carries:

               • its week-range as a `meta` chip (الأسابيع 1 إلى 3 …),
               • its "تخرج بـ…" line as an `outcome` callout, a
                 different silhouette from the body so the reader sees
                 at a glance what each stage leaves them holding,
               • the entry stages' conviction as a `note`.

             THE LINE IS UNBROKEN; THE PHASE TITLES SIT ON THE LEFT.
             ---------------------------------------------------------
             The client was explicit (second pass): the rail must not
             split between the three phases, and each phase title goes
             on the left so it does not affect the line's shape. So the
             nine stages are flattened into a SINGLE `ProcessSteps`
             (`journeySteps`) — one rail, one count 1-9 — and each
             phase's first stage carries `phaseLabel`/`phaseScope`,
             which `ProcessSteps` draws on the copy side — the left of
             the rail in RTL — in the gap ABOVE that stage, out of the
             flow. No phase header row interrupts the markers, so the
             connector runs straight through from stage 1 to stage 9,
             and every number still sits beside its OWN stage title
             (the third pass: in the flow, the phase title had pushed
             stage 3's title below its circle).

             The weekly rhythm closes the band as a repeating three-beat
             cycle in its own inset — a loop running THROUGH the twelve
             weeks, not a tenth stage after them — and the brief's final
             line sits apart as a statement.

             Full width and a centred heading, not a StickySplit: the
             rail carries its own column (inline-start, so the RIGHT in
             Arabic) and the rhythm's three beats need the whole
             measure. Phase labels are structural, not
             copy — see the `journey` notes in `content/usus-syria.js`. */}
      <Section size="lg">
        <SectionHeading title={journey.title} align="center" className="mb-14" />

        <div className="mx-auto max-w-3xl">
          <ProcessSteps steps={journeySteps} />
        </div>

        {/* The weekly rhythm — a repeating three-beat cycle, set in its
            own inset so it reads as a loop running through the weeks
            above rather than as a stage after them. */}
        <Reveal className="mx-auto mt-16 max-w-4xl">
          <div className="panel-inset px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring">
                  <RefreshCw className="size-5" aria-hidden="true" strokeWidth={1.75} />
                </span>
                <h3 className="text-xl font-bold text-ink lg:text-2xl">{journey.rhythm.title}</h3>
              </div>
              <p className="leading-relaxed text-ink-secondary">{journey.rhythm.lede}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-stretch">
              {journey.rhythm.beats.map((beat, beatIndex) => {
                const BeatIcon = RHYTHM_ICONS[beat.id];
                const last = beatIndex === journey.rhythm.beats.length - 1;
                return (
                  <Fragment key={beat.id}>
                    <div className="panel-quiet flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring">
                          {BeatIcon ? (
                            <BeatIcon className="size-5" aria-hidden="true" strokeWidth={1.75} />
                          ) : null}
                        </span>
                        <h4 className="text-base font-bold text-ink">{beat.title}</h4>
                      </div>
                      <p className="text-sm leading-relaxed text-ink-secondary">
                        {beat.description}
                      </p>
                    </div>

                    {/* The connector to the next beat. "Forward" in RTL
                        is leftward, so the plain glyph already points to
                        the next card on desktop; it turns to point down
                        where the beats stack on a phone. */}
                    {last ? null : (
                      <div
                        aria-hidden="true"
                        className="flex items-center justify-center lg:px-1"
                      >
                        <ArrowLeft className="size-5 -rotate-90 text-brand-300/70 lg:rotate-0" />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* The line the brief closes the whole journey on — a
            statement, not a stage, so it sits apart in the brand quote
            treatment the site keeps for its strongest single lines. */}
        <Reveal
          as="p"
          className="mx-auto mt-10 max-w-4xl rounded-xl border-s-4 border-brand-300 bg-brand-500/10 px-6 py-5 text-lg font-medium leading-relaxed text-ink dark:border-brand-500"
        >
          {journey.rhythm.conviction}
        </Reveal>
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
      {/* ── DRAWN IN THE LIGHT THEME ──────────────────────────────
             This band and §3 are the two the client asked to match
             the landing-page file exactly, and in that file they are
             LIGHT. `data-theme="light"` re-themes the band's tokens;
             `band-light-surface` (animations.css) paints the surface
             underneath them and switches off the dark site's ambient
             glows, which would otherwise smudge a light band.

             The gradient is the file's own scene for this band. The
             action colours are NOT the page's `ACCENT_SCOPE` here:
             `[data-theme='light']` re-declares them on this element,
             and a declaration on the element beats an inherited one,
             so the buttons take the light theme's own teal — which is
             what the file does and what clears AA on a pale surface. */}
      <Section
        tone="wash"
        data-theme="light"
        className="band-light-surface"
        style={{
          '--band-light-surface': 'linear-gradient(180deg, #f5f8f6 0%, #eef3f0 100%)',
          /* Same reason as §3 — see the note there. */
          '--action-primary': '#2c7c6a',
          '--action-primary-hover': '#24685a',
        }}
      >
        <StickySplit
          aside={<SectionHeading title={applying.title} lede={applying.lede} layout="aside" />}
        >
          <NumberedList items={applying.items} />

          {/* The one thing in this light band that stays DARK, exactly
              as the file draws it: a dark inset under the funnel. Its
              surface is already painted by the dark site's own
              `.panel-inset`, so without this the band's light tokens
              would put near-black ink on it and the sentence would be
              unreadable. `data-theme="dark"` hands the panel back its
              own ink (#a9b7b7 in the file) — the surface and the text
              have to come from the SAME theme, and here that is the
              dark one. */}
          <Reveal data-theme="dark" className="panel-inset mt-10 px-6 py-7 sm:px-8">
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
             The last band on the page — which is where the client's
             own comment on the brief asks for it ("يفضل وضع الشركاء في
             آخر الصفحة مع الرعاة"). After the closing band on purpose,
             therefore, rather than before it.

             A LOGO WALL, so the marks are the content and the plates
             only hold them. `PARTNER_LOGOS` resolves the id; the
             partner's name from the brief becomes the `alt`, so the
             band says the same thing to a screen reader as it does on
             screen.

             BOTH PARTNERS NOW HAVE ARTWORK (SMEDC, and Presently since
             Oct 2026 — it replaced SDO in the final brief). The plate
             still falls back to the partner's NAME as text when an id
             has no `PARTNER_LOGOS` entry, so a partner added later
             without a file ships as an honest name, never as a broken
             image or as a retired partner's mark standing in for it.
             See the map note above.

             SIZED ON HEIGHT, NEVER ON WIDTH — a logo row reads as a row
             because every mark shares a cap height, not because the
             boxes match. `max-w-full` is the guard for a narrow phone,
             where the height would otherwise overflow the plate.

             Quiet plates rather than IconCards: this band shows
             organisations, it does not describe them, and a card with
             an empty description slot would read as unfinished.

             `size="sm"` — the sentence the brief gives ("نعتزّ بشركائنا
             في إنجاح المشروع") is the whole section, and a closing band
             should not out-weigh the CTA directly above it.

             Images are `lazy`: this is the last band on a page about
             nine screens tall, nowhere near the first paint.

             READ THE MOU NOTE in `content/usus-syria.js` before this
             page is opened to search engines — a logo claims more than
             a name did. */}
      <Section size="sm">
        <SectionHeading
          eyebrow={partners.eyebrow}
          title={partners.title}
          align="center"
          size="sm"
          className="mb-10"
        />

        <Stagger className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {partners.items.map((partner) => {
            const logo = PARTNER_LOGOS[partner.id];
            return (
              <StaggerItem key={partner.id} className="h-full">
                <div className="panel-quiet flex h-full min-h-36 items-center justify-center p-6 text-center">
                  {logo ? (
                    <img
                      src={logo}
                      alt={partner.name}
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-auto max-w-full object-contain sm:h-20"
                    />
                  ) : (
                    /* Text stand-in for a partner with no artwork on
                       file. Not styled as a logo — it reads as a name,
                       which is the honest claim until a mark exists. */
                    <span className="text-xl font-bold text-ink sm:text-2xl">{partner.name}</span>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Section>
    </div>
  );
}
