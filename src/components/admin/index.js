/* ================================================================
   Dashboard-only building blocks.

   Separate from `@components/ui` on purpose. Several of these reach
   the Supabase client (MediaPicker, ImageField), and the ui barrel
   is imported by every public page — one stray re-export there would
   put ~53 kB of `@supabase/supabase-js` into the public bundle. The
   rule is checked after every routing change:

     npm run build && grep -c supabase dist/index.html   # → 0
   ================================================================ */

export { AdminPage } from './AdminPage.jsx';
export { DataState } from './DataState.jsx';
export { StateBadge, StateSelect } from './StateBadge.jsx';
export { STATE_LABELS, STATE_OPTIONS, STATE_TONES } from './publishStates.js';
export { SaveBar } from './SaveBar.jsx';
export { ConfirmDialog } from './ConfirmDialog.jsx';
export { MediaPicker, MediaThumb } from './MediaPicker.jsx';
export { ImageField } from './ImageField.jsx';
export { RichTextEditor } from './RichTextEditor.jsx';
export { IconAction } from './IconAction.jsx';
export { ListEditor } from './ListEditor.jsx';
export { FieldEditor } from './FieldEditor.jsx';
export { SeoSection } from './SeoSection.jsx';
export { fieldLabel, sectionLabel, groupFields } from './fieldLabels.js';
