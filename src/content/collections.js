/* ================================================================
   COLLECTION SEEDS — programs, articles, news.

   These are the three article-style collections the listing pages
   and the footer's "أحدث المقالات" block read from (Infra spec §3,
   Dashboard spec §3.2). Phase 4 serves the same shapes from
   Supabase and this file becomes the offline fallback.

   Metadata below (title, slug, date, category, excerpt) is migrated
   from the client's Webflow site, read 2026-08-04.

   ON `body` — LONG-FORM TEXT IS NOT IN THIS FILE
   ----------------------------------------------------------------
   Bodies live in the generated `collection-bodies.js`, produced by
   `scripts/migrate-bodies.mjs`, which fetches each item from the
   Webflow site and parses it. Generating beats transcribing twice
   over: a dropped tashkeel or swapped quote mark in 3,000 words of
   Arabic is invisible until the client reads it, and the migration
   stays re-runnable while the Webflow site is still being edited
   before cutover.

   Regenerate with:
     node scripts/migrate-bodies.mjs

   NEVER import that file statically from here. It is ~57 kB of
   prose, and this module is reached from `ContentContext`, which
   every public page mounts — a static import would ship all nine
   bodies to a visitor who only ever sees the homepage. Same rule
   that keeps Supabase out of the public bundle, same reason.
   `CollectionDetail` calls `loadBody(slug)` instead, so the text
   loads only on a detail route.

   Block shapes the renderer understands:
     { type: 'p',      text }
     { type: 'h2'|'h3', text }
     { type: 'quote',  text }
     { type: 'ul',     items: [] }
   ================================================================ */

import { PUBLISH_STATE } from '@utils/constants.js';

/**
 * Fetch one item's body on demand.
 *
 * Dynamic import, so Rolldown splits the bodies into their own chunk
 * and no listing page pays for them. The whole map is one chunk
 * rather than one per article: nine separate requests to render one
 * page is worse than a single 15 kB gzipped fetch, and a reader who
 * opens one article usually opens another.
 */
export async function loadBody(slug) {
  const { bodies } = await import('./collection-bodies.js');
  return bodies[slug] ?? [];
}

/* ── Programs ─────────────────────────────────────────────────
   `status` drives the filter tabs on /programs. Every program links
   under the canonical /programs/:slug — the path shape is unified
   (the live site's inconsistent /program/:slug is kept only as a 301
   alias in routes.jsx so old inbound links don't 404). ────────── */
const rawPrograms = [
  /* Newest first — `CollectionListing` leads with the first item, so
     the open programme is the one that runs full width. Its detail
     view is a built page, not a rich-text body: `/programs/usus-syria`
     resolves to `pages/public/UsusSyria.jsx` through the static route
     declared before `:slug` in routes.jsx, which is why this record
     carries no entry in `collection-bodies.js`. Same arrangement the
     hackathon has. */
  {
    id: 'usus-syria',
    slug: 'usus-syria',
    href: '/programs/usus-syria',
    title: 'أُسُس سوريا للريادة المجتمعية',
    category: 'البرامج الحالية',
    status: 'current',
    date: '2026-08-31',
    excerpt:
      'مسار عملي تطلقه مؤسسة منار للمشاركة المجتمعية، ويهدف إلى دعم الشركات الناشئة التي تمتلك منتجًا أوليًا (MVP) أو خدمة قابلة للاختبار، لتطوير منتجاتها واختبار السوق وبناء نماذج أعمال أكثر جاهزية للنمو.',
    state: PUBLISH_STATE.PUBLISHED,
  },
  {
    id: 'hackathon',
    slug: 'hackathon',
    href: '/programs/hackathon',
    title: 'هاكاثون أدوات الإعمار في غزة',
    category: 'البرامج السابقة',
    status: 'past',
    date: '2025-11-13',
    excerpt:
      'مبادرة مجتمعية لتطوير حلول وأدوات مبتكرة للإسهام في إعادة بناء البنية التحتية وتحسين الحياة الاجتماعية والاقتصادية لسكان غزة. ستنظم منصة بدار هذا الحدث الذي يمتد لمدة يومين، بالتعاون مع الهيئة العربية الدولية لإعمار فلسطين',
    state: PUBLISH_STATE.PUBLISHED,
  },
  {
    id: 'community-solutions-challenge',
    slug: 'community-solutions-challenge',
    href: '/programs/community-solutions-challenge',
    title: 'تحدي الحلول المجتمعية لمواجهة الكوارث والأزمات 2023',
    category: 'البرامج السابقة',
    status: 'past',
    date: '2025-11-13',
    excerpt:
      'تم إطلاق "تحدي الحلول المجتمعية لمواجهة الكوارث والأزمات" في عام 2023 استجابةً للزلزال المدمر الذي ضرب تركيا وسوريا، والذي أبرز الحاجة الملحة للتدخل السريع والموجه لمواجهة الكوارث الطبيعية والبشرية المستقبلية. تعد هذه المبادرة، إحدى النماذج لمبادرات مجتمعية ناجحة تهدف إلى تفعيل دور المجتمع في تقديم أفكار مبادرات مجتمعية قابلة للتطبيق.',
    state: PUBLISH_STATE.PUBLISHED,
  },
  {
    id: 'bedar-second-entrepreneurial-program',
    slug: 'bedar-second-entrepreneurial-program',
    href: '/programs/bedar-second-entrepreneurial-program',
    title: 'برنامج بدار الريادي الثاني 2021 - 2022',
    category: 'البرامج السابقة',
    status: 'past',
    date: '2025-11-13',
    excerpt:
      'انطلق برنامج "بدار الريادي الثاني" في ديسمبر 2021 بعد النجاح الذي حققته المنصة في برنامجها الريادي الأول. يهدف البرنامج إلى استقطاب أفكار مبادرات اجتماعية ومشاريع ريادة الأعمال الاجتماعية الريادية المستدامة التي تحقق أثرًا وقيمة مجتمعية للمجتمعات الفلسطينية',
    state: PUBLISH_STATE.PUBLISHED,
  },
];

