import { cn } from '@utils/cn.js';

/* ================================================================
   STICKY SPLIT — an editorial two-column spread whose heading half
   stays pinned while the content half scrolls past it.

   This is On Consult's `gird-sticky-halves`, and it is the single
   device that most changes how a long section reads. The Bedar
   pages already had two-column blocks — heading on one side, five
   paragraphs on the other — but both halves scrolled together, so
   by the time the reader reached the last paragraph the heading
   that framed it was long gone. Pinning the heading keeps the
   section's subject on screen for as long as the section is.

   It is only sticky from `lg` up (`.sticky-col`, layout.css). Below
   that the halves stack, and a sticky heading would sit on top of
   its own body copy.

   `ratio` names the split rather than taking a raw class, so a page
   cannot invent a seventh column ratio. Every one is written
   ASIDE / CONTENT, in DOM order:

     'narrow'  0.8 / 1.2   — a short heading against a long read
     'even'    1 / 1       — two comparable columns
     'wide'    1.15 / 0.85 — a long heading against a short list
     'roomy'   0.68 / 1.32 — a four-word heading against a list that
                             needs the room. This is the strategic
                             goals and the adopted definition: at
                             'narrow' the heading was holding 448px to
                             say "الأهداف الاستراتيجية" while six
                             goals crowded into what was left, which
                             is the cramping the brief flagged.

   A page that wants the content column wider asks for a wider RATIO.
   It must never reorder the columns visually to get there: the aside
   is first in the DOM because it is first in the reading order, and
   an `order-*` utility would leave a keyboard user tabbing through
   the page in an order that no longer matches what they see.
   ================================================================ */

const ratios = {
  narrow: 'lg:grid-cols-[0.8fr_1.2fr]',
  even: 'lg:grid-cols-2',
  wide: 'lg:grid-cols-[1.15fr_0.85fr]',
  roomy: 'lg:grid-cols-[0.68fr_1.32fr]',
};

export function StickySplit({
  /** The pinned half — usually a <SectionHeading layout="aside">. */
  aside,
  /** Set false to keep the aside in flow (long asides, short bodies). */
  sticky = true,
  ratio = 'narrow',
  className,
  asideClassName,
  children,
}) {
  return (
    <div className={cn('grid gap-10 lg:gap-16', ratios[ratio] ?? ratios.narrow, className)}>
      <div className={cn(sticky && 'sticky-col', asideClassName)}>{aside}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default StickySplit;
