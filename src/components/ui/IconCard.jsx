import { cn } from '@utils/cn.js';

/* ================================================================
   ICON CARD — an icon in a tinted tile, a title, a paragraph. It is
   the unit that fills every "what we offer / what we value / where
   we work" grid on the site, so it is one component rather than the
   same twenty lines of markup pasted into four pages.

   It replaces four separate hand-built grids: the services cards on
   the homepage and the services page, the values grid on /about, and
   the sectors grid on /social-entrepreneurship. They were visually
   different for no reason other than having been written at
   different times — the brief's requirement is one card system
   across every interior page.

   WHY THE TEXT IS CLAMPED (brief §1: "the very long containers")
   ----------------------------------------------------------------
   The seven service descriptions run from 220 to 366 characters and
   the titles from 16 to 60. In a four-column grid that is roughly a
   nine-line paragraph next to a fifteen-line one, and because every
   card stretches to the tallest in its row, the six short cards each
   ended up with a hand's width of dead space under their last line.
   That — not the styling — is what made the band look unbalanced.

   The copy is NOT edited: the brief says to preserve the content and
   the full text is what `/services` renders. The CARD is what gets
   normalised, with `line-clamp`, so:

     • the full string stays in the DOM and in the accessibility tree
       — a screen reader reads every word,
     • `title` carries it as a native tooltip,
     • `/services` shows it in full, which is what that page is for.

   `titleLines` reserves two lines even for a one-line title, so the
   paragraphs of every card in a row start on the same baseline. That
   floor is the single change that makes the grid read as a system
   rather than as seven cards that happen to be adjacent.

   THE HOVER IS A CONTENT SWAP (ported from the reference)
   ----------------------------------------------------------------
   Read from the reference template's own Webflow IX2 data
   (`embrace-center-wcopilot.webflow.io`, `.service-list-item`): its
   card hover is not a lift. Two layers trade places vertically —

     resting layer   moves DOWN 80px and fades to 0 over 500ms
     incoming layer  rises from +30px to 0 and fades in over ~260ms
     the surface     shifts colour underneath both

   That is the pattern here, at Bedar's scale (the resting layer
   travels 24px, not 80 — 80px on a 311px card throws the copy clean
   out of the frame before it has faded, which reads as a glitch on
   the reference's own taller cards too).

   It earns its place twice over: it is the reference's card
   behaviour, and it is what makes the paragraph clamp honest. The
   resting face shows the clamped summary; hovering or focusing the
   card swaps it for the FULL description. Nothing is hidden from a
   pointer any more, and nothing was ever hidden from a screen reader
   — the incoming layer is the same text node, not a duplicate.

   Everything else still moves, all composited (transform / opacity /
   colour — no layout property, so a grid of twelve costs nothing):

     the top edge  an accent line wipes in from the reading edge
     the bloom     a teal glow grows from the reading-start corner
     the icon tile fills with mint, lifts, tilts 4°

   `origin-right` with an `ltr:origin-left` counterpart, because
   `transform-origin` is physical: a rule that scales from the left in
   RTL grows away from the text it belongs to.

   `compact` drops the paragraph size and padding for a dense grid —
   the twelve sectors on /social-entrepreneurship are labels, not
   descriptions, and at full size they made a wall four screens tall.
   ================================================================ */

/* Tailwind scans source text for class names, so the clamp cannot be
   interpolated (`line-clamp-${lines}` generates nothing). Spelled out,
   which also caps the prop to values the design actually uses. */
