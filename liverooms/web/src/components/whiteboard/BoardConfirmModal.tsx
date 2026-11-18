import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * C-213 / C-252: centered confirm — portal to body so pointer-events
 * from board overlays cannot steal clicks; Escape closes; focus moves in.
 */
export function BoardConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Подтвердить',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => cancelRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const node = (
    <div
      className="board-confirm-backdrop"
      role="presentation"
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onCancel();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="board-confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="board-confirm-title">
          {title}
        </h2>
        <p className="board-confirm-body">{body}</p>
        <div className="board-confirm-actions">
          <button
            ref={cancelRef}
            type="button"
            className="campus-btn-secondary"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            type="button"
            className={
              danger
                ? 'campus-btn-primary board-confirm-danger'
                : 'campus-btn-primary'
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
