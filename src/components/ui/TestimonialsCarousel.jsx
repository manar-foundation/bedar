import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

import { IconButton } from './IconButton.jsx';
import { Spiral } from './Spiral.jsx';
import { cn } from '@utils/cn.js';

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
      className={cn('relative mx-auto max-w-3xl', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="آراء الخبراء"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-subtle bg-surface shadow-e2">
        {/* Watermark spiral — decoration, not the quote glyph. */}
        <Spiral
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 start-6 size-28 text-brand-100/60"
        />

        <figure
          role="group"
          aria-roledescription="slide"
          aria-label={`${shown + 1} من ${count}`}
          style={cardStyle}
          className="relative flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12 sm:py-14"
        >
          <Quote aria-hidden="true" className="size-9 shrink-0 text-accent-500/70" />

          <blockquote className="max-w-2xl text-lg leading-relaxed text-ink sm:text-xl">
            {item.quote}
          </blockquote>

          <figcaption className="mt-2 flex flex-col items-center gap-3">
            <span className="size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-brand-100 ring-offset-2 ring-offset-surface">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="size-full object-cover"
                  width={200}
                  height={200}
                  loading="lazy"
                  draggable="false"
                />
              ) : (
                <span className="flex size-full items-center justify-center bg-brand-50 text-sm font-semibold text-brand-600">
                  {item.author.slice(0, 1)}
                </span>
              )}
            </span>
            <span className="flex flex-col">
              <span className="font-semibold text-ink">{item.author}</span>
              <span className="text-xs text-ink-muted">{item.role}</span>
            </span>
          </figcaption>
        </figure>
      </div>

      {count > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3 sm:absolute sm:inset-y-0 sm:mt-0 sm:w-full sm:justify-between sm:px-0">
          {/* Arrows float outside the card on desktop, sit inline
              beneath it once the card takes the full row on mobile. */}
          <IconButton
            label="الرأي السابق"
            variant="outline"
            className="static bg-surface sm:-start-5 sm:absolute sm:top-1/2 sm:-translate-y-1/2"
            onClick={prev}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </IconButton>
          <IconButton
            label="الرأي التالي"
            variant="outline"
            className="static bg-surface sm:-end-5 sm:absolute sm:top-1/2 sm:-translate-y-1/2"
            onClick={next}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      ) : null}

      {count > 1 ? (
        <div
          className="mt-6 flex items-center justify-center gap-2"
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
              className={cn(
                'h-2 rounded-full transition-[width,background-color] duration-(--dur-base) ease-(--ease-standard)',
                slideIndex === index ? 'w-6 bg-accent-500' : 'w-2 bg-brand-100 hover:bg-brand-200',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default TestimonialsCarousel;
