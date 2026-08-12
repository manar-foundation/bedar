import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Menu, X } from 'lucide-react';

import Logo from '@components/ui/Logo.jsx';
import { Button } from '@components/ui/Button.jsx';
import { SocialIcon } from '@components/ui/SocialIcon.jsx';
import { NavDropdown } from './NavDropdown.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { headerCta } from '@content/site.js';
import { cn } from '@utils/cn.js';

/* ================================================================
   NAVBAR — data-driven from `content/site.js` (Infra spec §3).

   The structure mirrors bedar.webflow.io exactly:

     الرئيسية · [منصة بدار ▾] · البرامج · الخدمات · المدونة · الأخبار
     …then تواصل معنا as the accent CTA, NOT as a nav link.

   "منصة بدار" is a group, not a link — on the live site it is a
   Webflow dropdown toggle with no href. An item is a group when it
   carries `children`, so adding or removing one from the dashboard
   never touches this file.

   FLOATING OVER THE HERO
   ----------------------------------------------------------------
   `bedar.webflow.io` runs the header transparent, laid directly over
   the dark hero, with no visible bar until the page scrolls. That is
   the effect here: the header is `fixed`, not `sticky`, so it takes
   no space in flow and every page's Hero (dark by default — see
   `ui/Hero.jsx`) starts at the true top of the viewport, right
   behind it. `Hero`'s top padding is sized to clear `--nav-h` so the
   title never sits under the nav row.

   `floating` = "not scrolled yet". The site is dark-only, so the logo
   is always the white silhouette (the navy/teal wordmark would vanish
   on the dark hero AND on the dark solid header). While floating, nav
   labels are white over a soft top-down scrim (`from-black/35`) that
   makes the transparent bar read as the same dark colour as the hero.
   Scroll past ~8px and the header solidifies to a blurred, semi-opaque
   dark surface so section content never shows through behind the row.

   THE THREE-TRACK ROW (restructure)
   ----------------------------------------------------------------
   The reference header is logo / links / CTA with the links CENTRED
   in the bar, and a hairline closing the row. A flex
   `justify-between` cannot do that: the links land wherever the two
   outer blocks leave them, so the menu drifts as the CTA label
   changes length — and the CTA label is dashboard-editable. A
   three-track grid whose middle track is the only flexible one pins
   the menu to the true centre of the container regardless of what
   either side weighs.

   THE HAIRLINE IS SCROLLED-ONLY (client request)
   ----------------------------------------------------------------
   It used to carry in BOTH states — the argument was that floating,
   it was the only thing separating the header from the hero. The
   client asked for it gone at the top of the page and appearing on
   scroll ("مخفي عندما يكون في اعلى الصفحة و يظهر عند التمرير"), so
   the floating border is now transparent and the scrolled one is the
   white hairline. The header already transitions `border-color`, so
   the line FADES in as the bar solidifies rather than snapping on.
   Floating still reads as separated from the hero: the top-down scrim
   below does that job, and on a dark hero the missing line is not
   missed. Do not "restore" the floating hairline without checking.
   ================================================================ */

/** True when the current path is inside this item's subtree. */
function isBranchActive(item, pathname) {
  const hrefs = item.children ? item.children.map((child) => child.href) : [item.href];
  return hrefs.some(
    (href) => href && href !== '/' && (pathname === href || pathname.startsWith(`${href}/`)),
  );
}

