import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-border/80', className)}
      aria-hidden
    />
  )
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card !p-4 hover:translate-y-0">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonActivityList({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  )
}
