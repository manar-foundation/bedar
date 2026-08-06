import { Quote } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   TESTIMONIAL — a quote card. Backs the `testimonials` collection
   (Dashboard spec §3.2).

   Semantics first: <figure> + <blockquote> + <figcaption>, so the
   attribution is programmatically tied to the quote instead of just
   sitting under it.

   The quote mark is `aria-hidden` decoration. It is a symmetrical
   glyph, so it needs no RTL mirroring — but it is placed with
   `self-start`, a logical property, so it sits at the reading-start
   corner in either direction.
   ================================================================ */

export function Testimonial({ quote, author, role, avatar, accent = false, className }) {
  return (
    <figure
      className={cn(
        'flex h-full flex-col gap-5 rounded-lg p-7',
        accent ? 'bg-brand-700 text-white' : 'border border-subtle bg-surface text-ink',
        className,
      )}
    >
      <Quote
        aria-hidden="true"
        className={cn('size-7 shrink-0 self-start', accent ? 'text-brand-200' : 'text-brand-400')}
      />

      <blockquote className="text-lg leading-relaxed">{quote}</blockquote>

      <figcaption className="mt-auto flex items-center gap-3">
        {avatar ? (
          <span className="size-11 shrink-0 overflow-hidden rounded-full bg-neutral-200">
            {avatar}
          </span>
        ) : null}
        <span className="flex flex-col">
          <span className="font-semibold">{author}</span>
          {role ? (
            <span className={cn('text-xs', accent ? 'text-brand-100/80' : 'text-ink-muted')}>
              {role}
            </span>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

export default Testimonial;
