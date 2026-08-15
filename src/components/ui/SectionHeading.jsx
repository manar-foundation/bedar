import { Reveal } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   SECTION HEADING — eyebrow / title / lede, the block that opens
   almost every marketing section.

   THREE LAYOUTS, NOT ONE
   ----------------------------------------------------------------
   The site used to centre every heading and stack a grid under it,
   nine sections in a row. That is the single biggest reason the page
   read as a template: the eye lands in the same place every screen
   and the whole page has one rhythm. Both reference layouts vary it,
   and the variation is structural rather than decorative:

   • `layout="stack"` — the classic centred (or start-aligned) block.
     Still the right choice for a band whose content is symmetrical,
     like a 3-up grid of equal cards.

   • `layout="split"` — heading on the inline-start, `actions` on the
     inline-end, baseline-aligned, with a hairline under both. This
     is Embrace Center's `title-section-bottom` and On Consult's
     `flex-heading-cta`. It is what a LISTING section wants: the
     "see all" link belongs beside the title, not orphaned at the
     bottom of the grid.

   • `layout="aside"` — a start-aligned block sized to sit in the
     narrow half of a two-column spread (paired with `<StickySplit>`).
     Narrower measure, no centring, actions stacked underneath.

   `size` is a separate axis because a statement section wants the
   same component at display scale — On Consult's `big-text` band is
   an eyebrow plus one very large sentence, and building that from a
   raw <h2> would fork the eyebrow styling.

   The eyebrow is NOT uppercased. The design-system source applies
   `text-transform: uppercase`, which is a no-op on Arabic and only
   ever shouts at the occasional Latin word mixed into it.

   `tone="inverse"` is for bands that carry their own dark treatment.
   ================================================================ */

/* The reference runs its section titles very large and very tight
   (48px at -2.2px tracking, 1.0 leading). Latin display faces take
   that; Readex Pro setting Arabic does not — at 1.0 the descenders of
   one line touch the dots of the next. So the SIZES move up to match
   the reference's presence and the LEADING stays at 1.25–1.3, which
   is the smallest Arabic can hold at this weight. */
const titleSizes = {
  sm: 'text-xl font-bold leading-snug md:text-2xl',
  base: 'text-[1.75rem] font-bold leading-[1.3] tracking-tight md:text-4xl lg:text-[2.625rem]',
  lg: 'text-3xl font-bold leading-[1.25] tracking-tight md:text-[2.75rem] lg:text-[3.25rem]',
  display: 'text-[2rem] font-bold leading-[1.2] tracking-tight md:text-5xl lg:text-[3.5rem]',
};

export function SectionHeading({
  eyebrow,
  title,
  lede,
  /** Buttons / links. In `split` they sit opposite the title. */
  actions,
  align = 'start',
  layout = 'stack',
  size = 'base',
  tone = 'default',
  /** Hairline under the header. On by default in `split`. */
  rule,
  as: Tag = 'h2',
  className,
  children,
}) {
  const inverse = tone === 'inverse';
  const split = layout === 'split';
  const aside = layout === 'aside';
  const centered = align === 'center' && !split && !aside;
  const showRule = rule ?? split;

  const heading = (
    <div
      className={cn(
        'flex flex-col gap-4',
        // A heading's measure is what makes it read as a heading
        // rather than as a paragraph in a bigger font. `split` gives
        // the title column ~60% of the container (Embrace Center's
        // 750/1250); `aside` is the narrow half of a spread.
        split ? 'max-w-2xl' : aside ? 'max-w-md' : 'max-w-2xl',
        centered && 'mx-auto items-center text-center',
        !centered && 'text-start',
      )}
    >
      {eyebrow ? (
        <Reveal
          as="p"
          className={cn(
            // The reference wraps every section label in slashes —
            // `/About our center/`. It is the one piece of its type
            // styling that survives translation to Arabic intact: the
            // slash is direction-neutral, so the pair simply brackets
            // the words in both modes without a mirrored variant.
            // The marks are decorative, hence aria-hidden — a screen
            // reader should hear the label, not two solidi.
            'inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide',
            centered && 'justify-center',
            inverse ? 'text-brand-200' : 'text-accent-600 dark:text-brand-200',
          )}
        >
          <span aria-hidden="true" className="opacity-60">
            /
          </span>
          {eyebrow}
          <span aria-hidden="true" className="opacity-60">
            /
          </span>
        </Reveal>
      ) : null}

      {title ? (
        <Reveal delay={eyebrow ? 1 : 0}>
          {/* The title lives in a wrapper that hugs its own width, so a
              soft radial spotlight (`.section-title-glow`, animations
              .css) can pool behind the words — centred in both
              directions — and the type always paints on top of it. The
              glow is decorative, hence aria-hidden. */}
          <div className="section-title-wrap">
            <span aria-hidden="true" className="section-title-glow" />
            <Tag
              className={cn(
                'relative z-[1]',
                titleSizes[size] ?? titleSizes.base,
                inverse ? 'text-white' : 'text-ink',
              )}
            >
              {title}
            </Tag>
          </div>
        </Reveal>
      ) : null}

      {lede ? (
        <Reveal
          as="p"
          delay={2}
          className={cn(
            'text-base leading-relaxed',
            size === 'display' && 'text-lg',
            inverse ? 'text-brand-100/80' : 'text-ink-secondary',
          )}
        >
          {lede}
        </Reveal>
      ) : null}

      {children}
    </div>
  );

  if (!split) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {heading}

        {actions ? (
          <Reveal
            delay={3}
            className={cn('mt-2 flex flex-wrap gap-3', centered && 'justify-center')}
          >
            {actions}
          </Reveal>
        ) : null}

        {showRule ? <Rule className="mt-2" /> : null}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      {/* `items-end` rather than `items-center`: the CTA lines up with
          the LAST line of the title, which is the baseline the eye
          reads the pair against. Both references do this. */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        {heading}

        {actions ? (
          <Reveal delay={3} className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </Reveal>
        ) : null}
      </div>

      {showRule ? <Rule /> : null}
    </div>
  );
}

/** The fading hairline under a section header. Decorative. */
function Rule({ className }) {
  return <span aria-hidden="true" className={cn('rule-fade block w-full', className)} />;
}

export default SectionHeading;
