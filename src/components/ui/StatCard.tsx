import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  variant?: 'default' | 'success' | 'warning' | 'muted'
  className?: string
}

const variantStyles = {
  default: 'bg-primary-500/10 text-primary-600',
  success: 'bg-emerald-500/10 text-emerald-700',
  warning: 'bg-amber-500/10 text-amber-700',
  muted: 'bg-border/60 text-muted',
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'glass-card flex flex-col gap-3 !p-4 hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
        {trend && <p className="mt-0.5 text-xs text-muted">{trend}</p>}
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', variantStyles[variant])}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
    </div>
  )
}
