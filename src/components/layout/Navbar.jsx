import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';

import Logo from '@components/ui/Logo.jsx';
import { Button } from '@components/ui/Button.jsx';
import { NavDropdown } from './NavDropdown.jsx';
import { useContent } from '@context/ContentContext.jsx';
import { useTheme } from '@context/ThemeContext.jsx';
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

   `floating` = "not scrolled yet". In that state the logo swaps to
   the white silhouette asset (`Logo white` — the navy/teal wordmark
   disappears on `brand-950`) and every nav label switches to white.
   A soft top-down scrim (`from-black/35`) sits
   behind the row for BOTH reasons at once: it is what makes the
   transparent bar read as "the same dark colour as the hero" instead
   of a hard edge, and it is a legibility floor for the one route
   that does not open on a dark Hero — `NotFound` (§14, fixed
   content, no Hero). Scroll past ~8px and the header solidifies to
   `bg-surface` and every colour reverts to ink.
   ================================================================ */

/** True when the current path is inside this item's subtree. */
function isBranchActive(item, pathname) {
  const hrefs = item.children ? item.children.map((child) => child.href) : [item.href];
  return hrefs.some(
    (href) => href && href !== '/' && (pathname === href || pathname.startsWith(`${href}/`)),
  );
}

export default function Navbar() {
  const { navigation } = useContent();
  const { isDark, toggleTheme } = useTheme();
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

  const linkClasses = ({ isActive }) =>
    cn(
      'relative rounded-md px-3 py-2 text-sm font-medium no-underline',
      'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
      floating
        ? isActive
          ? 'text-white'
          : 'text-white/80 hover:text-white'
        : isActive
          ? 'text-brand-600'
          : 'text-ink-secondary hover:text-brand-600',
    );

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 w-full transition-[background-color,box-shadow,backdrop-filter] duration-(--dur-base) ease-(--ease-standard)',
        scrolled ? 'bg-surface/85 shadow-e1 backdrop-blur-md' : 'bg-transparent',
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
        <div className="flex h-(--nav-h) items-center justify-between gap-6">
          {/* The navy/teal wordmark is invisible on the dark hero it
              floats over, so the white silhouette asset stands in
              for that state only; it reverts to full colour the
              moment the header solidifies. */}
          {/* White silhouette when floating over the dark hero AND
              whenever the solid header itself is dark (dark theme) —
              the navy/teal wordmark would vanish on `bg-surface` in
              dark mode otherwise. */}
          <Logo
            white={floating || isDark}
            className="transition-opacity duration-(--dur-base) ease-(--ease-standard)"
          />

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 lg:flex">
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
                              floating ? 'bg-white' : 'bg-brand-500',
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

          <div className="flex items-center gap-2">
            {/* Light / dark toggle. Its colour follows `floating` the
                same way the nav links do, so it stays legible over the
                dark hero and on the solid light header alike. */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن'}
              title={isDark ? 'المظهر الفاتح' : 'المظهر الداكن'}
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-md transition-colors duration-(--dur-fast) focus-visible:outline-none focus-visible:shadow-focus',
                floating
                  ? 'text-white/90 hover:bg-white/10 hover:text-white'
                  : 'text-ink-secondary hover:bg-[var(--state-hover-tint)] hover:text-brand-600',
              )}
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>

            {/* Turquoise CTA — the one place accent-500 is allowed.
                Its own fill + halo already carry it on both a dark
                and a light header, so it does not switch with
                `floating`. */}
            <Button variant="accent" to={headerCta.href} className="hidden lg:inline-flex">
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
          menus, because there is no hover on touch. */}
      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            key="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden border-t border-subtle bg-surface lg:hidden"
          >
            <ul className="container-page flex flex-col gap-1 py-4">
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
                          ? 'text-brand-600'
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
                                      ? 'border-brand-500 font-medium text-brand-600'
                                      : 'text-ink-secondary hover:text-brand-600',
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
                            ? 'bg-[var(--state-selected-tint)] text-brand-600'
                            : 'text-ink-secondary hover:bg-[var(--state-hover-tint)]',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ),
              )}

              <li className="pt-2">
                <Button variant="accent" size="lg" block to={headerCta.href}>
                  {headerCta.label}
                </Button>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
