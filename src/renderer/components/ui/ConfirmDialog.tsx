import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  const dialog = (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="modal-content">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="form-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
            disabled={Boolean(busy)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            type="button"
            busy={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return dialog;
  }

  return createPortal(dialog, document.body);
}

ConfirmDialog.defaultProps = {
  cancelLabel: 'Cancel',
  confirmVariant: 'primary',
  busy: false,
};