export default function Navbar() {
  const { navigation, settings } = useContent();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile sheet whenever the route changes — including on
  // browser back/forward, which an onClick handler would miss.
  // Adjusted during render rather than in an effect so the sheet is
  // never painted open on the new page for a frame.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Lock body scroll behind the mobile sheet.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleGroup = (id) =>
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const floating = !scrolled;

  // The reference sets its nav links a size up from body and at a
  // light weight, which is what stops six items reading as a dense
  // strip of bold labels.
  const linkClasses = ({ isActive }) =>
    cn(
      'relative rounded-md px-3.5 py-2 text-[0.9375rem] font-normal no-underline',
      'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
      floating
        ? isActive
          ? 'text-white'
          : 'text-white/75 hover:text-white'
        : isActive
          ? 'text-brand-200'
          : 'text-ink-secondary hover:text-brand-200',
    );

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 w-full border-b transition-[background-color,box-shadow,backdrop-filter,border-color] duration-(--dur-base) ease-(--ease-standard)',
        scrolled
          ? 'border-white/10 bg-surface/80 shadow-e2 backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      {/* The legibility floor described above — a top-down scrim,
          not a bar. On a dark Hero it is nearly invisible (dark over
          dark); on NotFound's plain light section it is what keeps
          white nav text readable. Fades out once the header goes
          solid, so it never doubles up with `bg-surface`. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/35 via-black/10 to-transparent transition-opacity duration-(--dur-base) ease-(--ease-standard)',
          scrolled ? 'opacity-0' : 'opacity-100',
        )}
      />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-50 focus:rounded-md focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        تخطَّ إلى المحتوى
      </a>

      <nav aria-label="التنقل الرئيسي" className="container-page">
        <div className="grid h-(--nav-h) grid-cols-[auto_1fr] items-center gap-6 lg:grid-cols-[auto_1fr_auto]">
          {/* Dark-only site: the navy/teal wordmark would vanish both
              on the floating dark hero and on the dark solid header, so
              the white silhouette is used in every state. */}
          <Logo white className="transition-opacity duration-(--dur-base) ease-(--ease-standard)" />

          {/* Desktop links — the flexible middle track, so they sit at
              the container's centre whatever the CTA label weighs. */}
          <ul className="hidden items-center justify-center gap-0.5 lg:flex">
            {navigation.map((item) =>
              item.children ? (
                <li key={item.id}>
                  <NavDropdown
                    item={item}
                    active={isBranchActive(item, pathname)}
                    floating={floating}
                  />
                </li>
              ) : (
                <li key={item.id}>
                  <NavLink to={item.href} end={item.href === '/'} className={linkClasses}>
                    {({ isActive }) => (
                      <>
                        {item.label}
                        {isActive ? (
                          <motion.span
                            layoutId="nav-active"
                            className={cn(
                              'absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full',
                              floating ? 'bg-white' : 'bg-brand-200',
                            )}
                            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                          />
                        ) : null}
                      </>
                    )}
                  </NavLink>
                </li>
              ),
            )}
          </ul>

          <div className="flex items-center justify-end gap-2">
            {/* Turquoise CTA — the one place accent-500 is allowed.
                Its own fill + halo already carry it on both a dark
                and a light header, so it does not switch with
                `floating`. The arrow is the reference's `.button-arrow`
                chip; plain <ArrowLeft> because forward is leftward
                in RTL. */}
            <Button
              variant="accent"
              to={headerCta.href}
              className="group hidden lg:inline-flex"
              iconEnd={
                <ArrowLeft
                  aria-hidden="true"
                  className="size-4 transition-transform duration-(--dur-base) ease-(--ease-standard) group-hover:-translate-x-0.5"
                />
              }
            >
              {headerCta.label}
            </Button>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
              className={cn(
                'inline-flex size-11 items-center justify-center rounded-md transition-colors duration-(--dur-fast) focus-visible:outline-none focus-visible:shadow-focus lg:hidden',
                floating
                  ? 'text-white hover:bg-white/10'
                  : 'text-ink hover:bg-[var(--state-hover-tint)]',
              )}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet — groups become accordions rather than hover
          menus, because there is no hover on touch.

          It fills the screen below the header rather than pushing the
          page down. A six-item menu with an open group was already
          taller than a phone, so the old collapsible panel scrolled
          the PAGE behind a header that stayed put — the reference
          uses a full-height panel for the same reason. Body scroll is
          locked while it is open (see the effect above), so the only
          thing that scrolls is the menu itself. */}
      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            key="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-x-0 top-(--nav-h) h-[calc(100dvh-var(--nav-h))] overflow-y-auto overscroll-contain border-t border-subtle bg-app lg:hidden"
          >
            <ul className="container-page flex flex-col gap-1 py-5">
              {navigation.map((item) =>
                item.children ? (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.id)}
                      aria-expanded={openGroups.has(item.id)}
                      aria-controls={`mobile-group-${item.id}`}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-medium',
                        'transition-colors duration-(--dur-fast)',
                        isBranchActive(item, pathname)
                          ? 'text-brand-200'
                          : 'text-ink-secondary hover:bg-[var(--state-hover-tint)]',
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'size-4 transition-transform duration-(--dur-fast) ease-(--ease-standard)',
                          openGroups.has(item.id) && 'rotate-180',
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {openGroups.has(item.id) ? (
                        <motion.ul
                          id={`mobile-group-${item.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                          className="overflow-hidden"
                        >
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <NavLink
                                to={child.href}
                                className={({ isActive }) =>
                                  cn(
                                    // border-s- flips: the rule sits on
                                    // the right in RTL.
                                    'ms-3 block border-s border-subtle ps-4 pe-3 py-2.5 text-sm no-underline',
                                    'transition-colors duration-(--dur-fast)',
                                    isActive
                                      ? 'border-brand-300 font-medium text-brand-200'
                                      : 'text-ink-secondary hover:text-brand-200',
                                  )
                                }
                              >
                                {child.label}
                              </NavLink>
                            </li>
                          ))}
                        </motion.ul>
                      ) : null}
                    </AnimatePresence>
                  </li>
                ) : (
                  <li key={item.id}>
                    <NavLink
                      to={item.href}
                      end={item.href === '/'}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-md px-3 py-3 text-base font-medium no-underline transition-colors duration-(--dur-fast)',
                          isActive
                            ? 'bg-[var(--state-selected-tint)] text-brand-200'
                            : 'text-ink-secondary hover:bg-[var(--state-hover-tint)]',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ),
              )}

              <li className="pt-4">
                <Button variant="accent" size="lg" block to={headerCta.href}>
                  {headerCta.label}
                </Button>
              </li>

              {/* Quick reach — the brief asks for fewer clicks to the
                  things people actually open a nav for. On a phone
                  that is "call/write us" and "find us", which
                  otherwise sit at the very bottom of a long footer.
                  Same `settings` data the footer renders, so nothing
                  is duplicated as copy. */}
              <li className="mt-6 border-t border-subtle pt-6">
                <a
                  href={`mailto:${settings.email}`}
                  className="block text-sm text-ink-secondary no-underline hover:text-brand-200"
                >
                  <span className="ltr-run">{settings.email}</span>
                </a>

                {/* Icon + label, the same marks the footer uses
                    (`SocialIcon`). The label stays: this is a menu, and
                    a row of bare glyphs in a navigation panel is a
                    guessing game — the footer can be icon-only because
                    its chips carry an accessible name and sit in a
                    context people already read as "social". */}
                <ul className="mt-4 flex flex-wrap gap-2">
                  {settings.social.map((account) => (
                    <li key={account.id}>
                      <a
                        href={account.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-subtle px-3.5 py-1.5 text-xs text-ink-secondary no-underline transition-colors duration-(--dur-fast) hover:border-brand-300/40 hover:text-brand-200"
                      >
                        <SocialIcon id={account.id} className="size-3.5 shrink-0" />
                        {account.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
