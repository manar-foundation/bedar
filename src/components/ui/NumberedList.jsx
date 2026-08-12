import { Reveal } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';
import { formatNumber } from '@utils/format.js';

/* ================================================================
   NUMBERED LIST — the reference layout's "Our mission" block:
   `01.` in the accent colour, a title beside it, its paragraph
   under, and a hairline between rows.

   WHY THIS IS NOT AN ACCORDION
   ----------------------------------------------------------------
   The reference builds the same block as a one-column accordion, so
   three of its four paragraphs are hidden until clicked. That works
   for its content — four restatements of one mission sentence, where
   the reader loses nothing by never opening three of them. It does
   not work here: the rows this backs are the audience segments and
   the definition elements, each of which says something different,
   and the brief's first constraint is that no existing content
   disappears. Same visual rhythm, nothing hidden.

   `<ProcessSteps>` is still the right component for content that is
   genuinely ORDERED (a sequence of stages). This one numbers rows
   that are merely enumerated — the numbers are a counting device,
   which is exactly what the reference uses them for.

   Numbers go through `formatNumber` and are zero-padded to two
   digits, matching the reference's `01.` and the Western-digits rule.
   ================================================================ */

export function NumberedList({
  items = [],
  /** `title` + `description` keys, when the data names them otherwise. */
  titleKey = 'title',
  descriptionKey = 'description',
  className,
}) {
  if (items.length === 0) return null;

  return (
    <ol className={cn('flex flex-col', className)}>
      {items.map((item, index) => {
        // Plain strings are a valid row — the definition elements on
        // /social-entrepreneurship are an array of sentences with no
        // title of their own.
        const isText = typeof item === 'string';
        const title = isText ? null : item[titleKey];
        const description = isText ? item : item[descriptionKey];

        return (
          <Reveal
            as="li"
            key={isText ? item.slice(0, 24) : (item.id ?? title)}
            delay={index % 4}
            className={cn(
              'group flex flex-col gap-3 py-7 sm:flex-row sm:gap-8 sm:py-8',
              // A rule between rows, never above the first or below
              // the last — the section's own edges do that job.
              //
              // 2px on a mint tint rather than the 1px `border-subtle`
              // hairline. `--border-subtle` is #1b2e31 in dark, which
              // on this page's near-black surface is a rule you have
              // to look for; the client asked for the segments to read
              // as separated at a glance. Tinted rather than merely
              // brighter grey, so it belongs to the same palette as
              // the numbers it separates.
              index > 0 && 'border-t-2 border-brand-300/25',
            )}
          >
            {/* The counter, at display scale. It was `text-lg` — the
                same size as the row's own title — so it read as a
                prefix to the heading rather than as the enumeration.
                At 3xl/4xl and `font-extrabold` it is the row's anchor,
                which is what the numbering is for. The column widens
                with it so two digits never crowd the title. */}
            <span
              aria-hidden="true"
              className="shrink-0 text-3xl font-extrabold leading-none tabular-nums text-brand-300/80 transition-colors duration-(--dur-base) ease-(--ease-standard) group-hover:text-brand-200 sm:w-24 sm:text-4xl lg:text-5xl"
            >
              <span className="ltr-run">{formatNumber(index + 1).padStart(2, '0')}.</span>
            </span>

            <div className="flex flex-col gap-2.5">
              {title ? (
                <h3 className="text-lg font-semibold text-ink transition-colors duration-(--dur-base) ease-(--ease-standard) group-hover:text-brand-200 sm:text-xl">
                  {title}
                </h3>
              ) : null}

              {description ? (
                <p className="text-base leading-relaxed text-ink-secondary">{description}</p>
              ) : null}
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}

export default NumberedList;
