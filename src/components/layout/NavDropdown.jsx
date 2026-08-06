import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { cn } from '@utils/cn.js';

/* ================================================================
   NAV DROPDOWN — the desktop "منصة بدار" menu.

   The live site opens this on hover (Webflow `data-hover="true"`).
   Hover alone is not an interaction: it does not exist on touch and
   cannot be reached by keyboard. So this opens on hover AND on
   click/Enter/Space, which is the standard disclosure-menu pattern:

     • the trigger is a <button aria-expanded aria-haspopup>, not a
       link — it navigates nowhere, and the live toggle has no href
     • Escape closes it and returns focus to the trigger
     • focus leaving the menu closes it, so tabbing past the group
       does not leave an orphaned panel open over the page
     • a pointerdown anywhere else closes it

   `mouseleave` closes after a short grace period. Closing instantly
   makes the diagonal trip from the trigger down to the second item
   drop the menu out from under the cursor.
   ================================================================ */

const CLOSE_DELAY = 120;

export function NavDropdown({ item, active, floating = false }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(0);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY);
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Outside press. `pointerdown` rather than `click` so the menu is
  // already gone by the time the click lands on whatever is under it.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        // Only close when focus has actually left the group — moving
        // between the trigger and its items must not close it.
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium',
          'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          'focus-visible:outline-none focus-visible:shadow-focus',
          floating
            ? active || open
              ? 'text-white'
              : 'text-white/80 hover:text-white'
            : active || open
              ? 'text-brand-600'
              : 'text-ink-secondary hover:text-brand-600',
        )}
      >
        {item.label}
        {/* ChevronDown is vertical — no RTL mirroring involved. */}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 transition-transform duration-(--dur-fast) ease-(--ease-standard)',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            role="menu"
            aria-label={item.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            // `start-0` so the panel hangs from the reading-start edge
            // of the trigger — the right edge in RTL.
            className="absolute top-full start-0 z-50 mt-1 min-w-56 overflow-hidden rounded-lg border border-subtle bg-surface p-1.5 shadow-e3"
          >
            {item.children.map((child) => (
              <li key={child.id} role="none">
                <NavLink
                  to={child.href}
                  role="menuitem"
                  className={({ isActive }) =>
                    cn(
                      'block rounded-sm px-3 py-2.5 text-sm no-underline',
                      'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
                      isActive
                        ? 'bg-[var(--state-selected-tint)] font-medium text-brand-600'
                        : 'text-ink-secondary hover:bg-[var(--state-hover-tint)] hover:text-brand-600',
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
    </div>
  );
}

export default NavDropdown;
