import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';

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
          // Matches the plain nav links exactly — a group must not
          // read as a different kind of item just because it opens.
          'inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[0.9375rem] font-normal',
          'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
          'focus-visible:outline-none focus-visible:shadow-focus',
          floating
            ? active || open
              ? 'text-white'
              : 'text-white/80 hover:text-white'
            : active || open
              ? 'text-brand-200'
              : 'text-ink-secondary hover:text-brand-200',
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
            // of the trigger — the right edge in RTL. `mt-3` clears
            // the header's hairline so the panel reads as hanging
            // from the bar rather than growing out of the label.
            className="absolute top-full start-0 z-50 mt-3 w-72 overflow-hidden rounded-xl border border-subtle bg-surface p-2 shadow-e4 backdrop-blur-xl"
          >
            {item.children.map((child) => (
              <li key={child.id} role="none">
                <NavLink
                  to={child.href}
                  role="menuitem"
                  className={({ isActive }) =>
                    cn(
                      // `group/item`, not `group` — the trigger row is
                      // already inside one, and an unnamed nested group
                      // makes `group-hover:` on the arrow fire for the
                      // whole menu instead of for the row under the
                      // pointer.
                      'group/item flex items-center justify-between gap-3 rounded-lg px-3.5 py-3 text-sm no-underline',
                      'transition-colors duration-(--dur-fast) ease-(--ease-standard)',
                      isActive
                        ? 'bg-[var(--state-selected-tint)] font-medium text-brand-200'
                        : 'text-ink-secondary hover:bg-[var(--state-hover-tint)] hover:text-brand-200',
                    )
                  }
                >
                  <span>{child.label}</span>
                  {/* Plain ArrowLeft: in RTL "go there" points left. */}
                  <ArrowLeft
                    aria-hidden="true"
                    className="size-4 shrink-0 opacity-0 transition-[opacity,transform] duration-(--dur-base) ease-(--ease-standard) group-hover/item:-translate-x-0.5 group-hover/item:opacity-100"
                  />
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
