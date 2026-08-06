import { useParams } from 'react-router-dom';

import { CollectionDetail } from '@components/layout/CollectionDetail.jsx';
import { useContent } from '@context/ContentContext.jsx';

/**
 * /programs/:slug and /program/:slug — one program.
 *
 * Both paths route here: the live site uses the plural for one
 * program and the singular for the other two, and the migration
 * must not 404 an inbound link. The Redirects manager (Phase 5) can
 * retire the singular once analytics show it is unused.
 */
export default function ProgramDetail() {
  const { slug } = useParams();
  const { collections } = useContent();

  return (
    <CollectionDetail
      collection={collections.programs}
      collectionName="programs"
      slug={slug}
      backHref="/programs"
      backLabel="العودة إلى البرامج"
      breadcrumbLabel="البرامج"
    />
  );
}
