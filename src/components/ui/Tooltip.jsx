import { useId, useState } from 'react';

import { cn } from '@utils/cn.js';

/* ================================================================
   TOOLTIP — supplementary text on hover or focus.

   Placement is LOGICAL. `start` / `end` follow the writing direction
   via `start-full` / `end-full` + `translate-x` stated per direction,
   so a tooltip placed at "start" appears on the right in RTL. The
   design-system source uses `left` / `right` and would put it on the
   wrong side of every control on this site.

   The trigger is described by the bubble, not labelled by it: a
   tooltip supplements an existing accessible name, it does not
   replace one. Icon-only controls still need their own `label`.

   Never put essential information in here — it is unreachable on
   touch, where there is no hover.
   ================================================================ */

const placements = {
  top: 'bottom-full start-1/2 rtl:translate-x-1/2 ltr:-translate-x-1/2 mb-2',
  bottom: 'top-full start-1/2 rtl:translate-x-1/2 ltr:-translate-x-1/2 mt-2',
  start: 'end-full top-1/2 -translate-y-1/2 me-2',
  end: 'start-full top-1/2 -translate-y-1/2 ms-2',
};

export function Tooltip({ children, content, placement = 'top', className }) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tooltipId : undefined} className="inline-flex">
        {children}
      </span>

      {visible ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-sm bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-e2',
            placements[placement] ?? placements.top,
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

export default Tooltip;
