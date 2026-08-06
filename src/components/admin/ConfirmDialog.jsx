import { Button, Modal } from '@components/ui';

/* ================================================================
   Confirmation for destructive actions.

   Deliberately not used for saving or publishing: a confirm on every
   ordinary action is a confirm nobody reads by the third day. This
   is for deletes and for taking a live page down — the actions whose
   damage is not visible on the screen you are looking at.
   ================================================================ */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'حذف',
  cancelLabel = 'تراجع',
  busy = false,
  tone = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={busy} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink-secondary">{children}</div>
    </Modal>
  );
}

export default ConfirmDialog;
