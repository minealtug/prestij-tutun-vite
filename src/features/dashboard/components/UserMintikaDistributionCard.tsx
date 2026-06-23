import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { Card } from '@/components/ui/Card'
import { computeMintikaDistribution } from '../utils/compute-mintika-distribution'

interface UserMintikaDistributionCardProps {
  surveys: AnketCevapOzetItem[]
  isLoading?: boolean
}

const BAR_COLORS = ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6', '#14b8a6'] as const

export function UserMintikaDistributionCard({
  surveys,
  isLoading = false,
}: UserMintikaDistributionCardProps) {
  const distribution = useMemo(() => computeMintikaDistribution(surveys), [surveys])
  const mintikaCount = distribution.length
  const totalSurveys = surveys.length

  return (
    <Card className="!p-4" interactive={false}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Mintika / Ekici Dağılımı
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {isLoading ? '…' : mintikaCount.toLocaleString('tr-TR')}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {isLoading
              ? 'Dağılım hesaplanıyor…'
              : `${totalSurveys.toLocaleString('tr-TR')} anket · ${mintikaCount} mıntıka`}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
          <MapPin className="h-4 w-4" aria-hidden />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted">Yükleniyor…</p>
        ) : distribution.length > 0 ? (
          distribution.map((item, index) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-foreground">{item.label}</span>
                <span className="shrink-0 text-muted">
                  {item.count.toLocaleString('tr-TR')} anket
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.barPercent}%`,
                    backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                  }}
                  role="presentation"
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Henüz mıntıka dağılımı gösterilecek kayıt yok.</p>
        )}
      </div>
    </Card>
  )
}
