import { useMemo } from 'react'
import { CheckCircle2, CircleAlert, ClipboardList, ListChecks } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import type { AnketCevapOzetItem } from '../types/survey-response.types'
import { computeSurveyResponseStats } from '../utils/compute-survey-response-stats'

function displayCount(value: number | undefined, loading: boolean) {
  if (loading) return '…'
  if (value === undefined) return '—'
  return value.toLocaleString('tr-TR')
}

interface SurveyResponseStatsCardsProps {
  data: AnketCevapOzetItem[]
  filterSummary: string
  isLoading: boolean
}

export function SurveyResponseStatsCards({
  data,
  filterSummary,
  isLoading,
}: SurveyResponseStatsCardsProps) {
  const stats = useMemo(() => computeSurveyResponseStats(data), [data])

  const tamamlanmaTrend =
    stats.tamamlanmaYuzdesi != null
      ? `Tamamlanma oranı %${stats.tamamlanmaYuzdesi}`
      : 'Henüz soru kaydı yok'

  return (
    <section className="border-t border-border px-5 py-5">
      <div className="mb-4">
        
        <p className="mt-1 text-sm font-medium text-foreground">{filterSummary}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cevaplanmış soru"
          value={displayCount(stats.yanitlananSoruSayisi, isLoading)}
          icon={CheckCircle2}
          variant="success"
          trend={tamamlanmaTrend}
        />
        <StatCard
          label="Cevaplanmamış soru"
          value={displayCount(stats.yanitlanmayanSoruSayisi, isLoading)}
          icon={CircleAlert}
          variant="warning"
        />
        <StatCard
          label="Toplam soru"
          value={displayCount(stats.toplamSoruSayisi, isLoading)}
          icon={ListChecks}
          variant="default"
        />
        <StatCard
          label="Anket kaydı"
          value={displayCount(stats.kayitSayisi, isLoading)}
          icon={ClipboardList}
          variant="muted"
          trend="Filtreye uyan ekici–anket satırı"
        />
      </div>
    </section>
  )
}
