import { PUBLISH_STATE } from '@utils/constants.js';

/* ================================================================
   Publish-state vocabulary (Dashboard spec §10).

   Split out of `StateBadge.jsx` for the same reason `fieldStyles.js`
   is split out of `Field.jsx`: a module that exports both a
   component and constants breaks Fast Refresh.

   Three states and not a boolean, because "never been live" and
   "deliberately taken down" are different editorial facts — and the
   second one is the interesting one, the state you look for when a
   URL starts returning 404.
   ================================================================ */

export const STATE_LABELS = {
  [PUBLISH_STATE.DRAFT]: 'مسودة',
  [PUBLISH_STATE.PUBLISHED]: 'منشور',
  [PUBLISH_STATE.UNPUBLISHED]: 'غير منشور',
};

export const STATE_TONES = {
  [PUBLISH_STATE.DRAFT]: 'warning',
  [PUBLISH_STATE.PUBLISHED]: 'success',
  [PUBLISH_STATE.UNPUBLISHED]: 'neutral',
};

export const STATE_OPTIONS = Object.entries(STATE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
