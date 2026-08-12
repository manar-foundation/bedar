import { cn } from '@utils/cn.js';

/* ================================================================
   SECTION — the marketing band: `<section>` + page container +
   vertical rhythm, in one place.

   Every public page used to open each band with the same three
   lines:

       <section className="section-glow">
         <div className="container-page section-y">

   which meant the site's rhythm was a string repeated in nine files.
   Changing it anywhere meant changing it everywhere, and the pages
   had already drifted — some bands carried the container on the
   <section> itself, some on an inner div, so their glows clipped
   differently. This is that boilerplate as one component.

   PROPS
   ----------------------------------------------------------------
   `tone`   the surface treatment (animations.css). On the public
            site — which is dark-only and renders as ONE continuous
            surface — these paint glows, not opaque blocks.
   `size`   vertical rhythm. `base` is the 96/120px default every
            band uses; `sm` and `lg` are for the bands that open or
            close a run and need to breathe differently.
   `bleed`  drop the container, for a band whose content is a panel
            that manages its own width.

   `innerClassName` reaches the container, which is what a section
   needs when its content is a grid that has to align with the
   container rather than with the section's padding box.
   ================================================================ */

const tones = {
  plain: '',
  glow: 'section-glow',
  'glow-alt': 'section-glow section-glow-alt',
  wash: 'section-wash',
  dark: 'surface-dark',
};

const sizes = {
  sm: 'section-y-sm',
  base: 'section-y',
  lg: 'section-y-lg',
};

export function Section({
  as: Tag = 'section',
  tone = 'plain',
  size = 'base',
  bleed = false,
  className,
  innerClassName,
  children,
  ...rest
}) {
  const glowing = tone === 'glow' || tone === 'glow-alt';

  return (
    <Tag className={cn('relative', tones[tone] ?? tones.plain, className)} {...rest}>
      {/* The glow's clipping layer is a SIBLING of the content, never
          an ancestor of it. It has to be `overflow: hidden` (a
          `clip-path` would leave the blurred circles in the page's
          scrollable area and put horizontal scroll on the document),
          and `overflow: hidden` on an ancestor is exactly what stops
          a `position: sticky` column from ever pinning. Keeping the
          clip out here is what lets a `<StickySplit>` live inside a
          glowing band. See `.section-glow-layer` in animations.css. */}
      {glowing ? (
        <div aria-hidden="true" className="section-glow-layer">
          <span />
          <span />
        </div>
      ) : null}

      <div className={cn(!bleed && 'container-page', sizes[size] ?? sizes.base, innerClassName)}>
        {children}
      </div>
    </Tag>
  );
}

export default Section;
