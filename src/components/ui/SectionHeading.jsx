import { Reveal } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';

/* ================================================================
   SECTION HEADING — eyebrow / title / lede, the block that opens
   almost every marketing section.

   `tone="inverse"` is for the dark bands (hero, impact stats,
   programs, footer). Everything else stays on light `bg-app`,
   because long-form Arabic body copy never sits on a dark or
   glowing surface (CLAUDE.md, brand rules).

   The eyebrow is NOT uppercased. The design-system source applies
   `text-transform: uppercase`, which is a no-op on Arabic and only
   ever shouts at the occasional Latin word mixed into it.
   ================================================================ */

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'start',
  tone = 'default',
  as: Tag = 'h2',
  className,
  children,
}) {
  const inverse = tone === 'inverse';

  return (
    <div
      className={cn(
        'flex max-w-2xl flex-col gap-4',
        align === 'center' && 'mx-auto items-center text-center',
        align === 'start' && 'text-start',
        className,
      )}
    >
      {eyebrow ? (
        <Reveal
          as="p"
          className={cn(
            // The rule is what makes an eyebrow read as a label
            // rather than as a stray small line of text. It leads in
            // RTL because it is `me-` — the mark sits to the right of
            // the words, where the eye starts.
            'inline-flex items-center gap-2.5 text-xs font-semibold tracking-wide',
            align === 'center' && 'justify-center',
            inverse ? 'text-brand-200' : 'text-accent-600',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-0.5 w-6 shrink-0 rounded-full',
              inverse ? 'bg-brand-200/70' : 'bg-accent-500',
            )}
          />
          {eyebrow}
        </Reveal>
      ) : null}

      {title ? (
        <Reveal delay={eyebrow ? 1 : 0}>
          <Tag
            className={cn(
              'text-2xl font-bold md:text-3xl lg:text-4xl',
              inverse ? 'text-white' : 'text-ink',
            )}
          >
            {title}
          </Tag>
        </Reveal>
      ) : null}

      {lede ? (
        <Reveal
          as="p"
          delay={2}
          className={cn(
            'text-base leading-relaxed',
            inverse ? 'text-brand-100/80' : 'text-ink-secondary',
          )}
        >
          {lede}
        </Reveal>
      ) : null}

      {children}
    </div>
  );
}

export default SectionHeading;
