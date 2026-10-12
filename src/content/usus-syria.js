/* ================================================================
   USUS SYRIA — مشروع أُسُس سورية, as structured content.

   WHY THIS FILE EXISTS
   ----------------------------------------------------------------
   This is the one program on the site with a built page instead of a
   rich-text body. Most programs are a rich-text body rendered by
   `CollectionDetail` → `RichText`, which is right for a program
   written as an article. This one was not written as an article: the
   client's brief ("صفحة هبوط أسس سورية - بدار - يوليو 2026.docx")
   specifies a LANDING PAGE — a numbered set of eight bands, each with
   its own shape: three headline figures, a challenges list, a sector
   list, a benefits grid, an eligibility checklist, a multi-stage
   journey, a five-step application funnel, a closing call to register
   and a partner row.

   Flattening that into one rich-text column would lose exactly what
   the brief is asking for, so the structure lives here and
   `pages/public/UsusSyria.jsx` is the layout for it. The program
   still appears in the /programs listing like any other — only the
   detail view differs. See the note on its route in `routes.jsx`.

   THIS IS THE FINAL CONTENT (brief confirmed 8 Oct 2026)
   ----------------------------------------------------------------
   The document is titled "يوليو 2026" but it is the LATEST issue and
   its own comment thread approves it on 8 Oct 2026 ("يرجى اعتماد رحلة
   المشروع"). It supersedes the earlier September accelerator rewrite,
   and the deltas from that state — so nobody "restores" superseded
   copy from git — are:

     wording     the programme now speaks of "المشاريع" and "مشروع
                 ناشئ", not "الشركات"/"شركة ناشئة", throughout (§3's
                 heading "الشركات المشاركة" is the one phrase the brief
                 keeps). "منظمة التنمية السورية" → "منار للمشاركة
                 المجتمعية" as منار's full name in §2.
     figures     TWO headline figures (21 / 3) → THREE: 21 مشروع ناشئ,
                 3 قطاعات مستهدفة, 12 أسبوعًا تدريبيًا. The weeks figure
                 is a headline number again (it still also appears in
                 the عن المشروع paragraph, exactly as the brief prints
                 it in both places).
     location    "دمشق - حضوريًا بالكامل" → "دمشق" (the brief's header
                 prints the city alone).
     benefits    +50 → +62 ساعة; "11 جلسة 1:1" → "جلسات إرشادية" (the
                 count is dropped); the seed card is now "للفرق الثلاثة
                 الفائزة بقيمة 3,500 دولار" — see the terminology note.
     audience    age bound 18-35 → 23-35; "شركة اجتماعية" → "مشروع
                 شبابي"; two conditions gain a clause ("أو في تقاطع
                 واضح بينها", "وتوثيق النتائج").
     JOURNEY     the four-stage rail became a NINE-stage journey plus a
                 weekly-rhythm cycle — the biggest change on the page,
                 and the one the client flagged for a visual treatment.
                 See the `journey` note below.
     partners    "منظمة التنمية السورية" (SDO) → "Presently". The SDO
                 logo is gone; Presently's artwork is not supplied yet
                 — see the partners note at the foot of this file.

   TWO COMMENT-DRIVEN RULES FROM THE SAME DOCUMENT
   ----------------------------------------------------------------
   The brief's own comment threads carry two instructions that are not
   in the body text and that the body text alone would get wrong:

   A. "دعم مالي", NOT "منحة مالية" (Muhammed Rustom, 8 Oct 2026).
      Asked which term to adopt across the whole project, the client
      answered: use "دعم مالي". The body writes "منحة مالية" in §3 and
      in journey stage 7; BOTH are rendered as "دعم مالي" here, on that
      instruction. The MARK of the decision is the comment; the body is
      the earlier draft.

   B. A TOTAL-DURATION FIGURE IS AN OPEN QUESTION (Faten Nasman, 8 Oct
      2026) — she asks the team to confirm the full engagement length
      (application through follow-up, "ليس 8 أشهر") and it is NOT yet
      answered. So no total-duration figure is invented anywhere on the
      page. The 12 weeks (intensive programme) and the شهران (post
      follow-up) are the only durations stated, because they are the
      only ones the brief states.

   THE WORDS ARE THE CLIENT'S, VERBATIM
   ----------------------------------------------------------------
   Every string below is copied from the brief (with rule A applied).
   Nothing is rewritten, expanded or invented, and no section of the
   brief is dropped. The places where a judgement had to be made:

   1. THE BENEFIT EMOJI ARE CARRIED AS MARKS, NOT AS CHARACTERS.
      The brief prefixes each benefit with an emoji (🧩 👥 🤝 📅 💰).
      Emoji are not used in site copy anywhere on this site —
      CLAUDE.md's brand rules are explicit about it — so each one is
      carried as a lucide mark in the page component's `BENEFIT_ICONS`
      map instead, chosen to match the emoji the brief picked. The
      MARK is preserved; only its typeface changes.

   2. THE THREE MID-PAGE CTA LINES ARE BUTTONS.
      The brief closes §1, §3 and §4 with a line that is an
      instruction rather than a sentence ("قدّم الآن وابدأ رحلة تجاوز
      هذه التحديات", "لا تفوّت الفرصة، قدّم طلبك الآن.", "هل تنطبق
      عليك الشروط؟ قدّم طلبك الآن"). Each is carried whole, as the
      label of that band's button — no words added, removed or split.

   3. SEO IS ASSEMBLED FROM THE BRIEF'S OWN SENTENCES.
      The brief specifies no `<title>`/`<meta description>` — it is a
      layout brief, not an SEO one — but `useSeo` needs both. The title
      pairs the programme's name with the brief's own header line and
      the description is the brief's own "ما هو أُسُس سورية؟" paragraph.
      No claim appears in either that is not already on the page.

   THE ONE THING THE BRIEF DOES NOT SUPPLY — see `APPLY_URL` below.
   ================================================================ */

