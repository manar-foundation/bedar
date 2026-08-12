/* ================================================================
   HACKATHON — هاكاثون أدوات الإعمار في غزة, as structured content.

   WHY THIS FILE EXISTS
   ----------------------------------------------------------------
   Every other program on the site is a rich-text body rendered by
   `CollectionDetail` → `RichText`, and that is right for a program
   that is written as an article. This one is not: on the client's
   Webflow site it is a bespoke landing page — a goals grid, three
   parallel "who / what / which" lists, a dated timeline and an FAQ.

   `scripts/migrate-bodies.mjs` has no rich-text block to read on that
   page, so it falls back to walking the prose between the `<h1>` and
   the footer. That preserved every word and flattened every
   structure: the migrated body is 40 `h3`s and 31 `p`s in a single
   column, ~6000px tall, with the timeline reduced to bare headings
   (its dates live in the page's markup, not its prose), the FAQ
   reduced to four answers with no questions, and two sections
   duplicated verbatim because the source renders them twice for its
   mobile breakpoint. The README says as much: "if the client wants
   that layout back it is a page build, not a content migration."

   This is that page build, and this file is its content half. The
   structure is recovered; the WORDS are the client's own, read back
   from bedar.webflow.io/programs/hackathon — including the parts the
   prose walk could not reach:

     • `timeline[].date` — in the source's markup, never in its text
     • `faq[].question`  — likewise; the migration captured only the
                           answers, which is why the migrated body's
                           "الأسئلة المكررة" section is four orphan
                           paragraphs
     • the section eyebrows (عن الهاكاثون, أهداف الهاكاثون,
       تخصصات الهاكاثون, الشريك الاستراتيجي, شروط المشاركة, أهم
       الأسئلة) — the source's own labels, which double as its
       in-page tab strip

   Two duplications in the source are NOT reproduced: the timeline and
   the tracks list each appear twice in the migrated body because the
   Webflow page renders a desktop and a mobile copy of them. They are
   one list each here.

   `collection-bodies.js` still holds the flat body and is untouched —
   it is generated, and re-running the migration must not fight this
   file. `pages/public/Hackathon.jsx` renders this instead, and the
   generic `ProgramDetail` still serves every other program.

   ONE COPY EDIT, DECLARED
   ----------------------------------------------------------------
   `hero.lede` is the first half of the source's opening paragraph.
   The source runs two near-identical variants of the same sentence
   back to back with no separator —

     "…وتحسين حياة سكّانها.استثمر خبراتك ومهاراتك في مشروع له أثر
      ملموس. انضم إلينا في برنامج … وتحسين حياة سكّانها."

   — which is a Webflow authoring slip (note the missing space after
   the full stop), not a rhetorical repetition. The second variant is
   dropped here rather than set as a second paragraph. It is recorded
   in this comment so nothing is lost, and it is the only string on
   this page that differs from the source; if the client wants it
   back, it is one line below.
   ================================================================ */

