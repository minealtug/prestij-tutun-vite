import {
  Baby,
  Home,
  Users,
  UserRound,
  VenusAndMars,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import type { AgeGenderKpis } from '../types/age-gender-report.types'

interface AgeGenderKpiCardsProps {
  kpis: AgeGenderKpis
  loading?: boolean
}

function displayValue(value: number | null | undefined, loading: boolean, suffix = '') {
  if (loading) return '…'
  if (value == null) return '—'
  return `${value.toLocaleString('tr-TR')}${suffix}`
}

export function AgeGenderKpiCards({ kpis, loading = false }: AgeGenderKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      <StatCard
        label="Analiz edilen yetiştirici"
        value={displayValue(kpis.analyzedGrowerCount, loading)}
        icon={Users}
        variant="default"
        trend="Filtreye uyan, kayıtlı yetiştirici"
      />
      <StatCard
        label="Ort. yetiştirici yaşı"
        value={displayValue(kpis.avgGrowerAge, loading)}
        icon={UserRound}
        variant="default"
        trend="Doğum tarihinden hesaplanır"
      />
      <StatCard
        label="Ort. hane büyüklüğü"
        value={displayValue(kpis.avgHouseholdSize, loading)}
        icon={Home}
        variant="success"
        trend="Yetiştirici + çocuk sayısı"
      />
      <StatCard
        label="0–18 yaş çocuk oranı"
        value={displayValue(kpis.childUnder18Ratio, loading, '%')}
        icon={Baby}
        variant="warning"
        trend="Toplam nüfus içindeki pay"
      />
      <StatCard
        label="Kadın / erkek çocuk"
        value={
          loading
            ? '…'
            : kpis.femaleChildRatio != null && kpis.maleChildRatio != null
              ? `%${kpis.femaleChildRatio} / %${kpis.maleChildRatio}`
              : '—'
        }
        icon={VenusAndMars}
        variant="muted"
        trend="Tüm çocuklar üzerinden"
        className="col-span-2 xl:col-span-1"
      />
    </div>
  )
}
