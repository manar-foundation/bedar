/* ================================================================
   USUS SYRIA — أُسُس سوريا للريادة المجتمعية, as structured content.

   WHY THIS FILE EXISTS
   ----------------------------------------------------------------
   Same reason `hackathon.js` exists, and the second instance of the
   same pattern. Most programs on this site are a rich-text body
   rendered by `CollectionDetail` → `RichText`, which is right for a
   program written as an article. This one was not written as an
   article: the client's brief
   ("إنشاء صفحة هبوط أسس سوريا - بدار - يوليو 2026.docx") specifies a
   LANDING PAGE — a numbered set of six bands, each with its own
   shape: a figure row, a sector list, a benefits grid, a four-stage
   journey, an eligibility list, a five-step application funnel and a
   closing call to register.

   Flattening that into one rich-text column would lose exactly what
   the brief is asking for, so the structure lives here and
   `pages/public/UsusSyria.jsx` is the layout for it. The program
   still appears in the /programs listing like any other — only the
   detail view differs. See the note on its route in `routes.jsx`.

   THE WORDS ARE THE CLIENT'S, VERBATIM
   ----------------------------------------------------------------
   Every string below is copied from the brief. Nothing is rewritten,
   expanded or invented, and no section of the brief is dropped. The
   two places where a judgement had to be made are declared here
   rather than left implicit:

   1. SECTION 2 IS THE BRIEF'S OWN SUGGESTED VERSION.
      The brief prints the participation benefits twice — first as
      six long bullets, then again as six short title+line cards
      under the note "اقتراح، عرض النقاط بهذه الطريقة" ("suggestion:
      present the points this way"), which carries a reviewer comment
      marked "اقتراح" in the document. That is a presentation choice
      the client has already made, so the card version is what
      `benefits.items` holds, word for word.

      The suggested cards are prefixed with emoji in the brief
      (🧩 👥 📊 🤝 📅 💰). Emoji are not used in site copy anywhere on
      this site — CLAUDE.md's brand rules are explicit about it — so
      each one is carried as a lucide mark in the page component's
      `BENEFIT_ICONS` map instead, chosen to match the emoji the
      brief picked. The MARK is preserved; only its typeface changes.

   2. SEO IS ASSEMBLED FROM THE BRIEF'S OWN SENTENCES.
      The brief specifies no `<title>`/`<meta description>` — it is a
      layout brief, not an SEO one — but `useSeo` needs both and a
      page with no description is a page that indexes badly. Rather
      than write new marketing copy, the title pairs the program's
      name with the brief's own header line and the description is
      the brief's own "ما هو برنامج أُسُس سوريا؟" paragraph, trimmed
      to length. No claim appears in either that is not already on
      the page.

   THE ONE THING THE BRIEF DOES NOT SUPPLY — see `APPLY_URL` below.
   ================================================================ */

/**
 * Where "قدّم الآن" goes.
 *
 * The brief specifies the BUTTON ("قدّم الآن", twice — once in the
 * header and once in the closing band) but not its destination: there
 * is no application-form URL anywhere in the document, and no form
 * for this program exists on the site yet.
 *
 * So this points at the contact page, which is a real, working
 * destination that reaches the team — not a `#` that dead-ends and
 * not a fabricated URL. It is a single constant, used by both CTAs,
 * so pointing the program at its real form is a ONE-LINE change here
 * once the client supplies it.
 *
 * An absolute `https://…` is supported as well as an internal path —
 * `CtaBand` and the header button both route on the shape of this
 * string, so an external form host needs no further change.
 */
const APPLY_URL = '/contact-us';

const APPLY_LABEL = 'قدّم الآن';

