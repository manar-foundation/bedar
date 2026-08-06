import { Link } from 'react-router-dom';

import { cn } from '@utils/cn.js';

/* ================================================================
   CARD — 14px radius, hairline border, teal-tinted elevation.

   `interactive` gives the 2px lift the design system specifies. It
   is CSS hover, not React state, so it costs nothing and works on a
   card rendered inside a list of fifty.

   If a card is clickable, pass `to` / `href` — it renders as a real
   link so the whole surface is one tab stop with a real target,
   instead of a div with an onClick that keyboard users cannot reach.
   ================================================================ */

const elevations = {
  0: 'shadow-none',
  1: 'shadow-e1',
  2: 'shadow-e2',
  3: 'shadow-e3',
};

const hoverElevations = {
  0: 'hover:shadow-e1',
  1: 'hover:shadow-e2',
  2: 'hover:shadow-e3',
  3: 'hover:shadow-e4',
};

export function Card({
  children,
  elevation = 1,
  interactive = false,
  padded = true,
  className,
  to,
  href,
  ...rest
}) {
  const classes = cn(
    'flex flex-col rounded-lg border border-subtle bg-surface text-ink no-underline',
    elevations[elevation] ?? elevations[1],
    padded && 'p-6',
    interactive && [
      'transition-[transform,box-shadow] duration-(--dur-base) ease-(--ease-standard)',
      'hover:-translate-y-0.5 hover:text-ink',
      hoverElevations[elevation] ?? hoverElevations[1],
      'focus-visible:outline-none focus-visible:shadow-focus',
    ],
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export default Card;
