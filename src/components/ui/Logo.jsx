import { Link } from 'react-router-dom';

import logoUrl from '@assets/bedar-logo.svg';
import logoWhiteUrl from '@assets/bedar-logo-white.svg';
import { cn } from '@utils/cn.js';

/**
 * Bedar wordmark + spiral, linked to home.
 *
 * Two source files, not one recoloured with a CSS filter: a navy/teal
 * version for light backgrounds and a plain white silhouette for the
 * floating navbar over the dark hero. `brightness-0 invert` used to
 * do this from a single SVG, but it also crushed the two-tone mark to
 * flat white with a soft drop-shadow hack — swapping the real white
 * asset in via `white` renders crisper and needs no filter/shadow.
 *
 * Rendered as <img> rather than inlined so either file can be swapped
 * without touching code. `dir="ltr"` is not needed: the artwork is a
 * single fixed image and must never mirror in RTL.
 */
export function Logo({ className, to = '/', label = 'بدار — الصفحة الرئيسية', white = false }) {
  const image = (
    <img
      src={white ? logoWhiteUrl : logoUrl}
      alt={to ? '' : 'بدار'}
      aria-hidden={to ? 'true' : undefined}
      className={cn('h-9 w-auto md:h-10', className)}
      width={341}
      height={104}
      draggable="false"
    />
  );

  if (!to) return image;

  return (
    <Link
      to={to}
      aria-label={label}
      className="inline-flex shrink-0 items-center rounded-md transition-opacity duration-(--dur-fast) hover:opacity-80"
    >
      {image}
    </Link>
  );
}

export default Logo;
