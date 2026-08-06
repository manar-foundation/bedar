import { Card } from './Card.jsx';
import { SectionHeading } from './SectionHeading.jsx';
import { Reveal } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   FEATURE GRID — the "what we do" section. Backs the services and
   programs listings.

   The design-system source hardcodes
   `gridTemplateColumns: repeat(3, 1fr)` with no breakpoints, which
   produces three 100px columns on a phone. Here the column count is
   a responsive class chosen from a lookup, so the grid is single
   column on mobile and only reaches its full width on `lg`.

   The lookup exists because Tailwind scans source text: a template
   literal like `lg:grid-cols-${columns}` never appears in the build
   output and the class is silently dropped.
   ================================================================ */

const columnClasses = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function FeatureGrid({
  eyebrow,
  title,
  lede,
  features = [],
  columns = 3,
  align = 'center',
  className,
}) {
  return (
    <section className={cn('container-page section-y', className)}>
      {eyebrow || title || lede ? (
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          lede={lede}
          align={align}
          className="mb-12"
        />
      ) : null}

      <div className={cn('grid gap-6', columnClasses[columns] ?? columnClasses[3])}>
        {features.map((feature, index) => (
          <Reveal key={feature.id ?? feature.title} delay={index % columns}>
            <Card
              elevation={0}
              interactive={Boolean(feature.href)}
              to={feature.href}
              className="h-full gap-3 p-7"
            >
              {feature.icon ? (
                <span className="mb-1 inline-flex size-12 items-center justify-center rounded-md bg-brand-50 text-brand-600 [&_svg]:size-6">
                  {feature.icon}
                </span>
              ) : null}
              <h3 className="text-xl font-semibold text-ink">{feature.title}</h3>
              {feature.description ? (
                <p className="text-sm leading-relaxed text-ink-secondary">{feature.description}</p>
              ) : null}
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default FeatureGrid;