export const hackathon = {
  slug: 'hackathon',

  seo: {
    title: 'هاكاثون إعمار غزة | مبادرة مجتمعية لحلول مبتكرة ومستدامة',
    description:
      'مبادرة مجتمعية لتطوير حلول وأدوات مبتكرة للإسهام في إعادة بناء البنية التحتية وتحسين الحياة الاجتماعية والاقتصادية لسكان غزة، بالتعاون مع الهيئة العربية الدولية لإعمار فلسطين',
  },

  hero: {
    category: 'البرامج السابقة',
    title: 'هاكاثون أدوات الإعمار في غزة',
    tagline: 'إحداث تغيير حقيقي في غزة يبدأ الآن!',
    lede: 'استثمر خبراتك ومهاراتك في مبادرات مجتمعية ناجحة. وانضم إلينا في برنامج "هاكاثون أدوات الإعمار في غزة" وكن جزءًا من الحلول المبتكرة لإعمار غزة وتحسين حياة سكّانها.',
    note: 'البرنامج أونلاين عبر تطبيق زوم',
    date: '2025-11-13',
  },

  /* The three figures the source states in its own FAQ answer —
     "سيعقد الهاكاثون في 24 و 25 آب/أغسطس 2024، بالإضافة لجلسة ختامية …
     في 31 آب/أغسطس 2024" — and in its participation conditions
     ("طوال مدة الهاكاثون التي تمتد لأسبوع كامل"). Nothing here is a
     new claim; each one is a restatement of a sentence already on the
     page, which is why the labels are short. */
  facts: [
    { id: 'dates', value: '24–25', label: 'آب/أغسطس 2024 — أيام الهاكاثون' },
    { id: 'final', value: '31', label: 'آب/أغسطس 2024 — الجلسة الختامية' },
    { id: 'duration', value: '7', label: 'أيام من العمل المتواصل' },
    { id: 'fee', value: '0', label: 'رسوم المشاركة' },
  ],

  about: {
    eyebrow: 'عن الهاكاثون',
    title: 'الهاكاثون - مستقبل أفضل لغزة',
    body: [
      'في ظل الظروف الراهنة التي يمر بها قطاع غزة، تبرز الحاجة الماسّة إلى الاستجابة لتحديات الإعمار ليس فقط للمنشآت والبنية التحتية، ولكن أيضًا للحياة الاجتماعية والاقتصادية لسكانها. يأتي "هاكاثون أدوات الإعمار في غزة" كمبادرة مجتمعية حيوية في مجال ريادة الأعمال الاجتماعية، تهدف إلى جمع المهتمين من مختلف التخصصات للعمل معًا على تطوير حلول وأدوات مبتكرة للإسهام في إعمار وتجديد البنية التحتية وتحسين الظروف المعيشية والمجتمعية في قطاع غزة.',
      '"هاكاثون أدوات الإعمار في غزة" هي بداية رحلة طويلة نحو التعافي والتجديد من خلال خلق خطط مستقبلية شاملة ومستدامة تجمع بين الاحتياجات الإسكانية والمخاوف المتعلقة ببقاء النازحين بلا مأوى. هذا الجهد يتضمن استخدام تحليلات البيانات وتطوير استراتيجيات تخطيط فعّالة، بالإضافة إلى اقتراح أساليب بناء وأدوات جديدة أو محسنة تساهم في دعم المعيشة في قطاع غزة، وتوفير حلول مرنة تتكيف مع التغيرات المستقبلية. ما يجعله مثالًا واقعيًا على مشاريع ريادة الأعمال الاجتماعية.',
    ],
  },

  /* Seven goals. The source sets each one as a heading whose sentence
     CONTINUES into the paragraph under it ("فتح حوار شامل" →
     "وتسليط الضوء على…"), which is why several descriptions open with
     a conjunction. Left exactly as written — rewriting them into
     standalone sentences would be editing the client's copy. */
  goals: {
    eyebrow: 'أهداف الهاكاثون',
    title: 'أهداف هاكاثون أدوات الإعمار في غزة',
    items: [
      {
        id: 'dialogue',
        title: 'فتح حوار شامل',
        description:
          'وتسليط الضوء على الإمكانيات والفرص المتاحة لتطوير أدوات وحلول جديدة تُسهم في الإعمار. وتدعم إطلاق مبادرات مجتمعية مبتكرة',
      },
      {
        id: 'collaboration',
        title: 'تحفيز التعاون بين الخبراء',
        description:
          'وإنشاء جسور التواصل لتبادل الخبرات وتوليد حلول مبتكرة تعزز الريادة الاجتماعية',
      },
      {
        id: 'tools',
        title: 'تطوير أدوات وحلول جديدة',
        description:
          'ومبتكرة تدعم نماذج مبادرات مجتمعية، وتعزّز كفاءة واستدامة عمليات الإعمار في مجالات متنوعة.',
      },
      {
        id: 'practical',
        title: 'تقديم حلول عملية',
        description:
          'إلى الجهات الفاعلة في عملية الإعمار لضمان تنفيذها بشكل فعّال ضمن إطار الريادة الاجتماعية.',
      },
      {
        id: 'documentation',
        title: 'جمع وتوثيق الأفكار الجديدة',
        description: 'التي يمكن تحويلها إلى مبادرات مجتمعية تُسهم في تحسين الظروف المعيشية في غزة.',
      },
      {
        id: 'impact',
        title: 'تعزيز التأثير الإيجابي والمستدام',
        description:
          'ضمان أنّ كل فكرة تتحول إلى مبادرة مجتمعية ناجحة تلهم التغيير وتحدث فارقًا حقيقيًا ومستدامًا.',
      },
      {
        id: 'technology',
        title: 'دمج التكنولوجيا الحديثة',
        description:
          'الاستفادة من التكنولوجيا الحديثة في تطوير الأدوات والحلول لتعزيز فعالية ريادة الأعمال الاجتماعية.',
      },
    ],
  },

  /* ── The three parallel lists ─────────────────────────────────
        WHO can take part, WHICH specialisms are wanted, and WHAT the
        tracks are. Three lists of the same shape, one after another,
        are 22 near-identical cards down one column in the migrated
        body — which is most of why the page reads as a wall. They are
        one tabbed panel on the page (see Hackathon.jsx); the `label`
        on each is the tab's own label and the source's own wording
        for that section. */
  participation: {
    tabs: [
      {
        id: 'audience',
        label: 'من يمكنه المشاركة؟',
        title: 'من يمكنه المشاركة في الهاكاثون؟',
        items: [
          {
            id: 'development-workers',
            title: 'العاملون في المجال التنموي والإنساني',
            description: 'المهنيون والنشطاء المهتمون بقضايا التنمية والإغاثة',
          },
          {
            id: 'students',
            title: 'الشباب وطلاب الجامعات',
            description: 'المتحمسون للمشاركة والمساهمة في المبادرات الإنسانية',
          },
          {
            id: 'entrepreneurs',
            title: 'المبتكرون ورواد الأعمال',
            description: 'من مختلف أنحاء العالم المهتمون بتطوير حلول ريادية للقضايا الإنسانية',
          },
        ],
      },
      {
        id: 'disciplines',
        label: 'تخصصات الهاكاثون',
        title: 'ما هي التخصصات المطلوبة في الهاكاثون؟',
        items: [
          {
            id: 'engineers-architects',
            title: 'مهندسون ومعماريون',
            description: 'خبراء يقدمون حلول وأدوات مبتكرة لإعادة البناء بطرق مستدامة وآمنة',
          },
          {
            id: 'construction-tech',
            title: 'متخصصون في تكنولوجيا البناء',
            description:
              'خبراء في البناء الذكي وتكنولوجيا المعلومات المطبقة في الإنشاءات لتحسين كفاءة البناء والتشييد',
          },
          {
            id: 'environmental',
            title: 'مهندسون وخبراء بيئيون',
            description:
              'متخصصون في التعامل مع التحديات البيئية، والمواد الكيميائية والمشعة، وتراكم النفايات',
          },
          {
            id: 'water',
            title: 'خبراء في معالجة المياه',
            description: 'متخصصون في تحلية المياه ومعالجة مياه الصرف الصحي',
          },
          {
            id: 'designers',
            title: 'مصممون',
            description: 'خبراء في التصميم الداخلي والعمراني، لإيجاد حلول مبتكرة للإيواء السريع',
          },
          {
            id: 'energy-engineers',
            title: 'مهندسون في مجال الطاقة',
            description: 'خبراء في توليد الطاقة الكهربائية، خصوصًا باستخدام تقنيات مستدامة ومتجددة',
          },
        ],
      },
      {
        id: 'tracks',
        label: 'مجالات الهاكاثون',
        title: 'مجالات هاكاثون أدوات الإعمار في غزة',
        items: [
          {
            id: 'power',
            title: 'توليد الطاقة الكهربائية',
            description: 'تطوير حلول مبتكرة لتوليد الطاقة الكهربائية بطرق مستدامة وآمنة',
          },
          {
            id: 'rubble',
            title: 'التعامل مع واقع الردم',
            description:
              'تطوير حلول وأساليب فعّالة للتعامل مع الردم (حجم الردم الكبير، تلوث الردم بمخلفات الحرب، الأبنية المتصدعة)',
          },
          {
            id: 'water',
            title: 'التعامل مع واقع المياه',
            description:
              'تقديم حلول مبتكرة لتحلية المياه، والتعامل مع مياه الصرف الصحي بالتخلص منها أو معالجتها',
          },
          {
            id: 'shelter',
            title: 'الإيواء السريع',
            description: 'تقديم حلول عملية للإيواء السريع تراعي الظروف الراهنة',
          },
          {
            id: 'rebuilding',
            title: 'إعادة البناء بطرق مستدامة وآمنة',
            description: 'تطوير تقنيات بناء مستدامة بما يضمن سلامة المباني والمحافظة على الموارد',
          },
          {
            id: 'environment',
            title: 'التحديات البيئية',
            description:
              'ابتكار حلول لمعالجة تلوث مياه البحر والمياه الجوفية، والتعامل مع المواد الكيميائية والمشعة، وتراكم النفايات بالتخلص منها أو معالجتها أو إعادة تدويرها',
          },
        ],
      },
    ],
  },

  partner: {
    eyebrow: 'الشريك الاستراتيجي',
    title: 'الهيئة العربية الدولية للإعمار في فلسطين',
    body: [
      'تعتبـر إحدى أهم المنظمات الرائدة في مجال الإعمار والبناء، وهي هيئة مدنية غير ربحية، تضم هيئات ومنتديات وشخصيات أهلية هندسية واقتصادية واجتماعية، عربية وإسلامية ودولية. وتقوم بالعديد من الأنشطة المتميزة ذات الصلة بالإعمار في فلسطين، مما أكسبها موقعا ريادياً في دعم نماذج مبادرات مجتمعية قابلة للاستدامة.',
      'وتهدف الهيئة إلى المساهمة في تجميع الجهود الأهلية عربياً ودولياً، وحشد الطاقات والموارد، وتجميع وتنسيق الجهود الهندسية والاقتصادية والمالية العربية والإسلامية والدولية، وذلك لتنمية الواقع المعاش في فلسطين، بمصداقية ومهنية عالية, وتتولى الهيئة متابعة عمليات الإعمار مباشرة أو نيابة عن الغير.',
    ],
  },

  conditions: {
    eyebrow: 'شروط المشاركة',
    title: 'شروط المشاركة في هاكاثون أدوات إعمار غزة',
    body: [
      'يشترط أن تزيد أعمار المشاركين عن 20 عامًا، وأن يكونوا قادرين على التعبير عن أفكارهم بوضوح والعمل دون عوائق اتصالية. كما ينبغي أن يكونوا مستعدين للعمل ضمن فرق والتعاون مع المشاركين الآخرين.',
      'يجب على المشاركين التحلي بالاستعداد لمشاركة أفكار المبادرات الاجتماعية ونتائج أعمالهم مع الجهات الراغبة في تنفيذ هذه المبادرات الاجتماعية والحلول على أرض الواقع. بالإضافة إلى ذلك، يجب عليهم الالتزام بالحضور والمشاركة الفعّالة طوال مدة الهاكاثون التي تمتد لأسبوع كامل.',
    ],
  },

  /* Nine stages. `date` is a plain string, not an ISO date: several
     of these are RANGES ("15-19/08/2024") and the source writes them
     dd/mm/yyyy, which is already Western-digit and already the format
     the client's audience reads. Passing them through `formatDate`
     would mean parsing a range, and `Intl` cannot render one. */
  timeline: {
    title: 'مراحل الهاكاثون',
    items: [
      { id: 'form-open', date: '01/08/2024', title: 'إطلاق استمارة التسجيل' },
      { id: 'form-close', date: '15/08/2024', title: 'إنتهاء مرحلة التسجيل' },
      { id: 'review', date: '15-19/08/2024', title: 'تقييم طلبات المسجلين' },
      { id: 'interviews', date: '20-22/08/2024', title: 'مقابلة المرشحين' },
      { id: 'invitations', date: '23/08/2024', title: 'إرسال الدعوات للمقبولين' },
      { id: 'opening', date: '24/08/2024', title: 'الجلسة الافتتاحية' },
      { id: 'workshops', date: '24-25/08/2024', title: 'ورش عمل الهاكاثون' },
      { id: 'mentoring', date: '26-30/08/2024', title: 'تطوير الحلول مع الخبراء' },
      { id: 'closing', date: '31/08/2024', title: 'الجلسة الختامية وعرض الحلول' },
    ],
  },

  faq: {
    eyebrow: 'أهم الأسئلة',
    title: 'الأسئلة المكررة',
    items: [
      {
        id: 'when',
        question: 'ما هو موعد الهاكاثون؟',
        answer:
          'سيعقد الهاكاثون في 24 و 25 آب/أغسطس 2024، بالإضافة لجلسة ختامية يتم فيها تقديم العروض النهائية في 31 آب/أغسطس 2024.',
      },
      {
        id: 'fees',
        question: 'هل هناك رسوم للمشاركة؟',
        answer: 'لا، المشاركة في الهاكاثون مجانية.',
      },
      {
        id: 'register',
        question: 'كيف يمكنني التسجيل؟',
        answer: 'يمكنك التسجيل عبر تعبئة الاستمارة التالية.',
      },
      {
        id: 'outcome',
        question: 'ماذا يحدث للأفكار والحلول التي تم تطويرها خلال الهاكاثون؟',
        answer:
          'سيتم مشاركة أفكار المبادرات المجتمعية والحلول مع الجهات المعنية التي تسعى لتنفيذها على أرض الواقع، مما يعزز فرص تحويل هذه الأفكار إلى مشاريع حقيقية.',
      },
    ],
  },
};

export default hackathon;
