import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   BUTTON — the Bedar design-system button, ported from
   `Bedar Design System (2)/components/core/Button.jsx`.

   The source ships inline styles plus a React hover state. That is
   fine for a static specimen page and wrong for an app: it costs a
   re-render per pointer-enter, it cannot express :focus-visible or
   :active, and it loses every hover style the moment the button is
   rendered on the server. Same visual result here, expressed as
   Tailwind utilities over the same tokens.

   ACCENT IS SPECIAL. `--accent-500` (turquoise) is reserved for
   primary CTAs and nothing else (CLAUDE.md, brand rules). It is a
   separate variant rather than the default so reaching for it is a
   deliberate act.
   ================================================================ */

/* `btn-press` is the reference template's button hover — it scales
   DOWN rather than lifting. The rule lives in layout.css scoped to
   `.public-site`, so this class is inert inside the dashboard and the
   admin buttons keep the behaviour they have. */
const base =
  'btn-press relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap ' +
  'rounded-md font-semibold no-underline align-middle ' +
  'transition-[background-color,border-color,color,box-shadow,transform] ' +
  'duration-(--dur-fast) ease-(--ease-standard) ' +
  'focus-visible:outline-none focus-visible:shadow-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

/** Heights are the DS values: 32 / 40 / 48px. */
const sizes = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

const variants = {
  /** Teal. The everyday action — forms, admin, secondary CTAs. */
  primary:
    'border border-transparent bg-action-primary text-action-primary-on hover:bg-action-primary-hover active:translate-y-px',
  /** Turquoise + halo. Primary marketing CTAs ONLY. The glow is
      not decoration: this accent sits one step from the primary
      teal, so on a dark hero the halo is what separates a CTA from
      an ordinary button. It fades in on hover, never flashes. */
  accent:
    'border border-transparent bg-action-accent text-action-accent-on shadow-[0_12px_32px_-14px_var(--action-accent-glow)] hover:bg-action-accent-hover hover:text-action-accent-on hover:shadow-[0_18px_42px_-14px_var(--action-accent-glow)] active:translate-y-px',
  secondary: 'border border-default bg-surface text-ink hover:bg-sunken hover:text-ink',
  outline:
    'border border-action-primary bg-transparent text-action-primary hover:bg-[var(--state-hover-tint)] hover:text-action-primary',
  ghost:
    'border border-transparent bg-transparent text-ink hover:bg-[var(--state-hover-tint)] hover:text-ink',
  danger:
    'border border-transparent bg-action-danger text-white hover:bg-[var(--action-danger-hover)] hover:text-white',
  /** For use on `.surface-dark` — hero, footer, programs band. */
  inverse:
    'border border-white/25 bg-transparent text-white hover:border-white/50 hover:bg-white/10 hover:text-white',
};

/**
 * Button, anchor, or router Link — decided by the props, so a CTA
 * that navigates is still a real <a> for middle-click and "open in
 * new tab", and a CTA that acts is still a real <button>.
 *
 *   <Button variant="accent" to="/programs">تعرّف على البرامج</Button>
 *   <Button onClick={save} loading={saving}>حفظ</Button>
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    block = false,
    loading = false,
    disabled = false,
    iconStart,
    iconEnd,
    className,
    to,
    href,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = cn(
    base,
    sizes[size] ?? sizes.md,
    variants[variant] ?? variants.primary,
    block && 'flex w-full',
    className,
  );

  // `iconStart` / `iconEnd` are logical: "start" is the right-hand
  // side in RTL. Flex order handles that for free — no mirroring.
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : iconStart}
      <span>{children}</span>
      {loading ? null : iconEnd}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled && !loading) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
        {...rest}
      >
        {content}
      </a>
    );
  }

  // A disabled link is not a thing in HTML — degrade to a button so
  // the disabled state is actually communicated to assistive tech.
  const isLink = Boolean(to || href);

  return (
    <button
      ref={ref}
      type={isLink ? 'button' : type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
