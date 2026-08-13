import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'

interface SnackbarProps {
  open: boolean
  message: string
  variant?: 'success' | 'error'
  onClose: () => void
  durationMs?: number
}

export function Snackbar({
  open,
  message,
  variant = 'success',
  onClose,
  durationMs = 6000,
}: SnackbarProps) {
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(timer)
  }, [open, durationMs, onClose, message])

  if (!open || typeof document === 'undefined') return null

  const isSuccess = variant === 'success'

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex max-w-lg items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
          isSuccess
            ? 'border-green-200 bg-green-50 text-green-900'
            : 'border-red-200 bg-red-50 text-red-900',
        )}
      >
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
        ) : (
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
        )}
        <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Kapat"
          className="shrink-0 text-current hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>,
    document.body,
  )
}
