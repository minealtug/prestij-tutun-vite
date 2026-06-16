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
    <section className="px-1 py-1">
      <div className="mb-4 rounded-none border-2 border-slate-300 bg-background px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Seçili filtre</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{filterSummary}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cevaplanmış soru"
          value={displayCount(stats.yanitlananSoruSayisi, isLoading)}
          icon={CheckCircle2}
          variant="default"
          trend={tamamlanmaTrend}
          className="!rounded-none !border !border-sky-400/35 bg-gradient-to-br from-sky-500/6 to-slate-500/4"
          iconContainerClassName="rounded-none"
        />
        <StatCard
          label="Cevaplanmamış soru"
          value={displayCount(stats.yanitlanmayanSoruSayisi, isLoading)}
          icon={CircleAlert}
          variant="default"
          className="!rounded-none !border !border-slate-400/35 bg-gradient-to-br from-slate-500/6 to-slate-500/4"
          iconContainerClassName="rounded-none"
        />
        <StatCard
          label="Toplam soru"
          value={displayCount(stats.toplamSoruSayisi, isLoading)}
          icon={ListChecks}
          variant="default"
          className="!rounded-none !border !border-sky-400/35 bg-gradient-to-br from-sky-500/6 to-slate-500/4"
          iconContainerClassName="rounded-none"
        />
        <StatCard
          label="Anket kaydı"
          value={displayCount(stats.kayitSayisi, isLoading)}
          icon={ClipboardList}
          variant="default"
          className="!rounded-none !border !border-slate-400/35 bg-gradient-to-br from-slate-500/6 to-slate-500/4"
          iconContainerClassName="rounded-none"
        />
      </div>
    </section>
  )
}
