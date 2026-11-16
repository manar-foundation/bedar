import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * The strip above the navbar. The whole bar is ONE link — a nested
 * button inside an anchor is invalid, and one tab stop is kinder than
 * two that go to the same place. The pill is a span that looks like
 * the primary CTA.
 *
 * Mint (`brand-200`) on dark ink is deliberately the odd one out: the
 * navbar and hero are dark, so a mint band is what makes the strip
 * read as an announcement. Height comes from `--bar-h`
 * (layout.css), which is also folded into `--nav-h`.
 */
export default function AnnouncementBar({ text, ctaLabel, href }) {
  return (
    <Link
      to={href}
      className="group flex h-(--bar-h) items-center justify-center gap-2 bg-brand-200 px-3 text-brand-950 md:px-4 no-underline focus-visible:outline-none focus-visible:shadow-focus md:gap-5"
    >
      <span className="min-w-0 flex-1 text-start text-[0.6875rem] font-medium leading-snug md:flex-none md:text-sm">{text}</span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-brand-950 underline decoration-1 underline-offset-4 md:text-sm">
        {ctaLabel}
        <ArrowLeft aria-hidden="true" className="hidden size-3.5 md:block transition-transform duration-(--dur-base) group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}
