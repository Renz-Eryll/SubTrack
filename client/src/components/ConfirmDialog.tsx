import type { ReactNode } from "react";
import Modal from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-sm text-muted">{children}</div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-ghost">
          Keep it
        </button>
        <button type="button" onClick={onConfirm} disabled={pending} className="btn-danger">
          {pending ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
