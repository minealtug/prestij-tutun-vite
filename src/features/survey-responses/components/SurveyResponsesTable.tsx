import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Skeleton'
import type { AnketCevapOzetItem } from '../types/survey-response.types'
import {
  getOzetDetayBadge,
  getOzetFullName,
  getOzetSurveyName,
} from '../types/survey-response.types'
import { SurveyResponseAnswersPanel } from './SurveyResponseAnswersPanel'

interface SurveyResponsesTableProps {
  data: AnketCevapOzetItem[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
}

function formatSonIslemTarihi(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR')
}

export function SurveyResponsesTable({
  data,
  isLoading,
  isError,
  error,
  onRefresh,
}: SurveyResponsesTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-3 border-t border-border px-5 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full border-t border-border px-5 py-4">
        <ErrorState
          error={error}
          title="Cevaplar yüklenemedi"
          onRetry={onRefresh}
          compact
        />
      </div>
    )
  }

  return (
    <div className="w-full border-t border-border">
      <div className="flex justify-end px-5 pt-4">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-primary-500/5">
              <th className="w-10 px-3 py-3" aria-hidden />
              <th className="px-4 py-3 font-semibold text-foreground">TARİH</th>
              <th className="px-4 py-3 font-semibold text-foreground">EKİCİ</th>
              <th className="px-4 py-3 font-semibold text-foreground">MINTİKA</th>
              <th className="px-4 py-3 font-semibold text-foreground">ANKET</th>
              <th className="px-4 py-3 font-semibold text-foreground">DETAY</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    compact
                    title="Henüz anket cevabı yok"
                    description="Filtreleri değiştirin veya API bağlantısını kontrol edin."
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isOpen = expandedId === row.id
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={cn(
                        'cursor-pointer border-b border-border/60 transition-colors hover:bg-primary-500/5',
                        isOpen && 'bg-primary-500/5',
                      )}
                      onClick={() => toggle(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggle(row.id)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isOpen}
                    >
                      <td className="px-3 py-3 text-muted">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {formatSonIslemTarihi(row.sonIslemTarihi)}
                      </td>
                      <td className="px-4 py-3 text-foreground">{getOzetFullName(row)}</td>
                      <td className="px-4 py-3 text-foreground">{row.mintikaAdi}</td>
                      <td className="px-4 py-3 text-foreground">{getOzetSurveyName(row)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-accent-500/20 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                          {getOzetDetayBadge(row)}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${row.id}-detail`} className="border-b border-border bg-surface/80">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="rounded-lg border border-border bg-surface-elevated p-4">
                            <SurveyResponseAnswersPanel
                              ekiciId={row.ekiciId}
                              sablonId={row.sablonId}
                              enabled={isOpen}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
