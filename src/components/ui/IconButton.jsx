import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@utils/cn.js';

/* ================================================================
   ICON BUTTON — square action with no visible text.

   `label` is required, not optional: an icon-only control with no
   accessible name is invisible to a screen reader, and the design
   system says so explicitly ("icon-only buttons require aria-label").
   It is a named prop rather than a raw `aria-label` so it cannot be
   forgotten silently.
   ================================================================ */

const sizes = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-10 [&_svg]:size-5',
  lg: 'size-12 [&_svg]:size-5',
};

const variants = {
  ghost: 'border-transparent bg-transparent text-ink hover:bg-[var(--state-hover-tint)]',
  solid: 'border-transparent bg-sunken text-ink hover:bg-[var(--state-hover-tint)]',
  outline: 'border-default bg-transparent text-ink hover:bg-[var(--state-hover-tint)]',
  primary:
    'border-transparent bg-action-primary text-action-primary-on hover:bg-action-primary-hover',
  inverse: 'border-transparent bg-transparent text-white hover:bg-white/10',
};

export const IconButton = forwardRef(function IconButton(
  {
    children,
    label,
    variant = 'ghost',
    size = 'md',
    className,
    to,
    href,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded-md border no-underline',
    'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
    'focus-visible:outline-none focus-visible:shadow-focus',
    'disabled:pointer-events-none disabled:opacity-50',
    sizes[size] ?? sizes.md,
    variants[variant] ?? variants.ghost,
    className,
  );

  if (to) {
    return (
      <Link ref={ref} to={to} aria-label={label} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    return (
      <a
        ref={ref}
        href={href}
        aria-label={label}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button ref={ref} type={type} aria-label={label} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default IconButton;
