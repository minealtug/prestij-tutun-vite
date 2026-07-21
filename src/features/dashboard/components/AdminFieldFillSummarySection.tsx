import { CheckCircle2, CircleAlert } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { UserSurveyMetricChartCard } from './UserSurveyMetricChartCard'
import { UserSurveyStatusPieChart } from './UserSurveyStatusPieChart'
import type { AdminFieldFillSummary } from '../utils/admin-dashboard-stats'

interface AdminFieldFillSummarySectionProps {
  summary: AdminFieldFillSummary
  isLoading?: boolean
}

function getStatusPercent(count: number, total: number): number | null {
  if (total <= 0) return null
  return Math.round((count / total) * 100)
}

export function AdminFieldFillSummarySection({
  summary,
  isLoading = false,
}: AdminFieldFillSummarySectionProps) {
  const total = summary.completed + summary.partial
  const tamamlanmaTrend =
    total > 0
      ? `Sistem geneli form tamamlama oranı %${getStatusPercent(summary.completed, total)}`
      : 'Henüz form kaydı yok'

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <Card title="Saha doluluk özeti" description={tamamlanmaTrend} interactive={false}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PeriodStat label="Bugün tamamlanan" value={summary.today.completed} tone="emerald" isLoading={isLoading} />
          <PeriodStat label="Bugün yarım" value={summary.today.partial} tone="amber" isLoading={isLoading} />
          <PeriodStat label="Bu hafta tamamlanan" value={summary.week.completed} tone="emerald" isLoading={isLoading} />
          <PeriodStat label="Bu hafta yarım" value={summary.week.partial} tone="amber" isLoading={isLoading} />
        </div>
        <UserSurveyStatusPieChart
          completed={summary.completed}
          partial={summary.partial}
          isLoading={isLoading}
        />
      </Card>

      <div className="flex flex-col gap-4">
        <UserSurveyMetricChartCard
          label="Tamamlanan"
          value={summary.completed}
          percent={getStatusPercent(summary.completed, total)}
          color="#10b981"
          icon={CheckCircle2}
          description="Sistem genelindeki tamamlanmış formlar"
          isLoading={isLoading}
        />
        <UserSurveyMetricChartCard
          label="Yarım kalan"
          value={summary.partial}
          percent={getStatusPercent(summary.partial, total)}
          color="#f59e0b"
          icon={CircleAlert}
          description="Devam edilmesi gereken formlar"
          isLoading={isLoading}
        />
      </div>
    </section>
  )
}

function PeriodStat({
  label,
  value,
  tone,
  isLoading,
}: {
  label: string
  value: number
  tone: 'emerald' | 'amber'
  isLoading: boolean
}) {
  return (
    <div
      className={
        tone === 'emerald'
          ? 'rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5'
          : 'rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2.5'
      }
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">
        {isLoading ? '…' : value.toLocaleString('tr-TR')}
      </p>
    </div>
  )
}
