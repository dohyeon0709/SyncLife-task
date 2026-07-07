interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <p>{message}</p>
        <div className="form-actions">
          <button type="button" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
