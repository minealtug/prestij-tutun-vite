import { Ban, UserRound, UserX, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { AnketGirisDurumuSayilari } from '@/features/survey-responses/types/survey-response.types'
import type { AdminEkiciActivitySummary } from '../utils/admin-dashboard-stats'

interface AdminUserActivityCardProps {
  summary: AdminEkiciActivitySummary
  statusCounts?: AnketGirisDurumuSayilari
  activeCount: number
  withoutTobaccoCount: number
  isLoading?: boolean
  activeLoading?: boolean
  withoutTobaccoLoading?: boolean
}

export function AdminUserActivityCard({
  summary,
  statusCounts,
  activeCount,
  withoutTobaccoCount,
  isLoading = false,
  activeLoading = false,
  withoutTobaccoLoading = false,
}: AdminUserActivityCardProps) {
  const filledEkiciler =
    (statusCounts?.tamamlananAnketSayisi ?? 0) + (statusCounts?.yarimKalanAnketSayisi ?? 0)
  const neverFilled = statusCounts?.girisYokSayisi ?? 0
  const totalEkiciler = statusCounts?.toplamEkiciSayisi ?? summary.totalEkiciler

  return (
    <Card interactive={false} accent>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Ekici aktivitesi</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={Users}
          label="Aktif"
          value={activeCount}
          hint={`Toplam ${totalEkiciler.toLocaleString('tr-TR')}`}
          isLoading={activeLoading}
        />
        <Metric
          icon={Ban}
          label="Tütünü olmayan"
          value={withoutTobaccoCount}
          hint="Kayıtlı ekici"
          isLoading={withoutTobaccoLoading}
        />
        <Metric
          icon={UserRound}
          label="Dolduran"
          value={filledEkiciler}
          hint="En az bir form işlemi"
          isLoading={isLoading}
        />
        <Metric
          icon={UserX}
          label="Hiç doldurmayan"
          value={neverFilled}
          hint="Form kaydı yok"
          isLoading={isLoading}
          tone="amber"
        />
      </div>
    </Card>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  isLoading,
  tone = 'default',
}: {
  icon: typeof Users
  label: string
  value: number
  hint: string
  isLoading: boolean
  tone?: 'default' | 'amber'
}) {
  return (
    <div
      className={
        tone === 'amber'
          ? 'rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5'
          : 'rounded-lg border border-border/80 bg-surface-elevated/60 px-3 py-2.5'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">
        {isLoading ? '…' : value.toLocaleString('tr-TR')}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
    </div>
  )
}

