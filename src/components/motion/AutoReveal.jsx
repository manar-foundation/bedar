import { useLayoutEffect } from 'react';

/* ================================================================
   AUTO REVEAL — one scroll-reveal for everything a page did not
   animate by hand.

   `Reveal` / `Stagger` cover the blocks a page author reached for
   deliberately. Everything else on the public site — body copy,
   listings, images, panels, tables, forms, the footer — used to
   simply be there when you scrolled to it. This closes that gap
   without asking nine page files to wrap every element they own.

   It renders nothing. Mount it once, inside `PublicLayout`.

   HOW IT PICKS ELEMENTS
   ----------------------------------------------------------------
   A scan over `main` and `footer` for CANDIDATES (below), then three
   passes, and the ORDER of them is the whole design:

   1. ELIGIBILITY, per element. Out: anything inside
      `[data-reveal="off"]`, `[data-no-reveal]` or `.sticky-col` (the
      first is what the Framer components stamp on themselves; the
      last because a pinned column is positioned against a scroll it
      must not also be animating in); anything `aria-hidden="true"`,
      since decoration should already be there rather than arrive;
      and anything whose SUBTREE contains a `[data-reveal="off"]`, so
      a list of Framer-animated rows is not itself faded in
      underneath them.

   2. LAYOUT. Every rect is read in one pass, and an element that is
      0×0 right now is not touched at all. That is the safety net for
      a collapsed accordion panel, a `hidden` tab panel, anything not
      yet laid out: it stays untouched and gets another chance on the
      next scan, rather than being left at `opacity: 0` forever with
      no intersection ever coming.

   3. NESTING — the topmost survivor wins. A card and the four
      paragraphs inside it are all candidates; only the card
      animates.

   Pass 3 runs LAST, and against what actually survived passes 1 and
   2, which is subtler than it looks. Test nesting against the raw
   candidate list instead and a container that pass 1 rejected — a
   `.panel-inset` holding one Framer-animated child, say — still
   shadows its own plain paragraphs, and those paragraphs end up
   animated by neither system. The rule is "is any ancestor going to
   animate", not "is any ancestor a candidate".

   WHY A MutationObserver AND NOT THE ROUTER
   ----------------------------------------------------------------
   Content arrives here three different ways: a route change (React
   Router swaps `main`), an async fetch resolving (collections,
   published content), and a user action (opening an accordion). A
   `useLocation()` dependency catches only the first. Watching the
   DOM catches all three and needs no coupling to either the router
   or the data layer.

   The callback scans SYNCHRONOUSLY rather than on an animation
   frame: MutationObserver records are delivered as a microtask, so a
   scan there still lands before the next paint and new content is
   hidden before it has ever been shown. On a rAF the reader gets one
   frame of the finished page followed by a fade-in of it, which
   reads as a flicker. Same reason the first scan is a
   `useLayoutEffect`.

   It observes `childList` only. Our own writes are attributes and
   inline custom properties, so nothing here can retrigger itself.

   PERFORMANCE
   ----------------------------------------------------------------
   One observer for the whole document, not one per element. Every
   target is unobserved the moment it fires — `once`, always: content
   that re-animates each time it scrolls back past is what makes a
   long page exhausting.

   The transition is transform + opacity only, so each frame is a
   composite. `will-change` is deliberately NOT set: promoting sixty
   elements up front costs more memory than it saves frames, and the
   browser promotes each one for the duration of its own transition
   anyway.

   And when an element has finished, its attribute and its custom
   property are REMOVED (`SETTLE_MS`). A settled element is exactly
   the element it would be with this component deleted — see the note
   in `styles/reveal.css` for why that matters more than it sounds.
   ================================================================ */

/** Block-level content. Anything not here is only reached as part of
    a block that is — which is the point of filter 3 above. */
