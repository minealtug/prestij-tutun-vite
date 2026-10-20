import { useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, CircleOff, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { UserSurveyMetricChartCard } from './UserSurveyMetricChartCard'
import {
  AdminMintikaFillBarChart,
  type AdminMintikaFillFocus,
} from './AdminMintikaFillBarChart'
import type { AnketGirisDurumuSayilari } from '@/features/survey-responses/types/survey-response.types'
import type { AdminFieldFillSummary } from '../utils/admin-dashboard-stats'
import type { MintikaEkiciFillRow } from '../utils/compute-ekici-survey-coverage'

interface AdminFieldFillSummarySectionProps {
  summary: AdminFieldFillSummary
  mintikaRows: MintikaEkiciFillRow[]
  statusCounts?: AnketGirisDurumuSayilari
  isLoading?: boolean
}

function getStatusPercent(count: number, total: number): number | null {
  if (total <= 0) return null
  return Math.round((count / total) * 100)
}

export function AdminFieldFillSummarySection({
  summary,
  mintikaRows,
  statusCounts,
  isLoading = false,
}: AdminFieldFillSummarySectionProps) {
  const [focus, setFocus] = useState<AdminMintikaFillFocus | null>(null)
  const coverageTotals = useMemo(
    () => ({
      totalEkici: statusCounts?.toplamEkiciSayisi ?? 0,
      completedEkici: statusCounts?.tamamlananAnketSayisi ?? 0,
      partialEkici: statusCounts?.yarimKalanAnketSayisi ?? 0,
      untouchedEkici: statusCounts?.girisYokSayisi ?? 0,
    }),
    [statusCounts],
  )
  const tamamlanmaTrend =
    mintikaRows.length > 0
      ? 'Mıntıka bazında ekici ve anket doluluk sayıları'
      : 'Henüz form kaydı yok'

  const toggleFocus = (next: AdminMintikaFillFocus) => {
    setFocus((current) => (current === next ? null : next))
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <Card title="Saha doluluk özeti" description={tamamlanmaTrend} interactive={false}>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PeriodStat label="Bugün tamamlanan" value={summary.today.completed} tone="emerald" isLoading={isLoading} />
          <PeriodStat label="Bugün yarım" value={summary.today.partial} tone="amber" isLoading={isLoading} />
          <PeriodStat label="Bu hafta tamamlanan" value={summary.week.completed} tone="emerald" isLoading={isLoading} />
          <PeriodStat label="Bu hafta yarım" value={summary.week.partial} tone="amber" isLoading={isLoading} />
        </div>
        <AdminMintikaFillBarChart rows={mintikaRows} isLoading={isLoading} focus={focus} />
      </Card>

      <div className="flex flex-col gap-4">
        <UserSurveyMetricChartCard
          label="Tüm ekiciler"
          value={coverageTotals.totalEkici}
          percent={getStatusPercent(coverageTotals.totalEkici, coverageTotals.totalEkici)}
          color="#1a3d5c"
          icon={Users}
          description="Tamamlanan, yarım kalan ve giriş yok toplamı"
          isLoading={isLoading}
          selected={focus === 'totalEkici'}
          onSelect={() => toggleFocus('totalEkici')}
        />
        <UserSurveyMetricChartCard
          label="Tamamlanan"
          value={coverageTotals.completedEkici}
          percent={getStatusPercent(coverageTotals.completedEkici, coverageTotals.totalEkici)}
          color="#10b981"
          icon={CheckCircle2}
          description="Tamamlanan anket sayısı"
          isLoading={isLoading}
          selected={focus === 'completedEkici'}
          onSelect={() => toggleFocus('completedEkici')}
        />
        <UserSurveyMetricChartCard
          label="Yarım kalan"
          value={coverageTotals.partialEkici}
          percent={getStatusPercent(coverageTotals.partialEkici, coverageTotals.totalEkici)}
          color="#f59e0b"
          icon={CircleAlert}
          description="Yarım kalan anket sayısı"
          isLoading={isLoading}
          selected={focus === 'partialEkici'}
          onSelect={() => toggleFocus('partialEkici')}
        />
        <UserSurveyMetricChartCard
          label="Giriş yok"
          value={coverageTotals.untouchedEkici}
          percent={getStatusPercent(coverageTotals.untouchedEkici, coverageTotals.totalEkici)}
          color="#94a3b8"
          icon={CircleOff}
          description="Hiç anket girişi yapılmayan ekiciler"
          isLoading={isLoading}
          selected={focus === 'untouchedEkici'}
          onSelect={() => toggleFocus('untouchedEkici')}
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
