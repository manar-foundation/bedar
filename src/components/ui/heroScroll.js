import { createContext, useContext } from 'react';

/* ================================================================
   HERO SCROLL RANGE — the hero section's own ref, handed to whatever
   artwork the hero was given.

   `Hero` owns the ref because the range a scroll-linked exit is
   measured against has to be the SECTION: the artwork shrinks as it
   goes, and a `useScroll` target that changes size underneath itself
   re-measures into a moving range — the shrink feeds its own
   progress and the whole thing eases out early.

   `HeroArtwork` needs that same range for the photograph alone (the
   drawn arcs stay put), and it is two components down. The obvious
   spellings do not survive contact with the lint rules:
   `cloneElement(visual, { scrollTargetRef })` is a ref passed into a
   function call during render (`react-hooks/refs`), and a render
   prop is the same thing wearing a hat. A context is the one shape
   that passes a ref down without anything reading `.current` on the
   way.

   It lives in its own module, and not in `Hero.jsx`, because a file
   that exports both a component and a non-component breaks Fast
   Refresh — the same reason `ui/fieldStyles.js` exists.

   `null` outside a hero, which is exactly right: an artwork with no
   range renders static.
   ================================================================ */

export const HeroScrollContext = createContext(null);

/** The hero section's ref, or `null` outside one. */
export function useHeroScrollTarget() {
  return useContext(HeroScrollContext);
}
