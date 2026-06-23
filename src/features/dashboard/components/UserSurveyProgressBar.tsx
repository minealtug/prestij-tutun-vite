import { cn } from '@/lib/utils/cn'

interface UserSurveyProgressBarProps {
  percent: number
  className?: string
  barClassName?: string
}

export function UserSurveyProgressBar({
  percent,
  className,
  barClassName,
}: UserSurveyProgressBarProps) {
  const safePercent = Math.min(100, Math.max(0, percent))

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-foreground/10', className)}>
      <div
        className={cn('h-full rounded-full bg-primary-500 transition-all', barClassName)}
        style={{ width: `${safePercent}%` }}
        role="progressbar"
        aria-valuenow={safePercent}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
