import { useCountUp } from '@hooks/useCountUp.js';
import { Reveal } from '@components/motion/Reveal.jsx';
import { SectionHeading } from './SectionHeading.jsx';
import { cn } from '@utils/cn.js';
import { formatNumber } from '@utils/format.js';

/* ================================================================
   STAT BAND — the impact numbers ("120 مشروع", "20M", "24K").

   TILES, NOT A ROW OF LOOSE NUMERALS
   ----------------------------------------------------------------
   These used to be four bare numbers floating in a grid with their
   captions under them. On a page that is one continuous dark
   surface, that reads as a data dump: nothing frames a number, so
   the four of them merge into a single band of text. On Consult's
   `tile-stat-dark` is the fix — each number gets a translucent
   bordered tile, and the grid then carries the rhythm instead of the
   type having to. `.stat-tile` (layout.css) is that treatment.

   The tile is translucent rather than filled so the page's fixed
   background still shows through and the band stays part of the one
   surface the site is built on.

   TWO DETAILS THE NUMBERS DEPEND ON
   ----------------------------------------------------------------
   • `formatNumber` (ar-u-nu-latn) — Western digits, always, even
     inside Arabic. A bare Intl call with `ar` gives ٤٠ and breaks
     the brand rule.

   • `grouped={false}` for years. 2019 must not render as "2,019",
     and a year should not count up from zero either, so
     `countUp={false}` is the right pairing for it.

   Each stat is its own component because `useCountUp` is a hook and
   has to be called unconditionally, once per number.
   ================================================================ */

function Stat({ value, suffix, prefix, label, countUp = true, grouped = true, tone, index = 0 }) {
  const [ref, current] = useCountUp(countUp ? value : 0);
  const shown = countUp ? current : value;
  const inverse = tone === 'inverse';

  return (
    <Reveal
      as="li"
      delay={index % 4}
      className="stat-tile flex flex-col items-center justify-center gap-3 px-6 py-9 text-center sm:px-8 sm:py-10"
    >
      <div
        ref={ref}
        className={cn(
          'flex items-baseline gap-0.5 text-4xl font-bold tabular-nums lg:text-5xl',
          inverse ? 'text-brand-200' : 'text-brand-600 dark:text-brand-200',
        )}
      >
        {/* ONE `.ltr-run` around the whole figure — prefix, digits and
            suffix together. A suffix left outside it becomes its own
            RTL flex item and lands to the LEFT of the digits, so
            `20` + `M` rendered as `M20`. Isolated as one run it reads
            `20M`. Same fix, same reason, in `StatRow`. */}
        <span className="ltr-run">
          {prefix}
          {grouped ? formatNumber(shown) : String(shown)}
          {suffix}
        </span>
      </div>
      <p
        className={cn(
          'text-sm leading-relaxed',
          inverse ? 'text-brand-100/80' : 'text-ink-secondary',
        )}
      >
        {label}
      </p>
    </Reveal>
  );
}

export function StatBand({
  stats = [],
  tone = 'dark',
  title,
  eyebrow,
  lede,
  /** 'center' keeps the old centred header; 'start' opens the band
      with a start-aligned one, for a page that already leans left. */
  align = 'center',
  className,
}) {
  const dark = tone === 'dark';

  return (
    <section className={cn('relative', dark ? 'surface-dark' : 'bg-sunken', className)}>
      <div className="container-page section-y">
        {title || eyebrow ? (
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            lede={lede}
            align={align}
            tone={dark ? 'inverse' : 'default'}
            className="mb-12"
          />
        ) : null}

        {/* Two columns on a phone rather than one: these are short
            numeric tiles, and a single-column stack of four makes the
            band twice as tall as the section it belongs to. */}
        <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Stat
              key={stat.id ?? stat.label}
              {...stat}
              index={index}
              tone={dark ? 'inverse' : 'default'}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default StatBand;
