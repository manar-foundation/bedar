import { useRef } from 'react';

import { cn } from '@utils/cn.js';

/* ================================================================
   TABS — the ARIA tabs pattern, not a row of buttons.

   Two things the design-system source leaves out, both of which are
   what makes tabs usable rather than decorative:

     • roles + roving tabindex — one tab stop for the whole strip,
       arrows move between tabs, Home/End jump to the ends
     • RTL arrow semantics — in RTL, ArrowLeft moves FORWARD. Reusing
       the LTR mapping makes the arrows feel reversed on this site.

   Panels are rendered by the caller; wire them with
   `id={`panel-${value}`}` and `aria-labelledby={`tab-${value}`}`.
   ================================================================ */

export function Tabs({ tabs = [], value, onChange, idPrefix = 'tab', className }) {
  const listRef = useRef(null);

  const focusTab = (index) => {
    const buttons = listRef.current?.querySelectorAll('[role="tab"]');
    const target = buttons?.[index];
    if (target) {
      target.focus();
      onChange?.(tabs[index].value);
    }
  };

  const handleKeyDown = (event) => {
    const rtl = document.documentElement.dir === 'rtl';
    const current = tabs.findIndex((tab) => tab.value === value);
    if (current < 0) return;

    // "Forward" is leftward in RTL — swap the two arrow keys rather
    // than swapping the meaning of next/previous.
    const forwardKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backKey = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === forwardKey) {
      event.preventDefault();
      focusTab((current + 1) % tabs.length);
    } else if (event.key === backKey) {
      event.preventDefault();
      focusTab((current - 1 + tabs.length) % tabs.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTab(tabs.length - 1);
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn('flex gap-1 overflow-x-auto border-b border-default', className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${idPrefix}-${tab.value}`}
            aria-selected={active}
            aria-controls={`panel-${tab.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              '-mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm',
              'transition-[color,border-color] duration-(--dur-fast) ease-(--ease-standard)',
              'focus-visible:outline-none focus-visible:shadow-focus',
              active
                ? 'border-action-primary font-semibold text-ink'
                : 'border-transparent font-medium text-ink-secondary hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
