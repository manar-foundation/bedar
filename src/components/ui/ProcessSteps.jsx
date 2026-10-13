import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { CalendarDays, Sparkles, Target } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   PROCESS STEPS — a numbered vertical timeline on a rail.

   Bedar had several ORDERED lists rendered as unordered bullets —
   the strategic goals, the three elements of the adopted definition,
   the impact horizons. An ordered idea drawn as a flat list loses
   the one thing that made it ordered. This gives sequence a shape.

   THE RAIL DRAWS ITSELF AS YOU SCROLL (brief §2)
   ----------------------------------------------------------------
   The connector used to be a static gradient: the whole line was
   already there when the section arrived, so the numbering was the
   only thing saying "this is a sequence" and a reader skimming saw
   six parallel bullets with a decorative stripe beside them.

   Now the line is drawn. One `useScroll` on the list feeds a spring,
   and each step maps its own slice of that progress onto the segment
   between its marker and the next one — so the stroke travels from
   the first goal to the last as the section passes, and each number
   lights up as the line reaches it.

   WHY THE FILL IS PER-SEGMENT AND NOT ONE ELEMENT
   ----------------------------------------------------------------
   A single line spanning the whole <ol> is easy to draw and wrong at
   the bottom: the last step's copy runs well below its marker, so a
   full-height line overshoots the last number by the height of that
   paragraph and stops in mid-air. Ruling it off needs the last
   step's height, which is only knowable at runtime.

   Segment-per-step is exact by construction — each segment spans its
   own step's box, and the last step simply has no segment (there is
   nothing after it to connect to). It is also why the dim track
   below it is drawn the same way.

   Everything animated is `scaleY` and `opacity` on a promoted layer:
   no layout property, so a six-step list costs nothing to scroll
   past. Under `prefers-reduced-motion` the fill is dropped entirely
   and the static track is all that renders.

   NUMBERS
   ----------------------------------------------------------------
   Western digits always (brand rule), and each numeral is wrapped in
   `.ltr-run` so a two-digit step reads "10" and not "01" beside the
   Arabic that follows it.

   RTL
   ----------------------------------------------------------------
   The rail is the inline-START column, so it lands on the right in
   Arabic — which is where a reader's eye enters the row. The
   connector is drawn with logical properties, so nothing here needs
   an `rtl:` variant.

   `variant="plain"` drops the numbers for a sequence that is a list
   of guarantees rather than a set of ordered steps — the marker
   becomes the brand's dot instead.

   TWO OPTIONAL FIELDS A STEP MAY CARRY (أُسُس سورية's journey)
   ----------------------------------------------------------------
   Both default to absent, so a plain `{title, description}` step is
   unaffected and the /about and /social-… rails do not change:

     step.note     a short emphasised line UNDER the body — a
                   conviction or aside the stage turns on ("نحن لا
                   نختار من الورق…").
     step.outcome  what the reader WALKS AWAY WITH from the stage
                   ("تخرج بـ…") — a deliverable, distinct from the
                   body, which is the whole point of not rendering the
                   journey as a flat list.

   BOTH ARE DRAWN IN THE SAME BOX (client, Oct 2026 notes §5)
   ----------------------------------------------------------------
   `note` was a bare tinted line with no box, beside an `outcome` that
   had one; the client asked for the note to take the outcome's shape
   ("نجعل شكل هذه نفس شكل البوكس اللي بالفقرة ٣"). So they share ONE
   className constant and differ only in their mark — `Sparkles` for a
   conviction, `Target` for a deliverable. Keep them sharing it: two
   copies of the same box drift the moment one is touched.

   THE RAIL IS ONE UNBROKEN LINE
   ----------------------------------------------------------------
   The connector runs from a marker to the bottom of its own step's
   box, so a header row dropped BETWEEN two steps would leave a gap and
   the line would stop looking like one journey. أُسُس سورية's journey
   therefore passes all nine of its stages as one flat list — it
   numbers itself 1-9 like any other, and no offset is needed.

   It carried its three PHASE titles too until the client's Oct 2026
   notes deleted them ("حذف هذه", on all three). They were drawn out of
   the flow above the step that opened each phase, from a `phaseLabel`
   / `phaseScope` pair on the step plus a longer gap on the step before
   it; nothing else on the site ever set them, so the whole path came
   out with the labels rather than being left behind unreachable.
   ================================================================ */

/* The box both callouts are drawn in — see the note above. `border-s-2`
   so the accent runs down the reading edge in RTL. */
const CALLOUT =
  'mt-2 flex items-start gap-2.5 rounded-lg border-s-2 border-brand-300 bg-brand-500/10 py-2.5 pe-4 ps-3.5 text-sm font-medium leading-relaxed text-ink dark:border-brand-400';

/** One row: marker + its segment of the rail + the copy. */
function Step({ step, index, count, numbered, inverse, progress, animated }) {
  const title = step.title ?? step.label ?? step;
  const description = step.description ?? step.body;
  const note = step.note;
  const outcome = step.outcome;
  // `meta` is a short label ABOVE the title — the hackathon timeline's
  // stage dates. A plain string, not a Date: several of those stages
  // are ranges ("15-19/08/2024") and `Intl` cannot format a range, so
  // the caller owns the formatting and this component only places it.
  // `.ltr-run` because a date is a Latin/numeric run inside Arabic
  // prose (CLAUDE.md, RTL rules) — without it "15-19/08/2024" reorders.
  const meta = step.meta ?? step.date;
  const last = index === count - 1;
  const draws = animated && !last;

  // This step's slice of the list's scroll progress. `clamp` keeps a
  // finished segment at 1 instead of overshooting as the page moves on.
  const segment = useTransform(progress, [index / count, (index + 1) / count], [0, 1], {
    clamp: true,
  });
  // The marker lights when the stroke reaches it — i.e. as soon as
  // the PREVIOUS segment completes. The first one lights immediately.
  const lit = useTransform(progress, [Math.max(0, (index - 0.35) / count), index / count], [0, 1], {
    clamp: true,
  });

  return (
    <li className="process-step group/step flex gap-5 sm:gap-8">
      {/* ── Rail: marker + connector ─────────────────────────── */}
      <div className="process-rail flex shrink-0 flex-col items-center">
        {/* The bright stroke, over the dim track drawn by
            `.process-rail::before`. `origin-top` so it grows
            downward, in reading order. */}
        {draws ? (
          <motion.span
            aria-hidden="true"
            className="process-rail-fill"
            style={{ scaleY: segment }}
          />
        ) : null}

        <span
          className={cn(
            'relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums sm:size-11 sm:text-sm',
            inverse
              ? 'bg-brand-200 text-brand-950'
              : 'bg-tint-brand text-tint-brand-fg ring-1 ring-tint-brand-ring',
          )}
        >
          {/* The "reached" state. It is a HALO — a ring plus a wash —
              and deliberately not a solid fill: a fill would have to
              be mint to read as lit, and the numeral on top of it
              would then be light-on-light. Haloing leaves the chip's
              own background and text colour alone, so the number
              keeps its contrast in both states and nothing about the
              marker's size or position changes as it lights. */}
          {animated ? (
            <motion.span
              aria-hidden="true"
              className="absolute -inset-px rounded-full bg-brand-300/20 ring-2 ring-brand-300 shadow-[0_0_18px_-3px_rgba(169,225,211,0.65)]"
              style={{ opacity: lit }}
            />
          ) : null}
          <span className="relative">
            {numbered ? (
              <span className="ltr-run">{index + 1}</span>
            ) : (
              <span aria-hidden="true" className="block size-2 rounded-full bg-current" />
            )}
          </span>
        </span>
      </div>

      {/* ── Copy ─────────────────────────────────────────────────
            The bottom padding is what spaces the steps, so the
            connector runs unbroken through the gap instead of
            restarting at each row.

            IT IS A CSS RULE, NOT A UTILITY, AND THAT IS THE FIX.
            The spacing used to be `pb-14 last:pb-0 sm:pb-[4.5rem]`
            here, and `last:` was silently matching EVERY step: this
            div is always the last child of its own <li>, so the
            variant was true on all six of them and the rhythm
            computed to 0 everywhere. That is the "متراص جدا / متداخل
            في بعضه" the client reported on both the strategic goals
            and the adopted definition — the six goals were sitting
            flush against each other with the rail running through a
            gap that did not exist.

            The condition belongs on the STEP (`.process-step:not(
            :last-child)`, layout.css), which is the element that
            actually knows whether anything follows it. Keeping it in
            CSS also puts it beside the `:last-child` rule that hides
            the rail's trailing segment, so the two cannot disagree,
            and it sidesteps the variant-ordering trap that made
            `sm:pb-*` outrank `last:pb-0` in the first place. */}
      <div className="process-step-copy flex min-w-0 flex-col gap-2">
        {meta ? (
          <span
            className={cn(
              'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              inverse
                ? 'bg-white/10 text-brand-100 ring-1 ring-inset ring-white/15'
                : 'bg-tint-brand text-tint-brand-fg ring-1 ring-inset ring-tint-brand-ring',
            )}
          >
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="ltr-run">{meta}</span>
          </span>
        ) : null}

        <h3
          className={cn(
            'text-lg font-semibold leading-snug transition-colors duration-(--dur-base) group-hover/step:text-brand-200 sm:text-xl',
            inverse ? 'text-white' : 'text-ink',
          )}
        >
          {title}
        </h3>
        {description ? (
          <p
            className={cn(
              'text-base leading-relaxed',
              inverse ? 'text-brand-100/80' : 'text-ink-secondary',
            )}
          >
            {description}
          </p>
        ) : null}

        {/* The conviction the stage turns on — the stage's own voice
            rather than more body copy, which the `Sparkles` mark says
            without needing a heading. One tone, not an `inverse` split:
            the public site is dark on both tones. */}
        {note ? (
          <p className={CALLOUT}>
            <Sparkles
              className="mt-0.5 size-4 shrink-0 text-brand-200"
              aria-hidden="true"
              strokeWidth={1.75}
            />
            <span>{note}</span>
          </p>
        ) : null}

        {/* The deliverable — a different silhouette from the body
            paragraph, so a reader skimming the rail sees at a glance
            what each stage leaves them holding. */}
        {outcome ? (
          <p className={CALLOUT}>
            <Target
              className="mt-0.5 size-4 shrink-0 text-brand-200"
              aria-hidden="true"
              strokeWidth={1.75}
            />
            <span>{outcome}</span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function ProcessSteps({ steps = [], variant = 'numbered', tone = 'default', className }) {
  const inverse = tone === 'inverse';
  const numbered = variant === 'numbered';
  const listRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // `offset` is deliberately asymmetric: the stroke starts moving
  // once the list's top has risen to 85% of the viewport height (just
  // after it appears) and completes when its bottom reaches 60% (just
  // before it leaves). Filling across the full pass would leave the
  // last two steps unlit for anyone who stops scrolling at the end of
  // the section, which is exactly where a reader stops.
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start 0.85', 'end 0.6'],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 });

  return (
    <ol ref={listRef} className={cn('flex flex-col', className)}>
      {steps.map((step, index) => (
        <Step
          key={step.id ?? (typeof step === 'string' ? step.slice(0, 24) : (step.title ?? index))}
          step={step}
          index={index}
          count={steps.length}
          numbered={numbered}
          inverse={inverse}
          // The spring is always passed — `useTransform` needs a real
          // MotionValue to derive from, and hook order has to be the
          // same on every render. `animated` is the switch: under
          // reduced motion the child renders no motion elements at
          // all, so the static track is the whole component and there
          // is no suspended animation left running behind it.
          progress={progress}
          animated={!reduceMotion}
        />
      ))}
    </ol>
  );
}

export default ProcessSteps;
