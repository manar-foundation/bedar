import { useCountUp } from '@hooks/useCountUp.js';
import { cn } from '@utils/cn.js';
import { formatNumber } from '@utils/format.js';

/* ================================================================
   STAT BAND — the impact numbers ("40+ مبادرة", "منذ 2019", "500").

   One of the four surfaces allowed to use the dark treatment.

   Two details the numbers depend on:

   • `formatNumber` (ar-u-nu-latn) — Western digits, always, even
     inside Arabic. A bare Intl call with `ar` gives ٤٠ and breaks
     the brand rule.

   • `grouped={false}` for years. 2019 must not render as "2,019",
     and a year should not count up from zero either, so
     `countUp={false}` is the right pairing for it.

   Each stat is its own component because `useCountUp` is a hook and
   has to be called unconditionally, once per number.
   ================================================================ */

function Stat({ value, suffix, prefix, label, countUp = true, grouped = true, tone }) {
  const [ref, current] = useCountUp(countUp ? value : 0);
  const shown = countUp ? current : value;
  const inverse = tone === 'inverse';

  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <div
        ref={ref}
        className={cn(
          'flex items-baseline gap-0.5 text-4xl font-bold tabular-nums lg:text-5xl',
          inverse ? 'text-brand-200' : 'text-brand-600',
        )}
      >
        {prefix ? <span>{prefix}</span> : null}
        {/* .ltr-run keeps the digits in logical order next to the
            Arabic suffix without breaking the flex baseline. */}
        <span className="ltr-run">{grouped ? formatNumber(shown) : String(shown)}</span>
        {suffix ? <span>{suffix}</span> : null}
      </div>
      <p className={cn('text-sm', inverse ? 'text-brand-100/80' : 'text-ink-secondary')}>{label}</p>
    </li>
  );
}

export function StatBand({ stats = [], tone = 'dark', title, className }) {
  const dark = tone === 'dark';

  return (
    <section className={cn(dark ? 'surface-dark' : 'bg-sunken', className)}>
      <div className="container-page py-16 lg:py-20">
        {title ? (
          <h2
            className={cn(
              'mb-12 text-center text-2xl font-bold md:text-3xl',
              dark ? 'text-white' : 'text-ink',
            )}
          >
            {title}
          </h2>
        ) : null}

        <ul className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {stats.map((stat) => (
            <Stat key={stat.id ?? stat.label} {...stat} tone={dark ? 'inverse' : 'default'} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default StatBand;
