/* ================================================================
   Bedar design-system components — single import surface.

     import { Button, Card, Input } from '@components/ui';

   Every component here is a Tailwind + token port of the matching
   file in `Bedar Design System (2)/components/`. The ports are
   visually faithful; where they differ it is because the source is
   a static specimen and this is a live RTL app — each of those
   differences is documented in the component that makes it.

   This barrel is for authoring convenience only. It is NOT a code
   boundary: nothing here may import from `@services/supabaseClient`
   or anything that reaches it, because the public site imports from
   this file and Supabase must stay out of the public bundle.
   ================================================================ */

/* ── Core ────────────────────────────────────────────────────── */
export { Button } from './Button.jsx';
export { IconButton } from './IconButton.jsx';
export { Badge } from './Badge.jsx';
export { Tag } from './Tag.jsx';

/* ── Forms ───────────────────────────────────────────────────── */
export { Field } from './Field.jsx';
export { fieldChrome, fieldTone } from './fieldStyles.js';
export { Input } from './Input.jsx';
export { Textarea } from './Textarea.jsx';
export { Select } from './Select.jsx';
export { Checkbox } from './Checkbox.jsx';
export { Radio } from './Radio.jsx';
export { Switch } from './Switch.jsx';
export { FileUpload } from './FileUpload.jsx';

/* ── Surfaces & feedback ─────────────────────────────────────── */
export { Card } from './Card.jsx';
export { Modal } from './Modal.jsx';
export { Tooltip } from './Tooltip.jsx';

/* ── Data & navigation ───────────────────────────────────────── */
export { Table } from './Table.jsx';
export { Tabs } from './Tabs.jsx';
export { Breadcrumbs } from './Breadcrumbs.jsx';
export { Accordion } from './Accordion.jsx';

/* ── Marketing blocks ────────────────────────────────────────── */
export { Hero } from './Hero.jsx';
export { HeroEmblem } from './HeroEmblem.jsx';
export { SectionHeading } from './SectionHeading.jsx';
export { FeatureGrid } from './FeatureGrid.jsx';
export { ContentCard } from './ContentCard.jsx';
export { Testimonial } from './Testimonial.jsx';
export { TestimonialsCarousel } from './TestimonialsCarousel.jsx';
export { StatBand } from './StatBand.jsx';
export { CtaBand } from './CtaBand.jsx';
export { RichText } from './RichText.jsx';

/* ── Brand ───────────────────────────────────────────────────── */
export { Logo } from './Logo.jsx';
export { Spiral, SpiralDivider, SectionSeam } from './Spiral.jsx';
