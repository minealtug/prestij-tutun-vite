import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 text-center',
        compact ? 'px-4 py-8' : 'px-6 py-10',
        className,
      )}
    >
      <div
        className={cn(
          'mb-3 flex items-center justify-center rounded-full bg-primary-500/10 text-primary-600',
          compact ? 'h-10 w-10' : 'h-12 w-12',
        )}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} aria-hidden />
      </div>
      <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>
      {description && (
        <p className={cn('mt-1.5 max-w-sm text-muted', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}
    </div>
  )
}