const CANDIDATES = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'blockquote',
  'ul',
  'ol',
  'dl',
  'table',
  'form',
  'figure',
  'picture',
  'video',
  'img',
  /* The site's own composed blocks. Named explicitly so a card
     animates as ONE thing rather than as an icon, a heading and a
     paragraph landing separately. */
  '.band-tile',
  '.stat-tile',
  '.quote-panel',
  '.panel-inset',
  '.panel-quiet',
  '.media-frame',
  '.word-orbit',
  /* The per-element opt-in, for anything this list cannot name — a
     button, a bare div, a decorative rule that should arrive. */
  '[data-reveal="on"]',
  '[data-reveal="up"]',
  '[data-reveal="left"]',
  '[data-reveal="right"]',
].join(',');

const SKIP_SUBTREE = '[data-reveal="off"],[data-no-reveal],.sticky-col';

/** Where to look. The navbar is excluded on purpose: it is fixed and
    on screen from the first pixel, so it has nothing to arrive from. */
const ROOTS = '.public-site main, .public-site footer';

/** Stagger cap, in steps. 6 × 70ms = 420ms for the last tile of a
    batch; past that a reader is waiting for the page rather than
    watching it. */
const MAX_STEP = 6;

/** Reveal starts this far before the element's top reaches the fold,
    so a block is already arriving as it comes into view rather than
    starting once it is fully on screen.

    It also creates a DEAD BAND, which `flushTail` below is what
    answers — read that note before changing this number. */
const ROOT_MARGIN = '0px 0px -8% 0px';

/** Long enough to cover the longest delay + duration in reveal.css
    (6 × 70 + 620) with room for a slow frame. */
