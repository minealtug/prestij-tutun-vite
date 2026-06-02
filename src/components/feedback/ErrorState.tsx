import { AlertTriangle, RefreshCw } from 'lucide-react'
import { getErrorMessage, type AppError } from '@/lib/api/api-error'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
  className?: string
  compact?: boolean
}

export function ErrorState({
  error,
  title = 'Veri yüklenemedi',
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  const message = getErrorMessage(error)
  const isNetwork =
    typeof error === 'object' && error !== null && 'isNetworkError' in error
      ? (error as AppError).isNetworkError
      : false

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/80 text-center',
        compact ? 'px-4 py-6' : 'px-6 py-12',
        className,
      )}
      role="alert"
    >
      <AlertTriangle
        className={cn('text-red-500', compact ? 'mb-2 h-8 w-8' : 'mb-3 h-10 w-10')}
        aria-hidden
      />
      <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-lg')}>
        {title}
      </h3>
      <p className={cn('mt-1.5 max-w-md text-muted', compact ? 'text-xs' : 'text-sm')}>
        {message}
      </p>
      {isNetwork && !compact && (
        <p className="mt-2 text-xs text-muted">
          .NET API henüz hazır değilse bu beklenen bir durumdur.
        </p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className={cn(compact ? 'mt-3' : 'mt-4')} onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Tekrar dene
        </Button>
      )}
    </div>
  )
}
