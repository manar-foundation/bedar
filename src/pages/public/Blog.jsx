import { Hero } from '@components/ui';
import { CollectionListing } from '@components/layout/CollectionListing.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { blogPage } from '@content/pages.js';

/**
 * المدونة — the article listing, rendered from the `articles`
 * collection through the shared `CollectionListing`: the newest
 * article leads at full width, the rest follow in a grid.
 */
export default function Blog() {
  const { collections } = useContent();
  useSeo(blogPage.seo);

  return (
    <>
      <Hero eyebrow={blogPage.hero.eyebrow} title={blogPage.hero.title} showSpiral={false} />

      <CollectionListing
        items={collections.articles}
        empty={blogPage.empty}
        readMore={blogPage.readMore}
      />
    </>
  );
}
