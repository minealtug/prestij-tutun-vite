import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PageLoaderProps {
  label?: string
  className?: string
  compact?: boolean
}

export function PageLoader({ label = 'Yükleniyor...', className, compact = false }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        compact ? 'gap-2 py-8' : 'gap-3 py-12',
        className,
      )}
    >
      <Loader2 className={cn('animate-spin text-primary-500', compact ? 'h-6 w-6' : 'h-8 w-8')} />
      <p className={cn('text-muted', compact ? 'text-xs' : 'text-sm')}>{label}</p>
    </div>
  )
}
