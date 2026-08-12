import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { IconButton } from './IconButton.jsx';
import { cn } from '@utils/cn.js';

import logoWhiteUrl from '@assets/bedar-logo-white.svg';

import avatarNawal from '@assets/experts/expert-nawal-fayez.avif';
import avatarTarek from '@assets/experts/expert-tarek-hassan.avif';
import avatarAlhareth from '@assets/experts/expert-alhareth-alomari.avif';
import avatarMona from '@assets/experts/expert-mona-itani.avif';
import avatarMohammad from '@assets/experts/expert-mohammad-kahlani.avif';

/* ================================================================
   TESTIMONIALS CAROUSEL — the "آراء الخبراء" section.

   The live site (bedar.webflow.io) runs this as a single-slide
   Webflow slider (one quote in view, dot rail + arrows, "Slide N of
   5"), not a static grid. This ports that behaviour: one card in
   view, autoplay with pause-on-interaction, and a slide direction
   that respects RTL — "next" is the forward/start direction, which
   on this RTL site is leftward (see the ArrowLeft convention on
   every other forward CTA), so an advancing slide drifts toward the
   left as it fades, and the next one crossfades back in from there.

   Plain CSS transitions driven by two React states (`shown`, the
   content on screen, vs `index`, the target), not Framer Motion's
   `AnimatePresence`: its exit tracking depends on
   `requestAnimationFrame`, which browsers fully suspend on a
   backgrounded/hidden tab — the slide index advanced but the exiting
   card never finished leaving, so the next one never mounted. A
   single `setTimeout` (still fires on a hidden tab, just throttled)
   swaps `shown` once the exit transition's duration has elapsed, so
   the crossfade never depends on an animation-frame callback firing.

   Avatars are a display concern, not content — `testimonials` in
   `content/pages.js` stays plain data (id/quote/author/role) per the
   "content is data" rule, and this map is the one place a person's
   id resolves to their photo.
   ================================================================ */

const AVATARS = {
  'nawal-fayez-hassan': avatarNawal,
  'tarek-hassan': avatarTarek,
  'alhareth-alomari': avatarAlhareth,
  'mona-itani': avatarMona,
  'mohammad-alif-kahlani': avatarMohammad,
};

/* The same portraits keyed by the person's exact name, so a
   testimonial coming from Supabase (a uuid id, not the seed slug the
   map above uses) still shows the real photo used on the live site.
   A dashboard-uploaded photo always wins over this; this is only the
   fallback for the five migrated experts, whose names match the seed
   exactly. */
const AVATARS_BY_NAME = {
  'نوال فايز حسن': avatarNawal,
  'طارق حسان': avatarTarek,
  'الحارث بن سفر العمري': avatarAlhareth,
  'الدكتورة منى عيتاني': avatarMona,
  'محمد اليف كحلاني': avatarMohammad,
};

/**
 * The portrait to show, in priority order:
 *   1. a dashboard-uploaded photo (URL string on the record),
 *   2. the bundled expert photo by seed id,
 *   3. the bundled expert photo by exact name (Supabase rows),
 *   4. nothing → the caller renders the person's initial.
 */
function resolveAvatar(item) {
  if (typeof item.image === 'string' && item.image) return item.image;
  return AVATARS[item.id] ?? AVATARS_BY_NAME[(item.author ?? '').trim()] ?? null;
}

const AUTOPLAY_MS = 6500;
const STEP_MS = 260;
/* How far a drag must travel before it counts as a swipe. 56px is
   comfortably past a thumb's incidental wobble while scrolling and
   well short of a deliberate flick. */
const DRAG_THRESHOLD = 56;
/* The card follows the finger at 40% — enough that it is obviously
   attached to the gesture, damped enough that a long drag does not
   pull the card off its own panel. */
const DRAG_FOLLOW = 0.4;

