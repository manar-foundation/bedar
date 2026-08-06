import { useState } from 'react';

import { ContentCard, Hero, Tabs } from '@components/ui';
import { Reveal } from '@components/motion/Reveal.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useSeo } from '@hooks/useSeo.js';
import { programsPage } from '@content/pages.js';

/**
 * البرامج — the programs listing.
 *
 * The live site filters with "عرض الكل / البرامج الحالية / البرامج
 * السابقة". Those are real tabs here (`<Tabs>` implements the ARIA
 * pattern with RTL-correct arrow keys), and the filter runs against
 * `program.status` — so a program published from the dashboard as
 * "current" lands in the right tab with no code change.
 */
export default function Programs() {
  const { collections } = useContent();
  const [filter, setFilter] = useState('all');
  useSeo(programsPage.seo);

  const visible =
    filter === 'all'
      ? collections.programs
      : collections.programs.filter((program) => program.status === filter);

  return (
    <>
      <Hero
        eyebrow={programsPage.hero.eyebrow}
        title={programsPage.hero.title}
        showSpiral={false}
      />

      <section className="container-page section-y">
        <div className="mb-10 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-ink-secondary">{programsPage.filters.label}</h2>
          <Tabs
            tabs={programsPage.filters.options}
            value={filter}
            onChange={setFilter}
            idPrefix="programs-filter"
          />
        </div>

        <div
          id={`panel-${filter}`}
          role="tabpanel"
          aria-labelledby={`programs-filter-${filter}`}
          tabIndex={-1}
        >
          {visible.length === 0 ? (
            <p className="py-12 text-center text-ink-muted">{programsPage.empty}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((program, index) => (
                <Reveal key={program.id} delay={index % 3}>
                  <ContentCard
                    title={program.title}
                    excerpt={program.excerpt}
                    href={program.href}
                    image={program.image}
                    imageAlt={program.imageAlt}
                    category={program.category}
                    date={program.date}
                    cta="إقرأ المزيد"
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
