/* ================================================================
   USUS SYRIA — مشروع أُسُس سورية, as structured content.

   WHY THIS FILE EXISTS
   ----------------------------------------------------------------
   Same reason `hackathon.js` exists, and the second instance of the
   same pattern. Most programs on this site are a rich-text body
   rendered by `CollectionDetail` → `RichText`, which is right for a
   program written as an article. This one was not written as an
   article: the client's brief
   ("إنشاء صفحة هبوط أسس سوريا - بدار - يوليو 2026 (1).docx") specifies
   a LANDING PAGE — a numbered set of eight bands, each with its own
   shape: a figure pair, a challenges list, a sector list, a benefits
   grid, an eligibility checklist, a four-stage journey, a five-step
   application funnel, a closing call to register and a partner row.

   Flattening that into one rich-text column would lose exactly what
   the brief is asking for, so the structure lives here and
   `pages/public/UsusSyria.jsx` is the layout for it. The program
   still appears in the /programs listing like any other — only the
   detail view differs. See the note on its route in `routes.jsx`.

   SEPTEMBER 2026 REWRITE — THIS IS A DIFFERENT PROGRAMME
   ----------------------------------------------------------------
   The client re-issued the brief (Sept 2026) and it is not an edit
   pass: the programme was re-scoped from a training track into an
   ACCELERATOR, and almost every string on the page changed with it.
   What moved, so nobody "restores" the old copy from git:

     name        أُسُس سوريا للريادة المجتمعية → مشروع أُسُس سورية,
                 and the spelling سوريا → سورية throughout
     figures     four (18 / 12 / 3 / 6) → two (21 / 3). The weeks and
                 the funded-company count are no longer headline
                 figures; 12 أسبوعًا now lives inside the عن المشروع
                 paragraph, and the seed support is one benefit card
     cities      دمشق - حلب → دمشق - حضوريًا بالكامل (Damascus only,
                 fully in person)
     NEW §1      التحديات — a problem statement the page now opens on
     benefits    six cards → five; اختبار السوق is gone as a card and
                 every remaining line was rewritten to a hard number
                 (+50 ساعة, 11 جلسة, 5,000 دولار)
     audience    four conditions → six; the programme is now age-
                 bounded (18-35) and explicitly social-impact
     journey     stage 2 اختبار السوق and stage 3 بناء الجاهزية
                 became بناء الجاهزية and الدخول للسوق, and the
                 section moved BELOW the audience band, which is the
                 brief's own order
     NEW §8      شركاؤنا — see the note on `partners` at the foot of
                 this file before touching it

   THE WORDS ARE THE CLIENT'S, VERBATIM
   ----------------------------------------------------------------
   Every string below is copied from the brief. Nothing is rewritten,
   expanded or invented, and no section of the brief is dropped. The
   places where a judgement had to be made are declared here rather
   than left implicit:

   1. THE BENEFIT EMOJI ARE CARRIED AS MARKS, NOT AS CHARACTERS.
      The brief prefixes each benefit with an emoji (🧩 👥 🤝 📅 💰).
      Emoji are not used in site copy anywhere on this site —
      CLAUDE.md's brand rules are explicit about it — so each one is
      carried as a lucide mark in the page component's
      `BENEFIT_ICONS` map instead, chosen to match the emoji the
      brief picked. The MARK is preserved; only its typeface changes.

   2. THE THREE MID-PAGE CTA LINES ARE BUTTONS.
      The brief closes §1, §3 and §4 with a line that is an
      instruction rather than a sentence ("قدّم الآن وابدأ رحلة تجاوز
      هذه التحديات", "لا تفوّت الفرصة، قدّم طلبك الآن.", "هل تنطبق
      عليك الشروط؟ قدّم طلبك الآن"). Each is carried whole, as the
      label of that band's button — no words added, removed or split.

   3. SEO IS ASSEMBLED FROM THE BRIEF'S OWN SENTENCES.
      The brief specifies no `<title>`/`<meta description>` — it is a
      layout brief, not an SEO one — but `useSeo` needs both and a
      page with no description is a page that indexes badly. Rather
      than write new marketing copy, the title pairs the programme's
      name with the brief's own header line and the description is
      the brief's own "ما هو أُسُس سورية؟" paragraph. No claim
      appears in either that is not already on the page.

   THE ONE THING THE BRIEF DOES NOT SUPPLY — see `APPLY_URL` below.
   ================================================================ */

