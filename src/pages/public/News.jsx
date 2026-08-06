import { ContentCard, Hero } from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { newsPage } from '@content/pages.js';

/**
 * الأخبار — the news listing.
 *
 * A separate collection from `articles` with the same shape, which
 * is why it reuses <ContentCard> unchanged. News items on the live
 * site carry no excerpt, so the card falls back to title + date.
 */
export default function News() {
  const { collections } = useContent();
  useSeo(newsPage.seo);

  return (
    <>
      <Hero eyebrow={newsPage.hero.eyebrow} title={newsPage.hero.title} showSpiral={false} />

      <section className="container-page section-y">
        {collections.news.length === 0 ? (
          <p className="py-12 text-center text-ink-muted">{newsPage.empty}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.news.map((item, index) => (
              <Reveal key={item.id} delay={index % 3}>
                <ContentCard
                  title={item.title}
                  excerpt={item.excerpt}
                  href={item.href}
                  image={item.image}
                  imageAlt={item.imageAlt}
                  date={item.date}
                  cta={newsPage.readMore}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
