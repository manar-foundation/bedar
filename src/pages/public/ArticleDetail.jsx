import { useParams } from 'react-router-dom';

import { CollectionDetail } from '@components/layout/CollectionDetail.jsx';
import { useContent } from '@context/ContentContext.jsx';

/** /blog/:slug — one article from the `articles` collection. */
export default function ArticleDetail() {
  const { slug } = useParams();
  const { collections } = useContent();

  return (
    <CollectionDetail
      collection={collections.articles}
      collectionName="articles"
      slug={slug}
      backHref="/blog"
      backLabel="العودة إلى المدونة"
      breadcrumbLabel="المدونة"
    />
  );
}
