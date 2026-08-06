import { ContentCard, Hero } from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { blogPage } from '@content/pages.js';

/** المدونة — the article listing, rendered from the `articles` collection. */
export default function Blog() {
  const { collections } = useContent();
  useSeo(blogPage.seo);

  return (
    <>
      <Hero eyebrow={blogPage.hero.eyebrow} title={blogPage.hero.title} showSpiral={false} />

      <section className="container-page section-y">
        {collections.articles.length === 0 ? (
          <p className="py-12 text-center text-ink-muted">{blogPage.empty}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.articles.map((article, index) => (
              <Reveal key={article.id} delay={index % 3}>
                <ContentCard
                  title={article.title}
                  excerpt={article.excerpt}
                  href={article.href}
                  image={article.image}
                  imageAlt={article.imageAlt}
                  date={article.date}
                  cta={blogPage.readMore}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