export const ususSyria = {
  slug: 'usus-syria',

  seo: {
    title: 'أُسُس سوريا للريادة المجتمعية | برنامج بدار لتطوير الشركات الناشئة',
    description:
      'مسار عملي تطلقه مؤسسة منار للمشاركة المجتمعية لدعم الشركات الناشئة التي تمتلك منتجًا أوليًا (MVP) أو خدمة قابلة للاختبار، لتطوير منتجاتها واختبار السوق وبناء نماذج أعمال أكثر جاهزية للنمو.',
  },

  /* ── Header ───────────────────────────────────────────────── */
  hero: {
    category: 'البرامج الحالية',
    title: 'أُسُس سوريا للريادة المجتمعية',
    tagline: 'طوّر شركتك الناشئة من المنتج الأولي إلى مشروع أكثر جاهزية للنمو',
    /* The brief prints the two cities on their own line under the
       figures. They are a location label, not a sentence, so the page
       sets them as a chip — the same treatment the hackathon page
       gives its delivery-format line. */
    location: 'دمشق - حلب',
    cta: { label: APPLY_LABEL, href: APPLY_URL },
  },

  /* The four figures the brief lists under the header. Split into
     value + label so `StatRow` can typeset the number at display
     scale; the pairs are the brief's own lines ("18 شركة ناشئة",
     "12 أسبوعًا من التدريب والإرشاد", …) with nothing added.

     Unlike the hackathon's figures, these are plain quantities
     rather than date ranges, so they take `StatRow`'s defaults and
     count up on scroll. */
  facts: [
    { id: 'startups', value: 18, label: 'شركة ناشئة' },
    { id: 'weeks', value: 12, label: 'أسبوعًا من التدريب والإرشاد' },
    { id: 'sectors', value: 3, label: 'قطاعات مستهدفة' },
    { id: 'funded', value: 6, label: 'شركات تحصل على دعم مالي أولي' },
  ],

  /* ── 1 · عن البرنامج ──────────────────────────────────────── */
  about: {
    eyebrow: 'عن البرنامج',
    title: 'ما هو برنامج أُسُس سوريا؟',
    body: 'هو مسار عملي تطلقه مؤسسة منار للمشاركة المجتمعية، ويهدف إلى دعم الشركات الناشئة التي تمتلك منتجًا أوليًا (MVP) أو خدمة قابلة للاختبار، لتطوير منتجاتها واختبار السوق وبناء نماذج أعمال أكثر جاهزية للنمو.',
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
        description: 'حلول تعليمية وتقنية تسهم في تطوير التعلم وتنمية المهارات.',
      },
    ],
  },

  /* ── 2 · ماذا ستحقق من مشاركتك في البرنامج؟ ───────────────────
        The brief's own suggested card version — see note 1 at the
        top of this file. ──────────────────────────────────────── */
  benefits: {
    title: 'ماذا ستحقق من مشاركتك في البرنامج؟',
    lede: 'يوفر لك البرنامج رحلة عملية تساعدك على تطوير مشروعك، من خلال:',
    items: [
      { id: 'training', title: 'تدريب عملي', description: 'طوّر نموذج عملك واختبر فرضياتك.' },
      { id: 'mentorship', title: 'إرشاد متخصص', description: 'دعم من خبراء وفق احتياجات مشروعك.' },
      {
        id: 'market-test',
        title: 'اختبار السوق',
        description: 'تحقق من احتياجات العملاء بالأدلة.',
      },
      {
        id: 'network',
        title: 'تشبيك وشراكات',
        description: 'التقِ بخبراء وجهات داعمة وشارك في يوم العرض.',
      },
      {
        id: 'follow-up',
        title: 'متابعة بعد البرنامج',
        description: 'دعم لمدة 8 أسابيع بعد انتهاء البرنامج.',
      },
      {
        id: 'seed-funding',
        title: 'دعم مالي أولي',
        description: 'فرصة لأفضل 6 شركات ناشئة وفق معايير البرنامج.',
      },
    ],
  },

  /* ── 3 · رحلة البرنامج ────────────────────────────────────────
        Four stages, genuinely ordered, so they render on the site's
        scroll-drawn rail (`ProcessSteps`) rather than as cards.

        The brief writes each one as "المرحلة الأولى | التشخيص
        والتحقق" — a stage label, a pipe, then the stage's name. The
        pipe is a typographic separator for a flat document; here the
        two halves are separate fields, so the label sits above the
        name in the rail's own `meta` slot. Both halves are the
        brief's words; only the pipe is gone. ──────────────────── */
  journey: {
    title: 'رحلة البرنامج',
    lede: 'يمتد البرنامج لمدة 12 أسبوعًا، ويتكون من أربع مراحل مترابطة:',
    items: [
      {
        id: 'diagnosis',
        meta: 'المرحلة الأولى',
        title: 'التشخيص والتحقق',
        description: 'تقييم المشروع، وتحديد الفرضيات، ووضع خطة لاختبار السوق.',
      },
      {
        id: 'market-test',
        meta: 'المرحلة الثانية',
        title: 'اختبار السوق',
        description: 'تنفيذ مقابلات وتجارب مع العملاء، والتحقق من القيمة المقترحة، وتحليل النتائج.',
      },
      {
        id: 'readiness',
        meta: 'المرحلة الثالثة',
        title: 'بناء الجاهزية',
        description:
          'تحسين نموذج العمل، وتعزيز الجاهزية للنمو، والعمل على تحقيق مؤشرات تقدم واضحة.',
      },
      {
        id: 'demo-day',
        meta: 'المرحلة الرابعة',
        title: 'يوم العرض والاستعداد للمرحلة التالية',
        description:
          'إعداد العرض النهائي، وتطوير خطة العمل للأشهر القادمة، وعرض المشروع أمام شركاء وجهات داعمة.',
      },
    ],
  },

  /* ── 4 · الفئة المستهدفة ──────────────────────────────────────
        Four eligibility lines. Plain strings, not title+description
        pairs: each one IS a sentence, and splitting it to earn a
        card title would be rewriting the client's copy. ───────── */
  audience: {
    title: 'الفئة المستهدفة',
    lede: 'يمكنك التقديم إذا كنت:',
    items: [
      'تقود شركة ناشئة أو تشارك في تأسيسها.',
      'تمتلك منتجًا أوليًا (MVP) أو خدمة قابلة للاختبار.',
      'تعمل في أحد القطاعات المستهدفة.',
      'تمتلك فريقًا قادرًا على الالتزام طوال مدة البرنامج.',
    ],
  },

  /* ── 5 · آلية التقديم ─────────────────────────────────────────
        Five steps of a selection funnel, and the sentence the brief
        closes the section with. `NumberedList` rather than the
        journey's rail: two scroll-drawn rails on one page read as
        the same section twice, and this is an enumerated funnel
        rather than a timeline the reader lives through. ───────── */
  applying: {
    title: 'آلية التقديم',
    lede: 'تمر عملية الاختيار بمراحل عدّة لضمان اختيار الشركات الأكثر جاهزية للاستفادة من البرنامج:',
    items: [
      'تعبئة نموذج التقديم.',
      'مراجعة الطلبات والتحقق من استيفاء معايير الأهلية.',
      'تنفيذ المهمة القبلية والمشاركة في المقابلة.',
      'اختيار 18 شركة ناشئة للانضمام إلى البرنامج.',
      'انطلاق البرنامج.',
    ],
    note: 'يعتمد الاختيار على مدى جاهزية المشروع، وملاءمته للبرنامج، وقدرة الفريق على الاستفادة من الرحلة التدريبية.',
  },

  /* ── 6 · دعوة للتسجيل ─────────────────────────────────────── */
  closing: {
    eyebrow: 'دعوة للتسجيل',
    title: 'ابدأ رحلتك اليوم',
    lede: 'إذا كنت تقود شركة ناشئة تمتلك منتجًا أوليًا وتسعى إلى تطويره، واختبار السوق، وبناء مشروع أكثر جاهزية للنمو، فإن برنامج أسس سوريا للريادة المجتمعية يوفر لك البيئة المناسبة للانتقال إلى المرحلة التالية.',
    cta: { label: APPLY_LABEL, href: APPLY_URL },
  },
};

export default ususSyria;
