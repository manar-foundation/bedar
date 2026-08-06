import { useParams } from 'react-router-dom';

import { CollectionDetail } from '@components/layout/CollectionDetail.jsx';
import { useContent } from '@context/ContentContext.jsx';

/** /news/:slug — one item from the `news` collection. */
export default function NewsDetail() {
  const { slug } = useParams();
  const { collections } = useContent();

  return (
    <CollectionDetail
      collection={collections.news}
      collectionName="news"
      slug={slug}
      backHref="/news"
      backLabel="العودة إلى الأخبار"
      breadcrumbLabel="الأخبار"
    />
  );
}
