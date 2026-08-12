import { useCallback, useEffect, useRef, useState } from 'react';

import { Spiral } from './Spiral.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   WORD ORBIT — the homepage About band's artwork, and a control.

   The reference layout puts a ring of single words around two
   concentric circles with its logo at the centre. Bedar has no photo
   library, so this is the one piece of that homepage that ports here
   directly — and the words are not new copy: they are
   `about.values[]`, the five brand values the About page already
   publishes, so the band has one source of truth with that page.

   IT IS A DIAL, NOT A DECORATION
   ----------------------------------------------------------------
   The first pass at "make the mark alive" added ambient motion — a
   pointer tilt and a scroll-linked rotation. It moved, but nothing a
   reader did changed what the band SAID, which is the difference
   between animation and interaction.

   Now each word is a real button. Hovering, focusing or tapping one
   brings that value's description into the middle of the ring, dims
   the other four, and draws the active chip forward. So the artwork
   answers a question — "what does الشفافية mean here?" — instead of
   just orbiting. The copy it reveals is `about.values[].description`,
   already published on /about; nothing was written for this.

   Click PINS a value (tap-friendly, and it survives the pointer
   leaving); hover previews it; blur and pointer-leave fall back to
   whatever is pinned. That three-way is what makes it work with a
   mouse and a thumb from the same state.

   WHY THIS IS CSS AND NOT FRAMER MOTION
   ----------------------------------------------------------------
   Every transition here is a CSS transition driven by a class or a
   custom property, and the pointer tilt writes `--tilt-x`/`--tilt-y`
   straight to the node from the event handler. Nothing runs on
   `requestAnimationFrame`.

   That is deliberate on three counts: a ring of five chips that each
   animate colour and transform is exactly the kind of thing that
   should live on the compositor; the tilt keeps tracking under a
   throttled animation frame; and — the practical one — a JS-driven
   tween cannot be verified in a preview whose page is backgrounded,
   while a CSS transition lands on its end state and can be
   screenshotted.

   `prefers-reduced-motion` is honoured by the motion tokens (every
   `--dur-*` collapses to 0), so the state changes still happen and
   simply do not travel. The ambient ring rotation is a keyframe
   animation and `animations.css` stops it outright.

   THE ENTRANCE IS THE REFERENCE'S, EXACTLY
   ----------------------------------------------------------------
   The dial answered a question but it did nothing on ARRIVAL: the
   band was simply there, fully drawn, the moment it scrolled up. The
   client asked for the reference's own treatment ("طبق نفس الشكل
   تماما"), and the reference has one — `embrace-center-wcopilot`'s
   about band runs an IX2 scroll-into-view list titled "About Scroll
   Section" over the same three parts this component has:

     .big-circle    translateX  +200px → 0, opacity 0 → 1
     .small-circle  translateX  -200px → 0, opacity 0 → 1
     .logo-image    rotateZ    -180deg → 0
     all three      500ms, on a 100ms delay

   So the two rings CONVERGE from opposite sides while the mark
   unwinds half a turn underneath them. That is ported here whole
   (the travel is a percentage of each ring's own box rather than a
   flat 200px, so it scales with the artwork), and the one thing
   added on top is the word chips arriving in ring order afterwards —
   the reference has no chip animation because its words are part of
   the same wrapper, but landing five chips simultaneously on top of
   a settled ring is the one beat where "all at once" reads as a pop
   rather than as an arrival.

   The trigger is an IntersectionObserver that adds `is-in` once and
   disconnects; every transform is still a CSS transition. `x` is
   PHYSICAL and is deliberately not flipped for RTL — two rings
   converging is a spatial gesture, not a reading-order one, the same
   call `StaggerItem variant="slide"` makes on /social-entrepreneurship.
   ================================================================ */

/** Words start at the top and go clockwise, alternating radius so
    two neighbours never collide at the same distance from centre. */
function place(index, count) {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  const radius = index % 2 === 0 ? 0.46 : 0.36;
  return {
    left: `${50 + Math.cos(angle) * radius * 100}%`,
    top: `${50 + Math.sin(angle) * radius * 100}%`,
  };
}

/** Accepts either `[{id,title,description}]` or a plain string list. */
function normalise(items) {
  return items.map((item, index) =>
    typeof item === 'string'
      ? { id: `${item}-${index}`, title: item, description: null }
      : { id: item.id ?? item.title, title: item.title, description: item.description ?? null },
  );
}