const CLAMP = {
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

export function IconCard({
  icon,
  title,
  description,
  as: Heading = 'h3',
  compact = false,
  /** Max lines for the paragraph. `null` disables the clamp. */
  lines = 4,
  /** Lines reserved for the title, so paragraphs align across a row. */
  titleLines = 2,
  className,
}) {
  const clamp = compact ? null : CLAMP[lines];
  // Is there a second face to swap TO on hover? Only clamped cards
  // render one. This one flag now gates BOTH the `swap-rest` class and
  // the `swap-in` element, so they can never disagree — which is the
  // bug it fixes: `swap-rest` fades the resting face to 0 on hover,
  // and a card that carried that class WITHOUT a `swap-in` behind it
  // (the compact sector tiles — a label, nothing held back) simply
  // emptied itself when you pointed at it. No swap, no fade.
  const hasSwap = Boolean(description && clamp);

  return (
    <div
      className={cn(
        'band-tile group relative flex h-full flex-col overflow-hidden rounded-xl border border-subtle bg-surface',
        compact ? 'gap-2 p-5' : 'gap-3 p-7',
        className,
      )}
    >
      {/* The accent line along the top edge, wiping in from the
          reading edge. It is the card's clearest "this is
          interactive" signal and costs one scaled pseudo-element. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px origin-right scale-x-0 bg-gradient-to-l from-brand-300/0 via-brand-300/70 to-brand-300/0 transition-transform duration-(--dur-slow) ease-(--ease-standard) group-hover:scale-x-100 ltr:origin-left"
      />

      {/* A teal bloom growing from the reading-start corner. Depth
          without moving a single character of the copy. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -start-20 size-48 rounded-full bg-brand-400/20 opacity-0 blur-2xl transition-opacity duration-(--dur-slow) ease-(--ease-standard) group-hover:opacity-100"
      />

      {/* ── The resting face ───────────────────────────────────
             Icon, title and the clamped summary, as ONE layer. The
             reference swaps its whole card face rather than just the
             paragraph, and that is what makes the room: with the icon
             tile leaving too, the incoming description gets the card's
             full padding box (266px here) instead of the 207px left
             under a title that stayed put. Three of the seven service
             descriptions do not fit in 207px and were being clipped. */}
      <div
        className={cn(
          'relative flex flex-1 flex-col',
          hasSwap && 'swap-rest',
          compact ? 'gap-2' : 'gap-3',
        )}
      >
        {icon ? (
          <span
            className={cn(
              'relative mb-1 inline-flex shrink-0 items-center justify-center rounded-2xl bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring',
              'transition-[transform,background-color,color,box-shadow] duration-(--dur-base) ease-(--ease-standard)',
              'group-hover:-translate-y-1 group-hover:rotate-[-4deg] group-hover:bg-brand-300 group-hover:text-brand-950 group-hover:shadow-e2',
              compact
                ? 'size-11 [&_svg]:size-5.5'
                : 'size-14 [&_svg]:size-7 group-hover:[&_svg]:scale-110',
              '[&_svg]:transition-transform [&_svg]:duration-(--dur-base)',
            )}
          >
            {icon}
          </span>
        ) : null}

        {title ? (
          <Heading
            // `title` so the full string is one hover away wherever the
            // clamp bites. Harmless on the cards that do not clamp.
            title={typeof title === 'string' ? title : undefined}
            className={cn(
              'relative font-semibold text-ink',
              compact ? 'text-base' : 'text-[1.0625rem] leading-snug',
            )}
          >
            <span
              className={cn(
                'block',
                // `lh` is the element's own line box, so the floor
                // tracks the type ramp instead of being a magic rem
                // that drifts the moment the size changes.
                !compact && 'line-clamp-3',
              )}
              style={!compact ? { minHeight: `${titleLines}lh` } : undefined}
            >
              {title}
            </span>
            <span
              aria-hidden="true"
              className="mt-1.5 block h-0.5 w-10 origin-right scale-x-0 rounded-full bg-brand-300 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:scale-x-100 ltr:origin-left"
            />
          </Heading>
        ) : null}

        {description ? (
          <p
            className={cn(
              'relative leading-relaxed text-ink-secondary',
              compact ? 'text-sm' : 'flex-1 text-[0.9375rem]',
              clamp,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {/* ── The incoming face ──────────────────────────────────
             Title plus the description in full, rising into the space
             the resting face vacates.

             `aria-hidden` because both strings are already in the
             accessibility tree above — this layer is a second VISUAL
             presentation of the same text, and announcing it twice
             would make every card read as a stutter.

             Only for the clamped variant: a `compact` sector tile is
             a label with nothing held back, so there is nothing to
             swap to. */}
      {hasSwap ? (
        <div aria-hidden="true" className="swap-in">
          {title ? <p className="swap-in-title">{title}</p> : null}
          <p className="swap-in-body">{description}</p>
        </div>
      ) : null}
    </div>
  );
}

export default IconCard;
