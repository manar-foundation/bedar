import { useCountUp } from '@hooks/useCountUp.js';
import { Reveal } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';
import { formatNumber } from '@utils/format.js';

/* ================================================================
   STAT ROW — the impact figures as one ruled row.

   This is the reference layout's `.info-big`: four numbers across
   the container, separated by hairlines, with no box around any of
   them. `<StatBand>` (the tiled version) still exists and still
   backs the pages that open with a full band of numbers; this is the
   inline shape, for a row that sits INSIDE another section — under a
   split header, at the foot of a long read — where four bordered
   tiles would add a second grid to a band that already has one.

   The rules come from `.stat-row` (layout.css) rather than from a
   border utility here, because which child loses its rule depends on
   the breakpoint: 2-up on mobile drops it on every odd child, 4-up
   on desktop drops it only on the first. That is three selectors, so
   it belongs in CSS, not in a className string.

   `formatNumber` is not optional. It passes `ar-u-nu-latn`, and a
   bare Intl call with the `ar` locale renders ١٢٠ — which breaks the
   Western-digits brand rule on the most-read number on the site.
   ================================================================ */

function Stat({ value, suffix, prefix, label, countUp = true, grouped = true, index = 0 }) {
  const [ref, current] = useCountUp(countUp ? value : 0);
  const shown = countUp ? current : value;

  return (
    <Reveal as="li" delay={index % 4} className="flex flex-col gap-2">
      <span
        ref={ref}
        className="flex items-baseline text-4xl font-bold tabular-nums text-brand-200 lg:text-5xl"
      >
        {prefix ? <span>{prefix}</span> : null}
        {/* .ltr-run keeps the digits in logical order beside the
            Arabic label without breaking the flex baseline. */}
        <span className="ltr-run">{grouped ? formatNumber(shown) : String(shown)}</span>
        {suffix ? <span>{suffix}</span> : null}
      </span>

      <span className="text-sm leading-relaxed text-ink-secondary">{label}</span>
    </Reveal>
  );
}

export function StatRow({ stats = [], className }) {
  if (stats.length === 0) return null;

  return (
    <ul className={cn('stat-row', className)}>
      {stats.map((stat, index) => (
        <Stat key={stat.id ?? stat.label} {...stat} index={index} />
      ))}
    </ul>
  );
}

export default StatRow;
