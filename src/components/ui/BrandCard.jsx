import { Spiral } from './Spiral.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   BRAND CARD — the dashboard welcome-band look, on the marketing
   site (brief §9). A deep-teal gradient panel lit from one corner,
   with the brand spiral set large and faint as a watermark.

   `variant="b"` swaps the glow to the opposite corner and shifts its
   hue, so a row of these does not read as one panel repeated — the
   "second version, same aesthetic" the brief asked for.

   Composition is flexible so the same card carries the four places it
   is used: an optional icon tile, an eyebrow, the title, a paragraph,
   and any extra `children`. `as` sets the heading level so the
   document outline stays correct per page.
   ================================================================ */

export function BrandCard({
  eyebrow,
  title,
  description,
  icon,
  variant = 'a',
  as: Heading = 'h3',
  interactive = false,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'brand-card relative flex h-full flex-col gap-3 rounded-xl p-8 text-start',
        variant === 'b' && 'brand-card-alt',
        interactive && 'lift-hover',
        className,
      )}
    >
      {/* The ownable mark as a watermark, clipped by the card's own
          overflow — the same treatment the dashboard band uses. */}
      <Spiral
        aria-hidden="true"
        className="pointer-events-none absolute -top-5 size-28 text-brand-200/10 end-4"
      />

      {icon ? (
        <span className="relative mb-1 inline-flex size-14 items-center justify-center rounded-2xl bg-white/10 text-brand-200 ring-1 ring-white/10 [&_svg]:size-7">
          {icon}
        </span>
      ) : null}

      {eyebrow ? (
        <p className="relative text-xs font-semibold tracking-wide text-brand-200">{eyebrow}</p>
      ) : null}

      {title ? <Heading className="relative text-xl font-bold text-white">{title}</Heading> : null}

      {description ? (
        <p className="relative text-base leading-relaxed text-brand-100/80">{description}</p>
      ) : null}

      {children}
    </div>
  );
}

export default BrandCard;
