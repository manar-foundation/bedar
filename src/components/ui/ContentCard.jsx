import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Spiral } from './Spiral.jsx';
import { cn } from '@utils/cn.js';
import { formatDate, toISODate } from '@utils/format.js';

/* ================================================================
   CONTENT CARD — an article, news item or program in a listing.

   RESTRUCTURED TO THE REFERENCE CARD
   ----------------------------------------------------------------
   The reference builds every collection card the same way: a media
   window with a 10px radius, its image scaling inside it on hover;
   the title as the link, changing colour rather than underlining;
   a category chip row; and a footer line that carries the meta and
   an arrow whose gap opens as the pointer arrives. That is the whole
   card language of the site, so it is expressed here once and every
   listing on every page inherits it.

   Its cards are borderless — image straight onto the page, text
   under it. That reads well on white. It does not survive on this
   site, which is one continuous dark surface with no colour change
   between a card and the page behind it: a borderless card there is
   not a card, it is a floating paragraph. So the chrome stays, and
   the reference's signature comes from INSET media instead — the
   frame sits in the card's padding, which is what makes its rounded
   corners visible at all.

   Things that stay true regardless of layout:

   • The CTA arrow is a plain <ArrowLeft>. In RTL "read more" points
     LEFT, so the left-pointing glyph is already correct and
     `.mirror-rtl` would reverse it (CLAUDE.md, icon rules).

   • The date goes through `formatDate`, which passes `ar-u-nu-latn`.
     A bare `Intl` call with the `ar` locale renders ١٥ يناير ٢٠٢٦
     and breaks the Western-digits brand rule.

   • With no image, the placeholder is the spiral watermark rather
     than a grey rectangle — the design system calls for the mark to
     carry empty media slots, and no collection item ships a cover
     until the dashboard uploads one.

   • `featured` turns the card on its side: media in one half, copy
     in the other, spanning the full grid width. Both the reference
     and this site lead a listing with a wider item, so the layout
     says what the ordering already meant.

   THE WHOLE CARD IS ONE LINK, NOT A CARD CONTAINING ONE
   ----------------------------------------------------------------
   The outer element is the <a>. Nesting the title in its own <a>
   inside a linked card produces two tab stops to the same URL and is
   invalid HTML besides; the title is styled to respond to the card's
   hover instead, which is the same effect with one target.
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
  featured = false,
  cta = 'اقرأ المزيد',
  className,
}) {
  const media = (
    <div
      className={cn(
        'media-frame shrink-0 bg-sunken',
        featured ? 'aspect-[16/10] lg:aspect-auto lg:h-full' : 'aspect-[16/10]',
      )}
    >
      {/* `image` is a cover URL (dashboard-uploaded, resolved from
          Supabase Storage) or a ready-made node. A plain string
          renders a real <img> that covers the frame; anything falsy
          falls back to the spiral watermark, per the design system. */}
      {typeof image === 'string' && image ? (
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="media-zoom size-full object-cover"
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
            <span className="media-zoom absolute inset-0 flex items-center justify-center">
              <Spiral className={cn('text-brand-300/80', featured ? 'size-20' : 'size-14')} />
            </span>
          </>
        ))
      )}
    </div>
  );

  return (
    <Link
      to={href}
      className={cn(
        'band-tile group flex h-full flex-col rounded-lg border border-subtle bg-surface p-3 text-ink no-underline',
        'focus-visible:outline-none focus-visible:shadow-focus',
        featured && 'lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-3',
        className,
      )}
    >
      {media}

      <div
        className={cn(
          'flex flex-1 flex-col gap-3',
          featured ? 'justify-center p-5 sm:p-7 lg:p-9' : 'px-3 pb-3 pt-5',
        )}
      >
        {/* The reference runs a row of chips above its card titles.
            One category per item here, so it is one chip — the row
            shape is kept so a second taxonomy can join it later
            without the card changing. */}
        {category ? (
          <span className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-brand-300/25 bg-brand-300/10 px-3 py-1 text-xs font-semibold text-brand-200">
              {category}
            </span>
          </span>
        ) : null}

        <h3
          className={cn(
            'font-semibold text-ink transition-colors duration-(--dur-base) ease-(--ease-standard) group-hover:text-brand-200',
            featured ? 'text-xl lg:text-2xl' : 'text-lg',
          )}
        >
          {title}
        </h3>

        {excerpt ? (
          <p
            className={cn(
              'text-base leading-relaxed text-ink-secondary',
              featured ? 'line-clamp-4' : 'line-clamp-3',
            )}
          >
            {excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-subtle pt-4">
          {date ? (
            <time dateTime={toISODate(date)} className="text-xs text-ink-muted">
              {formatDate(date)}
            </time>
          ) : meta ? (
            <span className="text-xs text-ink-muted">{meta}</span>
          ) : (
            <span />
          )}

          <span className="arrow-link text-sm font-semibold text-brand-200">
            {cta}
            <ArrowLeft className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ContentCard;