const SETTLE_MS = 1200;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function AutoReveal() {
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    if (prefersReducedMotion()) return undefined;

    /* Every element this instance has already decided about, so a
       rescan is O(new nodes) rather than O(page). WeakSets, because a
       route change drops half of these on the floor and this must not
       be what keeps them alive.

       `marked` outlives the attribute on purpose: it is removed once
       the reveal settles, and content that arrives later underneath
       an already-revealed container still has to know not to animate
       a second time inside it. */
    const seen = new WeakSet();
    const marked = new WeakSet();
    const timers = new Set();

    const settle = (el) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        el.removeAttribute('data-reveal-state');
        el.style.removeProperty('--reveal-step');
      }, SETTLE_MS);
      timers.add(timer);
    };

    /* THE STAGGER IS DECIDED HERE, NOT AT SCAN TIME.
       ------------------------------------------------------------
       An element's place in a cascade is a property of what it
       ARRIVES WITH, not of where it sits in its parent. Numbering
       them during the scan looks right on a grid and is wrong
       everywhere else: an article body is twenty paragraphs with one
       parent, so the twentieth would carry a permanent 420ms delay
       and hang for half a second every time the reader scrolled to
       it, alone, with nothing to be staggered against.

       An IntersectionObserver already batches by frame — everything
       that crossed the line together is in one callback. So the
       index is taken over that batch, ordered down the page. A block
       that arrives on its own is index 0 and plays immediately; a
       band of twelve cards coming into view together cascades. */
    const observer = new IntersectionObserver(
      (entries) => {
        const arriving = entries.filter((entry) => entry.isIntersecting);
        arriving.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        arriving.forEach((entry, index) => {
          const el = entry.target;
          observer.unobserve(el);
          // Both writes land before the next style recalc, so the
          // transition that the state change starts already carries
          // this element's delay.
          el.style.setProperty('--reveal-step', String(Math.min(index, MAX_STEP)));
          el.dataset.revealState = 'shown';
          settle(el);
        });

        // Second trigger for the tail (see `flushTail`). The scroll
        // listener is the primary one; this covers a reader who
        // arrives at the bottom in one gesture, where the last entries
        // can fire before `scrollY` has settled at its maximum.
        //
        // `flushTail` is declared below this and closed over, not
        // called during the effect body — an observer callback cannot
        // run before the effect that registered the observer has
        // finished, so the TDZ is already over by the time this line
        // executes.
        flushTail();
      },
      { rootMargin: ROOT_MARGIN, threshold: 0.01 },
    );

    const scan = () => {
      for (const root of document.querySelectorAll(ROOTS)) {
        // ── 1 · eligibility ────────────────────────────────────
        const eligible = [];
        for (const el of root.querySelectorAll(CANDIDATES)) {
          if (seen.has(el)) continue;

          if (
            el.closest(SKIP_SUBTREE) ||
            el.getAttribute('aria-hidden') === 'true' ||
            el.querySelector('[data-reveal="off"]')
          ) {
            seen.add(el);
            continue;
          }

          eligible.push(el);
        }
        if (eligible.length === 0) continue;

        /* ── 2 · layout ────────────────────────────────────────
              Read, then write: every rect is measured before the
              first attribute is set, so the whole scan costs ONE
              layout rather than one per element.

              A 0×0 element is neither marked nor remembered — it is
              inside something collapsed, and hiding it would hide it
              for good. It is picked up when it opens. */
        const laid = eligible.filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        const willAnimate = new Set(laid);

        // ── 3 · nesting, against what actually survived ────────
        for (const el of laid) {
          let shadowed = false;
          for (let parent = el.parentElement; parent && parent !== root;) {
            if (willAnimate.has(parent) || marked.has(parent)) {
              shadowed = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (shadowed) {
            seen.add(el);
            continue;
          }

          el.dataset.revealState = 'hidden';
          seen.add(el);
          marked.add(el);
          observer.observe(el);
        }
      }
    };

    /* ── THE LAST 8vh OF A PAGE CAN NEVER INTERSECT ─────────────
          `ROOT_MARGIN` shrinks the observer's root by 8% of the
          viewport at the BOTTOM, so a block starts arriving before it
          is fully on screen. Everywhere in the middle of a document
          that is free: the reader scrolls, and the element crosses the
          shrunk line a moment early.

          At the END of a document there is no more scroll to give.
          An element sitting inside that final 8vh at maximum scroll
          never crosses the line, never fires, and stays at
          `opacity: 0` for the life of the page.

          That is not a corner case — it is the footer's legal bar on
          EVERY page. Measured at 1440×900: the dead band is 72px, the
          shrunk root ends at 828, and the copyright line sits at
          854–870. `كافة الحقوق محفوظة ©` and the design credit were
          invisible site-wide, which is what the client reported.

          So: once the reader is at the bottom of the document, nothing
          may still be hidden. Anything the observer has marked and not
          yet fired is shown here instead.

          Three things about this guard:

          • It reads the DOM (`[data-reveal-state="hidden"]`) rather
            than keeping a list. `marked` is a WeakSet and cannot be
            iterated, and a Set of pending elements would hold every
            node of every route the reader has left. The query only
            runs on the frames where the check below passes.
          • The check is the cheap half and runs first — three
            property reads, no layout — so this costs nothing on the
            scroll frames that are not at the end.
          • It also covers the page that does not scroll AT ALL. There
            `maxScroll` is 0, so the guard passes on the first call and
            the tail is shown immediately, which is correct: on a page
            that fits the viewport, everything is already on screen.
            That is why `scan()` calls it too — async content can
            extend a short page after mount, and no scroll or resize
            event follows. */
    const flushTail = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      // 1px of slack: fractional zoom and sub-pixel layout mean
      // `scrollY` at the bottom is routinely maxScroll - 0.5.
      if (window.scrollY < maxScroll - 1) return;

      for (const el of document.querySelectorAll('[data-reveal-state="hidden"]')) {
        observer.unobserve(el);
        el.dataset.revealState = 'shown';
        settle(el);
      }
    };

    scan();
    flushTail();

    window.addEventListener('scroll', flushTail, { passive: true });
    window.addEventListener('resize', flushTail);

    const mutations = new MutationObserver((records) => {
      // Attribute-only churn (a class toggling, our own writes) can
      // never introduce a candidate, so it must never cost a scan.
      const added = records.some((record) =>
        Array.from(record.addedNodes).some((node) => node.nodeType === 1),
      );
      if (added) {
        scan();
        // New content can land entirely inside the dead band, or can
        // extend a page that did not scroll into one that still does
        // not. Either way the tail has to be re-checked, not just
        // re-scanned.
        flushTail();
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener('scroll', flushTail);
      window.removeEventListener('resize', flushTail);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  return null;
}

export default AutoReveal;