/* ── Articles (المدونة) ───────────────────────────────────────
   Order is newest-first; the footer's "أحدث المقالات" block takes
   the first three, which is why a new article reaches the footer
   with no code change. ─────────────────────────────────────── */
const rawArticles = [
  {
    id: 'stages-of-idea-generation',
    slug: 'stages-of-idea-generation',
    href: '/blog/stages-of-idea-generation',
    title: 'مراحل توليد الفكرة',
    date: '2023-10-27',
    excerpt:
      'عرفنا أهمية الفكرة في هذه الحياة، ورأينا كيف يمكن لفكرة واحدة مميزة أن تغير حياة كثير من المجتمعات، لكن كيف يمكن أن نطوِّر أفكارنا؟',
    seo: {
      title: 'مراحل توليد أفكار مبادرات مجتمعية | دليل عملي من بدار',
      description:
        'كيف تطور أفكار مبادرات مجتمعية مبتكرة؟ دليل شامل من بدار يشرح مراحل توليد الفكرة: التحضير، الاحتضان، والإشراق. منهجية علمية لرواد الأعمال المجتمعيين',
    },
    state: PUBLISH_STATE.PUBLISHED,
  },
  {
    id: 'an-idea-equals-profits',
    slug: 'an-idea-equals-profits',
    href: '/blog/an-idea-equals-profits',
    title: 'الفكرة تساوي الأرباح',
    date: '2023-08-22',
    excerpt:
      'هل تعرف أن “الفكرة الجديدة” هي ترتيب غير مسبوق لشبكة من الخلايا العصبيّة الجديدةِ، والمتصلةِ بشكل متزامن مع بعضها البعض داخل الدّماغ، لتعلن عن ومضةٍ سحريّة؟',
    state: PUBLISH_STATE.PUBLISHED,
  },
  {
    id: 'refining-ideas',
    slug: 'refining-ideas',
    href: '/blog/refining-ideas',
    title: 'تنقية الأفكار',
    date: '2022-03-29',
    excerpt:
      'مبدأ التّقدم البشري قائم على أنّ الأفكار تتشابك، وتتفاعل طوال الوقت، بحثًا عن تركيبة جديدة تَحُلُّ أهمّ مشاكل العالم.',
    state: PUBLISH_STATE.PUBLISHED,
  },
  {
    id: 'become-like-those-successful-people',
    slug: 'become-like-those-successful-people',
    href: '/blog/become-like-those-successful-people',
    title: 'من أنا لأصبح مثل هؤلاء الناجحين؟!',
    date: '2022-03-29',
    excerpt:
      'كل شخص منّا يحب أن يقتدي بقصص الناجحين، ويشقّ طريقه الخاص في مشروع أو شركة أو إنجاز شخصي.',
    state: PUBLISH_STATE.PUBLISHED,
  },
];

/* ── News (الأخبار) ──────────────────────────────────────────── */
const rawNews = [
  {
    id: 'gaza-hackathon-launch',
    slug: 'gaza-hackathon-launch',
    href: '/news/gaza-hackathon-launch',
    title: 'انطلاق أعمال "هاكاثون أدوات الإعمار في غزة" بحضور شخصيات بارزة',
    date: '2024-08-28',
    excerpt: '',
    state: PUBLISH_STATE.PUBLISHED,
  },
  {
    id: 'hackathon-press-release',
    slug: 'hackathon-press-release',
    href: '/news/hackathon-press-release',
    title: 'بيان صحفي حول إطلاق مبادرة "هاكاثون أدوات الإعمار في غزة"',
    date: '2024-08-18',
    excerpt: '',
    state: PUBLISH_STATE.PUBLISHED,
  },
];

/* ── Exports. Bodies are attached here rather than inline above so
      the records stay readable as metadata, and so the generated
      file is the single place long-form text comes from. ──────── */
export const programs = rawPrograms;
export const articles = rawArticles;
export const news = rawNews;

/** Look an item up by slug — used by every detail route. */
export function findBySlug(collection, slug) {
  return collection.find((item) => item.slug === slug) ?? null;
}

export default { programs, articles, news, findBySlug };