export function WordOrbit({ items = [], words, className }) {
  const values = normalise(items.length ? items : (words ?? []));
  const [pinned, setPinned] = useState(null);
  const [preview, setPreview] = useState(null);
  const rootRef = useRef(null);

  /* Has the band been reached? `is-in` is what every entrance rule
     hangs off, and it is one-way — the ring does not re-assemble
     itself each time it scrolls back into view, which would make a
     visitor scrolling up and down watch the same 600ms over and
     over.

     Derived in the INITIALISER, not set from the effect body: no
     IntersectionObserver means no way to detect arrival, and a band
     that stays at opacity 0 forever is the worst possible failure
     mode, so that case starts already entered. (`set-state-in-effect`
     forbids the other spelling anyway.) */
  const [entered, setEntered] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (entered) return undefined;
    const node = rootRef.current;
    if (!node) return undefined;

    // 0.25 rather than 0: the artwork is a tall square, and firing at
    // the first pixel means the rings have finished converging before
    // the band is far enough up the viewport for anyone to see them.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setEntered(true);
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [entered]);

  // Hover wins while it lasts, so moving across the ring reads each
  // value in turn; the pinned one is what it falls back to.
  const activeId = preview ?? pinned;
  const active = values.find((value) => value.id === activeId) ?? null;

  /* The tilt, as two custom properties. Written to the node directly
     — no state, no re-render, no animation frame. */
  const onPointerMove = useCallback((event) => {
    if (event.pointerType !== 'mouse') return; // a thumb has no hover
    const node = rootRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    node.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${(x * 7).toFixed(2)}deg`);
  }, []);

  const onPointerLeave = useCallback(() => {
    const node = rootRef.current;
    if (node) {
      node.style.setProperty('--tilt-x', '0deg');
      node.style.setProperty('--tilt-y', '0deg');
    }
    setPreview(null);
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn('word-orbit', entered && 'is-in', active && 'is-active', className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* ── Rings, glow and the mark ───────────────────────────
             `emblem-orbit-*` are the existing emblem keyframes, so
             this and the hero mark read as one system. They stop dead
             under prefers-reduced-motion (animations.css).

             EACH RING IS NOW A SHELL AROUND A RING, and that nesting
             is load-bearing rather than tidy markup: the ring itself
             is running `emblem-orbit-*`, a keyframe animation on
             `transform`, and a running animation outranks both a
             transition and a declared value on the same property. The
             converging travel put on the ring directly simply never
             rendered. The shell owns the entrance transform, the ring
             inside it keeps its rotation, and the two compose.

             `.word-orbit-rings` is the layer that clips them. It has
             to exist: a ring translated 190px at rest would otherwise
             sit outside the column and put horizontal scroll on the
             document — the failure the section glows already had to be
             re-engineered around. Clipping HERE is safe where clipping
             a section is not, because there is no `position: sticky`
             anywhere inside this box, and the clip is what makes the
             rings read as sliding in from off-stage. */}
      <div className="word-orbit-stage">
        <span aria-hidden="true" className="word-orbit-rings">
          <span className="word-orbit-ring-shell word-orbit-ring-shell-outer">
            <span className="word-orbit-ring emblem-orbit-slow" />
          </span>
          <span className="word-orbit-ring-shell word-orbit-ring-shell-inner">
            <span className="word-orbit-ring word-orbit-ring-dashed emblem-orbit-reverse" />
          </span>
          <span
            className="emblem-breathe absolute rounded-full bg-brand-300/12 blur-2xl"
            style={{ inset: '28%' }}
          />
        </span>
      </div>

      {/* ── The centre ─────────────────────────────────────────
             The mark at rest; the active value's description once one
             is chosen. Both are always mounted and cross-faded, so the
             panel does not reflow the ring as it appears and a screen
             reader is not handed a node that pops in and out.

             `aria-live="polite"` because the text changes in response
             to a hover the user may not have meant as a command — it
             should be announced when the reader is idle, never
             interrupt. */}
      <div className="word-orbit-core">
        {/* Same nesting, same reason: `emblem-float` owns the mark's
            `transform`, so the half-turn goes on a shell around it.
            It also fixes something that was quietly broken before —
            `.is-active .word-orbit-mark { transform: scale(0.8) }` was
            competing with the float animation and losing, so the mark
            faded without ever shrinking. On the shell it works. */}
        <span aria-hidden="true" className="word-orbit-mark-shell">
          {/* The size is a UTILITY, not the `block-size: 4rem` that
              `.word-orbit-mark` used to declare. That declaration
              never once applied: `Spiral` defaults to `h-6`, Tailwind
              emits it from the `utilities` layer, and utilities
              outrank `@layer components` however specific the
              selector — the same trap `.btn-press` documents in
              layout.css. So the mark at the centre of a 480px ring
              has been rendering at 24px against a design that asked
              for 64. `cn` is tailwind-merge, so naming the height
              here drops the default instead of racing it. */}
          <Spiral aria-hidden="true" className="word-orbit-mark emblem-float h-12 sm:h-16" />
        </span>
        <div className="word-orbit-readout" aria-live="polite">
          {active ? (
            <>
              <p className="word-orbit-readout-title">{active.title}</p>
              {active.description ? (
                <p className="word-orbit-readout-body">{active.description}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* ── The words ──────────────────────────────────────────
             Real buttons: focusable, in reading order, and operable
             from the keyboard with no roving-tabindex machinery —
             five buttons is a short tab run and each one is a
             legitimate stop. `aria-pressed` carries the pinned state,
             which is what a toggle button is. */}
      {values.map((value, index) => (
        <span key={value.id} className="word-orbit-slot" style={place(index, values.length)}>
          <button
            type="button"
            aria-pressed={pinned === value.id}
            // The chip's place in the arrival sequence. Inline because
            // it is a per-index value, which no utility class can
            // express; the delay it feeds is built from motion tokens
            // in CSS, so it collapses with everything else under
            // prefers-reduced-motion.
            style={{ '--chip-index': index }}
            className={cn('word-orbit-word', activeId === value.id && 'is-on')}
            onPointerEnter={() => setPreview(value.id)}
            onFocus={() => setPreview(value.id)}
            onBlur={() => setPreview(null)}
            onClick={() => setPinned((current) => (current === value.id ? null : value.id))}
          >
            {value.title}
          </button>
        </span>
      ))}
    </div>
  );
}

export default WordOrbit;
