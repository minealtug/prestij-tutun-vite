import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Skeleton'
import type { SurveyResponseDto } from '../types/survey-response.types'

interface SurveyResponsesTableProps {
  data: SurveyResponseDto[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRefresh: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
      <div className="glass-card space-y-3 !p-4 hover:translate-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Cevaplar yüklenemedi"
        onRetry={onRefresh}
        compact
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>

      <div className="glass-card overflow-hidden !p-0 hover:translate-y-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-primary-500/5">
                <th className="w-10 px-3 py-3" aria-hidden />
                <th className="px-4 py-3 font-semibold text-foreground">TARİH</th>
                <th className="px-4 py-3 font-semibold text-foreground">KULLANICI</th>
                <th className="px-4 py-3 font-semibold text-foreground">ADI SOYADI</th>
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
                          {formatDate(row.submittedAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{row.username}</td>
                        <td className="px-4 py-3 text-foreground">{row.fullName}</td>
                        <td className="px-4 py-3 text-foreground">{row.surveyName}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-accent-500/20 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                            {row.answers.length} soru
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${row.id}-detail`} className="border-b border-border bg-surface/80">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="rounded-lg border border-border bg-surface-elevated p-4">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                Sorular ve cevaplar
                              </p>
                              <ul className="space-y-3">
                                {row.answers.map((a) => (
                                  <li
                                    key={`${row.id}-${a.questionNo}`}
                                    className="border-b border-border/50 pb-3 last:border-0 last:pb-0"
                                  >
                                    <p className="text-xs font-medium text-primary-600">
                                      Soru {a.questionNo}
                                    </p>
                                    <p className="mt-0.5 text-sm text-foreground">{a.questionText}</p>
                                    <p className="mt-2 rounded-md bg-primary-500/5 px-3 py-2 text-sm text-foreground">
                                      <span className="font-medium text-muted">Cevap: </span>
                                      {a.answer}
                                    </p>
                                  </li>
                                ))}
                              </ul>
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
    </div>
  )
}
