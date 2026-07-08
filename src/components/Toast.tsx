import { useEffect } from 'react'

interface Props {
  message: string | null
  onDismiss: () => void
  onRetry?: () => void
}

export function Toast({ message, onDismiss, onRetry }: Props) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="toast" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          className="toast-retry"
          onClick={() => {
            onRetry()
            onDismiss()
          }}
        >
          재시도
        </button>
      )}
    </div>
  )
}
