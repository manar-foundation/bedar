import { ArrowLeft } from 'lucide-react';

import { Button } from './Button.jsx';
import { Spiral } from './Spiral.jsx';
import { Reveal } from '@components/motion/Reveal.jsx';
import { cn } from '@utils/cn.js';

/**
 * The closing call-to-action band. The same block ends several
 * marketing pages, so it is one component fed by page data rather
 * than four near-identical copies.
 *
 * Uses the dark treatment — allowed here because it carries a
 * heading and a button, not long-form body copy.
 */
export function CtaBand({ eyebrow, title, cta, className }) {
  return (
    <section className={cn('surface-dark relative overflow-hidden', className)}>
      <div className="container-page py-16 lg:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <Reveal>
            <Spiral className="size-9 text-brand-200" />
          </Reveal>

          {eyebrow ? (
            <Reveal as="p" delay={1} className="text-xs font-semibold tracking-wide text-brand-200">
              {eyebrow}
            </Reveal>
          ) : null}

          <Reveal delay={2}>
            <h2 className="text-2xl font-bold text-white md:text-3xl">{title}</h2>
          </Reveal>

          {cta ? (
            <Reveal delay={3} className="mt-2">
              {/* ArrowLeft unmirrored — in RTL "forward" is leftward. */}
              <Button
                variant="accent"
                size="lg"
                to={cta.href}
                iconEnd={<ArrowLeft className="size-4" aria-hidden="true" />}
              >
                {cta.label}
              </Button>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default CtaBand;