/**
 * Where "قدّم الآن" goes.
 *
 * The brief specifies the BUTTON (five times now — the header, the
 * end of §1, §3 and §4, and the closing band) but not its
 * destination: there is no application-form URL anywhere in the
 * document, and no form for this programme exists on the site yet.
 *
 * So this points at the contact page, which is a real, working
 * destination that reaches the team — not a `#` that dead-ends and
 * not a fabricated URL. It is a single constant, used by all five
 * CTAs, so pointing the programme at its real form is a ONE-LINE
 * change here once the client supplies it.
 *
 * An absolute `https://…` is supported as well as an internal path —
 * `CtaBand` and the page's own buttons all route on the shape of this
 * string, so an external form host needs no further change.
 */
const APPLY_URL = '/contact-us';

const APPLY_LABEL = 'قدّم الآن';

export const ususSyria = {
  slug: 'usus-syria',

  seo: {
    title: 'مشروع أُسُس سورية | مسرعة أعمال متخصصة لتمكين الشركات الشبابية الناشئة في دمشق',
    description:
      'مسرعة أعمال متخصصة أطلقتها منصة بدار للريادة المجتمعية التابعة لمؤسسة "منار"، وتهدف إلى تمكين 21 شركة ناشئة في دمشق عبر برنامج مكثف يستمر لمدة 12 أسبوعًا.',
  },

  /* ── Header ───────────────────────────────────────────────── */
  hero: {
    /* The listing category, kept in step with the `programs` record
       in `content/collections.js`. The page itself no longer renders
       it as a chip — the client's Aug 2026 pass replaced the chip and
       the breadcrumb with the programme's own wordmark — so this is
       read by nothing today and exists so the two stay in sync. */
    category: 'البرامج الحالية',
    title: 'مشروع أُسُس سورية',
    tagline: 'مسرعة أعمال متخصصة لتمكين الشركات الشبابية الناشئة في دمشق',
    /* The brief prints this on its own line under the figures. It is
       a location label, not a sentence, so the page sets it as a chip
       — the same treatment the hackathon page gives its
       delivery-format line. Sept 2026: it now carries the delivery
       format too ("حضوريًا بالكامل"), which is exactly what that chip
       is for. */
    location: 'دمشق - حضوريًا بالكامل',
    cta: { label: APPLY_LABEL, href: APPLY_URL },
  },

  /* The TWO figures the brief lists under the header — it printed
     four in July and prints two now. Split into value + label so the
     number can be typeset at display scale; the pairs are the brief's
     own lines ("21 شركة ناشئة", "3 قطاعات مستهدفة") with nothing
     added.

     They are still the header's block in the DOCUMENT, which is why
     they live here at the top of this file rather than inside
     `benefits`. Where they are DRAWN is a layout decision, and the
     client made it in Sept 2026: the page now leads the §3 grid with
     them, in the same card as that section's other items, instead of
     giving them a ruled row under the hero. See `FigureCard` in
     `pages/public/UsusSyria.jsx`.

     Do not pad this back to four to fill a row. Two is what the brief
     says, and §3's grid is arranged around the count. */
  facts: [
    { id: 'startups', value: 21, label: 'شركة ناشئة' },
    { id: 'sectors', value: 3, label: 'قطاعات مستهدفة' },
  ],

  /* ── 1 · التحديات ─────────────────────────────────────────────
        New in the Sept 2026 brief, and the page now OPENS on it: the
        programme is introduced as an answer to four named pressures
        rather than as a curriculum. The four lines are the brief's
        sentences, unsplit — each one IS a sentence, and cutting it in
        two to earn a card title would be rewriting the client's copy.

        `note` is the brief's own bridge out of the section and
        `cta.label` is the line it closes on, whole. ────────────── */
  challenges: {
    eyebrow: 'التحديات',
    title: 'ما التحديات التي تواجه الشركات السورية الناشئة؟',
    lede: 'في ظل المرحلة التي تمر بها سورية، تواجه الشركات الناشئة تحديات تتطلب حلولاً تنطلق من واقع السوق المحلي، أبرزها:',
    items: [
      'التشغيل والوصول إلى العملاء في ظل ضعف الكهرباء والإنترنت.',
      'تسعير المنتجات بما يتناسب مع القدرة الشرائية في السوق المحلي.',
      'الوصول إلى التمويل والخبرات والشبكات المناسبة لدعم نمو المشروع.',
      'الانتقال من التدريب إلى التنفيذ وتحقيق تقدّم فعلي في السوق.',
    ],
    note: 'إذا كان مشروعك يواجه واحدًا أو أكثر من هذه التحديات، فأُسُس سورية صُمم لمساعدتك على تجاوزها.',
    cta: { label: 'قدّم الآن وابدأ رحلة تجاوز هذه التحديات', href: APPLY_URL },
  },

  /* ── 2 · عن المشروع ──────────────────────────────────────────── */
  about: {
    eyebrow: 'عن المشروع',
    title: 'ما هو أُسُس سورية؟',
    body: 'مسرعة أعمال متخصصة أطلقتها منصة بدار للريادة المجتمعية التابعة لمؤسسة "منار"، وتهدف إلى تمكين 21 شركة ناشئة في دمشق عبر برنامج مكثف يستمر لمدة 12 أسبوعًا.',
    sectorsTitle: 'القطاعات المستهدفة:',
    sectors: [
      {
        id: 'energy',
        title: 'الطاقة والحلول اللامركزية',
        description: 'حلول وتقنيات تسهم في تحسين إنتاج الطاقة وإدارتها واستخدامها.',
      },
      {
        id: 'circular-economy',
        title: 'الاقتصاد الدائري وإعادة التدوير',
        description: 'حلول تعزز كفاءة استخدام الموارد وإعادة الاستخدام وإدارة النفايات.',
      },
      {
        id: 'edtech',
        title: 'تقنيات التعليم والمهارات',
        description: 'حلول تعليمية وتدريبية تسهم في تطوير التعلم وتنمية المهارات.',
      },
    ],
  },

  /* ── 3 · على ماذا ستحصل الشركات المشاركة؟ ──────────────────────
        Five cards, down from six — the brief dropped اختبار السوق as
        a card of its own (it is now the subject of متابعة مستمرة) and
        rewrote every remaining line around a hard number. The emoji
        the brief prefixes each title with are carried as lucide marks
        in the page component; see note 1 at the top of this file.

        Five does not divide into a 3-up grid, and the page centres
        the trailing row rather than padding the set to six. ────── */
  benefits: {
    title: 'على ماذا ستحصل الشركات المشاركة؟',
    lede: 'توفر لك المسرعة رحلة عملية تساعدك على تطوير مشروعك، من خلال:',
    items: [
      {
        id: 'training',
        title: 'تدريب عملي',
        description: '+50 ساعة تدريبية خلال 12 أسبوعًا مكثفًا.',
      },
      {
        id: 'mentorship',
        title: 'إرشاد متخصص',
        description: '11 جلسة إرشادية 1:1 في مجال تطوير المنتج واختراق السوق والتسعير.',
      },
      {
        id: 'network',
        title: 'تشبيك وشراكات',
        description: 'الالتقاء بخبراء ومستثمرين والمشاركة في يوم العرض.',
      },
      {
        id: 'follow-up',
        title: 'متابعة مستمرة',
        description: 'متابعة أسبوعية بمهام ميدانية إلزامية لاختبار السوق.',
      },
      {
        id: 'seed-funding',
        title: 'دعم مالي أولي',
        description: 'فرصة للمنافسة على استثمار بقيمة 5,000 دولار.',
      },
    ],
    cta: { label: 'لا تفوّت الفرصة، قدّم طلبك الآن.', href: APPLY_URL },
  },

  /* ── 4 · الفئة المستهدفة ──────────────────────────────────────
        Six eligibility lines, up from four: the Sept 2026 brief adds
        an age bound (18-35) and an explicit social-impact condition.
        Plain strings, not title+description pairs — each one IS a
        sentence, and splitting it to earn a card title would be
        rewriting the client's copy.

        Six is why this grid is 2-up rather than 3-up: three even rows
        beat two rows of three under a centred heading. ────────── */
  audience: {
    title: 'الفئة المستهدفة',
    lede: 'يمكنك التقديم إذا كنت:',
    items: [
      'شاب/ة يتراوح عمرك ما بين 18 و35 عامًا.',
      'تقود شركة اجتماعية ناشئة أو تشارك في تأسيسها.',
      'تمتلك منتجًا أوليًا (MVP) قابل للاختبار.',
      'تعمل بنموذج عمل يُحقق أثر اجتماعي.',
      'تعمل في أحد القطاعات المستهدفة.',
      'تمتلك فريقًا قادرًا على الالتزام طوال مدة المشروع.',
    ],
    cta: { label: 'هل تنطبق عليك الشروط؟ قدّم طلبك الآن', href: APPLY_URL },
  },

  /* ── 5 · رحلة المشروع ─────────────────────────────────────────
        Four stages, genuinely ordered, so they render on the site's
        scroll-drawn rail (`ProcessSteps`) rather than as cards.

        The brief writes each one as "المرحلة الأولى | التشخيص
        والتحقق" — a stage label, a pipe, then the stage's name. The
        pipe is a typographic separator for a flat document; here the
        two halves are separate fields, so the label sits above the
        name in the rail's own `meta` slot. Both halves are the
        brief's words; only the pipe is gone.

        This band sits AFTER الفئة المستهدفة, which is the brief's own
        order as of Sept 2026 — it ran before it in July. ───────── */
  journey: {
    title: 'رحلة المشروع',
    lede: 'يتكون المشروع من أربعة مراحل مترابطة:',
    items: [
      {
        id: 'diagnosis',
        meta: 'المرحلة الأولى',
        title: 'التشخيص والتحقق',
        description: 'تقييم المشروع، وتحديد الفرضيات، وتحديد العميل المثالي.',
      },
      {
        id: 'readiness',
        meta: 'المرحلة الثانية',
        title: 'بناء الجاهزية',
        description: 'تحسين نموذج العمل والمنتج، وتحديد نموذج التسعير، واختباره الأولي في السوق.',
      },
      {
        id: 'go-to-market',
        meta: 'المرحلة الثالثة',
        title: 'الدخول للسوق',
        description: 'وضع خطة الدخول للسوق، وإطلاق حملة المبيعات، وقياس النتائج والتحسين المستمر.',
      },
      {
        id: 'demo-day',
        meta: 'المرحلة الرابعة',
        title: 'يوم العرض والاستعداد للمرحلة التالية',
        description:
          'إعداد العرض النهائي، وتطوير خطة العمل للأشهر القادمة، وعرض المشروع أمام لجنة التحكيم.',
      },
    ],
  },

  /* ── 6 · آلية التقديم ─────────────────────────────────────────
        Five steps of a selection funnel, and the sentence the brief
        closes the section with. `NumberedList` rather than the
        journey's rail: two scroll-drawn rails on one page read as
        the same section twice, and this is an enumerated funnel
        rather than a timeline the reader lives through. ───────── */
  applying: {
    title: 'آلية التقديم',
    lede: 'تمر عملية الاختيار بمراحل عدّة لضمان اختيار الشركات الأكثر جاهزية للاستفادة من المشروع:',
    items: [
      'تعبئة نموذج التقديم.',
      'مراجعة الطلبات والتحقق من استيفاء معايير الأهلية.',
      'تنفيذ المهمة القبلية والمشاركة في المقابلة.',
      'اختيار 21 شركة ناشئة للانضمام إلى المشروع.',
      'انطلاق المشروع.',
    ],
    note: 'يعتمد الاختيار على مدى جاهزية الشركة، وملاءمتها للمشروع، وقدرة الفريق على الاستفادة من الرحلة التدريبية.',
  },

  /* ── 7 · دعوة للتسجيل ─────────────────────────────────────────
        The brief labels this section "دعوة للتسجيل" and the band
        carried it as an eyebrow over the heading. The client struck
        that word out in their Aug 2026 pass — the section is already
        announced by "ابدأ رحلتك اليوم" and the button under it — so
        the label survives only as this comment and as the section's
        name in the brief. Do not re-add it as an `eyebrow`. */
  closing: {
    title: 'ابدأ رحلتك اليوم',
    lede: 'إذا كنت تقود شركة ناشئة تمتلك منتجًا أوليًا وتسعى إلى تطويره، واختبار السوق، وبناء مشروع أكثر جاهزية للنمو، فإن أسس سورية يوفر لك البيئة المناسبة للانتقال إلى المرحلة التالية.',
    cta: { label: APPLY_LABEL, href: APPLY_URL },
  },

  /* ── 8 · شركاؤنا ──────────────────────────────────────────────
        New in the Sept 2026 brief. Two things to know before touching
        it:

        1. `id` KEYS THE LOGO, `name` IS THE ALT TEXT. The brief writes
           each partner as "لوجو <name>" — the word "لوجو" is the
           brief's marker for artwork, not copy, so it is dropped and
           the artwork itself lives in `assets/partners/`, keyed by
           `id` in the page's `PARTNER_LOGOS` map. Same arrangement as
           `SECTOR_ICONS` and `BENEFIT_ICONS` on that page, and as the
           sector tiles in `pages.js`: data carries an id, the page
           resolves it to a file. The `name` is what a screen reader
           hears in place of the mark, so it stays the brief's own
           wording.

           The client supplied both files (Sept 2026); the note at the
           map in `pages/public/UsusSyria.jsx` records where each one
           came from and what was done to it.

        2. NEITHER MOU IS SIGNED. The brief carries a comment from the
           client's own team (Akeel Bakkour, 1 Sept 2026) saying no
           memorandum of understanding has been signed with either
           partner yet — signature depends on Bedar securing
           sponsorship for the programme, and on the partners approving
           the MOU terms. The band is built because the brief asks for
           it and /programs/usus-syria is still held out of search
           (`content/noindex-paths.js`), but SHOWING AN UNSIGNED
           PARTNER'S LOGO IS THE CLIENT'S CALL, not this file's — and
           a logo is a stronger claim of partnership than a name was.
           Confirm before the page is opened to crawlers.

        The client's same comment asks for the partners to sit at the
        END of the page alongside the sponsors, which is where §8
        already puts them — after the closing band. A sponsors row,
        when there is one, belongs beside `items` here rather than in
        a ninth band. */
  partners: {
    eyebrow: 'شركاؤنا',
    title: 'نعتزّ بشركائنا في إنجاح المشروع',
    items: [
      { id: 'sme-authority', name: 'هيئة تنمية المشروعات الصغيرة والمتوسطة' },
      { id: 'syrian-development', name: 'منظمة التنمية السورية' },
    ],
  },
};

export default ususSyria;
