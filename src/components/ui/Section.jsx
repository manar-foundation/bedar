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
   `light`  adjust the band's ambient lighting. Which of the seven
            lighting scenes a band gets is decided by its position in
            the page (`nth-of-type`, animations.css) — that is what
            keeps the site from lighting every band the same way, so
            this is an escape hatch, not a normal prop. `quiet` dims
            whatever scene the band has, for one that should recede
            between two bright neighbours; `none` switches the band's
            own light off entirely (the page-wide field underneath
            still lights it). Neither re-positions anything: for a
            genuinely bespoke band, set the slot custom properties
            inline instead (`style={{ '--lk-x': '20%' }}`).

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

const lights = {
  quiet: 'band-light-quiet',
  none: 'band-light-none',
};

export function Section({
  as: Tag = 'section',
  tone = 'plain',
  size = 'base',
  bleed = false,
  light,
  className,
  innerClassName,
  children,
  ...rest
}) {
  const glowing = tone === 'glow' || tone === 'glow-alt';

  return (
    <Tag
      className={cn('section-band relative', tones[tone] ?? tones.plain, lights[light], className)}
      {...rest}
    >
          {/* Ambient section lighting, and on the dark public site the only
          lighting a reader really sees. A band gets one of seven
          LIGHTING SCENES from a cycle keyed off `nth-of-type` — and
          three of those seven carry no light at all. Not every section
          is lit, on purpose: a page where every band glows has no
          lighting in it, only a tint, and the four lit scenes read as
          deliberate precisely because they arrive after a quiet one.

          That is the second thing this replaced. Before it there were
          seven scenes but all of them lit; before THAT, a four-step
          cycle that gave every band the identical composition and
          varied only which side each orb entered from — which the eye
          learns in two sections. And before that, page-tall light
          columns, one unchanging shape for the whole document, which
          the client read as a rail rather than as lighting.

          A dark band is not a black band: `.page-ambient` on the shell
          is still under it, so it keeps the site's tone and only loses
          its own local shaping.

          Painted on a sibling layer at z-index -1 (`.section-band`
          isolates, so it sits over the band's own surface but under the
          content) and is background-image only, so it can never add to
          the document's scroll width. See `.section-ambient-layer` in
          animations.css. */}
      <div aria-hidden="true" className="section-ambient-layer" />

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
