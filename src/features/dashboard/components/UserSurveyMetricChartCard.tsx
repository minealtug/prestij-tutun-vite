import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/Card'

interface UserSurveyMetricChartCardProps {
  label: string
  value: number
  percent: number | null
  color: string
  trackColor?: string
  icon: LucideIcon
  description?: string
  isLoading?: boolean
  className?: string
}

export function UserSurveyMetricChartCard({
  label,
  value,
  percent,
  color,
  trackColor = '#e8edf2',
  icon: Icon,
  description,
  isLoading = false,
  className,
}: UserSurveyMetricChartCardProps) {
  const safePercent = percent ?? 0
  const chartData = [
    { name: 'value', value: safePercent },
    { name: 'rest', value: Math.max(0, 100 - safePercent) },
  ]

  return (
    <Card className={cn('!p-4', className)} interactive={false}>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-foreground/5">
              <span className="text-xs text-muted">…</span>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={30}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill={color} />
                    <Cell fill={trackColor} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-foreground">
                  {percent != null ? `%${safePercent}` : '—'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {isLoading ? '…' : value.toLocaleString('tr-TR')}
              </p>
              {description ? (
                <p className="mt-0.5 text-xs text-muted">{description}</p>
              ) : null}
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