export function TestimonialsCarousel({ items, className }) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [direction, setDirection] = useState(1);
  const [phase, setPhase] = useState('rest'); // 'rest' | 'exit'
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef(null);
  const stepRef = useRef(null);
  const figureRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, dx: 0, pointerId: null });

  const go = useCallback(
    (nextIndex, dir) => {
      setDirection(dir);
      setIndex((current) => {
        const clamped = (nextIndex + count) % count;
        return clamped === current ? current : clamped;
      });
    },
    [count],
  );

  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  /* ── Drag / swipe ─────────────────────────────────────────────
        The live site's slider is drag-driven and this port had no
        swipe at all: on a phone the only way to reach the second
        opinion was to hit a 24px dot or wait 6.5 seconds. That is the
        gap this closes.

        The move handler writes `transform` straight to the node
        rather than going through React state. Two reasons: a
        re-render per pointermove is wasteful for a value that only
        ever lands on one element, and — more to the point — it keeps
        the gesture off the animation frame entirely, so it tracks the
        finger even while the tab is throttled.

        Pointer events rather than touch events, so the same code
        serves a mouse drag, a trackpad, a pen and a finger. The
        element sets `touch-action: pan-y`, which is what tells the
        browser "vertical scrolling is still yours, horizontal is
        mine" — without it the first horizontal move either scrolls
        the page or cancels the gesture depending on the platform. */
  const applyDragTransform = (dx) => {
    const node = figureRef.current;
    if (!node) return;
    node.style.transition = dx === null ? '' : 'none';
    node.style.transform = dx === null ? '' : `translateX(${dx * DRAG_FOLLOW}px)`;
  };

  /* Pointer capture is a nicety, not a requirement: it keeps the
     gesture alive when the finger leaves the card mid-drag. It also
     throws `NotFoundError` whenever the id is not one the browser
     considers active — a synthetic event, a pointer the OS already
     cancelled, a device that vanished mid-gesture. Uncaught, that
     throw lands in the middle of the release handler and the swipe
     silently never completes, which is exactly what it did here. */
  const capture = (node, pointerId, release = false) => {
    try {
      if (release) node.releasePointerCapture?.(pointerId);
      else node.setPointerCapture?.(pointerId);
    } catch {
      /* the gesture works without it */
    }
  };

  const onPointerDown = (event) => {
    if (count < 2) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { active: true, startX: event.clientX, dx: 0, pointerId: event.pointerId };
    setPaused(true);
    capture(event.currentTarget, event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!drag.current.active) return;
    drag.current.dx = event.clientX - drag.current.startX;
    applyDragTransform(drag.current.dx);
  };

  const onPointerUp = (event) => {
    if (!drag.current.active) return;
    const { dx } = drag.current;
    drag.current.active = false;
    capture(event.currentTarget, event.pointerId, true);
    applyDragTransform(null);
    setPaused(false);

    if (Math.abs(dx) < DRAG_THRESHOLD) return; // a tap, or a wobble
    // Forward is LEFTWARD in RTL — the same convention as every
    // ArrowLeft CTA on the site and as this carousel's own exit
    // direction. Dragging the card left therefore advances it.
    if (dx < 0) next();
    else prev();
  };

  /* Arrow keys, matching the on-screen controls: the "next" button
     carries a ChevronLeft, so ArrowLeft advances. */
  const onKeyDown = (event) => {
    if (count < 2) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      prev();
    }
  };

  // Both branches react purely to `index` diverging from `shown` — no
  // external system involved — so they're adjusted during render
  // (matching Navbar's `lastPathname` pattern) rather than from an
  // effect; react-hooks/set-state-in-effect flags a bare setState in
  // an effect body for exactly this case. The effect below only ever
  // fires *after* `phase` has already flipped to 'exit' on some prior
  // render, and its own setState calls live inside the timer
  // callback — a real subscription to an external clock, not a
  // synchronous echo of props/state.
  if (reduceMotion && shown !== index) {
    setShown(index);
  } else if (!reduceMotion && shown !== index && phase !== 'exit') {
    setPhase('exit');
  }

  useEffect(() => {
    if (phase !== 'exit') return undefined;
    stepRef.current = window.setTimeout(() => {
      setShown(index);
      setPhase('rest');
    }, STEP_MS);
    return () => window.clearTimeout(stepRef.current);
  }, [phase, index]);

  useEffect(() => {
    if (paused || reduceMotion || count < 2) return undefined;
    timerRef.current = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(timerRef.current);
  }, [paused, reduceMotion, count, next]);

  const item = items[shown];
  const avatar = resolveAvatar(item);
  // Slides out toward the exit edge; the swapped-in card then
  // transitions back from that same edge to center (a crossfade with
  // a small directional drift, not a true two-edge slide) — see the
  // note above on why this stays a single-timer, single-phase change.
  const exitOffset = direction > 0 ? -16 : 16;
  const cardStyle =
    phase === 'exit'
      ? {
          opacity: 0,
          transform: `translateX(${exitOffset}px)`,
          transition: `opacity ${STEP_MS}ms var(--ease-standard), transform ${STEP_MS}ms var(--ease-standard)`,
        }
      : {
          opacity: 1,
          transform: 'translateX(0)',
          transition: `opacity ${STEP_MS}ms var(--ease-standard), transform ${STEP_MS}ms var(--ease-standard)`,
        };

  return (
    <div
      className={cn('relative mx-auto max-w-4xl', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="آراء الخبراء"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="quote-panel">
        <figure
          ref={figureRef}
          role="group"
          aria-roledescription="slide"
          aria-label={`${shown + 1} من ${count}`}
          style={cardStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // `touch-action: pan-y` hands vertical scrolling back to the
          // browser and keeps horizontal for the swipe. `select-none`
          // stops a drag from turning into a text selection of the
          // quote, which is what makes a hand-written slider feel
          // broken on desktop.
          className="quote-slide relative flex touch-pan-y select-none flex-col gap-7 px-6 py-10 sm:px-12 sm:py-14"
        >
          {/* The Bedar wordmark opens the card, in the corner the
              lucide quotation glyph used to hold. The client asked for
              the comma-shaped mark gone and the site logo in its place
              — one clean brand mark, not a faint watermark behind the
              text. White silhouette, since the panel is near-black;
              `self-start` so the wide wordmark keeps its own width and
              sits at the reading edge (right in RTL) rather than
              stretching. Decorative — the region already carries the
              "آراء الخبراء" label, so the logo is aria-hidden. */}
          <img
            src={logoWhiteUrl}
            alt=""
            aria-hidden="true"
            draggable="false"
            className="h-8 w-auto shrink-0 self-start opacity-90 sm:h-9"
          />

          {/* Start-aligned, not centred: five lines of centred Arabic
              gives every line a different start point and the eye has
              to re-find the margin on each one. The band reads as an
              editorial pull-quote now, which is what it is. */}
          <blockquote className="text-balance text-lg leading-[1.9] text-ink sm:text-xl sm:leading-[1.9]">
            {item.quote}
          </blockquote>

          <figcaption className="mt-1 flex items-center gap-4 border-t border-subtle pt-6">
            <span className="size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-brand-300/40 ring-offset-2 ring-offset-transparent sm:size-16">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="size-full object-cover"
                  width={200}
                  height={200}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              ) : (
                <span className="flex size-full items-center justify-center bg-tint-brand text-sm font-semibold text-tint-brand-fg">
                  {item.author.slice(0, 1)}
                </span>
              )}
            </span>

            <span className="flex min-w-0 flex-col">
              <span className="font-semibold text-ink">{item.author}</span>
              <span className="text-sm leading-snug text-ink-muted">{item.role}</span>
            </span>

            {/* "N / 5", the live-site slider's own counter. Western
                digits and `.ltr-run` so the pair never bidi-reorders
                into "5 / N" beside the Arabic name. */}
            {count > 1 ? (
              <span className="ms-auto hidden shrink-0 text-sm tabular-nums text-ink-muted sm:block">
                <span className="ltr-run">
                  {shown + 1} / {count}
                </span>
              </span>
            ) : null}
          </figcaption>
        </figure>
      </div>

      {/* ── Controls ─────────────────────────────────────────────
             One row under the card holding both the arrows and the
             dots. The arrows used to be absolutely positioned into the
             card's outer margin from `sm` up, which on a 640–768px
             screen put them on top of the card's own padding; and the
             dots sat in a third row below. One centred control row
             works at every width and needs no breakpoint. */}
      {count > 1 ? (
        <div className="mt-7 flex items-center justify-center gap-3 sm:gap-4">
          <IconButton label="الرأي السابق" variant="outline" onClick={prev}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </IconButton>

          {/* The dot rail wraps. The count is DATA — the dashboard can
              publish a sixth testimonial — so a row that only fits five
              is a row that breaks the first time someone adds one. */}
          <div
            className="flex flex-wrap items-center justify-center gap-y-1"
            role="tablist"
            aria-label="اختر رأياً"
          >
            {items.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={slideIndex === index}
                aria-label={`الانتقال إلى رأي ${slideIndex + 1}`}
                onClick={() => go(slideIndex, slideIndex > index ? 1 : -1)}
                // The dot draws at 8px but the hit area is 24×44 —
                // full thumb height, and wide enough to clear WCAG
                // 2.5.8's 24×24 minimum with its own spacing. A square
                // 44×44 target per dot is the ideal and does not fit:
                // five of them plus two arrows is 372px on a 288px
                // line, which is what put 22px of horizontal scroll on
                // the whole homepage at 320px wide.
                className="group/dot grid h-11 w-6 place-items-center rounded-full"
              >
                <span
                  className={cn(
                    'h-2 rounded-full transition-[width,background-color] duration-(--dur-base) ease-(--ease-standard)',
                    slideIndex === index
                      ? 'w-5 bg-brand-300'
                      : 'w-2 bg-brand-100/30 group-hover/dot:bg-brand-200/70',
                  )}
                />
              </button>
            ))}
          </div>

          <IconButton label="الرأي التالي" variant="outline" onClick={next}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}

export default TestimonialsCarousel;
