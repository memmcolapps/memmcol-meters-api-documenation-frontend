import { useRef } from 'react'
import { useDismiss } from './useDismiss'

export function ConfirmModal({
  message,
  confirmLabel,
  tone = 'danger',
  onCancel,
  onConfirm,
}: {
  message: string
  confirmLabel: string
  /** Visual weight of the confirm button: red for destructive, blue otherwise. */
  tone?: 'danger' | 'primary'
  onCancel: () => void
  onConfirm: () => void
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  useDismiss(modalRef, onCancel)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal" ref={modalRef}>
        <div className="modal-head">
          <h2 id="confirm-title" className="modal-title">
            Confirm Action
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
          <div className="modal-foot">
            <button type="button" className="btn-neutral" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className={tone === 'danger' ? 'btn-danger-solid' : 'btn-primary'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
