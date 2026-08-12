import { ContentCard, Section } from '@components/ui';
import { Stagger, StaggerItem } from '@components/motion/Reveal.jsx';

/* ================================================================
   COLLECTION LISTING — the body of /programs, /blog and /news.

   The three listings render the same shape from the same card, the
   way `CollectionDetail` already backs the three detail routes. They
   were three copies of one grid, and the copies had already drifted:
   two of them had a section treatment and one did not.

   LEAD ITEM
   ----------------------------------------------------------------
   The newest item runs full width, the rest follow in a grid. A
   listing where every card is identical gives the reader nowhere to
   start and no signal that anything is current — both reference
   layouts lead their listings with a wider item. The lead is simply
   the first item, so the ordering the collection already has is what
   decides it; no `featured` flag is involved, and nothing in the
   dashboard has to be set for a new article to take the lead.

   COLUMN COUNT
   ----------------------------------------------------------------
   Three columns, except when what remains after the lead is 2 or 4 —
   those leave a ragged hole in a three-up grid, and the collections
   here are small enough (three programs today) that the hole is the
   common case rather than the edge one. Derived from the data rather
   than hardcoded per page, so a fourth program published from the
   dashboard re-lays the grid with no code change.
   ================================================================ */

/** Tailwind scans source text, so both classes must appear whole. */
const gridColumns = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
};

export function CollectionListing({
  items = [],
  empty,
  readMore = 'اقرأ المزيد',
  tone = 'glow',
  /** Show the newest item as a full-width lead card. */
  lead = true,
}) {
  if (items.length === 0) {
    return (
      <Section tone={tone}>
        <p className="py-12 text-center text-ink-muted">{empty}</p>
      </Section>
    );
  }

  // A lead needs something to lead. With two items, promoting one
  // leaves a single third-width card stranded under a full-width
  // one; two equal cards side by side is the honest layout for a
  // collection that small.
  const showLead = lead && items.length >= 3;
  const [first, ...rest] = items;
  const grid = showLead ? rest : items;
  const columns = grid.length === 2 || grid.length === 4 ? 2 : 3;

  return (
    <Section tone={tone}>
      <Stagger className="flex flex-col gap-6">
        {showLead ? (
          <StaggerItem>
            <ContentCard
              featured
              title={first.title}
              excerpt={first.excerpt}
              href={first.href}
              image={first.image}
              imageAlt={first.imageAlt}
              category={first.category}
              date={first.date}
              cta={readMore}
            />
          </StaggerItem>
        ) : null}

        {grid.length > 0 ? (
          <div className={`grid gap-6 ${gridColumns[columns]}`}>
            {grid.map((item) => (
              <StaggerItem key={item.id} className="h-full">
                <ContentCard
                  title={item.title}
                  excerpt={item.excerpt}
                  href={item.href}
                  image={item.image}
                  imageAlt={item.imageAlt}
                  category={item.category}
                  date={item.date}
                  cta={readMore}
                />
              </StaggerItem>
            ))}
          </div>
        ) : null}
      </Stagger>
    </Section>
  );
}

export default CollectionListing;
