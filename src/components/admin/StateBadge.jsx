import { Badge, Select } from '@components/ui';
import { PUBLISH_STATE } from '@utils/constants.js';

import { STATE_LABELS, STATE_OPTIONS, STATE_TONES } from './publishStates.js';

/* ================================================================
   The publish-state pill and its picker. The vocabulary itself lives
   in `publishStates.js` — see that file for why.
   ================================================================ */

export function StateBadge({ state, size = 'sm' }) {
  return (
    <Badge tone={STATE_TONES[state] ?? 'neutral'} size={size} dot>
      {STATE_LABELS[state] ?? state}
    </Badge>
  );
}

export function StateSelect({ value, onChange, ...rest }) {
  return (
    <Select
      label="حالة النشر"
      options={STATE_OPTIONS}
      value={value ?? PUBLISH_STATE.DRAFT}
      onChange={(event) => onChange(event.target.value)}
      {...rest}
    />
  );
}

export default StateBadge;
