import { ArrowLeft } from 'lucide-react';

import { Card } from './Card.jsx';
import { Spiral } from './Spiral.jsx';
import { cn } from '@utils/cn.js';
import { formatDate, toISODate } from '@utils/format.js';

/* ================================================================
   CONTENT CARD — an article, news item or program in a listing.

   Notes that are easy to get wrong here:

   • The CTA arrow is a plain <ArrowLeft>. In RTL "read more" points
     LEFT, so the left-pointing glyph is already correct and
     `.mirror-rtl` would reverse it (CLAUDE.md, icon rules).

   • The date goes through `formatDate`, which passes
     `ar-u-nu-latn`. A bare `Intl` call with the `ar` locale renders
     ١٥ يناير ٢٠٢٦ and breaks the Western-digits brand rule.

   • With no image, the placeholder is the spiral watermark rather
     than a grey rectangle — the design system calls for the mark to
     carry empty media slots.
   ================================================================ */

export function ContentCard({
  title,
  excerpt,
  href,
  image,
  imageAlt = '',
  category,
  date,
  meta,
  cta = 'اقرأ المزيد',
  className,
}) {
  return (
    <Card
      to={href}
      interactive
      padded={false}
      elevation={0}
      className={cn('group h-full overflow-hidden', className)}
    >
      {/* The empty media slot used to be a flat grey rectangle, and a
          grid of three of them was the coldest thing on the page.
          Now it is a teal wash with the mark floating in it, lit from
          the inline-start corner. Both tints are semantic tokens, so
          the wash re-themes with the rest of the site instead of
          staying pale on a dark theme. */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-sunken">
        {/* `image` is a cover URL (dashboard-uploaded, resolved from
            Supabase Storage) or a ready-made node. A plain string
            renders a real <img> that covers the slot; anything falsy
            falls back to the spiral watermark, per the design system. */}
        {typeof image === 'string' && image ? (
          <img
            src={image}
            alt={imageAlt}
            loading="lazy"
            className="size-full object-cover transition-transform duration-(--dur-slow) ease-(--ease-standard) group-hover:scale-105"
          />
        ) : (
          (image ?? (
            <>
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_0%,var(--media-wash-a),transparent_64%)]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(95%_95%_at_10%_100%,var(--media-wash-b),transparent_60%)]"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <Spiral className="size-14 text-brand-300/80 transition-transform duration-(--dur-slow) ease-(--ease-standard) group-hover:scale-110" />
              </span>
            </>
          ))
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {category ? <span className="text-xs font-semibold text-brand-600">{category}</span> : null}

        <h3 className="text-lg font-semibold text-ink">{title}</h3>

        {excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-secondary">{excerpt}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {date ? (
            <time dateTime={toISODate(date)} className="text-xs text-ink-muted">
              {formatDate(date)}
            </time>
          ) : meta ? (
            <span className="text-xs text-ink-muted">{meta}</span>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
            {cta}
            <ArrowLeft className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Card>
  );
}

export default ContentCard;
