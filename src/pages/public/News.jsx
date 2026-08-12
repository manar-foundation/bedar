import { Hero } from '@components/ui';
import { CollectionListing } from '@components/layout/CollectionListing.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { newsPage } from '@content/pages.js';

/**
 * الأخبار — the news listing.
 *
 * A separate collection from `articles` with the same shape, which is
 * why it reuses the same listing layout unchanged. News items on the
 * live site carry no excerpt, so the card falls back to title + date.
 */
export default function News() {
  const { collections } = useContent();
  useSeo(newsPage.seo);

  return (
    <>
      <Hero eyebrow={newsPage.hero.eyebrow} title={newsPage.hero.title} showSpiral={false} />

      <CollectionListing
        items={collections.news}
        empty={newsPage.empty}
        readMore={newsPage.readMore}
      />
    </>
  );
}