/**
 * Where "قدّم الآن" goes.
 *
 * The brief specifies the BUTTON (five times — the header, the end of
 * §1, §3 and §4, and the closing band) but not its destination: there
 * is no application-form URL anywhere in the document, and no form for
 * this programme exists on the site yet.
 *
 * So this points at the contact page, which is a real, working
 * destination that reaches the team — not a `#` that dead-ends and not
 * a fabricated URL. It is a single constant, used by all five CTAs, so
 * pointing the programme at its real form is a ONE-LINE change here
 * once the client supplies it.
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
    title: 'مشروع أُسُس سورية | مسرعة أعمال متخصصة لتمكين مشاريع الريادة المجتمعية في دمشق',
    description:
      'مسرعة أعمال متخصصة أطلقتها منصة بدار للريادة المجتمعية التابعة لمؤسسة منار للمشاركة المجتمعية، وتهدف إلى تمكين 21 مشروع شبابي ناشئ في دمشق عبر برنامج مكثف يستمر لمدة 12 أسبوعًا.',
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
    tagline: 'مسرعة أعمال متخصصة لتمكين مشاريع الريادة المجتمعية في دمشق',
    /* The brief prints the city on its own line under the figures. It
       is a location label, not a sentence, so the page sets it as a
       chip — the same treatment the hackathon page gives its
       delivery-format line. The final brief prints the city ALONE
       ("دمشق"); the September draft's "حضوريًا بالكامل" is not in it. */
    location: 'دمشق',
    cta: { label: APPLY_LABEL, href: APPLY_URL },
  },

  /* The THREE figures the brief lists under the header. Split into
     value + label so the number can be typeset at display scale; the
     pairs are the brief's own lines ("21 مشروع ناشئ", "3 قطاعات
     مستهدفة", "12 أسبوعًا تدريبيًا") with nothing added.

     They are the header's block in the DOCUMENT, which is why they
     live here at the top of this file rather than inside `about`, and
     it is also where they are DRAWN: a ruled `StatRow` band directly
     under the hero, ahead of §1. See the figures band in
     `pages/public/UsusSyria.jsx`.

     The weeks figure (12) appears here AND inside the عن المشروع
     paragraph — the brief prints it in both places, so it is carried
     in both. Do not "de-duplicate" it; that is the brief's own repeat,
     not an accident. */
  facts: [
    { id: 'startups', value: 21, label: 'مشروع ناشئ' },
    { id: 'sectors', value: 3, label: 'قطاعات مستهدفة' },
    { id: 'weeks', value: 12, label: 'أسبوعًا تدريبيًا' },
  ],

  /* ── 1 · التحديات ─────────────────────────────────────────────
        The page OPENS on it: the programme is introduced as an answer
        to four named pressures rather than as a curriculum. The four
        lines are the brief's sentences, unsplit — each one IS a
        sentence, and cutting it in two to earn a card title would be
        rewriting the client's copy.

        `note` is the brief's own bridge out of the section and
        `cta.label` is the line it closes on, whole. ────────────── */
  challenges: {
    eyebrow: 'التحديات',
    title: 'ما التحديات التي تواجه المشاريع السورية الناشئة؟',
    lede: 'في ظل المرحلة التي تمر بها سورية، تواجه المشاريع الناشئة تحديات تتطلب حلولاً تنطلق من واقع السوق المحلي، أبرزها:',
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
    body: 'مسرعة أعمال متخصصة أطلقتها منصة بدار للريادة المجتمعية التابعة لمؤسسة منار للمشاركة المجتمعية، وتهدف إلى تمكين 21 مشروع شبابي ناشئ في دمشق عبر برنامج مكثف يستمر لمدة 12 أسبوعًا.',
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
        Five cards. The emoji the brief prefixes each title with are
        carried as lucide marks in the page component; see note 1 at
        the top of this file. The seed-funding line reads "دعم مالي",
        not the body's "منحة مالية" — see rule A above.

        Five does not divide into a 3-up grid, and the page centres the
        trailing row rather than padding the set to six. ─────────── */
  benefits: {
    title: 'على ماذا ستحصل الشركات المشاركة؟',
    lede: 'توفر لك المسرعة رحلة عملية تساعدك على تطوير مشروعك، من خلال:',
    items: [
      {
        id: 'training',
        title: 'تدريب عملي',
        description: '+62 ساعة تدريبية خلال 12 أسبوعًا مكثفًا.',
      },
      {
        id: 'mentorship',
        title: 'إرشاد متخصص',
        description: 'جلسات إرشادية في مجال تطوير المنتج واختراق السوق والتسعير.',
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
        description: 'دعم مالي للفرق الثلاثة الفائزة بقيمة 3,500 دولار.',
      },
    ],
    cta: { label: 'لا تفوّت الفرصة، قدّم طلبك الآن.', href: APPLY_URL },
  },

  /* ── 4 · الفئة المستهدفة ──────────────────────────────────────
        Six eligibility lines. Plain strings, not title+description
        pairs — each one IS a sentence, and splitting it to earn a card
        title would be rewriting the client's copy.

        Six is why this grid is 2-up rather than 3-up: three even rows
        beat two rows of three under a centred heading. ────────── */
  audience: {
    title: 'الفئة المستهدفة',
    lede: 'يمكنك التقديم إذا كنت:',
    items: [
      'شاب/ة يتراوح عمرك ما بين 23 و35 عامًا.',
      'تقود مشروع شبابي ناشئ أو تشارك في تأسيسه.',
      'تمتلك منتجًا أوليًا (MVP) قابل للاختبار.',
      'تعمل بنموذج عمل يُحقق أثر اجتماعي.',
      'تعمل في أحد القطاعات المستهدفة أو في تقاطع واضح بينها.',
      'تمتلك فريقًا قادرًا على الالتزام طوال مدة المشروع وتوثيق النتائج.',
    ],
    cta: { label: 'هل تنطبق عليك الشروط؟ قدّم طلبك الآن', href: APPLY_URL },
  },

  /* ── 5 · رحلة المشروع ─────────────────────────────────────────
        THE CENTREPIECE, and the one band the client singled out for a
        visual treatment: "جزئية رحلة المشروع مهم جدا عرضها بطريقة
        بصرية ملفتة وتعكس مفهوم الرحلة/مراحل، وليس كقائمة نصية" (Faten
        Nasman, 8 Oct 2026, assigned to the developer). So it is NOT a
        flat list: `pages/public/UsusSyria.jsx` draws the nine stages as
        ONE continuous scroll-drawn rail, with each stage's week-range
        as a chip and its outcome ("تخرج بـ…") as a distinct callout,
        and the weekly rhythm as a repeating three-beat cycle.

        THE STRUCTURE IS THE BRIEF'S; THE GROUPING IS LAYOUT.
        --------------------------------------------------------------
        The brief numbers nine stages 1-9 and then a weekly rhythm. The
        nine fall into three natural PHASES by their own content — the
        two entry stages, the four 12-week stages (which carry the
        brief's week ranges), and the three show-and-after stages. The
        phase labels below (`label`) are the only added words on this
        band, and they are structural, not claims: they name a group of
        the brief's own stages, the way a table of contents names a
        part. Every stage's title, body, `meta` (week range) and
        `outcome` is the brief's wording, unchanged.

        THE LINE DOES NOT SPLIT BETWEEN PHASES (client, second pass).
        The page flattens these phases into a single `ProcessSteps`, so
        the rail is one unbroken line numbered 1-9 by position, and each
        phase's FIRST stage carries `phaseLabel`/`scope`, which render
        on the LEFT of the rail (the copy side in RTL) without a header
        row of their own. `number` below is the brief's own 1-9, kept as
        documentation of that order; the rail derives the count itself.

        Stage 7's "دعم مالي بقيمة 3,500$" is the brief's "منحة مالية"
        with rule A applied — see the top of this file. ──────────── */
  journey: {
    title: 'رحلة المشروع',
    phases: [
      {
        id: 'join',
        label: 'التقديم والقبول',
        steps: [
          {
            id: 'apply',
            number: 1,
            title: 'تتقدّم',
            description:
              'تملأ الاستمارة في نحو عشرين دقيقة، وترفق دليلاً بسيطاً على وجود منتجك: صوراً، أو فيديو قصيراً، أو لقطات شاشة.',
            note: 'لا نطلب خطة عمل ولا عرضاً تقديمياً؛ نريد أن نرى شيئاً حقيقياً يمكن اختباره.',
          },
          {
            id: 'prove',
            number: 2,
            title: 'تُثبت جديتك',
            description:
              'إن اجتاز طلبك الفرز الأولي، تحضر مقابلة تشخيصية مدتها ثلاثون دقيقة تُشغّل فيها منتجك أمام اللجنة وتتحدث عن سوقك.',
            note: 'نحن لا نختار من الورق. نختار بعد أن نرى ما بنيته.',
          },
        ],
      },
      {
        id: 'program',
        label: 'البرنامج المكثّف',
        /* The only phase with a stated span, and it is the brief's own
           headline figure — so the chip is factual, not invented. */
        scope: '12 أسبوعًا',
        steps: [
          {
            id: 'know-customer',
            number: 3,
            meta: 'الأسابيع 1 إلى 3',
            title: 'تعرف عميلك',
            description:
              'تتحقق من المشكلة مع عملاء حقيقيين لا من مكتبك، وتحدّد من يدفع ولماذا، وتحسّن نموذج عملك بناءً على ما تسمعه فعلاً.',
            outcome: 'تخرج بفرضيات عميل موثقة ونموذج عمل محدَّث.',
          },
          {
            id: 'reach',
            number: 4,
            meta: 'الأسابيع 4 إلى 6',
            title: 'تصل إليه',
            description:
              'تبني خطة الدخول إلى السوق، وتختبر قناة وصول واحدة، وتتعلّم كيف تُدير محادثة بيع حقيقية وتُغلقها.',
            outcome: 'تخرج بخطة دخول وقناة مختبَرة ومحادثات بيع موثقة.',
          },
          {
            id: 'validate',
            number: 5,
            meta: 'الأسابيع 7 إلى 10',
            title: 'تُثبت أن الحل يعمل',
            description:
              'تضع سعرك وتختبره في السوق وتعرف هل يُقبل، وتقيس ما يحدث فعلاً، وتقرر ما تغيّره بناءً على الأدلة لا على الظن.',
            outcome: 'تخرج بسعر مختبَر ولوحة مؤشرات ونسخة محسّنة من حلّك.',
          },
          {
            id: 'pitch-prep',
            number: 6,
            meta: 'الأسبوعان 11 و12',
            title: 'تعرض وتنطلق',
            description: 'تبني ملف جاهزيتك وخطة التسعين يوماً.',
            outcome: 'تخرج بـ: عرض استثماري وخطة تسعين يوماً وشبكة علاقات تبقى بعد البرنامج.',
          },
        ],
      },
      {
        id: 'beyond',
        label: 'العرض وما بعد البرنامج',
        steps: [
          {
            id: 'demo-day',
            number: 7,
            title: 'العرض أمام لجنة التحكيم والمستثمرين',
            description:
              'تعرض مشروعك أمام لجنة تحكيم ومستثمرين في جلسات قطاعية تلتقي فيها بمهتمين بمجالك تحديداً. وتنافس على دعم مالي بقيمة 3,500$ وتُعلَن المشاريع الثلاثة التي تحصل على دعم تأسيسي مشروط في الفعالية الختامية.',
          },
          {
            id: 'closing-event',
            number: 8,
            title: 'الفعالية الختامية',
            description:
              'تحضر فعالية تجمع الفاعلين في منظومة ريادة الأعمال المجتمعية في سورية، وتعرض منتجك على هامشها أمام مشترين وشركاء ومستثمرين. وتُعلَن فيها المشاريع الثلاثة الحاصلة على الدعم التأسيسي، ويعرض أصحابها مشاريعهم أمام الحضور.',
            outcome: 'تخرج بـ: ظهور أمام المنظومة ولقاءات مباشرة مع جهات مهتمة.',
          },
          {
            id: 'post-follow-up',
            number: 9,
            meta: 'شهران',
            title: 'المتابعة البعدية',
            description:
              'تنتقل إلى متابعة بعدية لشهرين تنفّذ خلالها خطة التسعين يوماً، مع جلسات مراجعة قصيرة وربط بخبراء أو موردين أو جهات وصول بحسب حاجتك.',
          },
        ],
      },
    ],

    /* The weekly rhythm that repeats through the twelve weeks — the
       brief draws it as a set-apart block after the nine stages, so
       the page gives it its own three-beat cycle rather than folding
       it into the rail. Each beat's title/body is the brief's own, cut
       at the em-dash it already uses. `conviction` is the line the
       brief closes the whole journey on. */
    rhythm: {
      title: 'الإيقاع الأسبوعي',
      lede: 'يتكرر ثابتاً طوال الأسابيع الاثني عشر:',
      repeats: 12,
      beats: [
        {
          id: 'training-day',
          title: 'يوم تدريب كامل',
          description: 'تحضر مع شريكك يوماً تطبيقياً على محور محدد، لا محاضرة.',
        },
        {
          id: 'field-task',
          title: 'مهمة ميدانية',
          description:
            'تخرج من القاعة وتنفّذها خلال الأسبوع: تقابل زبائن، أو تجرّب سعراً، أو تختبر طريقة بيع — وتوثّق النتيجة.',
        },
        {
          id: 'mentoring',
          title: 'جلسة إرشاد',
          description: 'تجلس مع مرشد متخصص يراجع معك ما حدث فعلاً، وتقرران الخطوة التالية.',
        },
      ],
      conviction:
        'لا تخرج من البرنامج بشهادة حضور فقط، بل بأدلة: زبائن تحدثت إليهم بالاسم، وسعر اختبرته وعرفت هل يُقبل، ونموذج عمل عدّلته بناءً على ما رأيت.',
    },
  },

  /* ── 6 · آلية التقديم ─────────────────────────────────────────
        Five steps of a selection funnel, and the sentence the brief
        closes the section with. `NumberedList` rather than the
        journey's rail: two scroll-drawn rails on one page read as the
        same section twice, and this is an enumerated funnel rather
        than a timeline the reader lives through. ───────────────── */
  applying: {
    title: 'آلية التقديم',
    lede: 'تمر عملية الاختيار بمراحل عدّة لضمان اختيار المشاريع الأكثر جاهزية، وهي كالتالي:',
    items: [
      'تعبئة نموذج التقديم.',
      'مراجعة الطلبات والتحقق من استيفاء معايير الأهلية.',
      'تنفيذ المهمة القبلية والمشاركة في المقابلة.',
      'اختيار 21 مشروع ناشئ للانضمام إلى المشروع.',
      'انطلاق المشروع.',
    ],
    note: 'يعتمد الاختيار على مدى جاهزية المشروع، واستيفائه للشروط، وقدرة الفريق على الاستفادة من الرحلة التدريبية.',
  },

  /* ── 7 · دعوة للتسجيل ─────────────────────────────────────────
        The brief labels this section "دعوة للتسجيل"; the band is
        already announced by "ابدأ رحلتك اليوم" and the button under it,
        so the label survives only as this comment and as the section's
        name in the brief. Do not re-add it as an `eyebrow`. */
  closing: {
    title: 'ابدأ رحلتك اليوم',
    lede: 'إذا كنت تقود مشروع ناشئ يمتلك منتجًا أوليًا وتسعى إلى تطويره، واختبار السوق، وبناء مشروع أكثر جاهزية للنمو، فإن أسس سورية يوفر لك البيئة المناسبة للانتقال إلى المرحلة التالية.',
    cta: { label: APPLY_LABEL, href: APPLY_URL },
  },

  /* ── 8 · شركاؤنا ──────────────────────────────────────────────
        The last band on the page — which is where the client's own
        comment on the brief asks for it ("يفضل وضع الشركاء في آخر
        الصفحة مع الرعاة", Akeel Bakkour, 1 Sept 2026). After the
        closing band on purpose, therefore, rather than before it.

        `id` KEYS THE LOGO, `name` IS THE ALT TEXT. The brief writes
        each partner as "لوجو <name>" — "لوجو" is the brief's marker for
        artwork, not copy, so it is dropped and the artwork itself lives
        in `assets/partners/`, keyed by `id` in the page's
        `PARTNER_LOGOS` map. The `name` is what a screen reader hears in
        place of the mark, so it stays the brief's own wording.

        PRESENTLY HAS NO LOGO FILE YET. The final brief replaced the
        second partner (منظمة التنمية السورية / SDO) with "Presently",
        and no Presently artwork is supplied. The page falls back to
        rendering the name as text on its plate until a logo arrives —
        it must NOT show the old SDO mark under the new name. Drop a
        `presently` entry into `PARTNER_LOGOS` the moment the file is
        supplied; nothing else changes.

        NEITHER MOU IS SIGNED. The brief carries a comment from the
        client's own team (Akeel Bakkour, 1 Sept 2026) that no
        memorandum of understanding has been signed with either partner
        yet — signature depends on Bedar securing sponsorship and on the
        partners approving the MOU terms. /programs/usus-syria is still
        held out of search (`content/noindex-paths.js`); SHOWING A
        PARTNER'S LOGO IS THE CLIENT'S CALL, not this file's, and a logo
        is a stronger claim of partnership than a name. Confirm before
        the page is opened to crawlers. A sponsors row, when there is
        one, belongs beside `items` here rather than in a ninth band. */
  partners: {
    eyebrow: 'شركاؤنا',
    title: 'نعتزّ بشركائنا في إنجاح المشروع',
    items: [
      { id: 'sme-authority', name: 'هيئة تنمية المشروعات الصغيرة والمتوسطة' },
      { id: 'presently', name: 'Presently' },
    ],
  },
};

export default ususSyria;
