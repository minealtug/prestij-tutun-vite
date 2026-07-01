import { useMemo } from 'react'
import { Users } from 'lucide-react'
import type { AnketCevapOzetItem } from '@/features/survey-responses/types/survey-response.types'
import { Card } from '@/components/ui/Card'
import { computeEkiciSurveyCoverage } from '../utils/compute-ekici-survey-coverage'

interface UserFilledEkiciCardProps {
  ekiciIds: string[]
  surveys: AnketCevapOzetItem[]
  isLoading?: boolean
}

interface CoverageRowProps {
  label: string
  count: number
  total: number
  percent: number | null
  color: string
}

function CoverageRow({ label, count, total, percent, color }: CoverageRowProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-muted">
          {count.toLocaleString('tr-TR')} / {total.toLocaleString('tr-TR')} ekici
          {percent != null ? ` · %${percent}` : ''}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent ?? 0}%`,
            backgroundColor: color,
          }}
          role="presentation"
        />
      </div>
    </div>
  )
}

export function UserFilledEkiciCard({
  ekiciIds,
  surveys,
  isLoading = false,
}: UserFilledEkiciCardProps) {
  const coverage = useMemo(
    () => computeEkiciSurveyCoverage(ekiciIds, surveys),
    [ekiciIds, surveys],
  )

  const coveredCount = coverage.completedEkiciCount + coverage.partialEkiciCount
  const coveredPercent =
    coverage.totalEkiciCount > 0
      ? Math.round((coveredCount / coverage.totalEkiciCount) * 100)
      : null

  return (
    <Card className="!p-4" interactive={false}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Ekici anket kapsamı
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {isLoading ? '…' : coveredPercent != null ? `%${coveredPercent}` : '—'}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {isLoading
              ? 'Hesaplanıyor…'
              : coverage.totalEkiciCount > 0
                ? `${coverage.totalEkiciCount.toLocaleString('tr-TR')} aktif ekici üzerinden`
                : 'Aktif ekici kaydınız yok'}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
          <Users className="h-4 w-4" aria-hidden />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted">Yükleniyor…</p>
        ) : coverage.totalEkiciCount > 0 ? (
          <>
            <CoverageRow
              label="Tamamlanan"
              count={coverage.completedEkiciCount}
              total={coverage.totalEkiciCount}
              percent={coverage.completedPercent}
              color="#10b981"
            />
            <CoverageRow
              label="Yarım kalan"
              count={coverage.partialEkiciCount}
              total={coverage.totalEkiciCount}
              percent={coverage.partialPercent}
              color="#f59e0b"
            />
            <CoverageRow
              label="Anket başlanmamış"
              count={coverage.untouchedEkiciCount}
              total={coverage.totalEkiciCount}
              percent={coverage.untouchedPercent}
              color="#94a3b8"
            />
          </>
        ) : (
          <p className="text-sm text-muted">Aktif ekici listeniz yüklendiğinde oranlar burada görünecek.</p>
        )}
      </div>
    </Card>
  )
}
