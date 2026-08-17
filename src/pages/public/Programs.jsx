import { PageHero } from '@components/ui';
import { CollectionListing } from '@components/layout/CollectionListing.jsx';
import { useContent, usePage } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { pageBanners } from '@content/page-banners.js';
import { breadcrumbsFor } from '@content/site.js';
import { PUBLISH_STATE } from '@utils/constants.js';

/**
 * البرامج — the programs listing.
 *
 * The old status filter ("عرض الكل / الحالية / السابقة") is gone by
 * request: every published program shows at once in a single modern
 * grid. Filtering stays on `state` only — a draft never leaks to the
 * public listing — and never on `status`, so a program published from
 * the dashboard lands here with no code change.
 *
 * The listing body is `CollectionListing`, shared with /blog and
 * /news: newest item full width, the rest in a grid.
 */
export default function Programs() {
  const programsPage = usePage('programsPage');
  const { collections } = useContent();
  useSeo(programsPage.seo);

  const visible = collections.programs.filter(
    (program) => !program.state || program.state === PUBLISH_STATE.PUBLISHED,
  );

  return (
    <>
      <PageHero
        breadcrumbs={breadcrumbsFor('/programs')}
        eyebrow={programsPage.hero.eyebrow}
        title={programsPage.hero.title}
        image={pageBanners.programs}
      />

      <CollectionListing items={visible} empty={programsPage.empty} readMore="إقرأ المزيد" />
    </>
  );
}
